import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { RequestUser } from './types';

@Injectable()
export class HospitalsService {
  constructor(private readonly db: DatabaseService) {}

  async list(user: RequestUser) {
    const params: unknown[] = [];
    const where = user.role === 'SUPER_ADMIN' ? '' : 'WHERE hospitals.id = $1';
    if (user.role !== 'SUPER_ADMIN') params.push(user.hospitalId);

    const result = await this.db.query(
      `SELECT hospitals.id, hospitals.name, hospitals.type, hospitals.address, hospitals.sync_enabled,
              hospitals.created_at, COUNT(users.id)::int AS active_users
       FROM hospitals
       LEFT JOIN users ON users.hospital_id = hospitals.id AND users.is_active = true
       ${where}
       GROUP BY hospitals.id
       ORDER BY hospitals.name ASC`,
      params,
    );
    return result.rows;
  }

  async platformOverview() {
    const result = await this.db.query(
      `SELECT
        (SELECT COUNT(*)::int FROM hospitals) AS hospitals,
        (SELECT COUNT(*)::int FROM users WHERE is_active = true) AS active_users,
        (SELECT COUNT(*)::int FROM user_sessions WHERE expires_at > now()) AS active_sessions,
        (SELECT COUNT(*)::int FROM audit_logs WHERE emergency_override = true AND timestamp > now() - interval '24 hours') AS emergency_overrides_24h`,
    );
    return result.rows[0];
  }
}
