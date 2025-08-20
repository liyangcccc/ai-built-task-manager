import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Search, 
  Filter,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Repeat,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import BackButton from '../components/common/BackButton';
import RoutineForm from '../components/routines/RoutineForm';
import { routineApi, categoryApi } from '../services/api';
import { Routine, Category, RecurrenceType } from '../types/Task';

type FilterType = 'all' | 'active' | 'inactive';

const Routines: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>(undefined);

  // Load routines and categories
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [routinesResponse, categoriesResponse] = await Promise.all([
        routineApi.getRoutines({ search: searchTerm }),
        categoryApi.getCategories()
      ]);

      if (routinesResponse.success) {
        setRoutines(routinesResponse.data);
      } else {
        setError(routinesResponse.error || 'Failed to load routines');
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      }
    } catch (err) {
      setError('Failed to connect to server. Please check if the backend is running.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter routines based on current filters
  const filteredRoutines = routines.filter(routine => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && routine.isActive) || 
      (filter === 'inactive' && !routine.isActive);

    const matchesSearch = 
      routine.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (routine.description && routine.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = 
      !selectedCategory || routine.categoryId === selectedCategory;

    const matchesRecurrence = 
      !selectedRecurrence || routine.schedule.recurrenceType === selectedRecurrence;

    return matchesFilter && matchesSearch && matchesCategory && matchesRecurrence;
  });

  // Toggle routine active status
  const toggleRoutineStatus = async (routineId: string, currentStatus: boolean) => {
    try {
      const response = await routineApi.toggleRoutineStatus(routineId, !currentStatus);
      if (response.success) {
        setRoutines(routines.map(routine => 
          routine.id === routineId ? { ...routine, isActive: !currentStatus } : routine
        ));
      }
    } catch (err) {
      console.error('Error updating routine status:', err);
    }
  };

  // Delete routine
  const deleteRoutine = async (routineId: string) => {
    if (!confirm('Are you sure you want to delete this routine? This action cannot be undone.')) return;
    
    try {
      const response = await routineApi.deleteRoutine(routineId);
      if (response.success) {
        setRoutines(routines.filter(routine => routine.id !== routineId));
      }
    } catch (err) {
      console.error('Error deleting routine:', err);
    }
  };

  // Open form for new routine
  const openNewRoutineForm = () => {
    setEditingRoutine(undefined);
    setIsFormOpen(true);
  };

  // Open form for editing routine
  const openEditRoutineForm = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
  };

  // Close form
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingRoutine(undefined);
  };

  // Handle routine updated
  const handleRoutineUpdated = () => {
    loadData();
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-700 bg-red-100 border-red-200';
      case 'HIGH': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'MEDIUM': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'LOW': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  // Get recurrence icon
  const getRecurrenceIcon = (type: RecurrenceType) => {
    switch (type) {
      case 'DAILY': return <Clock className="h-4 w-4" />;
      case 'WEEKLY': return <Calendar className="h-4 w-4" />;
      case 'MONTHLY': return <Calendar className="h-4 w-4" />;
      case 'CUSTOM': return <Repeat className="h-4 w-4" />;
    }
  };

  // Format schedule display
  const formatScheduleDisplay = (routine: Routine) => {
    const { schedule } = routine;
    let text = '';

    switch (schedule.recurrenceType) {
      case 'DAILY':
        text = 'Daily';
        break;
      case 'WEEKLY':
        if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
          text = `Weekly on ${schedule.daysOfWeek.map(day => day.charAt(0) + day.slice(1).toLowerCase()).join(', ')}`;
        } else {
          text = 'Weekly';
        }
        break;
      case 'MONTHLY':
        text = schedule.dayOfMonth 
          ? `Monthly on the ${schedule.dayOfMonth}${getOrdinalSuffix(schedule.dayOfMonth)}`
          : 'Monthly';
        break;
      case 'CUSTOM':
        text = schedule.interval 
          ? `Every ${schedule.interval} day${schedule.interval > 1 ? 's' : ''}`
          : 'Custom';
        break;
    }

    if (schedule.time) {
      text += ` at ${schedule.time}`;
    }

    return text;
  };

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading routines...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-red-800 font-medium">Error Loading Routines</h3>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <BackButton />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Clock className="h-8 w-8 mr-3 text-purple-600" />
                Routines
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your daily, weekly, and monthly routines. {filteredRoutines.length} of {routines.length} routines shown.
              </p>
            </div>
            <button
              onClick={openNewRoutineForm}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Routine
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search routines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'inactive', label: 'Inactive' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as FilterType)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Recurrence Filter */}
            <div className="min-w-[150px]">
              <select
                value={selectedRecurrence}
                onChange={(e) => setSelectedRecurrence(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Types</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Routines List */}
        {filteredRoutines.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No routines found</h3>
              <p className="text-gray-600 mb-6">
                {routines.length === 0 
                  ? "You don't have any routines yet. Create your first routine to get started!"
                  : "No routines match your current filters. Try adjusting your search or filters."
                }
              </p>
              <button
                onClick={openNewRoutineForm}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Routine
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRoutines.map((routine) => (
              <div
                key={routine.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                  !routine.isActive ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold ${
                            routine.isActive ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {routine.title}
                          </h3>
                          {!routine.isActive && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        
                        {routine.description && (
                          <p className={`text-sm mb-3 ${
                            routine.isActive ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {routine.description}
                          </p>
                        )}
                        
                        {/* Schedule Display */}
                        <div className="flex items-center gap-2 mb-3">
                          {getRecurrenceIcon(routine.schedule.recurrenceType)}
                          <span className={`text-sm font-medium ${
                            routine.isActive ? 'text-purple-700' : 'text-gray-500'
                          }`}>
                            {formatScheduleDisplay(routine)}
                          </span>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Priority */}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(routine.priority)}`}>
                            {routine.priority}
                          </span>
                          
                          {/* Category */}
                          {routine.category && (
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: routine.category.color }}
                            >
                              {routine.category.name}
                            </span>
                          )}
                          
                          {/* Date Range */}
                          {(routine.startDate || routine.endDate) && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                              {routine.startDate && formatDate(routine.startDate)}
                              {routine.startDate && routine.endDate && ' - '}
                              {routine.endDate && formatDate(routine.endDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {/* Toggle Active Status */}
                        <button
                          onClick={() => toggleRoutineStatus(routine.id, routine.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            routine.isActive 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={routine.isActive ? 'Deactivate routine' : 'Activate routine'}
                        >
                          {routine.isActive ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditRoutineForm(routine)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit routine"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteRoutine(routine.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete routine"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routine Form Modal */}
      <RoutineForm
        routine={editingRoutine}
        isOpen={isFormOpen}
        onClose={closeForm}
        onRoutineUpdated={handleRoutineUpdated}
      />
    </div>
  );
};

export default Routines;