import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  BarChart3,
  AlertCircle,
  Loader2,
  Merge,
  Users,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import BackButton from '../components/common/BackButton';
import CategoryForm from '../components/categories/CategoryForm';
import { Category } from '../types/Task';
import { categoryApi } from '../services/api';

interface CategoryWithStats extends Category {
  taskStats?: {
    total: number;
    completed: number;
    pending: number;
  };
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMergeMode, setShowMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<{ category: Category; hasContent: boolean } | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string>('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [categories, searchTerm]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await categoryApi.getCategories();
      if (response.success) {
        // Add task statistics to each category
        const categoriesWithStats = response.data.map(category => ({
          ...category,
          taskStats: {
            total: category._count?.tasks || 0,
            completed: 0, // Will be populated from analytics if needed
            pending: category._count?.tasks || 0,
          }
        }));
        setCategories(categoriesWithStats);
      } else {
        setError(response.error || 'Failed to load categories');
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...categories];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchLower) ||
        (category.description && category.description.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCategories(filtered);
  };

  const handleCategoryUpdated = () => {
    loadCategories();
    setShowForm(false);
    setEditingCategory(undefined);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    const hasContent = (category._count?.tasks || 0) > 0 || (category._count?.routines || 0) > 0;
    setShowDeleteModal({ category, hasContent });
  };

  const confirmDelete = async () => {
    if (!showDeleteModal) return;

    try {
      const response = await categoryApi.deleteCategory(
        showDeleteModal.category.id,
        reassignTarget || undefined
      );
      
      if (response.success) {
        setCategories(categories.filter(cat => cat.id !== showDeleteModal.category.id));
        setShowDeleteModal(null);
        setReassignTarget('');
      } else {
        setError(response.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    }
  };

  const handleMergeToggle = () => {
    setShowMergeMode(!showMergeMode);
    setSelectedForMerge([]);
  };

  const handleSelectForMerge = (categoryId: string) => {
    if (selectedForMerge.includes(categoryId)) {
      setSelectedForMerge(selectedForMerge.filter(id => id !== categoryId));
    } else if (selectedForMerge.length < 2) {
      setSelectedForMerge([...selectedForMerge, categoryId]);
    }
  };

  const handleMergeCategories = async () => {
    if (selectedForMerge.length !== 2) return;

    const [sourceId, targetId] = selectedForMerge;
    const sourceCategory = categories.find(cat => cat.id === sourceId);
    const targetCategory = categories.find(cat => cat.id === targetId);

    if (!sourceCategory || !targetCategory) return;

    const confirmed = window.confirm(
      `Are you sure you want to merge "${sourceCategory.name}" into "${targetCategory.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await categoryApi.mergeCategories(sourceId, targetId);
      if (response.success) {
        loadCategories();
        setShowMergeMode(false);
        setSelectedForMerge([]);
      } else {
        setError(response.error || 'Failed to merge categories');
      }
    } catch (err) {
      console.error('Error merging categories:', err);
      setError('Failed to merge categories. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-700 bg-red-100';
      case 'HIGH': return 'text-orange-700 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-700 bg-yellow-100';
      case 'LOW': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading categories...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FolderOpen className="h-8 w-8 mr-3 text-blue-600" />
                Categories
              </h1>
              <p className="text-gray-600 mt-2">Organize your tasks with custom categories.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleMergeToggle}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                  showMergeMode 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Merge className="h-4 w-4 mr-2" />
                {showMergeMode ? 'Cancel Merge' : 'Merge Categories'}
              </button>
              <button
                onClick={() => {
                  setEditingCategory(undefined);
                  setShowForm(true);
                }}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Category
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <FolderOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {categories.reduce((sum, cat) => sum + (cat._count?.tasks || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Routines</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {categories.reduce((sum, cat) => sum + (cat._count?.routines || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average per Category</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {categories.length > 0 
                      ? Math.round(categories.reduce((sum, cat) => sum + (cat._count?.tasks || 0), 0) / categories.length)
                      : 0
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Merge Mode Info */}
        {showMergeMode && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Merge className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <p className="text-orange-700 font-medium">Merge Mode Active</p>
                  <p className="text-orange-600 text-sm">
                    Select exactly 2 categories to merge. {selectedForMerge.length}/2 selected.
                  </p>
                </div>
              </div>
              {selectedForMerge.length === 2 && (
                <button
                  onClick={handleMergeCategories}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Merge Selected
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredCategories.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500 mb-6">
                {categories.length === 0 
                  ? "Get started by creating your first category to organize your tasks."
                  : "No categories match your search criteria."
                }
              </p>
              <button
                onClick={() => {
                  setEditingCategory(undefined);
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className={`bg-white border-2 rounded-xl p-6 transition-all hover:shadow-md ${
                    showMergeMode && selectedForMerge.includes(category.id)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-blue-300'
                  } ${showMergeMode ? 'cursor-pointer' : ''}`}
                  onClick={() => showMergeMode && handleSelectForMerge(category.id)}
                >
                  {/* Category Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-sm"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon || category.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(category.defaultPriority)}`}>
                            {category.defaultPriority}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!showMergeMode && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {category.description && (
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                  )}

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 text-blue-600 mr-2" />
                        <div>
                          <p className="text-xs text-gray-600">Tasks</p>
                          <p className="text-lg font-bold text-gray-900">{category._count?.tasks || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-purple-600 mr-2" />
                        <div>
                          <p className="text-xs text-gray-600">Routines</p>
                          <p className="text-lg font-bold text-gray-900">{category._count?.routines || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {category.notes && (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500">{category.notes}</p>
                    </div>
                  )}

                  {/* Merge Selection Indicator */}
                  {showMergeMode && selectedForMerge.includes(category.id) && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-6 w-6 text-orange-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Form Modal */}
      <CategoryForm
        category={editingCategory}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(undefined);
        }}
        onCategoryUpdated={handleCategoryUpdated}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
            
            <div className="inline-block w-full max-w-md px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Delete Category</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{showDeleteModal.category.name}"?
              </p>

              {showDeleteModal.hasContent && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm mb-3">
                    This category has {showDeleteModal.category._count?.tasks || 0} tasks and {showDeleteModal.category._count?.routines || 0} routines.
                    What should we do with them?
                  </p>
                  <select
                    value={reassignTarget}
                    onChange={(e) => setReassignTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select an option...</option>
                    <option value="null">Remove category assignment</option>
                    {categories
                      .filter(cat => cat.id !== showDeleteModal.category.id)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>
                          Move to "{cat.name}"
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={showDeleteModal.hasContent && !reassignTarget}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;