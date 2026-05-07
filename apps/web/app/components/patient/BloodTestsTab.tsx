'use client';

import { Droplet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { BloodTest } from '../../../lib/types';

// BloodTest.severity/unit mapping depends on backend enum values; normalize to known UI levels.


interface BloodTestsTabProps {
  tests: BloodTest[] | undefined;
}

export default function BloodTestsTab({ tests = [] }: BloodTestsTabProps) {
  if (!tests || tests.length === 0) {
    return (
      <div className="p-6 text-center">
        <Droplet className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-500">No blood test results available</p>
      </div>
    );
  }

  const sortedTests = [...tests].sort((a, b) => 
    new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
  );

const groupedByDate = sortedTests.reduce((acc: Record<string, BloodTest[]>, test) => {
    
    const date = new Date(test.test_date).toLocaleDateString('en-IN');
    if (!acc[date]) acc[date] = [];
    acc[date].push(test);
    return acc;
  }, {} as Record<string, BloodTest[]>);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'bg-red-50 border-red-200';
      case 'moderate':
        return 'bg-yellow-50 border-yellow-200';
      case 'mild':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'bg-red-100 text-red-700';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-700';
      case 'mild':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {Object.entries(groupedByDate).map(([date, dateTests]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">
            {date}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dateTests.map((test) => (
              <div
                key={test.id}
                className={`border rounded-lg p-4 transition-all ${getSeverityColor(test.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-slate-900">{test.test_name}</h4>
                    <p className="text-sm text-slate-600 mt-0.5">{test.unit}</p>
                  </div>
                  {test.is_abnormal && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeColor(test.severity)}`}>
                      {test.severity.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-slate-900">{test.test_value}</span>
                  {test.reference_range && (
                    <span className="text-xs text-slate-600">ref: {test.reference_range}</span>
                  )}
                </div>

                {test.is_abnormal && test.lab_comments && (
                  <p className="text-sm text-slate-700 bg-white bg-opacity-50 rounded p-2 mb-2">
                    {test.lab_comments}
                  </p>
                )}

                {test.risk_indicator && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white bg-opacity-50 rounded p-2">
                    {test.severity === 'severe' && <TrendingUp className="h-4 w-4 text-red-600" />}
                    {test.severity === 'moderate' && <TrendingDown className="h-4 w-4 text-yellow-600" />}
                    {test.severity === 'mild' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                    <span>{test.risk_indicator}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

