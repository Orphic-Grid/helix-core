'use client';

import { FileText, AlertCircle } from 'lucide-react';
import type { XrayReport } from '../../../lib/types';

interface XrayTabProps {
  reports: XrayReport[] | undefined;
}

export default function XrayTab({ reports = [] }: XrayTabProps) {
  if (!reports || reports.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card p-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Imaging Reports Yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Radiology records (X-ray) will appear here once synced from connected providers.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            <span className="text-xxs font-semibold text-brand-700">Waiting for provider sync</span>
          </div>
        </div>
      </div>
    );
  }

  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
  );

  return (
    <div className="space-y-3 p-6">
      {sortedReports.map((report) => (
        <div
          key={report.id}
          className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{report.report_type}</h3>
                {report.urgency === 'urgent' && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                    URGENT
                  </span>
                )}
                {report.urgency === 'semi-urgent' && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                    Semi-urgent
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1">Body Part: {report.body_part}</p>
            </div>
            {report.risk_score && report.risk_score > 0.5 && (
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            )}
          </div>

          <div className="bg-slate-50 rounded p-3 mb-3">
            <p className="text-sm text-slate-700 line-clamp-3">{report.findings}</p>
          </div>

          {report.radiologist_notes && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 font-medium mb-1">Radiologist Notes:</p>
              <p className="text-sm text-slate-700 italic">{report.radiologist_notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {new Date(report.report_date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            {report.risk_score && (
              <p className="text-xs font-medium">
                <span
                  className={`px-2 py-1 rounded ${
                    report.risk_score > 0.7
                      ? 'bg-red-100 text-red-700'
                      : report.risk_score > 0.4
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  Risk: {(report.risk_score * 100).toFixed(0)}%
                </span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
