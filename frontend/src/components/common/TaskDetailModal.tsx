import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Tag,
  FileText,
  Save,
  Edit3,
  AlertCircle,
  Loader2,
  Repeat
} from 'lucide-react';
import { Task, Category, Routine, ScheduledTask, RecurrenceType, RoutineSchedule } from '../../types/Task';
import { taskApi, categoryApi, routineApi, scheduledTaskApi } from '../../services/api';

interface TaskDetailModalProps {
  task: Task | Routine | ScheduledTask | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

interface EditFormData {
  title: string;
  description: string;
  categoryId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  taskType: 'task' | 'routine' | 'scheduled';
  // Basic task fields
  dueDate: string;
  // Scheduled task fields
  dueTime: string;
  startDate: string;
  // Routine fields
  recurrenceType: RecurrenceType;
  interval: number;
  daysOfWeek: string[];
  dayOfMonth: number;
  time: string;
  routineStartDate: string;
  endDate: string;
  isActive: boolean;
}

interface FormErrors {
  title?: string;
  dueDate?: string;
  recurrenceType?: string;
  daysOfWeek?: string;
  dayOfMonth?: string;
  interval?: string;
  general?: string;
}

const DAYS_OF_WEEK = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
  { value: 'SAT', label: 'Saturday' },
  { value: 'SUN', label: 'Sunday' },
];

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<EditFormData>({
    title: '',
    description: '',
    categoryId: '',
    priority: 'MEDIUM',
    taskType: 'task',
    // Basic task fields
    dueDate: '',
    // Scheduled task fields
    dueTime: '',
    startDate: '',
    // Routine fields
    recurrenceType: 'DAILY',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: 1,
    time: '',
    routineStartDate: '',
    endDate: '',
    isActive: true
  });

  // Determine task type
  const getTaskType = (task: any): 'task' | 'routine' | 'scheduled' => {
    if (task.schedule) return 'routine';
    if (task.dueTime || task.startDate) return 'scheduled';
    return 'task';
  };

  // Load categories and populate form when task changes
  useEffect(() => {
    if (task && isOpen) {
      const taskType = getTaskType(task);
      
      const baseFormData: EditFormData = {
        title: task.title,
        description: task.description || '',
        categoryId: task.categoryId || '',
        priority: task.priority,
        taskType,
        // Basic task fields
        dueDate: getTaskDueDate(task) ? new Date(getTaskDueDate(task)!).toISOString().split('T')[0] : '',
        // Scheduled task fields
        dueTime: '',
        startDate: '',
        // Routine fields
        recurrenceType: 'DAILY',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 1,
        time: '',
        routineStartDate: '',
        endDate: '',
        isActive: true
      };

      if (taskType === 'routine') {
        const routine = task as Routine;
        baseFormData.recurrenceType = routine.schedule.recurrenceType;
        baseFormData.interval = routine.schedule.interval || 1;
        baseFormData.daysOfWeek = routine.schedule.daysOfWeek || [];
        baseFormData.dayOfMonth = routine.schedule.dayOfMonth || 1;
        baseFormData.time = routine.schedule.time || '';
        baseFormData.routineStartDate = routine.startDate ? new Date(routine.startDate).toISOString().split('T')[0] : '';
        baseFormData.endDate = routine.endDate ? new Date(routine.endDate).toISOString().split('T')[0] : '';
        baseFormData.isActive = routine.isActive;
      } else if (taskType === 'scheduled') {
        const scheduledTask = task as ScheduledTask;
        baseFormData.dueTime = scheduledTask.dueTime || '';
        baseFormData.startDate = scheduledTask.startDate ? new Date(scheduledTask.startDate).toISOString().split('T')[0] : '';
      }

      setFormData(baseFormData);
      loadCategories();
    }
  }, [task, isOpen]);

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle day of week changes for routines
  const handleDayOfWeekChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: checked
        ? [...prev.daysOfWeek, day]
        : prev.daysOfWeek.filter(d => d !== day)
    }));
    
    if (errors.daysOfWeek) {
      setErrors(prev => ({ ...prev, daysOfWeek: undefined }));
    }
  };

  // Get ordinal suffix for day numbers
  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Get recurrence description
  const getRecurrenceDescription = () => {
    switch (formData.recurrenceType) {
      case 'DAILY':
        return 'Every day';
      case 'WEEKLY':
        return formData.daysOfWeek.length > 0 
          ? `Every ${formData.daysOfWeek.map(day => day.charAt(0) + day.slice(1).toLowerCase()).join(', ')}`
          : 'Select days';
      case 'MONTHLY':
        return `Every ${formData.dayOfMonth}${getOrdinalSuffix(formData.dayOfMonth)} of the month`;
      case 'CUSTOM':
        return `Every ${formData.interval} day${formData.interval > 1 ? 's' : ''}`;
      default:
        return '';
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (formData.taskType === 'scheduled' && !formData.dueDate) {
      newErrors.dueDate = 'Due date is required for scheduled tasks';
    }

    // Routine validation
    if (formData.taskType === 'routine') {
      if (formData.recurrenceType === 'WEEKLY' && formData.daysOfWeek.length === 0) {
        newErrors.daysOfWeek = 'Please select at least one day for weekly routines';
      }
      
      if (formData.recurrenceType === 'MONTHLY' && (formData.dayOfMonth < 1 || formData.dayOfMonth > 31)) {
        newErrors.dayOfMonth = 'Day of month must be between 1 and 31';
      }
      
      if (formData.recurrenceType === 'CUSTOM' && formData.interval < 1) {
        newErrors.interval = 'Interval must be at least 1 day';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!task) return;
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setErrors({});
      
      let response;

      if (formData.taskType === 'routine') {
        // Update routine
        const schedule: RoutineSchedule = {
          recurrenceType: formData.recurrenceType,
        };

        if (formData.recurrenceType === 'WEEKLY') {
          schedule.daysOfWeek = formData.daysOfWeek;
        } else if (formData.recurrenceType === 'MONTHLY') {
          schedule.dayOfMonth = formData.dayOfMonth;
        } else if (formData.recurrenceType === 'CUSTOM') {
          schedule.interval = formData.interval;
        }

        if (formData.time) {
          schedule.time = formData.time;
        }

        const routineData = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          categoryId: formData.categoryId || undefined,
          priority: formData.priority,
          schedule,
          isActive: formData.isActive,
          startDate: formData.routineStartDate || undefined,
          endDate: formData.endDate || undefined,
        };

        response = await routineApi.updateRoutine(task.id, routineData);
      } else if (formData.taskType === 'scheduled') {
        // Update scheduled task
        const taskData = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          categoryId: formData.categoryId || undefined,
          priority: formData.priority,
          dueDate: formData.dueDate,
          dueTime: formData.dueTime || undefined,
          startDate: formData.startDate || undefined,
        };

        response = await scheduledTaskApi.updateScheduledTask(task.id, taskData);
      } else {
        // Update regular task
        const updateData = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          categoryId: formData.categoryId || undefined,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined
        };

        response = await taskApi.updateTask(task.id, updateData);
      }
      
      if (response.success) {
        setIsEditing(false);
        onTaskUpdated();
      } else {
        setErrors({ general: response.error || 'Failed to update task' });
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setErrors({ general: 'Failed to update task. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Restore original form data
    if (task) {
      const taskType = getTaskType(task);
      
      const originalFormData: EditFormData = {
        title: task.title,
        description: task.description || '',
        categoryId: task.categoryId || '',
        priority: task.priority,
        taskType,
        // Basic task fields
        dueDate: getTaskDueDate(task) ? new Date(getTaskDueDate(task)!).toISOString().split('T')[0] : '',
        // Scheduled task fields
        dueTime: '',
        startDate: '',
        // Routine fields
        recurrenceType: 'DAILY',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 1,
        time: '',
        routineStartDate: '',
        endDate: '',
        isActive: true
      };

      if (taskType === 'routine') {
        const routine = task as Routine;
        originalFormData.recurrenceType = routine.schedule.recurrenceType;
        originalFormData.interval = routine.schedule.interval || 1;
        originalFormData.daysOfWeek = routine.schedule.daysOfWeek || [];
        originalFormData.dayOfMonth = routine.schedule.dayOfMonth || 1;
        originalFormData.time = routine.schedule.time || '';
        originalFormData.routineStartDate = routine.startDate ? new Date(routine.startDate).toISOString().split('T')[0] : '';
        originalFormData.endDate = routine.endDate ? new Date(routine.endDate).toISOString().split('T')[0] : '';
        originalFormData.isActive = routine.isActive;
      } else if (taskType === 'scheduled') {
        const scheduledTask = task as ScheduledTask;
        originalFormData.dueTime = scheduledTask.dueTime || '';
        originalFormData.startDate = scheduledTask.startDate ? new Date(scheduledTask.startDate).toISOString().split('T')[0] : '';
      }

      setFormData(originalFormData);
    }
    setIsEditing(false);
    setErrors({});
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-700 bg-red-100 border-red-200';
      case 'HIGH': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'MEDIUM': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'LOW': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  // Helper to safely get due date from any task type
  const getTaskDueDate = (task: Task | ScheduledTask | Routine): string | undefined => {
    if ('dueDate' in task) {
      return task.dueDate;
    }
    return undefined;
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Edit Task' : 'Task Details'}
            </h3>
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit task"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Task Type Display (non-editable) */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Type
                </label>
                <div className="flex items-center">
                  {formData.taskType === 'routine' && (
                    <>
                      <Repeat className="h-4 w-4 mr-2 text-purple-600" />
                      <span className="text-purple-700 font-medium">Routine Task</span>
                    </>
                  )}
                  {formData.taskType === 'scheduled' && (
                    <>
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-blue-700 font-medium">Scheduled Task</span>
                    </>
                  )}
                  {formData.taskType === 'task' && (
                    <>
                      <FileText className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-green-700 font-medium">Regular Task</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              ) : (
                <p className="text-gray-900 font-medium">{task.title}</p>
              )}
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Category
              </label>
              {isEditing ? (
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  {task.category ? (
                    <span 
                      className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: task.category.color }}
                    >
                      {task.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-500">No category</span>
                  )}
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              {isEditing ? (
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              )}
            </div>

            {/* Conditional Fields Based on Task Type */}
            {isEditing && formData.taskType === 'routine' && (
              <div className="bg-purple-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Schedule Configuration
                </h4>

                {/* Recurrence Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Recurrence Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'DAILY', label: 'Daily' },
                      { value: 'WEEKLY', label: 'Weekly' },
                      { value: 'MONTHLY', label: 'Monthly' },
                      { value: 'CUSTOM', label: 'Custom' }
                    ].map(option => (
                      <label key={option.value} className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.recurrenceType === option.value 
                          ? 'border-purple-500 bg-purple-100 text-purple-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <input
                          type="radio"
                          name="recurrenceType"
                          value={option.value}
                          checked={formData.recurrenceType === option.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <span className="font-medium">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Weekly Days Selection */}
                {formData.recurrenceType === 'WEEKLY' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Days of Week
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <label key={day.value} className={`flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors ${
                          formData.daysOfWeek.includes(day.value)
                            ? 'border-purple-500 bg-purple-100 text-purple-700' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.daysOfWeek.includes(day.value)}
                            onChange={(e) => handleDayOfWeekChange(day.value, e.target.checked)}
                            className="sr-only"
                          />
                          <span className="text-xs font-medium">{day.label.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                    {errors.daysOfWeek && <p className="mt-1 text-sm text-red-600">{errors.daysOfWeek}</p>}
                  </div>
                )}

                {/* Monthly Day Selection */}
                {formData.recurrenceType === 'MONTHLY' && (
                  <div className="mb-4">
                    <label htmlFor="dayOfMonth" className="block text-sm font-medium text-gray-700 mb-2">
                      Day of Month
                    </label>
                    <input
                      type="number"
                      name="dayOfMonth"
                      value={formData.dayOfMonth}
                      onChange={handleInputChange}
                      min={1}
                      max={31}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.dayOfMonth ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.dayOfMonth && <p className="mt-1 text-sm text-red-600">{errors.dayOfMonth}</p>}
                  </div>
                )}

                {/* Custom Interval */}
                {formData.recurrenceType === 'CUSTOM' && (
                  <div className="mb-4">
                    <label htmlFor="interval" className="block text-sm font-medium text-gray-700 mb-2">
                      Every X Days
                    </label>
                    <input
                      type="number"
                      name="interval"
                      value={formData.interval}
                      onChange={handleInputChange}
                      min={1}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.interval ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.interval && <p className="mt-1 text-sm text-red-600">{errors.interval}</p>}
                  </div>
                )}

                {/* Time */}
                <div className="mb-4">
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="routineStartDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="routineStartDate"
                      value={formData.routineStartDate}
                      onChange={handleInputChange}
                      lang="en"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      lang="en"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Routine is active
                  </label>
                </div>

                {/* Schedule Preview */}
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <span className="text-sm font-medium text-gray-600">Schedule Preview: </span>
                  <span className="text-sm text-purple-700">{getRecurrenceDescription()}</span>
                  {formData.time && <span className="text-sm text-purple-700"> at {formData.time}</span>}
                </div>
              </div>
            )}

            {isEditing && formData.taskType === 'scheduled' && (
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Schedule Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Due Date */}
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      lang="en"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.dueDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
                  </div>

                  {/* Due Time */}
                  <div>
                    <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700 mb-2">
                      Due Time (Optional)
                    </label>
                    <input
                      type="time"
                      name="dueTime"
                      value={formData.dueTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      max={formData.dueDate}
                      lang="en"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {isEditing && formData.taskType === 'task' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  lang="en"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Display fields for non-editing mode */}
            {!isEditing && (
              <>
                {/* Due Date for all task types */}
                {getTaskDueDate(task) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Due Date
                    </label>
                    <p className="text-gray-700">{formatDate(getTaskDueDate(task)!)}</p>
                  </div>
                )}

                {/* Additional fields for scheduled tasks */}
                {formData.taskType === 'scheduled' && (
                  <>
                    {(task as ScheduledTask).dueTime && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Due Time
                        </label>
                        <p className="text-gray-700">{(task as ScheduledTask).dueTime}</p>
                      </div>
                    )}
                    {(task as ScheduledTask).startDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <p className="text-gray-700">{formatDate((task as ScheduledTask).startDate!)}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Routine schedule display */}
                {formData.taskType === 'routine' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Repeat className="h-4 w-4 inline mr-1" />
                        Schedule
                      </label>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-purple-700 font-medium">
                          {getRecurrenceDescription()}
                          {formData.time && ` at ${formData.time}`}
                        </p>
                      </div>
                    </div>
                    
                    {((task as Routine).startDate || (task as Routine).endDate) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration
                        </label>
                        <p className="text-gray-700">
                          {(task as Routine).startDate && `From ${formatDate((task as Routine).startDate!)}`}
                          {(task as Routine).endDate && ` to ${formatDate((task as Routine).endDate!)}`}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        (task as Routine).isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {(task as Routine).isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </>
                )}

                {/* Created Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Created
                  </label>
                  <p className="text-gray-700">{formatDate(task.createdAt)}</p>
                </div>
              </>
            )}

            {/* Description/Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Notes
              </label>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add notes or description..."
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 min-h-[100px]">
                  {task.description ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No notes added</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;