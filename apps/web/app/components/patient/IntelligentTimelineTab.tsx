'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Building2,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
  FileText,
  Pill,
  Microscope,
} from 'lucide-react';
import type { MedicalEvent } from '../../../lib/types';

interface IntelligentTimelineTabProps {
  events: MedicalEvent[];
  emergencyMode: boolean;
  expandedEvent: string | null;
  onToggleEvent: (id: string | null) => void;
}

export default function IntelligentTimelineTab({
  events,
  emergencyMode,
  expandedEvent,
  onToggleEvent,
}: IntelligentTimelineTabProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const filteredEvents = events
    .filter((event) => {
      if (filterType !== 'all' && event.type !== filterType) return false;

      const eventDate = new Date(event.event_date);
      const now = new Date();
      const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);

      switch (timeRange) {
        case 'week':
          return daysDiff <= 7;
        case 'month':
          return daysDiff <= 30;
        case 'quarter':
          return daysDiff <= 90;
        case 'year':
          return daysDiff <= 365;
        default:
          return true;
      }
    })
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  const eventTypes = ['all', ...Array.from(new Set(events.map((e) => e.type)))];

  return (
    <div className="p-6">
      {/* Timeline Controls */}
      <div
        className={`rounded-xl p-4 mb-6 ${
          emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={20} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
            <h2 className={`text-lg font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
              Clinical Timeline
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex gap-1">
              {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
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

            {/* Event Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-3 py-1 rounded text-xs font-medium border ${
                emergencyMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Events' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="relative">
        {filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {/* Timeline Connector */}
            <div
              className={`absolute left-6 top-0 bottom-0 w-0.5 ${emergencyMode ? 'bg-slate-600' : 'bg-slate-200'}`}
            />

            {filteredEvents.map((event) => (
              <IntelligentEventCard
                key={event.id}
                event={event}
                isExpanded={expandedEvent === event.id}
                onToggle={() => onToggleEvent(expandedEvent === event.id ? null : event.id)}
                emergencyMode={emergencyMode}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Clock size={48} className={emergencyMode ? 'text-slate-600' : 'text-slate-400'} />
            <h3 className={`text-lg font-semibold mt-4 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
              No events found
            </h3>
            <p className={`text-sm mt-2 ${emergencyMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Try adjusting your filters or time range
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function IntelligentEventCard({
  event,
  isExpanded,
  onToggle,
  emergencyMode,
}: {
  event: MedicalEvent;
  isExpanded: boolean;
  onToggle: () => void;
  emergencyMode: boolean;
}) {
  const eventTypeIcons: Record<
    string,
    React.ComponentType<{ size?: number; className?: string }>
  > = {
    emergency: AlertTriangle,
    surgery: Calendar,
    lab: Microscope,
    diagnosis: FileText,
    medication: Pill,
    imaging: Activity,
    accident: AlertTriangle,
    visit: Building2,
  };

  const eventStyles: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    emergency: {
      bg: emergencyMode ? 'bg-red-900/30' : 'bg-red-50',
      text: emergencyMode ? 'text-red-300' : 'text-red-700',
      dot: 'bg-red-500',
      border: emergencyMode ? 'border-red-700' : 'border-red-200',
    },
    surgery: {
      bg: emergencyMode ? 'bg-purple-900/30' : 'bg-purple-50',
      text: emergencyMode ? 'text-purple-300' : 'text-purple-700',
      dot: 'bg-purple-500',
      border: emergencyMode ? 'border-purple-700' : 'border-purple-200',
    },
    lab: {
      bg: emergencyMode ? 'bg-blue-900/30' : 'bg-blue-50',
      text: emergencyMode ? 'text-blue-300' : 'text-blue-700',
      dot: 'bg-blue-500',
      border: emergencyMode ? 'border-blue-700' : 'border-blue-200',
    },
    diagnosis: {
      bg: emergencyMode ? 'bg-emerald-900/30' : 'bg-emerald-50',
      text: emergencyMode ? 'text-emerald-300' : 'text-emerald-700',
      dot: 'bg-emerald-500',
      border: emergencyMode ? 'border-emerald-700' : 'border-emerald-200',
    },
    medication: {
      bg: emergencyMode ? 'bg-teal-900/30' : 'bg-teal-50',
      text: emergencyMode ? 'text-teal-300' : 'text-teal-700',
      dot: 'bg-teal-500',
      border: emergencyMode ? 'border-teal-700' : 'border-teal-200',
    },
    imaging: {
      bg: emergencyMode ? 'bg-indigo-900/30' : 'bg-indigo-50',
      text: emergencyMode ? 'text-indigo-300' : 'text-indigo-700',
      dot: 'bg-indigo-500',
      border: emergencyMode ? 'border-indigo-700' : 'border-indigo-200',
    },
    accident: {
      bg: emergencyMode ? 'bg-orange-900/30' : 'bg-orange-50',
      text: emergencyMode ? 'text-orange-300' : 'text-orange-700',
      dot: 'bg-orange-500',
      border: emergencyMode ? 'border-orange-700' : 'border-orange-200',
    },
    visit: {
      bg: emergencyMode ? 'bg-slate-700/50' : 'bg-slate-50',
      text: emergencyMode ? 'text-slate-300' : 'text-slate-700',
      dot: emergencyMode ? 'bg-slate-400' : 'bg-slate-400',
      border: emergencyMode ? 'border-slate-600' : 'border-slate-200',
    },
  };

  const style = eventStyles[event.type] || eventStyles.visit;
  const Icon = eventTypeIcons[event.type] || Building2;

  return (
    <div className="flex gap-6 animate-fade-in">
      {/* Timeline Dot */}
      <div className="relative flex flex-col items-center">
        <div className={`h-4 w-4 rounded-full ring-4 ${style.dot} ring-${emergencyMode ? 'slate-800' : 'slate-50'} z-10`} />
        {event.is_emergency && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Event Card */}
      <div
        className={`flex-1 rounded-xl border p-5 transition-all hover:shadow-lg ${style.bg} ${style.border} ${
          emergencyMode ? 'hover:bg-slate-700' : 'hover:bg-white'
        }`}
      >
        {/* Event Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${style.bg}`}>
              <Icon size={16} className={style.text} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>{event.type}</span>

                {event.is_emergency && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                    <AlertTriangle size={10} />
                    Emergency
                  </span>
                )}

                {event.severity && (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      event.severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : event.severity === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {event.severity}
                  </span>
                )}
              </div>

              <h3 className={`text-lg font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>{event.title}</h3>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-sm font-semibold ${emergencyMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Event Description */}
        <p className={`text-sm leading-relaxed mb-3 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
          {event.description}
        </p>

        {/* Provider Information */}
        {(event.provider || event.attending_physician || event.department) && (
          <div
            className={`flex items-center gap-4 pb-3 mb-3 border-b ${emergencyMode ? 'border-slate-600' : 'border-slate-200'}`}
          >
            {event.provider && (
              <div className="flex items-center gap-2">
                <Building2 size={14} className={emergencyMode ? 'text-slate-400' : 'text-slate-500'} />
                <span className={`text-xs font-medium ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>{event.provider.name}</span>
              </div>
            )}

            {event.attending_physician && (
              <div className="flex items-center gap-2">
                <User size={14} className={emergencyMode ? 'text-slate-400' : 'text-slate-500'} />
                <span className={`text-xs font-medium ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>Dr. {event.attending_physician}</span>
              </div>
            )}

            {event.department && (
              <div className="flex items-center gap-2">
                <FileText size={14} className={emergencyMode ? 'text-slate-400' : 'text-slate-500'} />
                <span className={`text-xs font-medium ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>{event.department}</span>
              </div>
            )}
          </div>
        )}

        {/* Expandable Details */}
        <div className="flex items-center justify-between">
          <button
            onClick={onToggle}
            className={`flex items-center gap-2 text-xs font-medium transition-colors ${
              emergencyMode ? 'text-brand-400 hover:text-brand-300' : 'text-brand-600 hover:text-brand-700'
            }`}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={14} />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Show Details
              </>
            )}
          </button>

          {event.external_event_id && (
            <span className={`text-xs ${emergencyMode ? 'text-slate-500' : 'text-slate-400'}`}>ID: {event.external_event_id}</span>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className={`mt-4 pt-4 border-t ${emergencyMode ? 'border-slate-600' : 'border-slate-200'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Clinical Context
                </h4>
                <div className={`text-xs space-y-1 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <p>
                    <strong>Event ID:</strong> {event.id}
                  </p>
                  <p>
                    <strong>Provider ID:</strong> {event.provider_id || 'N/A'}
                  </p>
                  <p>
                    <strong>External ID:</strong> {event.external_event_id || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>Risk Assessment</h4>
                <div className={`text-xs space-y-1 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <p>
                    <strong>Severity:</strong> {event.severity || 'Not specified'}
                  </p>
                  <p>
                    <strong>Emergency:</strong> {event.is_emergency ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Follow-up:</strong> Recommended
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

