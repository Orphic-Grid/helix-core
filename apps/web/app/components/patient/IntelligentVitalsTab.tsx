'use client';

import { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Heart,
  Thermometer,
  Wind
} from 'lucide-react';
import type { Vital } from '../../../lib/types';

interface IntelligentVitalsTabProps {
  vitals: Vital[];
  emergencyMode: boolean;
}

export default function IntelligentVitalsTab({ vitals, emergencyMode }: IntelligentVitalsTabProps) {
  const [selectedVitalType, setSelectedVitalType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  // Get unique vital types
  const vitalTypes = ['all', ...Array.from(new Set(vitals.map(v => v.type)))];
  
  // Filter vitals based on selections
  const filteredVitals = vitals.filter(vital => {
    if (selectedVitalType !== 'all' && vital.type !== selectedVitalType) return false;
    
    const vitalDate = new Date(vital.recorded_at);
    const now = new Date();
    const daysDiff = (now.getTime() - vitalDate.getTime()) / (1000 * 60 * 60 * 24);
    
    switch (timeRange) {
      case 'day': return daysDiff <= 1;
      case 'week': return daysDiff <= 7;
      case 'month': return daysDiff <= 30;
      default: return true;
    }
  }).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

  // Get vital type icon
  const getVitalIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'blood pressure':
      case 'bp':
      case 'systolic':
      case 'diastolic':
        return Heart;
      case 'temperature':
      case 'temp':
        return Thermometer;
      case 'oxygen saturation':
      case 'o2 sat':
      case 'spo2':
        return Wind;
      case 'heart rate':
      case 'pulse':
      case 'hr':
        return Activity;
      default:
        return Activity;
    }
  };

  // Calculate trends for each vital type
  const calculateTrend = (vitalType: string): 'up' | 'down' | 'stable' => {
    const typeVitals = vitals.filter(v => v.type === vitalType).slice(0, 5);
    if (typeVitals.length < 2) return 'stable';
    
    const latest = parseFloat(typeVitals[0].value);
    const previous = parseFloat(typeVitals[1].value);
    
    if (latest > previous * 1.05) return 'up';
    if (latest < previous * 0.95) return 'down';
    return 'stable';
  };

  // Get latest vitals for summary
  const latestVitals = vitalTypes
    .filter(type => type !== 'all')
    .map(type => {
      const typeVitals = vitals.filter(v => v.type === type);
      return typeVitals.length > 0 ? typeVitals[0] : null;
    })
    .filter(Boolean) as Vital[];

  const abnormalVitals = filteredVitals.filter(v => v.is_abnormal);
  const criticalVitals = abnormalVitals.filter(v => 
    v.type.toLowerCase().includes('pressure') && parseFloat(v.value) > 180
  );

  return (
    <div className="p-6 space-y-6">
      {/* Vitals Summary Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <VitalStatCard
          label="Total Vitals"
          value={filteredVitals.length.toString()}
          sub={timeRange}
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
          value="Stable"
          sub="Overall status"
          accent="green"
          emergencyMode={emergencyMode}
        />
      </div>

      {/* Latest Vitals Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {latestVitals.map((vital) => {
          const Icon = getVitalIcon(vital.type);
          const trend = calculateTrend(vital.type);
          
          return (
            <div key={vital.id} className={`rounded-xl p-4 border ${
              vital.is_abnormal
                ? emergencyMode
                  ? 'bg-red-900/30 border-red-700'
                  : 'bg-red-50 border-red-200'
                : emergencyMode
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={16} className={
                  vital.is_abnormal 
                    ? 'text-red-500' 
                    : emergencyMode 
                      ? 'text-brand-400' 
                      : 'text-brand-600'
                } />
                {trend === 'up' && <TrendingUp size={12} className="text-red-500" />}
                {trend === 'down' && <TrendingDown size={12} className="text-emerald-500" />}
                {trend === 'stable' && <div className="h-3 w-3 rounded-full bg-emerald-500" />}
              </div>
              <div className={`text-lg font-bold ${
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
                  }`}>
                    {' '}{vital.unit}
                  </span>
                )}
              </div>
              <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {vital.type}
              </div>
              <div className={`text-xxs ${emergencyMode ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                {new Date(vital.recorded_at).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className={`rounded-xl p-4 ${
        emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity size={20} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
            <h2 className={`text-lg font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
              Vitals History
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex gap-1">
              {(['day', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    timeRange === range
                      ? emergencyMode
                        ? 'bg-red-600 text-white'
                        : 'bg-brand-500 text-white'
                      : emergencyMode
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Vital Type Filter */}
            <select
              value={selectedVitalType}
              onChange={(e) => setSelectedVitalType(e.target.value)}
              className={`px-3 py-1 rounded text-xs font-medium border ${
                emergencyMode
                  ? 'bg-slate-700 border-slate-600 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {vitalTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Vitals' : type}
                </option>
              ))}
            </select>
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
          <div className="space-y-2">
            {criticalVitals.map((vital) => {
              const Icon = getVitalIcon(vital.type);
              return (
                <div key={vital.id} className={`p-3 rounded-lg flex items-center gap-3 ${
                  emergencyMode ? 'bg-red-800/40 text-red-200' : 'bg-red-100 text-red-700'
                }`}>
                  <Icon size={16} />
                  <div className="flex-1">
                    <div className="font-semibold">{vital.type}: {vital.value} {vital.unit}</div>
                    <div className="text-sm opacity-90">
                      {new Date(vital.recorded_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vitals List */}
      <div className={`rounded-xl p-4 ${
        emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
      }`}>
        <h3 className={`text-sm font-bold mb-4 ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
          Vitals History ({filteredVitals.length})
        </h3>
        
        {filteredVitals.length > 0 ? (
          <div className="space-y-3">
            {filteredVitals.map((vital) => {
              const Icon = getVitalIcon(vital.type);
              return (
                <VitalCard
                  key={vital.id}
                  vital={vital}
                  Icon={Icon}
                  emergencyMode={emergencyMode}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity size={32} className={emergencyMode ? 'text-slate-600' : 'text-slate-400'} />
            <p className={`text-sm mt-2 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
              No vitals found for selected filters
            </p>
          </div>
        )}
      </div>
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
  accent: 'blue' | 'green' | 'red';
  emergencyMode: boolean;
}) {
  const accentStyles = {
    blue: emergencyMode ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600',
    green: emergencyMode ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600',
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

function VitalCard({ 
  vital, 
  Icon,
  emergencyMode 
}: {
  vital: Vital;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  emergencyMode: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border transition-all hover:shadow-md ${
      vital.is_abnormal
        ? emergencyMode
          ? 'bg-red-900/20 border-red-700'
          : 'bg-red-50 border-red-200'
        : emergencyMode
          ? 'bg-slate-700/50 border-slate-600'
          : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            vital.is_abnormal
              ? emergencyMode ? 'bg-red-800/50' : 'bg-red-100'
              : emergencyMode ? 'bg-slate-600' : 'bg-slate-100'
          }`}>
            <Icon size={16} className={
              vital.is_abnormal 
                ? 'text-red-500' 
                : emergencyMode 
                  ? 'text-brand-400' 
                  : 'text-brand-600'
            } />
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`text-sm font-semibold ${emergencyMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {vital.type}
              </h4>
              {vital.is_abnormal && (
                <AlertTriangle size={12} className="text-red-500" />
              )}
            </div>
            <div className={`text-lg font-bold ${
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
                }`}>
                  {' '}{vital.unit}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {new Date(vital.recorded_at).toLocaleDateString()}
          </div>
          <div className={`text-xxs ${emergencyMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {new Date(vital.recorded_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
      
      {vital.clinical_context && (
        <div className={`mt-3 pt-3 border-t ${
          emergencyMode ? 'border-slate-600' : 'border-slate-200'
        }`}>
          <p className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="font-medium">Context:</span> {vital.clinical_context}
          </p>
        </div>
      )}
    </div>
  );
}
