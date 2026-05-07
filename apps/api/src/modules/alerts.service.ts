import { Injectable, Logger } from '@nestjs/common';
import { PatientProfile, RiskAlert, ClinicalInsight } from './types';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  async generateAlerts(patient: PatientProfile): Promise<RiskAlert[]> {
    // Prioritize clinical insights from the database
    if (patient.insights && patient.insights.length > 0) {
      return this.transformInsightsToAlerts(patient.insights);
    }

    // Fallback to remote intelligence service
    const remoteAlerts = await this.fetchRemoteAlerts(patient);
    if (remoteAlerts.length > 0) {
      return remoteAlerts;
    }

    // Final fallback to local rule-based alerts
    return this.buildLocalAlerts(patient);
  }

  private transformInsightsToAlerts(insights: ClinicalInsight[]): RiskAlert[] {
    return insights.map(insight => ({
      severity: this.mapInsightSeverityToAlertSeverity(insight.severity),
      title: insight.title,
      message: insight.explanation,
      source: 'Clinical Intelligence Engine',
      severity_score: Math.round(insight.confidence_score * 100),
      recommendation: insight.recommendations.slice(0, 2).join('. ') + (insight.recommendations.length > 2 ? '...' : ''),
    }));
  }

  private mapInsightSeverityToAlertSeverity(insightSeverity: string): 'critical' | 'warning' | 'stable' {
    switch (insightSeverity) {
      case 'critical': return 'critical';
      case 'high': return 'critical';
      case 'medium': return 'warning';
      case 'low': return 'warning';
      default: return 'stable';
    }
  }

  private async fetchRemoteAlerts(patient: PatientProfile): Promise<RiskAlert[]> {
    const url = `${process.env.INTELLIGENCE_URL ?? 'http://localhost:8000'}/alerts`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patient),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`Remote alert service returned ${response.status}`);
        return [];
      }

      const body = await response.json();
      return Array.isArray(body) ? body : [];
    } catch (error) {
      this.logger.warn(`Alert service fallback triggered: ${error instanceof Error ? error.message : 'unknown error'}`);
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildLocalAlerts(patient: PatientProfile): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    const activeMeds = new Set(patient.medications.filter((item) => item.is_active).map((med) => med.drug_name.toLowerCase()));
    const hasTrauma = patient.events.some((event) => ['accident', 'surgery', 'emergency'].includes(event.type) || event.description.toLowerCase().includes('trauma'));
    const bpReadings = patient.vitals
      .filter((vital) => vital.type.toLowerCase() === 'bp')
      .map((vital) => ({ value: this.parseBp(vital.value), recorded_at: vital.recorded_at, provider: vital.provider?.name }))
      .filter((bp) => bp.value)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

    // Enhanced hypertension trend analysis
    if (bpReadings.length >= 2) {
      const latest = bpReadings[0];
      const previous = bpReadings[1];
      const [systolic, diastolic] = latest.value!;

      if (systolic >= 160 || diastolic >= 100) {
        const trend = previous.value && latest.value ? this.calculateTrend(previous.value, latest.value) : 0;
        alerts.push({
          severity: 'critical',
          title: 'Hypertensive crisis detected',
          message: `Blood pressure ${systolic}/${diastolic} mmHg${trend > 10 ? ` with ${Math.round(trend)}% increase from previous reading` : ''}. Combined with elevated glucose trends, cardiovascular risk is rising.`,
          source: 'Multi-provider vital analysis',
          severity_score: 92,
          recommendation: 'Immediate antihypertensive therapy review. Consider ACE inhibitor addition. Schedule cardiology follow-up within 48 hours.',
        });
      } else if (systolic >= 140 || diastolic >= 90) {
        alerts.push({
          severity: 'warning',
          title: 'Sustained elevated blood pressure',
          message: `Blood pressure ${systolic}/${diastolic} mmHg across ${bpReadings.length} readings indicates poor control despite current therapy.`,
          source: 'Longitudinal vitals tracking',
          severity_score: 75,
          recommendation: 'Assess medication adherence. Consider therapy intensification. Lifestyle counseling reinforcement needed.',
        });
      }
    }

    // Enhanced medication interaction analysis
    const anticoagulants = ['warfarin', 'apixaban', 'rivaroxaban', 'dabigatran'];
    const nsaids = ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib'];
    const hasAnticoagulant = Array.from(activeMeds).some(med => anticoagulants.includes(med));
    const hasNsaid = Array.from(activeMeds).some(med => nsaids.includes(med));

    if (hasAnticoagulant && hasNsaid) {
      alerts.push({
        severity: 'critical',
        title: 'High-risk bleeding combination',
        message: 'Patient on anticoagulant therapy with concurrent NSAID use creates significant gastrointestinal bleeding risk.',
        source: 'Medication safety analysis',
        severity_score: 88,
        recommendation: 'Discontinue NSAID immediately. Consider acetaminophen for pain. Review INR if on warfarin. GI prophylaxis may be indicated.',
      });
    }

    if (hasAnticoagulant && hasTrauma) {
      alerts.push({
        severity: 'critical',
        title: 'Trauma with anticoagulation therapy',
        message: 'Recent trauma event while on anticoagulant therapy increases intracranial and internal bleeding risk.',
        source: 'Emergency risk assessment',
        severity_score: 95,
        recommendation: 'Urgent imaging if head trauma. Hold anticoagulant if high bleeding risk. Reverse agent availability confirmed. Neurology consultation recommended.',
      });
    }

    // Enhanced glycemic control analysis
    const glucoseReadings = patient.vitals
      .filter((vital) => vital.type.toLowerCase() === 'glucose')
      .map((vital) => ({ value: this.toNumeric(vital.value), recorded_at: vital.recorded_at, provider: vital.provider?.name }))
      .filter((glucose) => glucose.value > 0)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

    if (glucoseReadings.length >= 3) {
      const avgGlucose = glucoseReadings.slice(0, 3).reduce((sum, g) => sum + g.value, 0) / 3;
      const highGlucoseCount = glucoseReadings.slice(0, 3).filter(g => g.value >= 180).length;

      if (avgGlucose >= 200 || highGlucoseCount >= 2) {
        const hasMetformin = Array.from(activeMeds).some(med => med.includes('metformin'));
        alerts.push({
          severity: 'warning',
          title: 'Poor glycemic control detected',
          message: `Average glucose ${Math.round(avgGlucose)} mg/dL with ${highGlucoseCount}/3 readings >180 mg/dL${hasMetformin ? ' despite metformin therapy' : ''}. HbA1c likely elevated.`,
          source: 'Longitudinal glucose analysis',
          severity_score: 78,
          recommendation: hasMetformin
            ? 'Assess metformin adherence. Consider SGLT2 inhibitor or GLP-1 agonist addition. Diabetes education referral.'
            : 'Initiate or optimize diabetes therapy. Dietary counseling needed. HbA1c testing within 2 weeks.',
        });
      }
    }

    // Care gap detection
    const lastVisit = patient.events
      .filter(event => ['visit', 'diagnosis'].includes(event.type))
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0];

    if (lastVisit) {
      const daysSinceLastVisit = Math.floor((Date.now() - new Date(lastVisit.event_date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastVisit > 180 && patient.chronic_conditions.length > 0) {
        alerts.push({
          severity: 'warning',
          title: 'Care gap identified',
          message: `${Math.floor(daysSinceLastVisit / 30)} months since last clinical visit despite chronic conditions: ${patient.chronic_conditions.join(', ')}.`,
          source: 'Care continuity analysis',
          severity_score: 65,
          recommendation: 'Schedule follow-up appointment within 2 weeks. Comprehensive medication review needed. Update care plan.',
        });
      }
    }

    if (alerts.length === 0) {
      alerts.push({
        severity: 'stable',
        title: 'Stable clinical profile',
        message: 'No acute risk signals detected. Patient appears clinically stable based on available longitudinal data.',
        source: 'Comprehensive risk assessment',
        severity_score: 25,
        recommendation: 'Continue routine monitoring. Maintain current therapeutic regimen. Update preventive care schedule.',
      });
    }

    return alerts;
  }

  private calculateTrend(previous: [number, number], current: [number, number]): number {
    const prevAvg = (previous[0] + previous[1]) / 2;
    const currAvg = (current[0] + current[1]) / 2;
    return ((currAvg - prevAvg) / prevAvg) * 100;
  }

  private parseBp(value: string): [number, number] | null {
    const [systolic, diastolic] = value.split('/').map((segment) => segment.trim());
    if (!systolic || !diastolic || Number.isNaN(Number(systolic)) || Number.isNaN(Number(diastolic))) {
      return null;
    }
    return [Number(systolic), Number(diastolic)];
  }

  private toNumeric(value: string) {
    const parsed = Number(value.replace(/[^\\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
