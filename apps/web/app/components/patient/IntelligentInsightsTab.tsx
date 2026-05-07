'use client';

import { useState } from 'react';
import { 
  Brain, 
  Target, 
  AlertTriangle, 
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import type { ClinicalInsight } from '../../../lib/types';

interface IntelligentInsightsTabProps {
  insights: ClinicalInsight[];
  emergencyMode: boolean;
}

export default function IntelligentInsightsTab({ insights, emergencyMode }: IntelligentInsightsTabProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const activeInsights = insights.filter(i => i.is_active);
  
  // Filter insights
  const filteredInsights = activeInsights.filter(insight => {
    if (filterSeverity !== 'all' && insight.severity !== filterSeverity) return false;
    if (filterType !== 'all' && insight.insight_type !== filterType) return false;
    return true;
  });

  // Get unique insight types
  const insightTypes = ['all', ...Array.from(new Set(activeInsights.map(i => i.insight_type)))];

  // Count insights by severity
  const severityCounts = {
    critical: activeInsights.filter(i => i.severity === 'critical').length,
    high: activeInsights.filter(i => i.severity === 'high').length,
    medium: activeInsights.filter(i => i.severity === 'medium').length,
    low: activeInsights.filter(i => i.severity === 'low').length,
  };

  const avgConfidence = activeInsights.length > 0
    ? Math.round(activeInsights.reduce((sum, insight) => sum + insight.confidence_score, 0) / activeInsights.length * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* AI Intelligence Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <InsightStatCard
          label="Active Insights"
          value={activeInsights.length.toString()}
          sub="AI generated"
          accent="blue"
          emergencyMode={emergencyMode}
        />
        <InsightStatCard
          label="Critical"
          value={severityCounts.critical.toString()}
          sub="High priority"
          accent={severityCounts.critical > 0 ? 'red' : 'green'}
          emergencyMode={emergencyMode}
        />
        <InsightStatCard
          label="Avg Confidence"
          value={`${avgConfidence}%`}
          sub="AI accuracy"
          accent={avgConfidence >= 80 ? 'green' : avgConfidence >= 60 ? 'amber' : 'red'}
          emergencyMode={emergencyMode}
        />
        <InsightStatCard
          label="Updated"
          value="Live"
          sub="Real-time"
          accent="green"
          emergencyMode={emergencyMode}
        />
      </div>

      {/* AI Analysis Header */}
      <div className={`rounded-xl p-4 ${
        emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain size={20} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
            <h2 className={`text-lg font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
              AI Clinical Intelligence
            </h2>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-xs font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Live Analysis
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Severity Filter */}
            <div className="flex gap-1">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((severity) => (
                <button
                  key={severity}
                  onClick={() => setFilterSeverity(severity)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    filterSeverity === severity
                      ? emergencyMode
                        ? 'bg-red-600 text-white'
                        : 'bg-brand-500 text-white'
                      : emergencyMode
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-3 py-1 rounded text-xs font-medium border ${
                emergencyMode
                  ? 'bg-slate-700 border-slate-600 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {insightTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Critical Insights Alert */}
      {severityCounts.critical > 0 && (
        <div className={`rounded-xl p-4 border ${
          emergencyMode 
            ? 'bg-red-900/30 border-red-700' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className={emergencyMode ? 'text-red-400' : 'text-red-600'} />
            <h3 className={`text-sm font-bold ${emergencyMode ? 'text-red-300' : 'text-red-700'}`}>
              Critical Insights Require Immediate Attention ({severityCounts.critical})
            </h3>
          </div>
          <div className="space-y-2">
            {filteredInsights
              .filter(i => i.severity === 'critical')
              .slice(0, 3)
              .map((insight) => (
                <CriticalInsightCard
                  key={insight.id}
                  insight={insight}
                  emergencyMode={emergencyMode}
                />
              ))}
          </div>
        </div>
      )}

      {/* Insights Grid */}
      {filteredInsights.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredInsights.map((insight) => (
            <IntelligentInsightCard
              key={insight.id}
              insight={insight}
              isExpanded={expandedInsight === insight.id}
              onToggle={() => setExpandedInsight(
                expandedInsight === insight.id ? null : insight.id
              )}
              emergencyMode={emergencyMode}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Brain size={48} className={emergencyMode ? 'text-slate-600' : 'text-slate-400'} />
          <h3 className={`text-lg font-semibold mt-4 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            No insights found
          </h3>
          <p className={`text-sm mt-2 ${emergencyMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Try adjusting your filters or check back later as AI analysis continues
          </p>
        </div>
      )}
    </div>
  );
}

function InsightStatCard({ 
  label, 
  value, 
  sub, 
  accent, 
  emergencyMode 
}: {
  label: string;
  value: string;
  sub: string;
  accent: 'blue' | 'green' | 'amber' | 'red';
  emergencyMode: boolean;
}) {
  const accentStyles = {
    blue: emergencyMode ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600',
    green: emergencyMode ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600',
    amber: emergencyMode ? 'bg-amber-900/30 border-amber-700 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600',
    red: emergencyMode ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-600',
  };

  return (
    <div className={`rounded-xl border p-4 ${accentStyles[accent]}`}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
        {label}
      </div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="text-xs opacity-70 mt-1">{sub}</div>
    </div>
  );
}

function CriticalInsightCard({ 
  insight, 
  emergencyMode 
}: {
  insight: ClinicalInsight;
  emergencyMode: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg flex items-start gap-3 ${
      emergencyMode ? 'bg-red-800/40 text-red-200' : 'bg-red-100 text-red-700'
    }`}>
      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="font-semibold text-sm mb-1">{insight.title}</div>
        <div className="text-xs opacity-90">{insight.explanation}</div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Target size={10} />
            <span className="text-xs font-medium">
              {Math.round(insight.confidence_score * 100)}% confidence
            </span>
          </div>
          {insight.recommendations.length > 0 && (
            <span className="text-xs">
              {insight.recommendations.length} recommendation{insight.recommendations.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function IntelligentInsightCard({ 
  insight, 
  isExpanded, 
  onToggle, 
  emergencyMode 
}: {
  insight: ClinicalInsight;
  isExpanded: boolean;
  onToggle: () => void;
  emergencyMode: boolean;
}) {
  const severityStyles: Record<string, { card: string; badge: string; label: string }> = {
    critical: {
      card: emergencyMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200',
      badge: emergencyMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800',
      label: 'Critical',
    },
    high: {
      card: emergencyMode ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-200',
      badge: emergencyMode ? 'bg-orange-800 text-orange-200' : 'bg-orange-100 text-orange-800',
      label: 'High',
    },
    medium: {
      card: emergencyMode ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200',
      badge: emergencyMode ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-800',
      label: 'Medium',
    },
    low: {
      card: emergencyMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200',
      badge: emergencyMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800',
      label: 'Low',
    },
  };

  const typeLabels: Record<string, string> = {
    risk_trend: 'Risk Trend',
    medication_conflict: 'Medication Conflict',
    care_gap: 'Care Gap',
    emergency_risk: 'Emergency Risk',
    compliance_issue: 'Compliance Issue',
  };

  const style = severityStyles[insight.severity];

  return (
    <div className={`rounded-xl border p-5 transition-all hover:shadow-lg ${
      style.card
    } ${emergencyMode ? 'hover:bg-slate-700' : 'hover:bg-white'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${style.badge}`}>
            {style.label}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            emergencyMode ? 'bg-slate-700 text-slate-300' : 'bg-white/60 text-slate-700 border border-white/40'
          }`}>
            {typeLabels[insight.insight_type]}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 bg-white/60 rounded-full px-2.5 py-1">
          <Target size={11} className={emergencyMode ? 'text-slate-500' : 'text-slate-500'} />
          <span className={`text-xs font-bold ${emergencyMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {Math.round(insight.confidence_score * 100)}%
          </span>
        </div>
      </div>

      {/* Title and Explanation */}
      <h4 className={`text-sm font-bold mb-2 ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
        {insight.title}
      </h4>
      <p className={`text-sm leading-relaxed mb-3 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
        {insight.explanation}
      </p>

      {/* AI Analysis Details */}
      <div className={`p-3 rounded-lg mb-3 ${
        emergencyMode ? 'bg-slate-700/50' : 'bg-slate-50'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Brain size={14} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
          <span className={`text-xs font-bold uppercase tracking-wider ${
            emergencyMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            AI Analysis
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className={`font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Generated:
            </span>
            <span className={`ml-2 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {new Date(insight.generated_at).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className={`font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Status:
            </span>
            <span className={`ml-2 ${emergencyMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 text-xs font-medium transition-colors w-full ${
          emergencyMode 
            ? 'text-brand-400 hover:text-brand-300' 
            : 'text-brand-600 hover:text-brand-700'
        }`}
      >
        {isExpanded ? (
          <>
            <ChevronUp size={14} />
            Hide Recommendations
          </>
        ) : (
          <>
            <ChevronDown size={14} />
            View Recommendations ({insight.recommendations.length})
          </>
        )}
      </button>

      {/* Expanded Recommendations */}
      {isExpanded && insight.recommendations.length > 0 && (
        <div className={`mt-4 pt-4 border-t ${emergencyMode ? 'border-slate-600' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className={emergencyMode ? 'text-amber-400' : 'text-amber-600'} />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              emergencyMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Care Recommendations
            </span>
          </div>
          <div className="space-y-2">
            {insight.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`h-1.5 w-1.5 rounded-full mt-1.5 ${
                  emergencyMode ? 'bg-brand-400' : 'bg-brand-500'
                }`} />
                <p className={`text-xs leading-relaxed flex-1 ${
                  emergencyMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between mt-4 pt-3 border-t ${
        emergencyMode ? 'border-slate-600' : 'border-slate-200'
      }`}>
        <div className={`text-xxs ${emergencyMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Insight ID: {insight.id}
        </div>
        {insight.expires_at && (
          <div className={`text-xxs ${emergencyMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Expires: {new Date(insight.expires_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
