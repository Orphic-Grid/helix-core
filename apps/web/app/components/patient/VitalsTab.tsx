import { useState } from 'react';
import { Activity, Calendar, AlertTriangle, BarChart3 } from 'lucide-react';
import type { Vital } from '../../../lib/types';
import VitalTrendsChart from './VitalTrendsChart';

interface VitalsTabProps {
  vitals: Vital[];
  emergencyMode: boolean;
}

export default function VitalsTab({ vitals, emergencyMode }: VitalsTabProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'trends'>('trends');

  const vitalsByType = vitals.reduce((acc, vital) => {
    if (!acc[vital.type]) acc[vital.type] = [];
    acc[vital.type].push(vital);
    return acc;
  }, {} as Record<string, Vital[]>);

  const vitalTypes = Object.keys(vitalsByType);
  const abnormalVitals = vitals.filter(v => v.is_abnormal);
  const criticalVitals = abnormalVitals.filter(v => 
    v.type.toLowerCase().includes('pressure') && parseFloat(v.value) > 180
  );

  // Calculate overall trends
  const calculateOverallTrend = () => {
    if (vitals.length < 2) return 'stable';
    const recent = vitals.slice(-5);
    const older = vitals.slice(-10, -5);
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, v) => sum + parseFloat(v.value), 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + parseFloat(v.value), 0) / older.length;
    
    return recentAvg > olderAvg * 1.05 ? 'improving' : recentAvg < olderAvg * 0.95 ? 'declining' : 'stable';
  };

  const overallTrend = calculateOverallTrend();

  if (vitals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Activity size={36} className="mb-3 opacity-40" />
        <p className="text-base font-semibold">No vitals recorded</p>
        <p className="text-sm mt-1">Vital signs will appear here as they are recorded</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Vitals Intelligence Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <VitalStatCard
          label="Total Readings"
          value={vitals.length.toString()}
          sub="All vitals"
          accent="blue"
          emergencyMode={emergencyMode}
        />
        <VitalStatCard
          label="Abnormal"
          value={abnormalVitals.length.toString()}
          sub="Require attention"
          accent={abnormalVitals.length > 0 ? 'red' : 'green'}
          emergencyMode={emergencyMode}
        />
        <VitalStatCard
          label="Critical"
          value={criticalVitals.length.toString()}
          sub="High priority"
          accent={criticalVitals.length > 0 ? 'red' : 'green'}
          emergencyMode={emergencyMode}
        />
        <VitalStatCard
          label="Trend"
          value={overallTrend}
          sub="Overall status"
          accent={overallTrend === 'improving' ? 'green' : overallTrend === 'declining' ? 'red' : 'amber'}
          emergencyMode={emergencyMode}
        />
      </div>

      {/* View Toggle */}
      <div className={`rounded-xl p-4 ${
        emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity size={20} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
            <h2 className={`text-lg font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
              Visual Intelligence
            </h2>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('trends')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedView === 'trends'
                  ? emergencyMode
                    ? 'bg-red-600 text-white'
                    : 'bg-brand-500 text-white'
                  : emergencyMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 size={14} />
              Trends
            </button>
            <button
              onClick={() => setSelectedView('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedView === 'overview'
                  ? emergencyMode
                    ? 'bg-red-600 text-white'
                    : 'bg-brand-500 text-white'
                  : emergencyMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Activity size={14} />
              Overview
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalVitals.length > 0 && (
        <div className={`rounded-xl p-4 border ${
          emergencyMode 
            ? 'bg-red-900/30 border-red-700' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className={emergencyMode ? 'text-red-400' : 'text-red-600'} />
            <h3 className={`text-sm font-bold ${emergencyMode ? 'text-red-300' : 'text-red-700'}`}>
              Critical Vitals Alert ({criticalVitals.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalVitals.slice(0, 4).map((vital) => (
              <div key={vital.id} className={`p-3 rounded-lg flex items-center gap-3 ${
                emergencyMode ? 'bg-red-800/40 text-red-200' : 'bg-red-100 text-red-700'
              }`}>
                <Activity size={16} />
                <div className="flex-1">
                  <div className="font-semibold">{vital.type}: {vital.value} {vital.unit}</div>
                  <div className="text-sm opacity-90">
                    {new Date(vital.recorded_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {selectedView === 'trends' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vitalTypes.slice(0, 6).map((type) => (
            <VitalTrendsChart
              key={type}
              vitals={vitals}
              vitalType={type}
              emergencyMode={emergencyMode}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {vitalTypes.map((type) => {
            const typeVitals = vitalsByType[type];
            typeVitals.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
            const abnormalCount = typeVitals.filter(v => v.is_abnormal).length;

            return (
              <div key={type} className={`rounded-2xl border shadow-card p-5 ${
                emergencyMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
                    <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {type}
                    </h3>
                    {abnormalCount > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        emergencyMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                      }`}>
                        {abnormalCount} abnormal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar size={12} />
                    {typeVitals.length} reading{typeVitals.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="space-y-3">
                  {typeVitals
                    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                    .slice(0, 5)
                    .map((vital) => (
                      <div key={vital.id} className={`flex items-center justify-between p-3 rounded-lg ${
                        emergencyMode ? 'bg-slate-700/50' : 'bg-slate-50'
                      }`}>
                        <div>
                          <div className={`font-semibold ${
                            vital.is_abnormal 
                              ? 'text-red-600' 
                              : emergencyMode 
                                ? 'text-slate-200' 
                                : 'text-slate-900'
                          }`}>
                            {vital.value}
                            {vital.unit && (
                              <span className={`text-sm font-normal ${
                                emergencyMode ? 'text-slate-400' : 'text-slate-500'
                              } ml-1`}>
                                {vital.unit}
                              </span>
                            )}
                          </div>
                          <div className={`text-xs ${
                            emergencyMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {new Date(vital.recorded_at).toLocaleDateString()} at{' '}
                            {new Date(vital.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {vital.is_abnormal && <AlertTriangle size={14} className="text-red-500" />}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VitalStatCard({ 
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

