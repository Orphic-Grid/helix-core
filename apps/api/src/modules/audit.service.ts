import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { RequestUser } from './types';

export type AuditEventInput = {
  user?: RequestUser | null;
  userId?: string | null;
  patientId?: string | null;
  action: string;
  ipAddress?: string;
  sourceHospital?: string | null;
  emergencyOverride?: boolean;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  async logEvent(input: AuditEventInput) {
    const userId = input.userId ?? input.user?.id ?? null;
    const sourceHospital = input.sourceHospital ?? input.user?.hospitalId ?? null;
    await this.db.query(
      `INSERT INTO audit_logs (user_id, patient_id, action, source_hospital, emergency_override, ip_address, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        userId,
        input.patientId ?? null,
        input.action,
        sourceHospital,
        Boolean(input.emergencyOverride),
        input.ipAddress ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
  }

  async listRecent(user: RequestUser) {
    const params: unknown[] = [];
    const hospitalFilter =
      user.role === 'SUPER_ADMIN'
        ? ''
        : 'WHERE audit_logs.source_hospital = $1 OR users.hospital_id = $1';

    if (user.role !== 'SUPER_ADMIN') {
      params.push(user.hospitalId);
    }

    const result = await this.db.query(
      `SELECT audit_logs.id, users.full_name AS user_name, hospitals.name AS hospital_name,
              patients.name AS patient_name, audit_logs.patient_id, audit_logs.action,
              audit_logs.emergency_override, audit_logs.ip_address, audit_logs.metadata,
              audit_logs.timestamp
       FROM audit_logs
       LEFT JOIN users ON users.id = audit_logs.user_id
       LEFT JOIN hospitals ON hospitals.id = audit_logs.source_hospital
       LEFT JOIN patients ON patients.id = audit_logs.patient_id
       ${hospitalFilter}
       ORDER BY audit_logs.timestamp DESC
       LIMIT 200`,
      params,
    );
    return result.rows;
  }
}
