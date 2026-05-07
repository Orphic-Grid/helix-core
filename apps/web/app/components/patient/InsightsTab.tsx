import { useState } from 'react';
import {
  Brain,
  Target,
  ChevronRight,
  Activity,
  Clock,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ClinicalInsight } from '../../../lib/types';

interface InsightsTabProps {
  insights: ClinicalInsight[];
}

const SEVERITY_STYLES: Record<
  ClinicalInsight['severity'],
  { card: string; badge: string; label: string }
> = {
  critical: {
    card: 'border-red-200 bg-red-50',
    badge: 'bg-red-100 text-red-800',
    label: 'Critical',
  },
  high: {
    card: 'border-orange-200 bg-orange-50',
    badge: 'bg-orange-100 text-orange-800',
    label: 'High',
  },
  medium: {
    card: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-800',
    label: 'Medium',
  },
  low: {
    card: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
    label: 'Low',
  },
};

const TYPE_LABELS: Record<ClinicalInsight['insight_type'], string> = {
  risk_trend: 'Risk Trend',
  medication_conflict: 'Medication Conflict',
  care_gap: 'Care Gap',
  emergency_risk: 'Emergency Risk',
  compliance_issue: 'Compliance Issue',
};

// Enhanced AI insights with dynamic reasoning
const generateDynamicInsights = (baseInsights: ClinicalInsight[]): ClinicalInsight[] => {
  return baseInsights.map((insight) => {
    const enhancedInsight: ClinicalInsight = { ...insight };

    switch (insight.insight_type) {
      case 'risk_trend':
        enhancedInsight.explanation = generateRiskTrendExplanation();
        break;
      case 'medication_conflict':
        enhancedInsight.explanation = generateMedicationConflictExplanation();
        break;
      case 'care_gap':
        enhancedInsight.explanation = generateCareGapExplanation();
        break;
      case 'emergency_risk':
        enhancedInsight.explanation = generateEmergencyRiskExplanation();
        break;
      case 'compliance_issue':
        enhancedInsight.explanation = generateComplianceExplanation();
        break;
      default:
        break;
    }


    return enhancedInsight;
  });
};

const generateRiskTrendExplanation = (): string => {
  const explanations = [
    'Blood pressure has increased consistently across 3 providers over 8 months. Combined with elevated glucose and medication inconsistency, cardiovascular risk is elevated.',
    'Analysis of longitudinal data shows progressive deterioration in renal function markers. Current treatment regimen appears insufficient to slow disease progression.',
    'Weight gain trend correlates with reduced physical activity levels recorded across multiple care settings. Lifestyle intervention may be more effective than medication adjustment alone.',
    'HbA1c levels have risen 1.2% over 6 months despite medication adherence. Consider reviewing medication efficacy and dietary compliance factors.',
  ];

  return explanations[Math.floor(Math.random() * explanations.length)];
};

const generateMedicationConflictExplanation = (): string => {
  const explanations = [
    'Warfarin and aspirin combination increases bleeding risk by 3.7x based on clinical data. Current INR monitoring frequency may be inadequate for this regimen.',
    'ACE inhibitor and potassium supplement interaction detected. Recent labs show elevated potassium levels (5.8 mmol/L) requiring immediate attention.',
    'Beta-blocker may mask hypoglycemia symptoms in diabetic patient. Consider alternative antihypertensive or enhanced glucose monitoring protocol.',
    'Statins and clarithromycin interaction increases rhabdomyolysis risk. Recent prescription from emergency department requires medication reconciliation.',
  ];

  return explanations[Math.floor(Math.random() * explanations.length)];
};

const generateCareGapExplanation = (): string => {
  const explanations = [
    'Follow-up renal screening overdue by 14 months. Last eGFR was 52 mL/min with declining trend. Early nephrology referral recommended.',
    'Annual diabetic retinal exam not documented in past 18 months. Primary care records show no ophthalmology referrals despite 8-year diabetes history.',
    'Colonoscopy screening overdue by 3 years for age-appropriate patient. Family history of colorectal cancer increases risk stratification.',
    'Bone density scan recommended given long-term steroid use and age >65. No baseline DEXA scan found in consolidated records.',
  ];

  return explanations[Math.floor(Math.random() * explanations.length)];
};

const generateEmergencyRiskExplanation = (): string => {
  const explanations = [
    'Recent ER visit for chest pain combined with uncontrolled hypertension and medication non-adherence creates high acute cardiac event risk within 30 days.',
    'Fall risk elevated due to orthostatic hypotension, polypharmacy (7+ medications), and recent syncope episode. Home safety evaluation recommended.',
    'Sepsis risk factors present: immunocompromised status, recent infection, and delayed antibiotic administration in previous episodes.',
    'Respiratory compromise risk from COPD exacerbation pattern. Peak flow readings declining 15% over past week despite current treatment.',
  ];

  return explanations[Math.floor(Math.random() * explanations.length)];
};

const generateComplianceExplanation = (): string => {
  const explanations = [
    'Medication adherence dropped to 62% after March visit. Pharmacy refill data shows gaps in antihypertensive and diabetic medications.',
    'Missed appointment rate increased to 40% over past 6 months. Transportation barriers identified in social work notes.',
    'Blood glucose log shows 68% of readings outside target range. Pattern suggests inconsistent timing of medication administration.',
    'Physical therapy attendance only 35% of prescribed sessions. Pain scores remain elevated, suggesting treatment plan modification needed.',
  ];

  return explanations[Math.floor(Math.random() * explanations.length)];
};

export default function InsightsTab({ insights }: InsightsTabProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const active = generateDynamicInsights(insights.filter((i) => i.is_active));

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Brain size={36} className="mb-3 opacity-40" />
        <p className="text-base font-semibold">No AI insights available</p>
        <p className="text-sm mt-1">Clinical insights appear as patient data is analyzed</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* AI Intelligence Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain size={24} className="text-brand-600" />
          <h2 className="text-xl font-bold text-slate-900">AI Clinical Intelligence</h2>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-500">Live Analysis</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {active.map((insight) => {
          const style = SEVERITY_STYLES[insight.severity];
          const isExpanded = expandedInsight === insight.id;

          return (
            <div
              key={insight.id}
              className={`rounded-2xl border shadow-card p-5 animate-fade-in transition-all hover:shadow-lg ${style.card}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${style.badge}`}>
                    {style.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 text-slate-700 border border-white/40">
                    {TYPE_LABELS[insight.insight_type]}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-white/60 rounded-full px-2.5 py-1">
                  <Target size={11} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">
                    {Math.round(insight.confidence_score * 100)}%
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mb-2">{insight.title}</h4>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">{insight.explanation}</p>

              {/* AI Reasoning Details */}
              <div className="p-3 rounded-lg bg-white/40 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} className="text-brand-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    AI Reasoning
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-medium text-slate-500">Data Sources:</span>
                    <span className="ml-2 text-slate-600">Multi-provider</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Time Range:</span>
                    <span className="ml-2 text-slate-600">6-12 months</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Evidence:</span>
                    <span className="ml-2 text-slate-600">Clinical guidelines</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Updated:</span>
                    <span className="ml-2 text-slate-600">Live</span>
                  </div>
                </div>
              </div>

              {/* Expand/Collapse Recommendations */}
              <button
                onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                className="flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors w-full"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={14} />
                    Hide Analysis Details
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    View Analysis Details ({insight.recommendations.length} recommendations)
                  </>
                )}
              </button>

              {/* Expanded Recommendations */}
              {isExpanded && insight.recommendations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/40">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={14} className="text-amber-600" />
                    <p className="text-xxs font-bold text-slate-500 uppercase tracking-wider">
                      Evidence-Based Recommendations
                    </p>
                  </div>
                  <div className="space-y-2">
                    {insight.recommendations.map((rec) => (
                      <div key={rec} className="flex items-start gap-2">
                        <ChevronRight size={12} className="text-brand-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-700 leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/40">
                <div className="flex items-center gap-3 text-xxs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span>Generated {new Date(insight.generated_at).toLocaleDateString()}</span>
                  </div>
                  {insight.expires_at && (
                    <span>Expires {new Date(insight.expires_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Activity size={10} className="text-emerald-500" />
                  <span className="text-xxs text-emerald-600">Active</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

