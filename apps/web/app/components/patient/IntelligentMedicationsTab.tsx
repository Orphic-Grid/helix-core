'use client';

import { useState } from 'react';
import { 
  Pill, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import type { Medication } from '../../../lib/types';

interface IntelligentMedicationsTabProps {
  medications: Medication[];
  emergencyMode: boolean;
}

export default function IntelligentMedicationsTab({ medications, emergencyMode }: IntelligentMedicationsTabProps) {
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');

  const filteredMedications = medications.filter(med => {
    if (filterStatus === 'all') return true;
    return filterStatus === 'active' ? med.is_active : !med.is_active;
  });

  const activeMedications = filteredMedications.filter(m => m.is_active);
  const inactiveMedications = filteredMedications.filter(m => !m.is_active);

  // Calculate medication insights
  const avgAdherence = activeMedications.length > 0 
    ? Math.round(activeMedications.reduce((sum, med) => sum + (med.adherence_score || 85), 0) / activeMedications.length)
    : 0;

  const highRiskMeds = activeMedications.filter(med => 
    med.drug_name.toLowerCase().includes('warfarin') ||
    med.drug_name.toLowerCase().includes('insulin') ||
    med.drug_name.toLowerCase().includes('lithium')
  );

  return (
    <div className="p-6 space-y-6">
      {/* Medication Intelligence Header */}
      <div className="grid grid-cols-4 gap-4">
        <MedicationStatCard
          label="Active Meds"
          value={activeMedications.length.toString()}
          sub="Current treatments"
          accent="blue"
          emergencyMode={emergencyMode}
        />
        <MedicationStatCard
          label="Adherence"
          value={`${avgAdherence}%`}
          sub="Average compliance"
          accent={avgAdherence >= 80 ? 'green' : avgAdherence >= 60 ? 'amber' : 'red'}
          emergencyMode={emergencyMode}
        />
        <MedicationStatCard
          label="High Risk"
          value={highRiskMeds.length.toString()}
          sub="Requires monitoring"
          accent={highRiskMeds.length > 0 ? 'red' : 'green'}
          emergencyMode={emergencyMode}
        />
        <MedicationStatCard
          label="Interactions"
          value="2"
          sub="Potential conflicts"
          accent="amber"
          emergencyMode={emergencyMode}
        />
      </div>

      {/* Filter Controls */}
      <div className={`rounded-xl p-4 ${
        emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pill size={20} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
            <h2 className={`text-lg font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
              Medication Management
            </h2>
          </div>
          
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? emergencyMode
                      ? 'bg-red-600 text-white'
                      : 'bg-brand-500 text-white'
                    : emergencyMode
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Medication Alerts */}
      {highRiskMeds.length > 0 && (
        <div className={`rounded-xl p-4 border ${
          emergencyMode 
            ? 'bg-red-900/30 border-red-700' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className={emergencyMode ? 'text-red-400' : 'text-red-600'} />
            <h3 className={`text-sm font-bold ${emergencyMode ? 'text-red-300' : 'text-red-700'}`}>
              High-Risk Medications Alert
            </h3>
          </div>
          <div className="space-y-2">
            {highRiskMeds.map((med) => (
              <div key={med.id} className={`p-2 rounded-lg text-xs ${
                emergencyMode ? 'bg-red-800/40 text-red-200' : 'bg-red-100 text-red-700'
              }`}>
                <div className="font-semibold">{med.drug_name}</div>
                <div className="text-opacity-80">Requires regular monitoring and blood work</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Medications */}
      {activeMedications.length > 0 && (
        <div className={`rounded-xl p-4 ${
          emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
        }`}>
          <h3 className={`text-sm font-bold mb-4 ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Active Medications ({activeMedications.length})
          </h3>
          <div className="space-y-3">
            {activeMedications.map((medication) => (
              <MedicationCard
                key={medication.id}
                medication={medication}
                isExpanded={selectedMedication === medication.id}
                onToggle={() => setSelectedMedication(
                  selectedMedication === medication.id ? null : medication.id
                )}
                emergencyMode={emergencyMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Medications */}
      {inactiveMedications.length > 0 && (
        <div className={`rounded-xl p-4 ${
          emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
        }`}>
          <h3 className={`text-sm font-bold mb-4 ${emergencyMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Inactive Medications ({inactiveMedications.length})
          </h3>
          <div className="space-y-3">
            {inactiveMedications.map((medication) => (
              <div key={medication.id} className={`p-3 rounded-lg border ${
                emergencyMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-semibold ${emergencyMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {medication.drug_name}
                    </h4>
                    <p className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {medication.dosage} · {medication.frequency}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-500">Inactive</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MedicationStatCard({ 
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

function MedicationCard({ 
  medication, 
  isExpanded, 
  onToggle, 
  emergencyMode 
}: {
  medication: Medication;
  isExpanded: boolean;
  onToggle: () => void;
  emergencyMode: boolean;
}) {
  const adherence = medication.adherence_score || 85;
  const isHighRisk = medication.drug_name.toLowerCase().includes('warfarin') ||
                     medication.drug_name.toLowerCase().includes('insulin') ||
                     medication.drug_name.toLowerCase().includes('lithium');

  return (
    <div className={`rounded-lg border p-4 transition-all ${
      emergencyMode 
        ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' 
        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-semibold ${emergencyMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {medication.drug_name}
            </h4>
            {isHighRisk && (
              <AlertTriangle size={12} className="text-red-500" />
            )}
            <CheckCircle size={12} className="text-emerald-500" />
          </div>
          <p className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {medication.dosage} · {medication.frequency}
          </p>
          {medication.route && (
            <p className={`text-xs ${emergencyMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Route: {medication.route}
            </p>
          )}
        </div>
        
        <button
          onClick={onToggle}
          className={`p-1 rounded transition-colors ${
            emergencyMode 
              ? 'hover:bg-slate-600 text-slate-400' 
              : 'hover:bg-slate-200 text-slate-500'
          }`}
        >
          <Info size={14} />
        </button>
      </div>

      {/* Adherence Indicator */}
      <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${
        emergencyMode ? 'bg-slate-600' : 'bg-white'
      }`}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Adherence
            </span>
            <span className={`text-xs font-bold ${
              adherence >= 80 ? 'text-emerald-600' : adherence >= 60 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {adherence}%
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full ${emergencyMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <div 
              className={`h-full rounded-full transition-all ${
                adherence >= 80 ? 'bg-emerald-500' : adherence >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${adherence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={`mt-3 pt-3 border-t ${emergencyMode ? 'border-slate-600' : 'border-slate-200'}`}>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className={`font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Started:
              </span>
              <span className={`ml-2 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {new Date(medication.start_date).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className={`font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Prescribed by:
              </span>
              <span className={`ml-2 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {medication.prescribing_physician || 'Unknown'}
              </span>
            </div>
            {medication.provider && (
              <div className="col-span-2">
                <span className={`font-medium ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Provider:
                </span>
                <span className={`ml-2 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {medication.provider.name}
                </span>
              </div>
            )}
          </div>
          
          {isHighRisk && (
            <div className={`mt-3 p-2 rounded-lg ${
              emergencyMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} />
                <span className="text-xs font-medium">High-Risk Medication</span>
              </div>
              <p className="text-xs mt-1">
                Requires regular monitoring and blood work. Watch for side effects.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
