import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Clock,
  Calendar,
  Repeat,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Routine, CreateRoutineRequest, UpdateRoutineRequest, Category, RecurrenceType, RoutineSchedule } from '../../types/Task';
import { routineApi, categoryApi } from '../../services/api';

interface RoutineFormProps {
  routine?: Routine;
  isOpen: boolean;
  onClose: () => void;
  onRoutineUpdated: () => void;
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  recurrenceType: RecurrenceType;
  interval: number;
  daysOfWeek: string[];
  dayOfMonth: number;
  time: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface FormErrors {
  title?: string;
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

const RoutineForm: React.FC<RoutineFormProps> = ({
  routine,
  isOpen,
  onClose,
  onRoutineUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    categoryId: '',
    priority: 'MEDIUM',
    recurrenceType: 'DAILY',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: 1,
    time: '',
    startDate: '',
    endDate: '',
    isActive: true
  });

  const isEditing = !!routine;

  // Load categories and populate form when routine changes
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (routine) {
        setFormData({
          title: routine.title,
          description: routine.description || '',
          categoryId: routine.categoryId || '',
          priority: routine.priority,
          recurrenceType: routine.schedule.recurrenceType,
          interval: routine.schedule.interval || 1,
          daysOfWeek: routine.schedule.daysOfWeek || [],
          dayOfMonth: routine.schedule.dayOfMonth || 1,
          time: routine.schedule.time || '',
          startDate: routine.startDate ? new Date(routine.startDate).toISOString().split('T')[0] : '',
          endDate: routine.endDate ? new Date(routine.endDate).toISOString().split('T')[0] : '',
          isActive: routine.isActive
        });
      } else {
        // Reset form for new routine
        setFormData({
          title: '',
          description: '',
          categoryId: '',
          priority: 'MEDIUM',
          recurrenceType: 'DAILY',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: 1,
          time: '',
          startDate: '',
          endDate: '',
          isActive: true
        });
      }
      setErrors({});
    }
  }, [routine, isOpen]);

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

  const handleDayOfWeekToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
    
    if (errors.daysOfWeek) {
      setErrors(prev => ({ ...prev, daysOfWeek: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.recurrenceType === 'WEEKLY' && formData.daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'Select at least one day for weekly routine';
    }

    if (formData.recurrenceType === 'MONTHLY' && (formData.dayOfMonth < 1 || formData.dayOfMonth > 31)) {
      newErrors.dayOfMonth = 'Day of month must be between 1 and 31';
    }

    if (formData.recurrenceType === 'CUSTOM' && formData.interval < 1) {
      newErrors.interval = 'Interval must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
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

      const routineData: CreateRoutineRequest | UpdateRoutineRequest = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        priority: formData.priority,
        schedule,
        isActive: formData.isActive,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

      let response;
      if (isEditing && routine) {
        response = await routineApi.updateRoutine(routine.id, routineData);
      } else {
        response = await routineApi.createRoutine(routineData as CreateRoutineRequest);
      }
      
      if (response.success) {
        onRoutineUpdated();
        onClose();
      } else {
        setErrors({ general: response.error || `Failed to ${isEditing ? 'update' : 'create'} routine` });
      }
    } catch (err) {
      console.error('Error saving routine:', err);
      setErrors({ general: `Failed to ${isEditing ? 'update' : 'create'} routine. Please try again.` });
    } finally {
      setLoading(false);
    }
  };

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

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-3xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Repeat className="h-6 w-6 mr-2 text-purple-600" />
              {isEditing ? 'Edit Routine' : 'Create New Routine'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-700">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Routine Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter routine title..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">No Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Schedule Configuration */}
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
                    Select Days *
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayOfWeekToggle(day.value)}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          formData.daysOfWeek.includes(day.value)
                            ? 'border-purple-500 bg-purple-100 text-purple-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  {errors.daysOfWeek && <p className="mt-1 text-sm text-red-600">{errors.daysOfWeek}</p>}
                </div>
              )}

              {/* Monthly Day Selection */}
              {formData.recurrenceType === 'MONTHLY' && (
                <div className="mb-4">
                  <label htmlFor="dayOfMonth" className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Month (1-31)
                  </label>
                  <input
                    type="number"
                    id="dayOfMonth"
                    name="dayOfMonth"
                    value={formData.dayOfMonth}
                    onChange={handleInputChange}
                    min="1"
                    max="31"
                    className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
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
                    Repeat every X days
                  </label>
                  <input
                    type="number"
                    id="interval"
                    name="interval"
                    value={formData.interval}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.interval ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.interval && <p className="mt-1 text-sm text-red-600">{errors.interval}</p>}
                </div>
              )}

              {/* Time */}
              <div className="mb-4">
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Time (Optional)
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Schedule Preview */}
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Schedule Preview:</h5>
                <p className="text-purple-700 font-medium">
                  {getRecurrenceDescription()}
                  {formData.time && ` at ${formData.time}`}
                </p>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
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
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  lang="en"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add any notes or details about this routine..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Routine is active
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Routine' : 'Create Routine'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoutineForm;