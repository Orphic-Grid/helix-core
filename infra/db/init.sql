CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS healthcare_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital', 'clinic', 'diagnostic_center', 'emergency')),
  network_id TEXT NOT NULL,
  address TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  govt_id TEXT UNIQUE NOT NULL,
  abha_id TEXT UNIQUE,
  name TEXT,
  age INT NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  chronic_conditions TEXT[] NOT NULL DEFAULT '{}',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  allergies TEXT[] DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_provider_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  external_patient_id TEXT,
  consent_status TEXT NOT NULL DEFAULT 'pending' CHECK (consent_status IN ('pending', 'approved', 'expired', 'revoked')),
  consent_requested_at TIMESTAMPTZ,
  consent_approved_at TIMESTAMPTZ,
  consent_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_id, provider_id)
);

CREATE TABLE IF NOT EXISTS consent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  requesting_provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  requesting_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL,
  access_duration_hours INT NOT NULL DEFAULT 24,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  request_ip TEXT,
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  external_event_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('visit', 'lab', 'diagnosis', 'medication', 'surgery', 'accident', 'emergency', 'imaging')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  department TEXT,
  attending_physician TEXT,
  is_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  external_medication_id TEXT,
  drug_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT,
  route TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  prescribing_physician TEXT,
  is_active BOOLEAN DEFAULT true,
  adherence_score NUMERIC(3,2) CHECK (adherence_score >= 0 AND adherence_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  recorded_by TEXT,
  is_abnormal BOOLEAN DEFAULT false,
  clinical_context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('risk_trend', 'medication_conflict', 'care_gap', 'emergency_risk', 'compliance_issue')),
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  supporting_data JSONB,
  recommendations TEXT[],
  is_active BOOLEAN DEFAULT true,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS emergency_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  requesting_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  emergency_type TEXT NOT NULL CHECK (emergency_type IN ('trauma', 'cardiac', 'neurological', 'respiratory', 'unknown')),
  triage_level TEXT NOT NULL CHECK (triage_level IN ('red', 'yellow', 'green', 'blue')),
  access_reason TEXT,
  temporary_access_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS xray_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  body_part TEXT NOT NULL,
  findings TEXT NOT NULL,
  radiologist_notes TEXT,
  urgency TEXT CHECK (urgency IN ('routine', 'semi-urgent', 'urgent')),
  report_date TIMESTAMPTZ NOT NULL,
  report_url TEXT,
  risk_score NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blood_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  test_value NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  reference_range TEXT,
  is_abnormal BOOLEAN DEFAULT false,
  severity TEXT CHECK (severity IN ('normal', 'mild', 'moderate', 'severe')),
  test_date TIMESTAMPTZ NOT NULL,
  lab_comments TEXT,
  risk_indicator TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('discharge_summary', 'admission_notes', 'surgical_report', 'procedure_report', 'consultation_note', 'progress_note')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  risk_assessment TEXT,
  recommendations TEXT[],
  record_date TIMESTAMPTZ NOT NULL,
  attending_physician TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON patients USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_phone_trgm ON patients USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_abha_id_trgm ON patients USING gin (abha_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_govt_id ON patients(govt_id);
CREATE INDEX IF NOT EXISTS idx_medical_events_patient_id ON medical_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_events_provider_id ON medical_events(provider_id);
CREATE INDEX IF NOT EXISTS idx_medical_events_event_date ON medical_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_provider_id ON medications(provider_id);
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_provider_id ON vitals(provider_id);
CREATE INDEX IF NOT EXISTS idx_vitals_recorded_at ON vitals(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_provider_links_patient_id ON patient_provider_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_provider_links_provider_id ON patient_provider_links(provider_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_patient_id ON consent_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_insights_patient_id ON clinical_insights(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_insights_active ON clinical_insights(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_xray_reports_patient_id ON xray_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_xray_reports_report_date ON xray_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_blood_tests_patient_id ON blood_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_blood_tests_test_date ON blood_tests(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_date ON medical_records(record_date DESC);

INSERT INTO users (name, email, password_hash, role) VALUES
  ('Dr. Asha Rao', 'doctor@helix.local', '$2a$10$e.fTmOAQAr8j/zD56cgOFe0xkHwxpQTLkK2c5EGCDVw2SXGxX/q8i', 'doctor'),
  ('Hospital Admin', 'admin@helix.local', '$2a$10$e.fTmOAQAr8j/zD56cgOFe0xkHwxpQTLkK2c5EGCDVw2SXGxX/q8i', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO healthcare_providers (id, name, type, network_id, address, contact_phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Apollo Hospital', 'hospital', 'APOLLO_NETWORK', 'Jubilee Hills, Hyderabad', '+914048485555'),
  ('550e8400-e29b-41d4-a716-446655440002', 'MetroCare Trauma Center', 'emergency', 'METROCARE_NETWORK', 'Hitech City, Hyderabad', '+914023456789'),
  ('550e8400-e29b-41d4-a716-446655440003', 'City Diagnostics', 'diagnostic_center', 'CITY_NETWORK', 'Banjara Hills, Hyderabad', '+914012345678'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Dr. Sharma Clinic', 'clinic', 'PRIVATE_NETWORK', 'Gachibowli, Hyderabad', '+914098765432')
ON CONFLICT DO NOTHING;

INSERT INTO patients (id, govt_id, abha_id, name, age, gender, phone, blood_group, chronic_conditions, emergency_contact_name, emergency_contact_phone, allergies) VALUES
  ('HX-10021', 'GOVT-2024-001', '91-2233-4455-6677', 'Rahul Mehta', 58, 'Male', '+919876543210', 'B+', ARRAY['Type 2 Diabetes', 'Hypertension'], 'Priya Mehta', '+919876543211', ARRAY['Penicillin', 'Sulfa drugs']),
  ('HX-10022', 'GOVT-2024-002', '91-9988-7766-5544', 'Neha Iyer', 34, 'Female', '+919700001122', 'O-', ARRAY['Asthma'], 'Ramesh Iyer', '+919700001123', ARRAY['Dust mites', 'Pollen']),
  ('HX-10023', 'GOVT-2024-003', '91-1122-3344-5566', 'Farhan Ali', 71, 'Male', '+919811223344', 'A+', ARRAY['Atrial Fibrillation', 'Chronic Kidney Disease'], 'Amina Ali', '+919811223345', ARRAY['None'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_provider_links (patient_id, provider_id, external_patient_id, consent_status, consent_approved_at, last_sync_at) VALUES
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'AP-2024-10021', 'approved', '2025-01-15T10:00:00+05:30', '2026-05-01T09:00:00+05:30'),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440003', 'CD-2024-10021', 'approved', '2025-02-20T14:30:00+05:30', '2026-04-28T15:00:00+05:30'),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'AP-2024-10022', 'approved', '2025-03-10T11:00:00+05:30', '2026-04-20T16:00:00+05:30'),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440002', 'MC-2024-10023', 'approved', '2025-01-05T09:00:00+05:30', '2026-04-30T10:00:00+05:30'),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440004', 'DR-2024-10023', 'pending', NULL, NULL)
ON CONFLICT (patient_id, provider_id) DO NOTHING;

INSERT INTO medical_events (patient_id, provider_id, type, title, description, event_date, severity, department, attending_physician, is_emergency) VALUES
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'emergency', 'Emergency visit for dizziness', 'Reported dizziness and fatigue. BP elevated on arrival. Patient given IV fluids and monitored.', '2026-04-28T09:20:00+05:30', 'high', 'Emergency Medicine', 'Dr. Kumar', true),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440003', 'lab', 'HbA1c and glucose panel', 'HbA1c 8.2%. Fasting glucose 218 mg/dL. Indicates poor glycemic control.', '2026-04-16T10:00:00+05:30', 'medium', 'Laboratory', 'Dr. Reddy', false),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'diagnosis', 'Hypertension follow-up', 'Medication adherence discussed. Lifestyle modifications recommended. BP still elevated.', '2026-03-22T12:30:00+05:30', 'medium', 'Cardiology', 'Dr. Sharma', false),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'medication', 'Metformin dose updated', 'Metformin increased to 1000mg twice daily due to poor glycemic control.', '2026-03-01T11:00:00+05:30', 'low', 'Endocrinology', 'Dr. Patel', false),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'visit', 'Pulmonary consultation', 'Mild wheeze, oxygen saturation 97%. Peak flow 320 L/min. Continue current regimen.', '2026-04-20T14:00:00+05:30', 'low', 'Pulmonology', 'Dr. Gupta', false),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'lab', 'CBC report', 'CBC values within expected range. Eosinophils slightly elevated at 6% (normal 0-5%).', '2026-02-12T09:00:00+05:30', 'low', 'Laboratory', 'Dr. Kumar', false),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440002', 'accident', 'Fall with hip bruising', 'Patient fell at home with visible bruising and tenderness. X-ray negative for fracture. CT head normal.', '2026-04-30T08:45:00+05:30', 'high', 'Emergency Medicine', 'Dr. Reddy', true),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440004', 'diagnosis', 'Atrial fibrillation review', 'Continues anticoagulation therapy. INR 3.1 (target 2-3). HR 72 bpm, irregularly irregular.', '2026-04-08T16:15:00+05:30', 'medium', 'Cardiology', 'Dr. Sharma', false),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440001', 'surgery', 'Cataract surgery', 'Uneventful phacoemulsification with IOL implantation. Post-op vision 20/20.', '2025-11-08T10:30:00+05:30', 'medium', 'Ophthalmology', 'Dr. Menon', false)
ON CONFLICT DO NOTHING;

INSERT INTO medications (patient_id, provider_id, drug_name, dosage, frequency, route, start_date, end_date, prescribing_physician, adherence_score) VALUES
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'Metformin', '1000 mg', 'twice daily', 'oral', '2025-08-01', NULL, 'Dr. Patel', 0.75),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'Amlodipine', '5 mg', 'once daily', 'oral', '2025-11-12', NULL, 'Dr. Sharma', 0.85),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'Ibuprofen', '400 mg', 'as needed', 'oral', '2026-04-24', '2026-05-02', 'Dr. Kumar', 1.00),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'Salbutamol', '100 mcg', '2 puffs as needed', 'inhalation', '2025-01-15', NULL, 'Dr. Gupta', 0.90),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'Budesonide', '200 mcg', 'twice daily', 'inhalation', '2025-05-10', NULL, 'Dr. Gupta', 0.80),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440004', 'Warfarin', '3 mg', 'once daily', 'oral', '2024-09-10', NULL, 'Dr. Sharma', 0.95),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440004', 'Aspirin', '75 mg', 'once daily', 'oral', '2026-01-18', NULL, 'Dr. Sharma', 0.90)
ON CONFLICT DO NOTHING;

INSERT INTO vitals (patient_id, provider_id, type, value, unit, recorded_at, recorded_by, is_abnormal, clinical_context) VALUES
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'bp', '168/104', 'mmHg', '2026-04-28T09:22:00+05:30', 'Nurse Johnson', true, 'Hypertensive crisis - patient symptomatic with dizziness'),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'bp', '146/94', 'mmHg', '2026-03-22T12:35:00+05:30', 'Nurse Smith', true, 'Stage 2 hypertension - medication adjustment needed'),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440003', 'glucose', '218', 'mg/dL', '2026-04-16T10:05:00+05:30', 'Lab Tech Kumar', true, 'Fasting glucose - poor glycemic control'),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'glucose', '196', 'mg/dL', '2026-04-28T09:30:00+05:30', 'Nurse Johnson', true, 'Random glucose - elevated during emergency visit'),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'bp', '118/76', 'mmHg', '2026-04-20T14:05:00+05:30', 'Nurse Patel', false, 'Normal blood pressure - stable'),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'spo2', '97', '%', '2026-04-20T14:05:00+05:30', 'Nurse Patel', false, 'Normal oxygen saturation - room air'),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440002', 'bp', '132/84', 'mmHg', '2026-04-30T08:50:00+05:30', 'Paramedic Singh', false, 'Blood pressure - acceptable for age'),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440004', 'inr', '3.1', '', '2026-04-08T16:20:00+05:30', 'Lab Tech Reddy', false, 'INR within therapeutic range (2-3)')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_insights (patient_id, insight_type, title, explanation, confidence_score, severity, supporting_data, recommendations) VALUES
  ('HX-10021', 'risk_trend', 'Worsening Hypertensive Trend', 'Blood pressure has increased 17% over last 8 months across 3 visits. Combined with elevated glucose and medication inconsistency, cardiovascular risk is rising.', 0.92, 'high', '{"bp_trend": [146/94, 152/98, 168/104], "glucose_trend": [196, 218], "medication_adherence": 0.75}', ARRAY['Consider adding ACE inhibitor', 'Intensify lifestyle counseling', 'Schedule cardiology follow-up within 2 weeks']::text[]),
  ('HX-10021', 'compliance_issue', 'Poor Diabetes Medication Adherence', 'Metformin adherence score of 75% with rising HbA1c from 7.8% to 8.2% over 6 months indicates poor medication compliance.', 0.88, 'medium', '{"adherence_score": 0.75, "hba1c_trend": [7.8, 8.0, 8.2], "missed_doses": 25}', ARRAY['Discuss medication barriers with patient', 'Consider simplified dosing regimen', 'Implement medication reminder system', 'Review side effects']::text[]),
  ('HX-10023', 'emergency_risk', 'Fall Risk with Anticoagulation', 'Recent fall with bruising while on warfarin therapy increases bleeding risk. INR stable at 3.1 but fall risk factors present.', 0.85, 'high', '{"recent_fall": true, "anticoagulant": "warfarin", "inr": 3.1, "age": 71, "home_hazards": true}', ARRAY['Comprehensive falls assessment', 'Home safety evaluation', 'Consider temporary warfarin hold if high fall risk', 'Physical therapy referral']::text[]),
  ('HX-10022', 'care_gap', 'Missing Pulmonary Function Tests', 'Asthma diagnosis established but no PFTs recorded in 14 months. Current reliance on symptom-based management only.', 0.79, 'medium', '{"last_pft": "2025-02-15", "days_since_pft": 440, "rescue_inhaler_use": "moderate"}', ARRAY['Schedule spirometry within 4 weeks', 'Consider asthma control assessment', 'Review inhaler technique', 'Update asthma action plan']::text[])
ON CONFLICT DO NOTHING;

-- X-Ray Reports
INSERT INTO xray_reports (patient_id, provider_id, report_type, body_part, findings, radiologist_notes, urgency, report_date, risk_score) VALUES
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'Chest X-Ray', 'Chest', 'No acute cardiopulmonary process. Heart size normal. Lungs clear bilaterally.', 'Routine screening. No findings requiring intervention.', 'routine', '2026-04-15T14:00:00+05:30', 0.15),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440002', 'Hip X-Ray', 'Hip/Pelvis', 'No fracture detected. Soft tissue swelling noted. Joint spaces preserved.', 'Fall-related injury ruled out. Conservative management appropriate.', 'urgent', '2026-04-30T09:00:00+05:30', 0.28),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440002', 'Head CT', 'Head', 'No acute intracranial findings. No hemorrhage or contusion. Ventricles normal.', 'Fall evaluation complete. Safe for discharge with follow-up.', 'urgent', '2026-04-30T09:45:00+05:30', 0.10),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'Chest X-Ray', 'Chest', 'Hyperinflation consistent with asthma. No infiltrates. Trachea midline.', 'Asthma-related changes expected. No acute infection.', 'routine', '2026-04-20T13:30:00+05:30', 0.25)
ON CONFLICT DO NOTHING;

-- Blood Tests
INSERT INTO blood_tests (patient_id, provider_id, test_name, test_value, unit, reference_range, is_abnormal, severity, test_date, lab_comments, risk_indicator) VALUES
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440003', 'HbA1c', 8.2, '%', '4.0-5.6', true, 'severe', '2026-04-16T10:15:00+05:30', 'Indicating poor glycemic control over past 3 months', 'High diabetes risk'),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440003', 'Fasting Glucose', 218, 'mg/dL', '70-100', true, 'severe', '2026-04-16T10:20:00+05:30', 'Elevated fasting glucose level', 'Uncontrolled diabetes'),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440003', 'Total Cholesterol', 245, 'mg/dL', '<200', true, 'moderate', '2026-04-16T10:25:00+05:30', 'Elevated total cholesterol', 'Cardiovascular risk'),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440003', 'LDL Cholesterol', 168, 'mg/dL', '<100', true, 'moderate', '2026-04-16T10:30:00+05:30', 'High LDL levels', 'Statin therapy needed'),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440003', 'Creatinine', 1.2, 'mg/dL', '0.7-1.3', false, 'normal', '2026-04-16T10:35:00+05:30', 'Kidney function normal', 'Normal'),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'Hemoglobin', 13.8, 'g/dL', '12.0-16.0', false, 'normal', '2026-02-12T09:15:00+05:30', 'Normal hemoglobin level', 'Normal'),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'WBC Count', 7.2, 'K/uL', '4.5-11.0', false, 'normal', '2026-02-12T09:20:00+05:30', 'Normal white blood cell count', 'Normal'),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'Eosinophils', 6.0, '%', '0-5', true, 'mild', '2026-02-12T09:25:00+05:30', 'Slightly elevated eosinophils - consistent with asthma', 'Allergic/Asthma response'),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440004', 'INR', 3.1, '', '2.0-3.0', true, 'mild', '2026-04-08T16:30:00+05:30', 'INR slightly elevated, therapeutic target achieved', 'Warfarin level acceptable'),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440004', 'Hemoglobin', 12.4, 'g/dL', '13.0-17.0', true, 'mild', '2026-04-08T16:35:00+05:30', 'Mild anemia noted', 'Monitor for bleeding')
ON CONFLICT DO NOTHING;

-- Medical Records
INSERT INTO medical_records (patient_id, provider_id, record_type, title, content, summary, risk_assessment, recommendations, record_date, attending_physician) VALUES
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'discharge_summary', 'Emergency Visit Discharge Summary', 'Patient presented with acute dizziness and elevated BP. Admitted to emergency department at 09:20. IV hydration initiated. Blood work revealed elevated glucose and electrolyte abnormalities. Patient stabilized and monitored for 4 hours. Discharged in stable condition with medication adjustments and close follow-up recommended.', 'Acute hypertensive episode with poor glycemic control. Patient stabilized with IV therapy. Discharged with medication adjustments.', 'HIGH: Patient at significant risk for myocardial infarction or stroke given uncontrolled hypertension and diabetes. Medication non-compliance is critical issue.', ARRAY['Increase Metformin to 1000mg BID', 'Add ACE inhibitor for BP control', 'Cardiology follow-up within 1 week', 'Blood glucose monitoring 4x daily', 'Lifestyle modification counseling']::text[], '2026-04-28T14:30:00+05:30', 'Dr. Kumar'),
  ('HX-10021', '550e8400-e29b-41d4-a716-446655440001', 'consultation_note', 'Endocrinology Consultation', 'Consultation requested for management of poorly controlled Type 2 Diabetes. Patient reports irregular medication adherence due to multiple side effects. Currently on Metformin 500mg daily. Fasting glucose trending upward. HbA1c increased from 7.8 to 8.2% over 6 months. Discussed treatment options including dose escalation and addition of second agent.', 'Poorly controlled diabetes with medication adherence issues. Multiple comorbidities increase urgency of optimization.', 'MEDIUM-HIGH: Without improved adherence, patient at risk for acute hyperglycemic crisis and chronic complications.', ARRAY['Increase Metformin to 1000mg twice daily', 'Add GLP-1 agonist if tolerated', 'Consider diabetes education program', 'Implement medication reminder system']::text[], '2026-03-22T13:00:00+05:30', 'Dr. Patel'),
  ('HX-10022', '550e8400-e29b-41d4-a716-446655440001', 'progress_note', 'Asthma Control Assessment', 'Patient reports stable asthma with occasional wheeze. Current regimen includes Salbutamol as needed and Budesonide twice daily. Compliance appears good with present medication regimen. Lung auscultation reveals clear lung fields with minimal end-expiratory wheeze. Peak flow 320 L/min, oxygen saturation 97% on room air.', 'Well-controlled asthma with good medication compliance. Minimal symptoms at present. Pulmonary function stable.', 'LOW: Current regimen appears adequate with good patient compliance. Continue monitoring for acute exacerbations.', ARRAY['Continue current medications', 'Schedule pulmonary function tests (PFTs)', 'Provide written asthma action plan', 'Review inhaler technique at next visit']::text[], '2026-04-20T14:30:00+05:30', 'Dr. Gupta'),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440002', 'discharge_summary', 'Fall-Related Injury Assessment Discharge', 'Patient presented to emergency after mechanical fall at home. Imaging studies including hip X-ray and head CT performed to rule out fractures and intracranial hemorrhage. All imaging negative. Patient cleared for discharge. Discharged in stable condition with pain management and home safety recommendations.', 'Mechanical fall at home with negative imaging workup. Patient discharged in stable condition.', 'HIGH: Advanced age (71) with anticoagulation therapy increases bleeding risk. Fall risk factors present in home environment.', ARRAY['Home safety evaluation', 'Physical therapy referral for balance training', 'Continue anticoagulation with close INR monitoring', 'Implement fall prevention measures']::text[], '2026-04-30T11:00:00+05:30', 'Dr. Reddy'),
  ('HX-10023', '550e8400-e29b-41d4-a716-446655440004', 'consultation_note', 'Cardiology Follow-Up: Atrial Fibrillation', 'Atrial fibrillation patient presenting for routine evaluation. Patient on Warfarin with current INR 3.1 (within therapeutic target 2-3). Heart rate 72 bpm with irregular rhythm noted on auscultation. Echocardiogram from 2025-12 shows preserved LV function. Patient tolerating current regimen well. Continue anticoagulation and monitor INR monthly.', 'Stable atrial fibrillation with well-controlled ventricular rate and therapeutic anticoagulation. LV function preserved.', 'MEDIUM: Age and anticoagulation therapy managed appropriately. Risk of thromboembolism controlled. Fall risk assessment needed given recent fall.', ARRAY['Continue Warfarin 3mg daily', 'Monitor INR monthly', 'Continue rate control with current regimen', 'Consider fall risk reduction strategies']::text[], '2026-04-08T17:00:00+05:30', 'Dr. Sharma')
ON CONFLICT DO NOTHING;
