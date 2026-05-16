import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from './database.service';
import { RequestUser, UserRole } from './types';

type CreateManagedUser = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  hospitalId?: string;
  department?: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async list(user: RequestUser) {
    const params: unknown[] = [];
    const where = user.role === 'SUPER_ADMIN' ? '' : 'WHERE users.hospital_id = $1';
    if (user.role !== 'SUPER_ADMIN') params.push(user.hospitalId);

    const result = await this.db.query(
      `SELECT users.id, users.full_name, users.email, users.role, users.department, users.is_active,
              users.hospital_id, hospitals.name AS hospital_name, users.created_at, users.updated_at
       FROM users
       LEFT JOIN hospitals ON hospitals.id = users.hospital_id
       ${where}
       ORDER BY users.created_at DESC
       LIMIT 250`,
      params,
    );
    return result.rows;
  }

  async create(input: CreateManagedUser, actor: RequestUser) {
    const hospitalId = this.resolveHospitalScope(input.role, input.hospitalId, actor);
    const passwordHash = await bcrypt.hash(input.password, 10);

    try {
      const result = await this.db.query(
        `INSERT INTO users (full_name, name, email, password_hash, role, hospital_id, department, is_active)
         VALUES ($1, $1, lower($2), $3, $4, $5, $6, true)
         RETURNING id, full_name, email, role, department, is_active, hospital_id`,
        [
          input.fullName.trim(),
          input.email.trim(),
          passwordHash,
          input.role,
          hospitalId,
          input.department?.trim() || null,
        ],
      );
      return result.rows[0];
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new BadRequestException('A user with this email already exists');
      }
      throw error;
    }
  }

  async setStatus(id: string, isActive: boolean, actor: RequestUser) {
    const params: unknown[] = [id, isActive];
    const scope = actor.role === 'SUPER_ADMIN' ? '' : 'AND hospital_id = $3';
    if (actor.role !== 'SUPER_ADMIN') params.push(actor.hospitalId);

    const result = await this.db.query(
      `UPDATE users
       SET is_active = $2, updated_at = now()
       WHERE id = $1 ${scope}
       RETURNING id, full_name, email, role, department, is_active, hospital_id`,
      params,
    );

    const updated = result.rows[0];
    if (!updated) {
      throw new NotFoundException('User not found in admin scope');
    }
    return updated;
  }

  async activeSessions(user: RequestUser) {
    const params: unknown[] = [];
    const where = user.role === 'SUPER_ADMIN' ? '' : 'AND users.hospital_id = $1';
    if (user.role !== 'SUPER_ADMIN') params.push(user.hospitalId);

    const result = await this.db.query(
      `SELECT user_sessions.id, users.full_name, users.email, users.role, hospitals.name AS hospital_name,
              user_sessions.ip_address, user_sessions.device_info, user_sessions.expires_at,
              user_sessions.created_at
       FROM user_sessions
       JOIN users ON users.id = user_sessions.user_id
       LEFT JOIN hospitals ON hospitals.id = users.hospital_id
       WHERE user_sessions.expires_at > now()
       ${where}
       ORDER BY user_sessions.created_at DESC
       LIMIT 100`,
      params,
    );
    return result.rows;
  }

  private resolveHospitalScope(role: UserRole, requestedHospitalId: string | undefined, actor: RequestUser) {
    if (actor.role === 'HOSPITAL_ADMIN') {
      if (role === 'SUPER_ADMIN') {
        throw new ForbiddenException('Hospital admins cannot create platform admins');
      }
      return actor.hospitalId;
    }

    if (role !== 'SUPER_ADMIN' && !requestedHospitalId) {
      throw new BadRequestException('Hospital is required for this role');
    }

    return role === 'SUPER_ADMIN' ? null : requestedHospitalId ?? null;
  }
}
