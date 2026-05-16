import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy, OnModuleInit {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgres://helix:helix@localhost:5432/helixcore',
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  async onModuleInit() {
    await this.ensureRuntimeSchema();
  }

  query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
    return this.pool.query<T>(text, params);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private async ensureRuntimeSchema() {
    await this.pool.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS hospitals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'hospital',
        address TEXT,
        sync_enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      INSERT INTO hospitals (id, name, type, address, sync_enabled) VALUES
        ('550e8400-e29b-41d4-a716-446655440001', 'Apollo Hospital', 'hospital', 'Jubilee Hills, Hyderabad', true),
        ('550e8400-e29b-41d4-a716-446655440002', 'MetroCare Trauma Center', 'emergency', 'Hitech City, Hyderabad', true),
        ('550e8400-e29b-41d4-a716-446655440003', 'City Diagnostics', 'diagnostic_center', 'Banjara Hills, Hyderabad', true),
        ('550e8400-e29b-41d4-a716-446655440004', 'Dr. Sharma Clinic', 'clinic', 'Gachibowli, Hyderabad', true)
      ON CONFLICT (id) DO NOTHING;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
      UPDATE users SET full_name = name WHERE full_name IS NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name'
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'EMERGENCY_STAFF', 'PATIENT', 'admin', 'doctor'));
      UPDATE users SET role = CASE role
        WHEN 'admin' THEN 'HOSPITAL_ADMIN'
        WHEN 'doctor' THEN 'DOCTOR'
        ELSE role
      END;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'EMERGENCY_STAFF', 'PATIENT'));
      UPDATE users SET hospital_id = '550e8400-e29b-41d4-a716-446655440001' WHERE hospital_id IS NULL AND role <> 'SUPER_ADMIN';

      INSERT INTO users (full_name, name, email, password_hash, role, hospital_id, department) VALUES
        ('Helix Security Command', 'Helix Security Command', 'superadmin@helix.local', '$2a$10$e.fTmOAQAr8j/zD56cgOFe0xkHwxpQTLkK2c5EGCDVw2SXGxX/q8i', 'SUPER_ADMIN', NULL, 'Platform Security'),
        ('Emergency Intake Lead', 'Emergency Intake Lead', 'emergency@helix.local', '$2a$10$e.fTmOAQAr8j/zD56cgOFe0xkHwxpQTLkK2c5EGCDVw2SXGxX/q8i', 'EMERGENCY_STAFF', '550e8400-e29b-41d4-a716-446655440002', 'Emergency Medicine')
      ON CONFLICT (email) DO NOTHING;

      INSERT INTO users (full_name, name, email, password_hash, role, patient_id) VALUES
        ('Rahul Mehta', 'Rahul Mehta', 'rahul@helix.local', '$2a$10$e.fTmOAQAr8j/zD56cgOFe0xkHwxpQTLkK2c5EGCDVw2SXGxX/q8i', 'PATIENT', 'HX-10021'),
        ('Neha Iyer', 'Neha Iyer', 'neha@helix.local', '$2a$10$e.fTmOAQAr8j/zD56cgOFe0xkHwxpQTLkK2c5EGCDVw2SXGxX/q8i', 'PATIENT', 'HX-10022'),
        ('Farhan Ali', 'Farhan Ali', 'farhan@helix.local', '$2a$10$e.fTmOAQAr8j/zD56cgOFe0xkHwxpQTLkK2c5EGCDVw2SXGxX/q8i', 'PATIENT', 'HX-10023')
      ON CONFLICT (email) DO NOTHING;

      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role TEXT UNIQUE NOT NULL CHECK (role IN ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'EMERGENCY_STAFF', 'PATIENT')),
        can_view_patient BOOLEAN NOT NULL DEFAULT false,
        can_manage_users BOOLEAN NOT NULL DEFAULT false,
        can_use_emergency_mode BOOLEAN NOT NULL DEFAULT false,
        can_export_data BOOLEAN NOT NULL DEFAULT false
      );

      INSERT INTO permissions (role, can_view_patient, can_manage_users, can_use_emergency_mode, can_export_data) VALUES
        ('SUPER_ADMIN', true, true, true, true),
        ('HOSPITAL_ADMIN', true, true, true, true),
        ('DOCTOR', true, false, true, false),
        ('EMERGENCY_STAFF', true, false, true, false),
        ('PATIENT', false, false, false, false)
      ON CONFLICT (role) DO UPDATE SET
        can_view_patient = EXCLUDED.can_view_patient,
        can_manage_users = EXCLUDED.can_manage_users,
        can_use_emergency_mode = EXCLUDED.can_use_emergency_mode,
        can_export_data = EXCLUDED.can_export_data;

      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash TEXT NOT NULL,
        ip_address TEXT,
        device_info TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        source_hospital UUID REFERENCES hospitals(id) ON DELETE SET NULL,
        emergency_override BOOLEAN NOT NULL DEFAULT false,
        ip_address TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS source_hospital UUID REFERENCES hospitals(id) ON DELETE SET NULL;
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS emergency_override BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL DEFAULT now();

      CREATE TABLE IF NOT EXISTS consent_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        granted_to_hospital UUID REFERENCES hospitals(id) ON DELETE SET NULL,
        consent_scope TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_id ON audit_logs(patient_id);
    `);
  }
}
