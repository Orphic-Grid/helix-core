import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { 
  PatientProfile,
  PatientRow,
  XrayReportRow,
  BloodTestRow,

  MedicalRecordRow,

  HealthcareProvider,
  ClinicalInsight,
  EmergencySession,
  PatientProviderLinkRow,
  MedicalEventWithProvider,
  MedicationWithProvider,
  VitalWithProvider
} from './types';
import { RequestUser } from './types';

type CreateApprovedPatientInput = {
  name: string;
  govtId: string;
  abhaId?: string;
  age: number;
  gender: string;
  phone: string;
  bloodGroup: string;
  chronicConditions?: string[];
  allergies?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  providerId: string;
  doctorName?: string;
  department?: string;
  externalPatientId?: string;
  intakeNote?: string;
};

@Injectable()
export class PatientsService {
  constructor(private readonly db: DatabaseService) {}

  async search(query: string, user: RequestUser) {
    if (!query.trim()) {
      return [] as PatientRow[];
    }

    const term = `%${query.trim()}%`;
    const scopeClause =
      user.role === 'SUPER_ADMIN'
        ? ''
        : `AND EXISTS (
            SELECT 1 FROM patient_provider_links scoped_link
            WHERE scoped_link.patient_id = patients.id
              AND scoped_link.provider_id = $2
              AND scoped_link.consent_status = 'approved'
          )`;
    const params = user.role === 'SUPER_ADMIN' ? [term] : [term, user.hospitalId];
    const result = await this.db.query<PatientRow>(
      `SELECT id, govt_id, abha_id, name, age, gender, phone, blood_group, chronic_conditions, emergency_contact_name, emergency_contact_phone, allergies
       FROM patients
       WHERE deleted_at IS NULL AND (id ILIKE $1 OR govt_id ILIKE $1 OR phone ILIKE $1 OR name ILIKE $1 OR COALESCE(abha_id, '') ILIKE $1)
       ${scopeClause}
       ORDER BY name ASC
       LIMIT 12`,
      params,
    );

    return result.rows;
  }

  async recentOnboarded(user: RequestUser) {
    const params: unknown[] = [];
    const scope =
      user.role === 'SUPER_ADMIN'
        ? ''
        : `WHERE EXISTS (
            SELECT 1 FROM patient_provider_links ppl
            WHERE ppl.patient_id = patients.id AND ppl.provider_id = $1
          )`;
    if (user.role !== 'SUPER_ADMIN') params.push(user.hospitalId);

    const result = await this.db.query<PatientRow & { provider_name?: string; consent_status?: string }>(
      `SELECT patients.id, patients.govt_id, patients.abha_id, patients.name, patients.age, patients.gender,
              patients.phone, patients.blood_group, patients.chronic_conditions,
              patients.emergency_contact_name, patients.emergency_contact_phone, patients.allergies,
              hp.name AS provider_name, ppl.consent_status
       FROM patients
       LEFT JOIN patient_provider_links ppl ON ppl.patient_id = patients.id
       LEFT JOIN healthcare_providers hp ON hp.id = ppl.provider_id
       ${scope}
       ORDER BY patients.created_at DESC
       LIMIT 12`,
      params,
    );

    return result.rows;
  }

  async createApprovedPatient(input: CreateApprovedPatientInput, user: RequestUser) {
    if (user.role === 'HOSPITAL_ADMIN' && input.providerId !== user.hospitalId) {
      throw new ForbiddenException('Hospital admins can only approve patients for their own hospital');
    }

    const provider = await this.db.query<{ id: string; name: string }>(
      `SELECT id, name FROM healthcare_providers WHERE id = $1 AND is_active = true`,
      [input.providerId],
    );
    if (!provider.rows[0]) {
      throw new BadRequestException('Selected hospital/provider is not available');
    }

    const patientId = await this.nextPatientId();
    try {
      const patientResult = await this.db.query<PatientRow>(
        `INSERT INTO patients (
           id, govt_id, abha_id, name, age, gender, phone, blood_group,
           chronic_conditions, emergency_contact_name, emergency_contact_phone, allergies
         )
         VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9, NULLIF($10, ''), NULLIF($11, ''), $12)
         RETURNING id, govt_id, abha_id, name, age, gender, phone, blood_group,
                   chronic_conditions, emergency_contact_name, emergency_contact_phone, allergies`,
        [
          patientId,
          input.govtId.trim(),
          input.abhaId?.trim() ?? '',
          input.name.trim(),
          input.age,
          input.gender.trim(),
          input.phone.trim(),
          input.bloodGroup.trim(),
          this.cleanList(input.chronicConditions),
          input.emergencyContactName?.trim() ?? '',
          input.emergencyContactPhone?.trim() ?? '',
          this.cleanList(input.allergies),
        ],
      );

      await this.db.query(
        `INSERT INTO patient_provider_links (
           patient_id, provider_id, external_patient_id, consent_status,
           consent_requested_at, consent_approved_at, consent_expires_at, last_sync_at
         )
         VALUES ($1, $2, NULLIF($3, ''), 'approved', now(), now(), now() + interval '365 days', now())
         ON CONFLICT (patient_id, provider_id) DO UPDATE SET
           external_patient_id = EXCLUDED.external_patient_id,
           consent_status = 'approved',
           consent_approved_at = now(),
           consent_expires_at = now() + interval '365 days',
           last_sync_at = now()`,
        [patientId, input.providerId, input.externalPatientId?.trim() ?? ''],
      );

      if (input.intakeNote?.trim()) {
        await this.db.query(
          `INSERT INTO medical_records (
             patient_id, provider_id, record_type, title, content, summary,
             recommendations, record_date, attending_physician
           )
           VALUES ($1, $2, 'admission_notes', 'Admin approved intake', $3, $4, $5, now(), NULLIF($6, ''))`,
          [
            patientId,
            input.providerId,
            input.intakeNote.trim(),
            `Approved by ${user.fullName} for ${provider.rows[0].name}.`,
            ['Verify identity documents', 'Confirm consent with patient at first visit'],
            input.doctorName?.trim() ?? '',
          ],
        );
      }

      if (input.department?.trim() || input.doctorName?.trim()) {
        await this.db.query(
          `INSERT INTO medical_events (
             patient_id, provider_id, type, title, description, event_date,
             severity, department, attending_physician, is_emergency
           )
           VALUES ($1, $2, 'visit', 'Admin approved access', $3, now(), 'low', NULLIF($4, ''), NULLIF($5, ''), false)`,
          [
            patientId,
            input.providerId,
            `Access approved for ${provider.rows[0].name}.`,
            input.department?.trim() ?? '',
            input.doctorName?.trim() ?? '',
          ],
        );
      }

      return patientResult.rows[0];
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new BadRequestException('Patient with this government ID or ABHA ID already exists');
      }
      throw error;
    }
  }

  async loadProfile(id: string, includeInactiveProviders = false, user?: RequestUser) {
    const patientResult = await this.db.query<PatientRow>(
      `SELECT id, govt_id, abha_id, name, age, gender, phone, blood_group, chronic_conditions, emergency_contact_name, emergency_contact_phone, allergies
       FROM patients
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );

    const patient = patientResult.rows[0];
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (user && user.role !== 'SUPER_ADMIN') {
      if (user.role === 'PATIENT') {
        if (!user.patientId || user.patientId !== id) {
          throw new ForbiddenException('Access denied to this patient record');
        }
      } else {
        const access = await this.db.query<{ id: string }>(
          `SELECT id FROM patient_provider_links
           WHERE patient_id = $1 AND provider_id = $2 AND consent_status = 'approved'
           LIMIT 1`,
          [id, user.hospitalId],
        );

        if (!access.rows[0] && !includeInactiveProviders) {
          throw new NotFoundException('Patient not found in hospital scope');
        }
      }
    }

    const [providerLinks, events, medications, vitals, insights, emergencySession, xrayReports, bloodTests, medicalRecords] = await Promise.all([
      this.loadProviderLinks(id, includeInactiveProviders),
      this.loadMedicalEvents(id),
      this.loadMedications(id),
      this.loadVitals(id),
      this.loadClinicalInsights(id),
      this.loadEmergencySession(id),
      this.loadXrayReports(id),
      this.loadBloodTests(id),
      this.loadMedicalRecords(id),
    ]);

    return {
      ...patient,
      provider_links: providerLinks,
      events: events,
      medications: medications,
      vitals: vitals,
      insights: insights,
      xray_reports: xrayReports,
      blood_tests: bloodTests,
      medical_records: medicalRecords,
      emergency_session: emergencySession,
    } as PatientProfile;
  }

  private async loadProviderLinks(patientId: string, includeInactive: boolean) {
    const providerFilter = includeInactive ? '' : 'AND hp.is_active = true AND ppl.consent_status = $2';
    const params = includeInactive ? [patientId] : [patientId, 'approved'];

    const linksResult = await this.db.query<PatientProviderLinkRow>(
      `SELECT ppl.id, ppl.patient_id, ppl.provider_id, ppl.external_patient_id, ppl.consent_status, 
              ppl.consent_requested_at, ppl.consent_approved_at, ppl.consent_expires_at, ppl.last_sync_at,
              hp.id as provider_id, hp.name as provider_name, hp.type as provider_type, hp.network_id, 
              hp.address, hp.contact_phone, hp.is_active
       FROM patient_provider_links ppl
       JOIN healthcare_providers hp ON ppl.provider_id = hp.id
       WHERE ppl.patient_id = $1 ${providerFilter}
       ORDER BY ppl.created_at DESC`,
      params,
    );

    return linksResult.rows.map(link => ({
      id: link.id,
      patient_id: link.patient_id,
      provider_id: link.provider_id,
      external_patient_id: link.external_patient_id,
      consent_status: link.consent_status,
      consent_requested_at: link.consent_requested_at,
      consent_approved_at: link.consent_approved_at,
      consent_expires_at: link.consent_expires_at,
      last_sync_at: link.last_sync_at,
      provider: {
        id: link.provider_id,
        name: link.provider_name,
        type: link.provider_type,
        network_id: link.network_id,
        address: link.address,
        contact_phone: link.contact_phone,
        is_active: link.is_active,
      } as HealthcareProvider,
    }));
  }

  private async loadMedicalEvents(patientId: string) {
    const eventsResult = await this.db.query<MedicalEventWithProvider>(
      `SELECT me.id, me.provider_id, me.external_event_id, me.type, me.title, me.description, 
              me.event_date, me.severity, me.department, me.attending_physician, me.is_emergency,
              hp.id as provider_id, hp.name as provider_name, hp.type as provider_type, hp.network_id
       FROM medical_events me
       LEFT JOIN healthcare_providers hp ON me.provider_id = hp.id
       WHERE me.patient_id = $1
       ORDER BY me.event_date DESC`,
      [patientId],
    );

    return eventsResult.rows.map(event => ({
      ...event,
      provider: event.provider_id ? {
        id: event.provider_id,
        name: event.provider_name,
        type: event.provider_type,
        network_id: event.network_id,
      } as HealthcareProvider : undefined,
    }));
  }

  private async loadMedications(patientId: string) {
    const medsResult = await this.db.query<MedicationWithProvider>(
      `SELECT m.id, m.provider_id, m.external_medication_id, m.drug_name, m.dosage, m.frequency, 
              m.route, m.start_date, m.end_date, m.prescribing_physician, m.is_active, m.adherence_score,
              hp.id as provider_id, hp.name as provider_name, hp.type as provider_type, hp.network_id
       FROM medications m
       LEFT JOIN healthcare_providers hp ON m.provider_id = hp.id
       WHERE m.patient_id = $1
       ORDER BY m.start_date DESC`,
      [patientId],
    );

    return medsResult.rows.map(med => ({
      ...med,
      provider: med.provider_id ? {
        id: med.provider_id,
        name: med.provider_name,
        type: med.provider_type,
        network_id: med.network_id,
      } as HealthcareProvider : undefined,
    }));
  }

  private async loadVitals(patientId: string) {
    const vitalsResult = await this.db.query<VitalWithProvider>(
      `SELECT v.id, v.provider_id, v.type, v.value, v.unit, v.recorded_at, v.recorded_by, 
              v.is_abnormal, v.clinical_context,
              hp.id as provider_id, hp.name as provider_name, hp.type as provider_type, hp.network_id
       FROM vitals v
       LEFT JOIN healthcare_providers hp ON v.provider_id = hp.id
       WHERE v.patient_id = $1
       ORDER BY v.recorded_at DESC`,
      [patientId],
    );

    return vitalsResult.rows.map(vital => ({
      ...vital,
      provider: vital.provider_id ? {
        id: vital.provider_id,
        name: vital.provider_name,
        type: vital.provider_type,
        network_id: vital.network_id,
      } as HealthcareProvider : undefined,
    }));
  }

  private async loadClinicalInsights(patientId: string) {
    const insightsResult = await this.db.query<ClinicalInsight>(
      `SELECT id, insight_type, title, explanation, confidence_score, severity, supporting_data, 
              recommendations, is_active, generated_at, expires_at
       FROM clinical_insights
       WHERE patient_id = $1 AND is_active = true
       ORDER BY severity DESC, confidence_score DESC, generated_at DESC`,
      [patientId],
    );

    return insightsResult.rows.map(insight => ({
      ...insight,
      supporting_data: typeof insight.supporting_data === 'string' 
        ? JSON.parse(insight.supporting_data) 
        : insight.supporting_data,
      recommendations: Array.isArray(insight.recommendations) 
        ? insight.recommendations 
        : [],
    }));
  }

  private async loadEmergencySession(patientId: string) {
    const sessionResult = await this.db.query<EmergencySession>(
      `SELECT id, patient_id, requesting_user_id, emergency_type, triage_level, access_reason, 
              temporary_access_expires_at, created_at
       FROM emergency_sessions
       WHERE patient_id = $1 AND temporary_access_expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [patientId],
    );

    return sessionResult.rows[0] || undefined;
  }

  private async loadXrayReports(patientId: string) {
    const result = await this.db.query<XrayReportRow>(
      `SELECT id, patient_id, provider_id, report_type, body_part, findings, radiologist_notes, urgency, report_date, report_url, risk_score
       FROM xray_reports
       WHERE patient_id = $1
       ORDER BY report_date DESC`,
      [patientId],
    );
    return result.rows;
  }

  private async loadBloodTests(patientId: string) {
    const result = await this.db.query<BloodTestRow>(
      `SELECT id, patient_id, provider_id, test_name, test_value, unit, reference_range, is_abnormal, severity, test_date, lab_comments, risk_indicator
       FROM blood_tests
       WHERE patient_id = $1
       ORDER BY test_date DESC`,
      [patientId],
    );
    return result.rows;
  }

  private async loadMedicalRecords(patientId: string) {
    const result = await this.db.query<MedicalRecordRow>(
      `SELECT id, patient_id, provider_id, record_type, title, content, summary, risk_assessment, recommendations, record_date, attending_physician
       FROM medical_records
       WHERE patient_id = $1
       ORDER BY record_date DESC`,
      [patientId],
    );
    return result.rows;
  }

  async requestConsent(patientId: string, providerId: string, userId: string, purpose: string, durationHours: number = 24) {
    const existingRequest = await this.db.query(
      `SELECT id FROM consent_requests 
       WHERE patient_id = $1 AND requesting_provider_id = $2 AND status = 'pending'`,
      [patientId, providerId]
    );

    if (existingRequest.rows.length > 0) {
      throw new Error('Consent request already pending');
    }

    const result = await this.db.query(
      `INSERT INTO consent_requests (patient_id, requesting_provider_id, requesting_user_id, purpose, access_duration_hours, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 hour')
       RETURNING id, patient_id, requesting_provider_id, purpose, status, created_at, expires_at`,
      [patientId, providerId, userId, purpose, durationHours]
    );

    return result.rows[0];
  }

  async createEmergencySession(patientId: string, userId: string, emergencyType: string, triageLevel: string, accessReason?: string) {
    const result = await this.db.query(
      `INSERT INTO emergency_sessions (patient_id, requesting_user_id, emergency_type, triage_level, access_reason, temporary_access_expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '6 hours')
       RETURNING id, patient_id, emergency_type, triage_level, access_reason, temporary_access_expires_at, created_at`,
      [patientId, userId, emergencyType, triageLevel, accessReason]
    );

    return result.rows[0];
  }

  private cleanList(value?: string[]) {
    return (value ?? []).map((item) => item.trim()).filter(Boolean);
  }

  private async nextPatientId() {
    const result = await this.db.query<{ next_id: string }>(
      `SELECT 'HX-' || lpad((10000 + COUNT(*) + 1)::text, 5, '0') AS next_id FROM patients`,
    );
    return result.rows[0]?.next_id ?? `HX-${Date.now().toString().slice(-5)}`;
  }
}
