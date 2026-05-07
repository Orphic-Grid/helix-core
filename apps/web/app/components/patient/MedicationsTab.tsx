'use client';

import { useState } from 'react';
import { Pill, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import type { Medication } from '../../../lib/types';

interface MedicationsTabProps {
  medications: Medication[];
}

export default function MedicationsTab({ medications }: MedicationsTabProps) {
  const [showHistory, setShowHistory] = useState(false);

  const active = medications.filter((m) => m.is_active);
  const historical = medications.filter((m) => !m.is_active);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Active medications */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-base font-bold text-slate-900">Active Medications</h3>
          <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
            {active.length}
          </span>
        </div>
        {active.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {active.map((med) => (
              <MedCard key={med.id} med={med} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <Pill size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No active medications</p>
          </div>
        )}
      </section>

      {/* Historical medications */}
      {historical.length > 0 && (
        <section>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition mb-4"
          >
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Past Medications
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
              {historical.length}
            </span>
          </button>

          {showHistory && (
            <div className="grid grid-cols-1 gap-3 animate-fade-in">
              {historical.map((med) => (
                <MedCard key={med.id} med={med} historical />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function MedCard({ med, historical }: { med: Medication; historical?: boolean }) {
  const adherence = med.adherence_score ?? null;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-card p-4 transition-shadow hover:shadow-card-hover ${
        historical ? 'opacity-55 border-slate-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-slate-900">{med.drug_name}</h4>
            {med.is_active ? (
              <span className="flex items-center gap-1 text-xxs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={10} /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xxs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                <XCircle size={10} /> Discontinued
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {med.dosage}
            {med.frequency ? ` · ${med.frequency}` : ''}
            {med.route ? ` · ${med.route}` : ''}
          </p>
          {med.prescribing_physician && (
            <p className="text-xxs text-slate-400 mt-1">
              Prescribed by {med.prescribing_physician}
            </p>
          )}
          {med.provider && (
            <p className="text-xxs text-slate-400">{med.provider.name}</p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            {new Date(med.start_date).toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            })}
          </p>
          {med.end_date && (
            <p className="text-xxs text-slate-400 mt-0.5">
              → {new Date(med.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* Adherence bar */}
      {adherence !== null && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Adherence Score</span>
            <span
              className={`font-bold ${
                adherence >= 0.8
                  ? 'text-emerald-600'
                  : adherence >= 0.6
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            >
              {Math.round(adherence * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                adherence >= 0.8
                  ? 'bg-emerald-500'
                  : adherence >= 0.6
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${adherence * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
