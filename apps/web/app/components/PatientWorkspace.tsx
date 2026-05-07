'use client';

import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Clock,
  Pill,
  Activity,
  Brain,
  Building2,
  Zap,
  Microscope,
  Radio,
  FileText,
} from 'lucide-react';
import type { Alert, Patient, SystemActivity } from '../../lib/types';

function formatPhone(phone: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '';

  // Prefer common India formatting: +91 XXXXX XXXXX / XXXXXXXXXX
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 11 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;

  // Generic fallback: keep readable groups
  return phone.trim();
}

import AlertBanner from './patient/AlertBanner';
import PatientIdentitySidebar from './patient/PatientIdentitySidebar';
import IntelligencePanel from './patient/IntelligencePanel';
import EnhancedOverviewTab from './patient/EnhancedOverviewTab';
import IntelligentTimelineTab from './patient/IntelligentTimelineTab';
import IntelligentMedicationsTab from './patient/IntelligentMedicationsTab';
import IntelligentVitalsTab from './patient/IntelligentVitalsTab';
import IntelligentInsightsTab from './patient/IntelligentInsightsTab';
import IntelligentProvidersTab from './patient/IntelligentProvidersTab';

import XrayTab from './patient/XrayTab';
import BloodTestsTab from './patient/BloodTestsTab';
import MedicalRecordsTab from './patient/MedicalRecordsTab';

type TabId = 'overview' | 'timeline' | 'medications' | 'vitals' | 'insights' | 'providers' | 'xray' | 'blood' | 'records';

const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'vitals', label: 'Vitals', icon: Activity },
  { id: 'xray', label: 'Imaging', icon: Radio },
  { id: 'blood', label: 'Blood Tests', icon: Microscope },
  { id: 'records', label: 'Medical Records', icon: FileText },
  { id: 'insights', label: 'AI Insights', icon: Brain },
  { id: 'providers', label: 'Providers', icon: Building2 },
];

interface PatientWorkspaceProps {
  patient: Patient;
  alerts: Alert[];
  onEmergencyAccess: (id: string) => void;
  emergencyMode: boolean;
}

export default function PatientWorkspace({
  patient,
  alerts,
  onEmergencyAccess,
  emergencyMode,
}: PatientWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [systemActivity, setSystemActivity] = useState<SystemActivity[]>([]);

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const insightCount = patient.insights?.filter((i) => i.is_active).length ?? 0;
  const approvedProviders = patient.provider_links?.filter((l) => l.consent_status === 'approved') ?? [];

  const displayName = patient.name || `Patient ID: ${patient.govt_id}`;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Simulate live system activity
  useEffect(() => {
    const activities: SystemActivity[] = [
      { id: '1', type: 'sync', message: 'Fetching records from MetroCare...', timestamp: new Date(), status: 'active' },
      { id: '2', type: 'analysis', message: 'Risk model recalculated 4s ago', timestamp: new Date(Date.now() - 4000), status: 'complete' },
      { id: '3', type: 'sync', message: 'Medication history synchronized', timestamp: new Date(Date.now() - 8000), status: 'complete' },
    ];
    setSystemActivity(activities);
  }, [patient.id]);

  return (
    <div className={`flex flex-col h-full overflow-hidden animate-fade-in ${
      emergencyMode ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      {/* Critical alert banner */}
      {criticalAlerts.length > 0 && !alertsDismissed && (
        <AlertBanner alerts={criticalAlerts} onDismiss={() => setAlertsDismissed(true)} />
      )}

      {/* TOP STICKY HEADER - Patient Command Center */}
      <div className={`${
        emergencyMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      } border-b px-6 py-4 shrink-0 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar with status */}
            <div className="relative">
              <div className={`h-14 w-14 rounded-xl ${
                emergencyMode 
                  ? 'bg-gradient-to-br from-red-500 to-red-700' 
                  : 'bg-gradient-to-br from-brand-400 to-brand-600'
              } flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                {initials}
              </div>
              {patient.emergency_session && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>

            {/* Core Patient Info */}
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className={`text-2xl font-bold tracking-tight ${
                  emergencyMode ? 'text-white' : 'text-slate-900'
                }`}>{displayName}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${
                  emergencyMode 
                    ? 'bg-red-900 text-red-200 border-red-700' 
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}>
                  {patient.govt_id}
                </span>
                {patient.blood_group && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    emergencyMode
                      ? 'bg-red-900 text-red-200 border-red-700'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {patient.blood_group}
                  </span>
                )}
              </div>
              <p className={`text-sm ${
                emergencyMode ? 'text-slate-300' : 'text-slate-500'
              }`}>
                {patient.age} yrs · {patient.gender} · {formatPhone(patient.phone)}
                {patient.abha_id && (
                  <span className={emergencyMode ? 'text-brand-400' : 'text-brand-600'}>
                    {' '}· ABHA {patient.abha_id}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Risk Score & Emergency Status */}
          <div className="flex items-center gap-4">
            <div className={`text-center px-4 py-2 rounded-lg ${
              emergencyMode ? 'bg-slate-700' : 'bg-slate-50'
            }`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${
                emergencyMode ? 'text-slate-400' : 'text-slate-500'
              }`}>Risk Score</p>
              <p className={`text-2xl font-bold ${
                criticalAlerts.length > 0 
                  ? 'text-red-600' 
                  : emergencyMode 
                    ? 'text-amber-400'
                    : 'text-emerald-600'
              }`}>
                {criticalAlerts.length > 0 ? '87' : '23'}
              </p>
            </div>
            
            {emergencyMode && (
              <button
                onClick={() => onEmergencyAccess(patient.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition shadow-lg animate-pulse"
              >
                <Zap size={14} />
                Emergency Access
              </button>
            )}
          </div>
        </div>

        {/* Hospital Sources Connected */}
        <div className="flex items-center gap-2 mt-3">
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            emergencyMode ? 'text-slate-400' : 'text-slate-400'
          }`}>Connected Sources:</span>
          <div className="flex gap-2">
            {approvedProviders.slice(0, 3).map((provider, i) => (
              <span
                key={i}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  emergencyMode
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}
              >
                {provider.provider?.name || `Provider ${provider.provider_id}`}
              </span>
            ))}
            {approvedProviders.length > 3 && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                emergencyMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                +{approvedProviders.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Clinical Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR - Patient Identity & Quick Info */}
        <div className={`w-80 ${
          emergencyMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        } border-r overflow-y-auto`}>
          <PatientIdentitySidebar patient={patient} emergencyMode={emergencyMode} />
        </div>

        {/* CENTER MAIN AREA - Timeline & Clinical Data */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Compact Tab Bar */}
          <div className={`${
            emergencyMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          } border-b px-6 shrink-0`}>
            <nav className="flex gap-0.5" role="tablist">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? emergencyMode
                          ? 'border-red-500 text-red-400'
                          : 'border-brand-500 text-brand-600'
                        : emergencyMode
                          ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={14} className={isActive ? (emergencyMode ? 'text-red-400' : 'text-brand-500') : ''} />
                    {tab.label}
                    {tab.id === 'insights' && insightCount > 0 && (
                      <span
                        className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xxs font-bold ${
                          isActive
                            ? emergencyMode
                              ? 'bg-red-900 text-red-300'
                              : 'bg-brand-100 text-brand-700'
                            : emergencyMode
                              ? 'bg-slate-700 text-slate-300'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {insightCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content with Enhanced Intelligence */}
          <div className={`flex-1 overflow-y-auto ${
            emergencyMode ? 'bg-slate-900' : 'bg-slate-50'
          }`}>
            {activeTab === 'overview' && (
              <EnhancedOverviewTab 
                patient={patient} 
                alerts={alerts} 
                emergencyMode={emergencyMode}
                expandedEvent={expandedEvent}
                onToggleEvent={setExpandedEvent}
              />
            )}
            {activeTab === 'timeline' && (
              <IntelligentTimelineTab 
                events={patient.events ?? []} 
                emergencyMode={emergencyMode}
                expandedEvent={expandedEvent}
                onToggleEvent={setExpandedEvent}
              />
            )}
            {activeTab === 'medications' && (
              <IntelligentMedicationsTab 
                medications={patient.medications ?? []} 
                emergencyMode={emergencyMode}
              />
            )}
            {activeTab === 'vitals' && (
              <IntelligentVitalsTab 
                vitals={patient.vitals ?? []} 
                emergencyMode={emergencyMode}
              />
            )}
            {activeTab === 'xray' && <XrayTab reports={patient.xray_reports} />}
            {activeTab === 'blood' && <BloodTestsTab tests={patient.blood_tests} />}
            {activeTab === 'records' && <MedicalRecordsTab records={patient.medical_records} />}
            {activeTab === 'insights' && (
              <IntelligentInsightsTab 
                insights={patient.insights ?? []} 
                emergencyMode={emergencyMode}
              />
            )}
            {activeTab === 'providers' && (
              <IntelligentProvidersTab 
                providerLinks={patient.provider_links ?? []} 
                emergencyMode={emergencyMode}
              />
            )}
          </div>
        </div>

        {/* RIGHT INTELLIGENCE PANEL */}
        <div className={`w-96 ${
          emergencyMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        } border-l overflow-y-auto`}>
          <IntelligencePanel 
            patient={patient}
            alerts={alerts}
            systemActivity={systemActivity}
            emergencyMode={emergencyMode}
          />
        </div>
      </div>
    </div>
  );
}
