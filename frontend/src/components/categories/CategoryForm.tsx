import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  FolderOpen,
  Palette,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../types/Task';
import { categoryApi } from '../../services/api';

interface CategoryFormProps {
  category?: Category;
  isOpen: boolean;
  onClose: () => void;
  onCategoryUpdated: () => void;
}

interface FormData {
  name: string;
  color: string;
  description: string;
  icon: string;
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes: string;
}

interface FormErrors {
  name?: string;
  color?: string;
  general?: string;
}

const PREDEFINED_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
];

const PREDEFINED_ICONS = [
  '📁', '📂', '📋', '📝', '💼', '🏠', '🎯', '⚡', '🔥', '💡',
  '🎨', '🎵', '📚', '🍽️', '🛒', '💪', '🧘', '✈️', '🎮', '⚽',
  '🔧', '💻', '📱', '🚗', '🌟', '❤️', '🎉', '🏆', '🌱', '☕'
];

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  isOpen,
  onClose,
  onCategoryUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showCustomColor, setShowCustomColor] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    color: '#3B82F6',
    description: '',
    icon: '',
    defaultPriority: 'MEDIUM',
    notes: ''
  });

  const isEditing = !!category;

  // Load form data when category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name,
          color: category.color,
          description: category.description || '',
          icon: category.icon || '',
          defaultPriority: category.defaultPriority,
          notes: category.notes || ''
        });
        setShowCustomColor(!PREDEFINED_COLORS.includes(category.color));
      } else {
        // Reset form for new category
        setFormData({
          name: '',
          color: '#3B82F6',
          description: '',
          icon: '',
          defaultPriority: 'MEDIUM',
          notes: ''
        });
        setShowCustomColor(false);
      }
      setErrors({});
    }
  }, [isOpen, category]);

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

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
    setShowCustomColor(false);
    if (errors.color) {
      setErrors(prev => ({ ...prev, color: undefined }));
    }
  };

  const handleIconSelect = (icon: string) => {
    setFormData(prev => ({ ...prev, icon }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!formData.color || !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'Please select a valid color';
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
      const categoryData: CreateCategoryRequest | UpdateCategoryRequest = {
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim() || undefined,
        icon: formData.icon || undefined,
        defaultPriority: formData.defaultPriority,
        notes: formData.notes.trim() || undefined,
      };

      let response;
      if (isEditing && category) {
        response = await categoryApi.updateCategory(category.id, categoryData);
      } else {
        response = await categoryApi.createCategory(categoryData as CreateCategoryRequest);
      }
      
      if (response.success) {
        onCategoryUpdated();
        onClose();
      } else {
        setErrors({ general: response.error || `Failed to ${isEditing ? 'update' : 'create'} category` });
      }
    } catch (err) {
      console.error('Error saving category:', err);
      setErrors({ general: `Failed to ${isEditing ? 'update' : 'create'} category. Please try again.` });
    } finally {
      setLoading(false);
    }
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
              <FolderOpen className="h-6 w-6 mr-2 text-blue-600" />
              {isEditing ? 'Edit Category' : 'Create New Category'}
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

            {/* Name and Color Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter category name..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Color Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Preview
                </label>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                    style={{ backgroundColor: formData.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{formData.color}</p>
                    <p className="text-xs text-gray-500">Selected color</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Palette className="h-4 w-4 inline mr-2" />
                Choose Color *
              </label>
              
              {/* Predefined Colors */}
              <div className="grid grid-cols-8 gap-2 mb-3">
                {PREDEFINED_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                      formData.color === color ? 'border-gray-600 ring-2 ring-blue-500' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Custom Color */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCustomColor(!showCustomColor)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showCustomColor ? 'Use predefined colors' : 'Use custom color'}
                </button>
                {showCustomColor && (
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-8 rounded border border-gray-300"
                  />
                )}
              </div>
              {errors.color && <p className="mt-1 text-sm text-red-600">{errors.color}</p>}
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Icon (Optional)
              </label>
              <div className="grid grid-cols-10 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => handleIconSelect('')}
                  className={`w-8 h-8 rounded border-2 transition-all hover:bg-gray-50 ${
                    !formData.icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <span className="text-xs text-gray-400">None</span>
                </button>
                {PREDEFINED_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 flex items-center justify-center ${
                      formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <span className="text-lg">{icon}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or enter custom emoji/icon..."
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Default Priority */}
              <div>
                <label htmlFor="defaultPriority" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Priority
                </label>
                <select
                  id="defaultPriority"
                  name="defaultPriority"
                  value={formData.defaultPriority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Default priority for new tasks in this category
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about this category..."
                rows={3}
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
                    {isEditing ? 'Update Category' : 'Create Category'}
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

export default CategoryForm;