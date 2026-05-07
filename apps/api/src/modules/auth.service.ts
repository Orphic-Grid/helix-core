import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from './database.service';
import { RequestUser, UserRow } from './types';

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'local-dev-change-me';
const REFRESH_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const result = await this.db.query<UserRow>(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase()],
    );
    const user = result.rows[0];
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;

    return user;
  }

  async createAccessToken(user: UserRow) {
    return this.jwt.signAsync({ sub: user.id, email: user.email, name: user.name, role: user.role }, { expiresIn: '15m' });
  }

  async createRefreshToken(user: UserRow) {
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, name: user.name, role: user.role },
      { secret: REFRESH_SECRET, expiresIn: '7d' },
    );
  }

  async storeRefreshToken(userId: string, refreshToken: string) {
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + REFRESH_LIFETIME_MS).toISOString();
    await this.db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, refreshHash, expiresAt],
    );

    return refreshHash;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  async refreshSession(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; name: string; role: 'doctor' | 'admin' }>(
        refreshToken,
        { secret: REFRESH_SECRET },
      );

      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const result = await this.db.query<{ token_hash: string }>(
        'SELECT token_hash FROM refresh_tokens WHERE user_id = $1 AND expires_at > now() ORDER BY created_at DESC LIMIT 1',
        [payload.sub],
      );

      const stored = result.rows[0];
      if (!stored) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const valid = await bcrypt.compare(refreshToken, stored.token_hash);
      if (!valid) {
        throw new UnauthorizedException('Refresh token is invalid');
      }

      const accessToken = await this.jwt.signAsync(
        { sub: payload.sub, email: payload.email, name: payload.name, role: payload.role },
        { expiresIn: '15m' },
      );

      return {
        user: { id: payload.sub, name: payload.name, email: payload.email, role: payload.role } as RequestUser,
        accessToken,
      };
    } catch {
      throw new UnauthorizedException('Refresh session failed');
    }
  }

  async revokeRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(refreshToken, { secret: REFRESH_SECRET });
      if (!payload?.sub) return;
      await this.db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [payload.sub]);
    } catch {
      // Ignore invalid tokens during logout.
    }
  }
}
