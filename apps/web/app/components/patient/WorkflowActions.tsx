'use client';

import { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Stethoscope,
  Activity
} from 'lucide-react';

interface WorkflowAction {
  id: string;
  type: 'note' | 'appointment' | 'referral' | 'test' | 'medication' | 'followup';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  physician?: string;
  createdAt: string;
}

interface WorkflowActionsProps {
  emergencyMode: boolean;
}

export default function WorkflowActions({ emergencyMode }: WorkflowActionsProps) {
  const [actions, setActions] = useState<WorkflowAction[]>([
    {
      id: '1',
      type: 'note',
      title: 'Complete cardiology consultation note',
      description: 'Document findings from today\'s cardiac evaluation and update treatment plan',
      priority: 'high',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Dr. Sarah Johnson',
      status: 'pending',
      physician: 'Dr. Michael Chen',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      type: 'referral',
      title: 'Refer to nephrology',
      description: 'Patient shows declining renal function, requires specialist evaluation within 2 weeks',
      priority: 'high',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Care Coordinator',
      status: 'pending',
      physician: 'Dr. Emily Rodriguez',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'test',
      title: 'Order HbA1c and lipid panel',
      description: 'Quarterly monitoring for diabetes management and cardiovascular risk assessment',
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Lab Team',
      status: 'in_progress',
      physician: 'Dr. Michael Chen',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      type: 'medication',
      title: 'Review antihypertensive regimen',
      description: 'Current BP control inadequate, consider ACE inhibitor dose adjustment',
      priority: 'medium',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Pharmacy Team',
      status: 'pending',
      physician: 'Dr. Sarah Johnson',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '5',
      type: 'followup',
      title: 'Schedule 3-month follow-up visit',
      description: 'Routine monitoring visit to assess treatment response and adjust medications',
      priority: 'low',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Scheduling',
      status: 'pending',
      physician: 'Dr. Emily Rodriguez',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const [showNewAction, setShowNewAction] = useState(false);
  const [newAction, setNewAction] = useState<{
    type: WorkflowAction['type'];
    title: string;
    description: string;
    priority: WorkflowAction['priority'];
  }>({
    type: 'note',
    title: '',
    description: '',
    priority: 'medium'
  });

  const getActionIcon = (type: WorkflowAction['type']) => {
    switch (type) {
      case 'note': return FileText;
      case 'appointment': return Calendar;
      case 'referral': return User;
      case 'test': return Activity;
      case 'medication': return Stethoscope;
      case 'followup': return Clock;
      default: return FileText;
    }
  };

  const getPriorityColor = (priority: WorkflowAction['priority']) => {
    switch (priority) {
      case 'high': return emergencyMode ? 'text-red-400' : 'text-red-600';
      case 'medium': return emergencyMode ? 'text-amber-400' : 'text-amber-600';
      case 'low': return emergencyMode ? 'text-emerald-400' : 'text-emerald-600';
      default: return emergencyMode ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const getStatusColor = (status: WorkflowAction['status']) => {
    switch (status) {
      case 'completed': return emergencyMode ? 'text-emerald-400' : 'text-emerald-600';
      case 'in_progress': return emergencyMode ? 'text-blue-400' : 'text-blue-600';
      case 'overdue': return emergencyMode ? 'text-red-400' : 'text-red-600';
      case 'pending': return emergencyMode ? 'text-slate-400' : 'text-slate-600';
      default: return emergencyMode ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const getStatusIcon = (status: WorkflowAction['status']) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'overdue': return AlertTriangle;
      default: return Clock;
    }
  };

  const handleCreateAction = () => {
    if (newAction.title && newAction.description) {
      const action: WorkflowAction = {
        id: Date.now().toString(),
        ...newAction,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      setActions([action, ...actions]);
      setNewAction({
        type: 'note',
        title: '',
        description: '',
        priority: 'medium'
      });
      setShowNewAction(false);
    }
  };

  const handleUpdateStatus = (id: string, status: WorkflowAction['status']) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, status } : action
    ));
  };

  const pendingCount = actions.filter(a => a.status === 'pending').length;
  const overdueCount = actions.filter(a => a.status === 'overdue').length;
  const inProgressCount = actions.filter(a => a.status === 'in_progress').length;

  return (
    <div className={`rounded-xl p-4 ${
      emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText size={20} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
          <h3 className={`text-lg font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
            Clinical Workflow
          </h3>
        </div>
        <button
          onClick={() => setShowNewAction(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            emergencyMode
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-brand-500 text-white hover:bg-brand-600'
          }`}
        >
          <Plus size={14} />
          New Action
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className={`text-center p-3 rounded-lg ${
          emergencyMode ? 'bg-slate-700' : 'bg-slate-50'
        }`}>
          <div className={`text-lg font-bold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
            {actions.length}
          </div>
          <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Actions
          </div>
        </div>
        <div className={`text-center p-3 rounded-lg ${
          emergencyMode ? 'bg-slate-700' : 'bg-slate-50'
        }`}>
          <div className={`text-lg font-bold ${getPriorityColor('high')}`}>
            {pendingCount}
          </div>
          <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Pending
          </div>
        </div>
        <div className={`text-center p-3 rounded-lg ${
          emergencyMode ? 'bg-slate-700' : 'bg-slate-50'
        }`}>
          <div className={`text-lg font-bold ${getStatusColor('in_progress')}`}>
            {inProgressCount}
          </div>
          <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            In Progress
          </div>
        </div>
        <div className={`text-center p-3 rounded-lg ${
          emergencyMode ? 'bg-slate-700' : 'bg-slate-50'
        }`}>
          <div className={`text-lg font-bold ${getStatusColor('overdue')}`}>
            {overdueCount}
          </div>
          <div className={`text-xs ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Overdue
          </div>
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = getActionIcon(action.type);
          const StatusIcon = getStatusIcon(action.status);
          
          return (
            <div
              key={action.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                emergencyMode 
                  ? 'bg-slate-700/50 border-slate-600' 
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    emergencyMode ? 'bg-slate-600' : 'bg-white'
                  }`}>
                    <Icon size={16} className={emergencyMode ? 'text-brand-400' : 'text-brand-600'} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      {action.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium capitalize ${getPriorityColor(action.priority)}`}>
                        {action.priority} priority
                      </span>
                      <span className={`text-xs capitalize ${getStatusColor(action.status)}`}>
                        {action.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon size={16} className={getStatusColor(action.status)} />
                  <select
                    value={action.status}
                    onChange={(e) => handleUpdateStatus(action.id, e.target.value as WorkflowAction['status'])}
                    className={`text-xs px-2 py-1 rounded border ${
                      emergencyMode 
                        ? 'bg-slate-600 border-slate-500 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <p className={`text-sm mb-3 ${emergencyMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {action.description}
              </p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <User size={12} />
                    <span>{action.assignedTo}</span>
                  </div>
                  {action.physician && (
                    <div className={`flex items-center gap-1 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Stethoscope size={12} />
                      <span>{action.physician}</span>
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-1 ${emergencyMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Calendar size={12} />
                  <span>
                    {action.dueDate 
                      ? new Date(action.dueDate).toLocaleDateString()
                      : 'No due date'
                    }
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Action Modal */}
      {showNewAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-full max-w-md ${
            emergencyMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${emergencyMode ? 'text-slate-200' : 'text-slate-900'}`}>
              Create New Action
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${emergencyMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Action Type
                </label>
                <select
                  value={newAction.type}
                  onChange={(e) => setNewAction({...newAction, type: e.target.value as WorkflowAction['type']})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    emergencyMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="note">Physician Note</option>
                  <option value="appointment">Appointment</option>
                  <option value="referral">Referral</option>
                  <option value="test">Lab Test</option>
                  <option value="medication">Medication Review</option>
                  <option value="followup">Follow-up</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${emergencyMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Title
                </label>
                <input
                  type="text"
                  value={newAction.title}
                  onChange={(e) => setNewAction({...newAction, title: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    emergencyMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                  placeholder="Enter action title..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${emergencyMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Description
                </label>
                <textarea
                  value={newAction.description}
                  onChange={(e) => setNewAction({...newAction, description: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border resize-none ${
                    emergencyMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                  rows={3}
                  placeholder="Enter action description..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${emergencyMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Priority
                </label>
                <select
                  value={newAction.priority}
                  onChange={(e) => setNewAction({...newAction, priority: e.target.value as WorkflowAction['priority']})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    emergencyMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewAction(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  emergencyMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAction}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  emergencyMode
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                }`}
              >
                Create Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
