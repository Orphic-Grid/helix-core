import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from './database.service';
import { secretEnv } from './env';
import { PermissionClaims, RequestUser, UserRow } from './types';

const REFRESH_SECRET = secretEnv('JWT_REFRESH_SECRET');
const REFRESH_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = 'helix_refresh_token';

type ClientContext = {
  ipAddress?: string;
  deviceInfo?: string;
};

type TokenPayload = {
  sub: string;
  email: string;
  fullName: string;
  role: RequestUser['role'];
  hospitalId: string | null;
  department: string | null;
  patientId?: string | null;
  permissions: PermissionClaims;
  sessionId?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const result = await this.db.query<UserRow>(
      `SELECT users.id, users.full_name, users.email, users.password_hash, users.role, users.hospital_id,
              users.patient_id, users.department, users.is_active, permissions.can_view_patient, permissions.can_manage_users,
              permissions.can_use_emergency_mode, permissions.can_export_data
       FROM users
       LEFT JOIN permissions ON permissions.role = users.role
       WHERE lower(users.email) = $1`,
      [email.toLowerCase()],
    );
    const user = result.rows[0];
    if (!user || !user.is_active) return null;

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;

    return user;
  }

  toRequestUser(user: UserRow): RequestUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      hospitalId: user.hospital_id,
      patientId: user.patient_id ?? null,
      department: user.department,
      permissions: {
        can_view_patient: Boolean(user.can_view_patient),
        can_manage_users: Boolean(user.can_manage_users),
        can_use_emergency_mode: Boolean(user.can_use_emergency_mode),
        can_export_data: Boolean(user.can_export_data),
      },
    };
  }

  async createAccessToken(user: RequestUser, sessionId?: string) {
    return this.jwt.signAsync({ ...this.createPayload(user), sessionId }, { expiresIn: '15m' });
  }

  async createRefreshToken(user: RequestUser, sessionId: string) {
    return this.jwt.signAsync({ ...this.createPayload(user), sessionId }, { secret: REFRESH_SECRET, expiresIn: '7d' });
  }

  async storeRefreshToken(userId: string, refreshToken: string, context: ClientContext) {
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + REFRESH_LIFETIME_MS).toISOString();
    const result = await this.db.query<{ id: string }>(
      `INSERT INTO user_sessions (user_id, refresh_token_hash, ip_address, device_info, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, refreshHash, context.ipAddress ?? null, context.deviceInfo ?? null, expiresAt],
    );

    return result.rows[0].id;
  }

  async login(email: string, password: string, context: ClientContext) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const requestUser = this.toRequestUser(user);
    const bootstrapRefreshToken = await this.jwt.signAsync(this.createPayload(requestUser), {
      secret: REFRESH_SECRET,
      expiresIn: '30s',
    });
    const sessionId = await this.storeRefreshToken(user.id, bootstrapRefreshToken, context);
    const refreshToken = await this.createRefreshToken(requestUser, sessionId);
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.db.query('UPDATE user_sessions SET refresh_token_hash = $1 WHERE id = $2', [refreshHash, sessionId]);
    const accessToken = await this.createAccessToken(requestUser, sessionId);

    return {
      user: requestUser,
      accessToken,
      refreshToken,
    };
  }

  async refreshSession(refreshToken: string, context: ClientContext) {
    try {
      const payload = await this.jwt.verifyAsync<TokenPayload>(refreshToken, { secret: REFRESH_SECRET });

      if (!payload?.sub || !payload.sessionId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const result = await this.db.query<{ refresh_token_hash: string }>(
        `SELECT refresh_token_hash
         FROM user_sessions
         WHERE id = $1 AND user_id = $2 AND expires_at > now()`,
        [payload.sessionId, payload.sub],
      );

      const stored = result.rows[0];
      if (!stored) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const valid = await bcrypt.compare(refreshToken, stored.refresh_token_hash);
      if (!valid) {
        await this.db.query('DELETE FROM user_sessions WHERE user_id = $1', [payload.sub]);
        throw new UnauthorizedException('Refresh token is invalid');
      }

      const user = await this.loadUser(payload.sub);
      const refreshTokenNext = await this.createRefreshToken(user, payload.sessionId);
      const refreshHash = await bcrypt.hash(refreshTokenNext, 10);
      await this.db.query(
        `UPDATE user_sessions
         SET refresh_token_hash = $1, ip_address = $2, device_info = $3, created_at = now()
         WHERE id = $4`,
        [refreshHash, context.ipAddress ?? null, context.deviceInfo ?? null, payload.sessionId],
      );
      const accessToken = await this.createAccessToken(user, payload.sessionId);

      return {
        user,
        accessToken,
        refreshToken: refreshTokenNext,
      };
    } catch {
      throw new UnauthorizedException('Refresh session failed');
    }
  }

  async revokeRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(refreshToken, { secret: REFRESH_SECRET });
      if (!payload?.sub) return;
      await this.db.query('DELETE FROM user_sessions WHERE user_id = $1', [payload.sub]);
    } catch {
      // Ignore invalid tokens during logout.
    }
  }

  async loadUser(userId: string) {
    const result = await this.db.query<UserRow>(
      `SELECT users.id, users.full_name, users.email, users.password_hash, users.role, users.hospital_id,
              users.patient_id, users.department, users.is_active, permissions.can_view_patient, permissions.can_manage_users,
              permissions.can_use_emergency_mode, permissions.can_export_data
       FROM users
       LEFT JOIN permissions ON permissions.role = users.role
       WHERE users.id = $1`,
      [userId],
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User is inactive or missing');
    }
    return this.toRequestUser(user);
  }

  get refreshCookieName() {
    return COOKIE_NAME;
  }

  private createPayload(user: RequestUser): TokenPayload {
    return {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      hospitalId: user.hospitalId,
      department: user.department,
      patientId: user.patientId ?? null,
      permissions: user.permissions,
    };
  }
}
