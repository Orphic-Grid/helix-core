import { useState, useEffect } from 'react';
import { Activity, Bell, LogOut, RefreshCw, CheckCircle, AlertCircle, Brain, AlertTriangle } from 'lucide-react';
import type { User } from '../../lib/types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  liveSyncStatus: 'syncing' | 'synced' | 'error';
  alertCount: number;
}

interface SystemActivity {
  id: string;
  type: 'sync' | 'analysis' | 'alert' | 'fetch';
  message: string;
  timestamp: Date;
  status: 'active' | 'complete' | 'error';
}

export default function Header({ user, onLogout, liveSyncStatus, alertCount }: HeaderProps) {
  const [systemActivities, setSystemActivities] = useState<SystemActivity[]>([]);
  const [showActivity, setShowActivity] = useState(false);
  const displayName = user.fullName || ('name' in user ? String(user.name) : user.email);

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Simulate live system activities
  useEffect(() => {
    const activities: SystemActivity[] = [
      { id: '1', type: 'sync', message: 'Fetching records from MetroCare...', timestamp: new Date(), status: 'active' },
      { id: '2', type: 'analysis', message: 'Risk model recalculated 4s ago', timestamp: new Date(Date.now() - 4000), status: 'complete' },
      { id: '3', type: 'sync', message: 'Medication history synchronized', timestamp: new Date(Date.now() - 8000), status: 'complete' },
    ];
    setSystemActivities(activities);

    // Simulate new activities
    const interval = setInterval(() => {
      const newActivity: SystemActivity = {
        id: Date.now().toString(),
        type: Math.random() > 0.5 ? 'analysis' : 'sync',
        message: Math.random() > 0.5 
          ? 'Analyzing patient trends...' 
          : `Syncing with ${['Apollo Hospital', 'MetroCare', 'City Diagnostics'][Math.floor(Math.random() * 3)]}...`,
        timestamp: new Date(),
        status: 'active'
      };
      
      setSystemActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      
      // Mark as complete after 2 seconds
      setTimeout(() => {
        setSystemActivities(prev => 
          prev.map(activity => 
            activity.id === newActivity.id 
              ? { ...activity, status: 'complete' as const }
              : activity
          )
        );
      }, 2000);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-10 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 shadow-sm">
          <Activity size={16} className="text-white" />
        </div>
        <div className="leading-none">
          <p className="text-sm font-bold text-slate-900 tracking-tight">Helix Core</p>
          <p className="text-xxs text-slate-400 uppercase tracking-widest">Clinical Intelligence</p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Enhanced Live sync pill with activity */}
        <div className="relative">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer hover:opacity-80 ${
              liveSyncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-700'
                : liveSyncStatus === 'syncing'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            }`}
            onClick={() => setShowActivity(!showActivity)}
          >
            {liveSyncStatus === 'syncing' ? (
              <RefreshCw size={11} className="animate-spin" />
            ) : liveSyncStatus === 'synced' ? (
              <CheckCircle size={11} />
            ) : (
              <AlertCircle size={11} />
            )}
            {liveSyncStatus === 'synced'
              ? 'Live Synced'
              : liveSyncStatus === 'syncing'
              ? 'Syncing…'
              : 'Sync Error'}
          </div>
          
          {/* Activity indicator pulse */}
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          
          {/* Activity dropdown */}
          {showActivity && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg border border-slate-200 shadow-lg z-50">
              <div className="p-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-brand-600" />
                  <span className="text-sm font-semibold text-slate-900">System Activity</span>
                  <Activity size={12} className="text-emerald-500 animate-pulse" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {systemActivities.map((activity) => (
                  <div key={activity.id} className="p-3 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-start gap-2">
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
                        <p className="text-xs text-slate-700">{activity.message}</p>
                        <p className="text-xxs text-slate-400 mt-0.5">
                          {activity.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications with enhanced indicator */}
        <button
          className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {alertCount > 0 && (
            <>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              {alertCount > 1 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </>
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User info with enhanced styling */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
          <div className="leading-none">
            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="text-xxs text-slate-400">{user.role.replaceAll('_', ' ')}</p>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="ml-1 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
