import { AlertTriangle, X } from 'lucide-react';
import type { Alert } from '../../../lib/types';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: () => void;
}

export default function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  const primary = alerts[0];
  return (
    <div
      className="flex items-center gap-3 px-6 py-2.5 shrink-0"
      style={{ background: 'linear-gradient(90deg, #B91C1C, #DC2626)' }}
      role="alert"
    >
      <AlertTriangle size={14} className="text-red-200 shrink-0" />
      <div className="flex-1 min-w-0 flex items-center gap-2 text-sm">
        <span className="text-red-200 font-bold uppercase tracking-wider text-xxs">
          Critical Alert
        </span>
        <span className="text-white font-semibold truncate">{primary.title}</span>
        <span className="text-red-200 hidden md:block truncate">— {primary.message}</span>
        {alerts.length > 1 && (
          <span className="text-red-300 text-xs shrink-0">+{alerts.length - 1} more</span>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="p-1 text-red-300 hover:text-white hover:bg-red-500/30 rounded transition shrink-0"
        aria-label="Dismiss alert"
      >
        <X size={14} />
      </button>
    </div>
  );
}
