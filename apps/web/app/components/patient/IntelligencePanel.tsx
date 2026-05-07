'use client';

import { useState, useEffect } from 'react';
import { Brain, Activity, AlertTriangle, TrendingUp, CheckCircle, RefreshCw, Target, ChevronRight } from 'lucide-react';
import type { Patient, Alert, SystemActivity } from '../../../lib/types';

interface IntelligencePanelProps {
  patient: Patient;
  alerts: Alert[];
  systemActivity: SystemActivity[];
  emergencyMode: boolean;
}

export default function IntelligencePanel({ patient, alerts, systemActivity, emergencyMode }: IntelligencePanelProps) {
  const [liveAnalysis, setLiveAnalysis] = useState({
    riskTrend: 'increasing',
    lastCalculated: new Date(),
    nextCalculation: new Date(Date.now() + 30000),
  });

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const activeInsights = patient.insights?.filter((i) => i.is_active) ?? [];
  
  // Simulate live risk analysis updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveAnalysis(prev => ({
        ...prev,
        lastCalculated: new Date(),
        nextCalculation: new Date(Date.now() + 30000),
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 space-y-4">
      {/* Live Risk Analysis */}
      <div className={`rounded-xl p-4 ${
        emergencyMode 
          ? 'bg-slate-700 border border-slate-600' 
          : 'bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain size={16} className={emergencyMode ? 'text-red-400' : 'text-brand-600'} />
            <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
              Live Risk Analysis
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${
              criticalAlerts.length > 0 ? 'bg-red-500' : 'bg-emerald-500'
            } animate-pulse`} />
            <span className={`text-xxs font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Live
            </span>
          </div>
        </div>
        
        <div className={`text-center py-3 rounded-lg ${
          emergencyMode ? 'bg-slate-800' : 'bg-white/60'
        }`}>
          <div className={`text-3xl font-bold ${
            criticalAlerts.length > 0 
              ? 'text-red-600' 
              : emergencyMode 
                ? 'text-amber-400' 
                : 'text-emerald-600'
          }`}>
            {criticalAlerts.length > 0 ? '87' : '23'}
          </div>
          <div className={`text-xs font-medium mt-1 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Risk Score
          </div>
          <div className={`flex items-center justify-center gap-1 mt-2 ${
            liveAnalysis.riskTrend === 'increasing' ? 'text-red-500' : 'text-emerald-500'
          }`}>
            <TrendingUp size={10} />
            <span className="text-xs font-medium">
              {liveAnalysis.riskTrend === 'increasing' ? 'Increasing' : 'Stable'}
            </span>
          </div>
        </div>
        
        <div className={`text-xxs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'} mt-3 text-center`}>
          Calculated {liveAnalysis.lastCalculated.toLocaleTimeString()} · 
          Next in {Math.round((liveAnalysis.nextCalculation.getTime() - Date.now()) / 1000)}s
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className={`rounded-xl p-4 ${
          emergencyMode 
            ? 'bg-red-900/30 border border-red-700' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className={emergencyMode ? 'text-red-400' : 'text-red-600'} />
            <h3 className={`text-sm font-bold ${emergencyMode ? 'text-red-300' : 'text-red-700'}`}>
              Critical Alerts ({criticalAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {criticalAlerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-xs ${
                  emergencyMode ? 'bg-red-800/40 text-red-200' : 'bg-red-100 text-red-700'
                }`}
              >
                <div className="font-semibold mb-1">{alert.title}</div>
                <div className="text-opacity-80">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {activeInsights.length > 0 && (
        <div className={`rounded-xl p-4 ${
          emergencyMode ? 'bg-slate-700' : 'bg-white border border-slate-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
            <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
              AI Insights ({activeInsights.length})
            </h3>
          </div>
          <div className="space-y-3">
            {activeInsights.slice(0, 2).map((insight) => (
              <div key={insight.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-xs font-semibold ${emergencyMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {insight.title}
                  </h4>
                  <div className={`px-1.5 py-0.5 rounded text-xxs font-bold ${
                    insight.severity === 'critical' 
                      ? 'bg-red-100 text-red-700'
                      : insight.severity === 'high'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {insight.severity.toUpperCase()}
                  </div>
                </div>
                <p className={`text-xxs leading-relaxed ${emergencyMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {insight.explanation}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Target size={8} className={emergencyMode ? 'text-slate-500' : 'text-slate-400'} />
                    <span className={`text-xxs font-medium ${emergencyMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      {Math.round(insight.confidence_score * 100)}% confidence
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Activity Feed */}
      <div className={`rounded-xl p-4 ${
        emergencyMode ? 'bg-slate-700' : 'bg-white border border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
          <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
            System Activity
          </h3>
        </div>
        <div className="space-y-2">
          {systemActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-2">
              <div className="mt-0.5">
                {activity.status === 'active' ? (
                  <RefreshCw size={10} className="animate-spin text-brand-500" />
                ) : activity.status === 'complete' ? (
                  <CheckCircle size={10} className="text-emerald-500" />
                ) : (
                  <AlertTriangle size={10} className="text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {activity.message}
                </p>
                <p className={`text-xxs ${emergencyMode ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>
                  {activity.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Care Recommendations */}
      <div className={`rounded-xl p-4 ${
        emergencyMode ? 'bg-slate-700' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <ChevronRight size={16} className={emergencyMode ? 'text-purple-400' : 'text-purple-600'} />
          <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Care Recommendations
          </h3>
        </div>
        <div className="space-y-2">
          {activeInsights.slice(0, 2).map((insight) =>
            insight.recommendations.slice(0, 2).map((rec, i) => (
              <div key={`${insight.id}-${i}`} className="flex items-start gap-2">
                <ChevronRight 
                  size={10} 
                  className={emergencyMode ? 'text-purple-400 mt-0.5' : 'text-purple-600 mt-0.5'} 
                />
                <p className={`text-xs leading-relaxed ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {rec}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
