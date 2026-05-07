'use client';

import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle
} from 'lucide-react';
import type { Vital } from '../../../lib/types';

interface VitalTrendsChartProps {
  vitals: Vital[];
  vitalType: string;
  emergencyMode: boolean;
}

export default function VitalTrendsChart({ vitals, vitalType, emergencyMode }: VitalTrendsChartProps) {
  // Filter and sort vitals for the specific type
  const typeVitals = vitals
    .filter(v => v.type === vitalType)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-10); // Last 10 readings

  if (typeVitals.length < 2) {
    return (
      <div className={`rounded-xl p-4 ${
        emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
          <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
            {vitalType} Trends
          </h3>
        </div>
        <div className="text-center py-8">
          <Activity size={32} className={emergencyMode ? 'text-slate-600' : 'text-slate-400'} />
          <p className={`text-sm mt-2 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Insufficient data for trend analysis
          </p>
        </div>
      </div>
    );
  }

  // Calculate trend
  const values = typeVitals.map(v => parseFloat(v.value));
  const latest = values[values.length - 1];
  const previous = values[values.length - 2];
  const trend = latest > previous ? 'up' : latest < previous ? 'down' : 'stable';
  
  // Calculate min/max for scaling
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Generate chart points
  const chartHeight = 120;
  const chartWidth = 100;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * chartWidth;
    const y = chartHeight - ((value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const getTrendColor = () => {
    if (typeVitals.some(v => v.is_abnormal)) return 'text-red-500';
    if (trend === 'up') return 'text-amber-500';
    if (trend === 'down') return 'text-emerald-500';
    return 'text-blue-500';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Activity;
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className={`rounded-xl p-4 ${
      emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
          <h3 className={`text-sm font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
            {vitalType} Trends
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon size={14} className={getTrendColor()} />
          <span className={`text-xs font-medium capitalize ${getTrendColor()}`}>
            {trend}
          </span>
        </div>
      </div>

      {/* Simple SVG Chart */}
      <div className="mb-4">
        <svg width="100%" height={chartHeight + 20} viewBox={`0 0 ${chartWidth + 20} ${chartHeight + 20}`}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="10"
              y1={y}
              x2={chartWidth + 10}
              y2={y}
              stroke={emergencyMode ? '#475569' : '#e2e8f0'}
              strokeWidth="0.5"
            />
          ))}
          
          {/* Data line */}
          <polyline
            points={points}
            fill="none"
            stroke={typeVitals.some(v => v.is_abnormal) ? '#ef4444' : '#007a74'}
            strokeWidth="2"
            transform="translate(10, 10)"
          />
          
          {/* Data points */}
          {values.map((value, index) => {
            const x = (index / (values.length - 1)) * chartWidth + 10;
            const y = chartHeight - ((value - minValue) / range) * chartHeight + 10;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={typeVitals[index].is_abnormal ? '#ef4444' : '#007a74'}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className={`font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Latest
          </div>
          <div className={`font-bold ${typeVitals[typeVitals.length - 1].is_abnormal ? 'text-red-600' : emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
            {latest} {typeVitals[0].unit}
          </div>
        </div>
        <div>
          <div className={`font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Average
          </div>
          <div className={`font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
            {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)} {typeVitals[0].unit}
          </div>
        </div>
        <div>
          <div className={`font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Range
          </div>
          <div className={`font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
            {minValue}-{maxValue} {typeVitals[0].unit}
          </div>
        </div>
      </div>

      {/* Abnormal Reading Alert */}
      {typeVitals.some(v => v.is_abnormal) && (
        <div className={`mt-3 p-2 rounded-lg flex items-start gap-2 ${
          emergencyMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
        }`}>
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-semibold">Abnormal Readings Detected</div>
            <div className="opacity-90">
              {typeVitals.filter(v => v.is_abnormal).length} reading(s) outside normal range
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
