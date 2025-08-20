import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Save, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import BackButton from '../components/common/BackButton';
import { categoryApi, routineApi, scheduledTaskApi } from '../services/api';
import { Category, RecurrenceType, RoutineSchedule } from '../types/Task';

const DAYS_OF_WEEK = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
  { value: 'SAT', label: 'Saturday' },
  { value: 'SUN', label: 'Sunday' },
];

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  taskType: 'routine' | 'scheduled';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  // Scheduled task specific fields
  dueTime: string;
  startDate: string;
  // Routine-specific fields
  recurrenceType: RecurrenceType;
  interval: number;
  daysOfWeek: string[];
  dayOfMonth: number;
  time: string;
  routineStartDate: string;
  endDate: string;
}

interface FormErrors {
  title?: string;
  categoryId?: string;
  dueDate?: string;
  recurrenceType?: string;
  daysOfWeek?: string;
  dayOfMonth?: string;
  interval?: string;
  general?: string;
}

const AddTask: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    categoryId: '',
    taskType: 'scheduled',
    priority: 'MEDIUM',
    dueDate: '',
    // Scheduled task defaults
    dueTime: '',
    startDate: '',
    // Routine-specific defaults
    recurrenceType: 'DAILY',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: 1,
    time: '',
    routineStartDate: '',
    endDate: ''
  });

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoryApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle radio button changes
  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes for days of week
  const handleDayOfWeekChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: checked
        ? [...prev.daysOfWeek, day]
        : prev.daysOfWeek.filter(d => d !== day)
    }));
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

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let response;

      if (formData.taskType === 'routine') {
        // Create routine
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
          isActive: true,
          startDate: formData.routineStartDate || undefined,
          endDate: formData.endDate || undefined,
        };

        response = await routineApi.createRoutine(routineData);
      } else {
        // Create scheduled task with enhanced fields
        const taskData = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          categoryId: formData.categoryId || undefined,
          priority: formData.priority,
          dueDate: formData.dueDate,
          dueTime: formData.dueTime || undefined,
          startDate: formData.startDate || undefined,
        };

        response = await scheduledTaskApi.createScheduledTask(taskData);
      }
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setErrors({ general: response.error || `Failed to create ${formData.taskType}` });
      }
    } catch (err) {
      console.error(`Error creating ${formData.taskType}:`, err);
      setErrors({ general: `Failed to create ${formData.taskType}. Please try again.` });
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date for date picker (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {formData.taskType === 'routine' ? 'Routine' : 'Task'} Created Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your {formData.taskType} "{formData.title}" has been added to your {formData.taskType === 'routine' ? 'routines' : 'task list'}.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to Dashboard in a moment...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <BackButton />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Plus className="h-8 w-8 mr-3 text-blue-600" />
            Add New Task
          </h1>
          <p className="text-gray-600 mt-2">Create a new task to stay organized and productive.</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-700">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Task Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter task title..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              {loadingCategories ? (
                <div className="flex items-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Loading categories...</span>
                </div>
              ) : (
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.categoryId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Task Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.taskType === 'routine' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="taskType"
                    value="routine"
                    checked={formData.taskType === 'routine'}
                    onChange={(e) => handleRadioChange('taskType', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-purple-600" />
                      <span className="font-medium text-gray-900">Routine</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Recurring task (daily, weekly, monthly)</p>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.taskType === 'scheduled' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="taskType"
                    value="scheduled"
                    checked={formData.taskType === 'scheduled'}
                    onChange={(e) => handleRadioChange('taskType', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-green-600" />
                      <span className="font-medium text-gray-900">Scheduled</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">One-time task with due date</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Conditional Fields */}
            {formData.taskType === 'routine' ? (
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
                          onChange={(e) => handleRadioChange('recurrenceType', e.target.value)}
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
                      id="dayOfMonth"
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
                      id="interval"
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
                    id="time"
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
                      id="routineStartDate"
                      name="routineStartDate"
                      value={formData.routineStartDate}
                      onChange={handleInputChange}
                      min={getMinDate()}
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
                      min={formData.routineStartDate || getMinDate()}
                      lang="en"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Schedule Preview */}
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <span className="text-sm font-medium text-gray-600">Schedule Preview: </span>
                  <span className="text-sm text-purple-700">{getRecurrenceDescription()}</span>
                  {formData.time && <span className="text-sm text-purple-700"> at {formData.time}</span>}
                </div>
              </div>
            ) : (
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
                      id="dueDate"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      min={getMinDate()}
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
                      id="dueTime"
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
                      id="startDate"
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

            {/* Description/Notes */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add any additional notes or details..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create {formData.taskType === 'routine' ? 'Routine' : 'Task'}
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

export default AddTask;