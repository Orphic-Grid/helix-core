export type User = {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'admin';
};

export type HealthcareProvider = {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'diagnostic_center' | 'emergency';
  network_id: string;
  address?: string;
  contact_phone?: string;
  is_active: boolean;
};

export type PatientProviderLink = {
  id: string;
  patient_id: string;
  provider_id: string;
  external_patient_id?: string;
  consent_status: 'pending' | 'approved' | 'expired' | 'revoked';
  consent_requested_at?: string;
  consent_approved_at?: string;
  consent_expires_at?: string;
  last_sync_at?: string;
  provider?: HealthcareProvider;
};

export type ClinicalInsight = {
  id: string;
  insight_type: 'risk_trend' | 'medication_conflict' | 'care_gap' | 'emergency_risk' | 'compliance_issue';
  title: string;
  explanation: string;
  confidence_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  supporting_data: Record<string, unknown>;
  recommendations: string[];
  is_active: boolean;
  generated_at: string;
  expires_at?: string;
};

export type EmergencySession = {
  id: string;
  patient_id: string;
  requesting_user_id?: string;
  emergency_type: 'trauma' | 'cardiac' | 'neurological' | 'respiratory' | 'unknown';
  triage_level: 'red' | 'yellow' | 'green' | 'blue';
  access_reason?: string;
  temporary_access_expires_at: string;
  created_at: string;
};

export type Patient = {
  id: string;
  govt_id: string;
  abha_id: string | null;
  name?: string;
  age: number;
  gender: string;
  phone: string;
  blood_group: string;
  chronic_conditions: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  allergies: string[];
  provider_links?: PatientProviderLink[];
  events?: MedicalEvent[];
  medications?: Medication[];
  vitals?: Vital[];
  insights?: ClinicalInsight[];
  xray_reports?: XrayReport[];
  blood_tests?: BloodTest[];
  medical_records?: MedicalRecord[];
  emergency_session?: EmergencySession;
};

export type MedicalEvent = {
  id: string;
  provider_id?: string;
  external_event_id?: string;
  type: 'visit' | 'lab' | 'diagnosis' | 'medication' | 'surgery' | 'accident' | 'emergency' | 'imaging';
  title: string;
  description: string;
  event_date: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  department?: string;
  attending_physician?: string;
  is_emergency: boolean;
  provider?: HealthcareProvider;
};

export type Medication = {
  id: string;
  provider_id?: string;
  external_medication_id?: string;
  drug_name: string;
  dosage: string;
  frequency?: string;
  route?: string;
  start_date: string;
  end_date: string | null;
  prescribing_physician?: string;
  is_active: boolean;
  adherence_score?: number;
  provider?: HealthcareProvider;
};

export type Vital = {
  id: string;
  provider_id?: string;
  type: string;
  value: string;
  unit?: string;
  recorded_at: string;
  recorded_by?: string;
  is_abnormal: boolean;
  clinical_context?: string;
  provider?: HealthcareProvider;
};

export type Alert = {
  severity: 'critical' | 'warning' | 'stable';
  title: string;
  message: string;
  source: string;
  severity_score?: number;
  recommendation?: string;
  risk_score?: number;
};

export type XrayReport = {
  id: string;
  patient_id: string;
  provider_id?: string;
  report_type: string;
  body_part: string;
  findings: string;
  radiologist_notes?: string;
  urgency: 'routine' | 'semi-urgent' | 'urgent';
  report_date: string;
  report_url?: string;
  risk_score?: number;
};

export type BloodTest = {
  id: string;
  patient_id: string;
  provider_id?: string;
  test_name: string;
  test_value: number;
  unit: string;
  reference_range?: string;
  is_abnormal: boolean;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  test_date: string;
  lab_comments?: string;
  risk_indicator?: string;
};

export type MedicalRecord = {
  id: string;
  patient_id: string;
  provider_id?: string;
  record_type: 'discharge_summary' | 'admission_notes' | 'surgical_report' | 'procedure_report' | 'consultation_note' | 'progress_note';
  title: string;
  content: string;
  summary?: string;
  risk_assessment?: string;
  recommendations?: string[];
  record_date: string;
  attending_physician?: string;
};

export type ConsentRequest = {
  id: string;
  patient_id: string;
  requesting_provider_id: string;
  requesting_user_id?: string;
  purpose: string;
  access_duration_hours: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  request_ip?: string;
  approved_by_user_id?: string;
  approved_at?: string;
  expires_at?: string;
  requesting_provider?: HealthcareProvider;
};

export type SystemActivity = {
  id: string;
  type: 'sync' | 'analysis' | 'alert' | 'fetch';
  message: string;
  timestamp: Date;
  status: 'active' | 'complete' | 'error';
};
