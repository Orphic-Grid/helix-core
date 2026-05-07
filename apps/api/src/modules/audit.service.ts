import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  async logEvent(userId: string, patientId: string, action: string) {
    await this.db.query('INSERT INTO audit_logs (user_id, patient_id, action) VALUES ($1, $2, $3)', [userId, patientId, action]);
  }

  async listRecent() {
    const result = await this.db.query(
      `SELECT audit_logs.id, users.name AS user_name, patients.name AS patient_name, audit_logs.patient_id,
              audit_logs.action, audit_logs.created_at
       FROM audit_logs
       LEFT JOIN users ON users.id = audit_logs.user_id
       LEFT JOIN patients ON patients.id = audit_logs.patient_id
       ORDER BY audit_logs.created_at DESC
       LIMIT 100`,
    );
    return result.rows;
  }
}
