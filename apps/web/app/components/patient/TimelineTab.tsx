import { AlertTriangle, Clock } from 'lucide-react';
import type { MedicalEvent } from '../../../lib/types';

interface TimelineTabProps {
  events: MedicalEvent[];
}

const EVENT_STYLES: Record<
  MedicalEvent['type'],
  { bg: string; text: string; dot: string }
> = {
  emergency: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  surgery: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  lab: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  diagnosis: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  medication: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  visit: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  accident: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  imaging: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
};

export default function TimelineTab({ events }: TimelineTabProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
  );

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Clock size={36} className="mb-3 opacity-40" />
        <p className="text-base font-semibold">No events recorded</p>
        <p className="text-sm mt-1">Medical events will appear here as they are recorded</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-[7px] top-3 bottom-3 w-px bg-slate-200" />

        <div className="space-y-5">
          {sorted.map((event) => {
            const style = EVENT_STYLES[event.type] ?? EVENT_STYLES.visit;
            return (
              <div key={event.id} className="flex gap-5 animate-fade-in">
                {/* Dot */}
                <div
                  className={`h-4 w-4 rounded-full shrink-0 ring-4 ring-slate-50 z-10 mt-1 ${style.dot}`}
                />

                {/* Card */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-card p-4 hover:shadow-card-hover transition-shadow">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${style.bg} ${style.text}`}
                      >
                        {event.type}
                      </span>

                      {event.is_emergency && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                          <AlertTriangle size={10} />
                          Emergency
                        </span>
                      )}

                      {event.provider && (
                        <span className="text-xs text-slate-400 font-medium">
                          {event.provider.name}
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-600">
                        {new Date(event.event_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xxs text-slate-400">
                        {new Date(event.event_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">{event.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>

                  {(event.attending_physician || event.department) && (
                    <div className="flex gap-4 mt-2 pt-2 border-t border-slate-100">
                      {event.attending_physician && (
                        <p className="text-xxs text-slate-400">
                          <span className="font-semibold text-slate-500">Physician: </span>
                          {event.attending_physician}
                        </p>
                      )}
                      {event.department && (
                        <p className="text-xxs text-slate-400">
                          <span className="font-semibold text-slate-500">Dept: </span>
                          {event.department}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
