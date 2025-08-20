import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  SortAsc,
  SortDesc,
  CalendarDays
} from 'lucide-react';
import BackButton from '../components/common/BackButton';
import ScheduledTaskForm from '../components/scheduled/ScheduledTaskForm';
import { ScheduledTask, Category } from '../types/Task';
import { scheduledTaskApi, categoryApi } from '../services/api';
import {
  getTaskStatus,
  getTaskStatusText,
  getTaskStatusColor,
  getPriorityColor,
  formatDate,
  formatTime,
  sortTasksByDueDate
} from '../utils/dateUtils';

interface FilterState {
  search: string;
  categoryId: string;
  priority: string;
  status: string;
  sortBy: 'dueDate' | 'priority' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

const ScheduledTasks: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | undefined>();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categoryId: '',
    priority: '',
    status: '',
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [tasksResponse, categoriesResponse] = await Promise.all([
        scheduledTaskApi.getScheduledTasks(),
        categoryApi.getCategories()
      ]);

      if (tasksResponse.success) {
        // Filter out tasks without due dates and convert to ScheduledTask
        const scheduledTasks = tasksResponse.data
          .filter(task => task.dueDate)
          .map(task => ({
            ...task,
            dueDate: task.dueDate!
          } as ScheduledTask));
        setTasks(scheduledTasks);
      } else {
        setError(tasksResponse.error || 'Failed to load scheduled tasks');
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (filters.categoryId) {
      filtered = filtered.filter(task => task.categoryId === filters.categoryId);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(task => {
        const status = getTaskStatus(task.dueDate, task.completed);
        return status === filters.status;
      });
    }

    // Sort
    if (filters.sortBy === 'dueDate') {
      filtered = sortTasksByDueDate(filtered, filters.sortOrder === 'asc');
    } else {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        if (filters.sortBy === 'priority') {
          const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
        } else {
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
        }

        return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    setFilteredTasks(filtered);
  };

  const handleTaskUpdated = () => {
    loadData();
    setShowForm(false);
    setEditingTask(undefined);
  };

  const handleEditTask = (task: ScheduledTask) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled task?')) {
      return;
    }

    try {
      const response = await scheduledTaskApi.deleteScheduledTask(taskId);
      if (response.success) {
        setTasks(tasks.filter(task => task.id !== taskId));
      } else {
        setError(response.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const response = await scheduledTaskApi.toggleTaskComplete(taskId, completed);
      if (response.success) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, completed } : task
        ));
      } else {
        setError(response.error || 'Failed to update task');
      }
    } catch (err) {
      console.error('Error toggling task completion:', err);
      setError('Failed to update task. Please try again.');
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: tasks.length,
      pending: 0,
      overdue: 0,
      completed: 0
    };

    tasks.forEach(task => {
      if (task.completed) {
        counts.completed++;
      } else {
        counts.pending++;
        const status = getTaskStatus(task.dueDate, task.completed);
        if (status === 'overdue') {
          counts.overdue++;
        }
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading scheduled tasks...</span>
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
                <Calendar className="h-8 w-8 mr-3 text-blue-600" />
                Scheduled Tasks
              </h1>
              <p className="text-gray-600 mt-2">Manage tasks with specific due dates and deadlines.</p>
            </div>
            <button
              onClick={() => {
                setEditingTask(undefined);
                setShowForm(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Scheduled Task
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <CalendarDays className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.overdue}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.completed}</p>
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="overdue">Overdue</option>
                <option value="due-today">Due Today</option>
                <option value="due-soon">Due Soon</option>
                <option value="future">Future</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <div className="flex">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="createdAt">Created</option>
                </select>
                <button
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                  }))}
                  className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors"
                >
                  {filters.sortOrder === 'asc' ? 
                    <SortAsc className="h-4 w-4" /> : 
                    <SortDesc className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled tasks found</h3>
              <p className="text-gray-500 mb-6">
                {tasks.length === 0 
                  ? "Get started by creating your first scheduled task."
                  : "No tasks match your current filters. Try adjusting your search criteria."
                }
              </p>
              <button
                onClick={() => {
                  setEditingTask(undefined);
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Scheduled Task
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTasks.map((task) => {
                const status = getTaskStatus(task.dueDate, task.completed);
                const statusColor = getTaskStatusColor(status);
                const priorityColor = getPriorityColor(task.priority);

                return (
                  <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Completion Toggle */}
                        <button
                          onClick={() => handleToggleComplete(task.id, !task.completed)}
                          className="mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>

                        {/* Task Details */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className={`text-lg font-medium ${
                              task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {task.title}
                            </h3>
                            
                            {/* Priority Badge */}
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${priorityColor}`}>
                              {task.priority}
                            </span>
                            
                            {/* Status Badge */}
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${statusColor}`}>
                              {getTaskStatusText(task.dueDate, task.completed)}
                            </span>
                          </div>

                          {task.description && (
                            <p className={`text-gray-600 mb-3 ${
                              task.completed ? 'line-through' : ''
                            }`}>
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{formatDate(task.dueDate)}</span>
                              {task.dueTime && (
                                <span className="ml-2">at {formatTime(task.dueTime)}</span>
                              )}
                            </div>
                            
                            {task.category && (
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-1"
                                  style={{ backgroundColor: task.category.color }}
                                />
                                <span>{task.category.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <ScheduledTaskForm
        task={editingTask}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTask(undefined);
        }}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default ScheduledTasks;