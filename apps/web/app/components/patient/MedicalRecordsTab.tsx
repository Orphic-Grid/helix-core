'use client';

import { FileText, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { MedicalRecord } from '../../../lib/types';

interface MedicalRecordsTabProps {
  records: MedicalRecord[] | undefined;
}

export default function MedicalRecordsTab({ records = [] }: MedicalRecordsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!records || records.length === 0) {
    return (
      <div className="p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-500">No medical records available</p>
      </div>
    );
  }

  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
  );

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'discharge_summary':
        return '🏥';
      case 'admission_notes':
        return '📋';
      case 'surgical_report':
        return '🔬';
      case 'procedure_report':
        return '⚕️';
      case 'consultation_note':
        return '👨‍⚕️';
      case 'progress_note':
        return '📈';
      default:
        return '📄';
    }
  };

  const getRecordTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-3 p-6">
      {sortedRecords.map((record) => (
        <div
          key={record.id}
          className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          <button
            onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
            className="w-full px-4 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1 text-left">
              <span className="text-2xl flex-shrink-0">{getRecordTypeIcon(record.record_type)}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900">{record.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    {getRecordTypeLabel(record.record_type)}
                  </span>
                  {record.attending_physician && (
                    <span className="text-xs text-slate-600">Dr. {record.attending_physician.split(' ').pop()}</span>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform ${
                expandedId === record.id ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedId === record.id && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
              <div className="space-y-4">
                {record.summary && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Summary</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{record.summary}</p>
                  </div>
                )}

                {record.content && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Full Record</h4>
                    <div className="bg-white rounded p-3 max-h-64 overflow-y-auto">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {record.content}
                      </p>
                    </div>
                  </div>
                )}

                {record.risk_assessment && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <div className="flex gap-2 items-start">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-900 mb-1">Risk Assessment</h4>
                        <p className="text-sm text-amber-800">{record.risk_assessment}</p>
                      </div>
                    </div>
                  </div>
                )}

                {record.recommendations && record.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {record.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    {new Date(record.record_date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
