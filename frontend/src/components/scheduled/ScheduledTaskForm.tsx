import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Calendar,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ScheduledTask, CreateScheduledTaskRequest, UpdateScheduledTaskRequest, Category } from '../../types/Task';
import { scheduledTaskApi, categoryApi } from '../../services/api';

interface ScheduledTaskFormProps {
  task?: ScheduledTask;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  dueTime: string;
  startDate: string;
}

interface FormErrors {
  title?: string;
  dueDate?: string;
  general?: string;
}

const ScheduledTaskForm: React.FC<ScheduledTaskFormProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    categoryId: '',
    priority: 'MEDIUM',
    dueDate: '',
    dueTime: '',
    startDate: ''
  });

  const isEditing = !!task;

  // Load categories and populate form when task changes
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (task) {
        // Parse date and time from task
        const dueDateTime = new Date(task.dueDate);
        const dueDate = dueDateTime.toISOString().split('T')[0];
        const dueTime = task.dueTime || '';
        
        setFormData({
          title: task.title,
          description: task.description || '',
          categoryId: task.categoryId || '',
          priority: task.priority,
          dueDate,
          dueTime,
          startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''
        });
      } else {
        // Reset form for new task
        setFormData({
          title: '',
          description: '',
          categoryId: '',
          priority: 'MEDIUM',
          dueDate: '',
          dueTime: '',
          startDate: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, task]);

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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
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
      const taskData: CreateScheduledTaskRequest | UpdateScheduledTaskRequest = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime || undefined,
        startDate: formData.startDate || undefined,
      };

      let response;
      if (isEditing && task) {
        response = await scheduledTaskApi.updateScheduledTask(task.id, taskData);
      } else {
        response = await scheduledTaskApi.createScheduledTask(taskData as CreateScheduledTaskRequest);
      }
      
      if (response.success) {
        onTaskUpdated();
        onClose();
      } else {
        setErrors({ general: response.error || `Failed to ${isEditing ? 'update' : 'create'} scheduled task` });
      }
    } catch (err) {
      console.error('Error saving scheduled task:', err);
      setErrors({ general: `Failed to ${isEditing ? 'update' : 'create'} scheduled task. Please try again.` });
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date for date picker (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
        <div className="inline-block w-full max-w-2xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="h-6 w-6 mr-2 text-blue-600" />
              {isEditing ? 'Edit Scheduled Task' : 'Create New Scheduled Task'}
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
                  Category
                </label>
                <select
                  id="categoryId"
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
            </div>

            {/* Date and Time */}
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
                onClick={onClose}
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
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Task' : 'Create Task'}
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

export default ScheduledTaskForm;