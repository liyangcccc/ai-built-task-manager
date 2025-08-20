import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ListTodo, 
  Plus, 
  Search, 
  Calendar,
  CheckCircle,
  Circle,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import BackButton from '../components/common/BackButton';
import { taskApi, categoryApi } from '../services/api';
import { Task, Category } from '../types/Task';
import TaskDetailModal from '../components/common/TaskDetailModal';

type FilterType = 'all' | 'active' | 'completed';

const AllTasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load tasks and categories
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tasksResponse, categoriesResponse] = await Promise.all([
        taskApi.getTasks({ search: searchTerm }),
        categoryApi.getCategories()
      ]);

      if (tasksResponse.success) {
        setTasks(tasksResponse.data);
      } else {
        setError(tasksResponse.error || 'Failed to load tasks');
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

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && !task.completed) || 
      (filter === 'completed' && task.completed);

    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = 
      !selectedCategory || task.categoryId === selectedCategory;

    return matchesFilter && matchesSearch && matchesCategory;
  });

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const response = await taskApi.updateTask(taskId, { completed: !completed });
      if (response.success) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, completed: !completed } : task
        ));
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await taskApi.deleteTask(taskId);
      if (response.success) {
        setTasks(tasks.filter(task => task.id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Open task details
  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  // Handle task updated in modal
  const handleTaskUpdated = () => {
    loadData();
    closeModal();
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

  // Get category info
  const getCategoryInfo = (categoryId?: string) => {
    if (!categoryId) return null;
    return categories.find(cat => cat.id === categoryId);
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
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading tasks...</p>
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
              <h3 className="text-red-800 font-medium">Error Loading Tasks</h3>
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
                <ListTodo className="h-8 w-8 mr-3 text-blue-600" />
                All Tasks
              </h1>
              <p className="text-gray-600 mt-2">
                Manage all your tasks in one place. {filteredTasks.length} of {tasks.length} tasks shown.
              </p>
            </div>
            <button
              onClick={() => navigate('/tasks/add')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Task
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
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'completed', label: 'Completed' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as FilterType)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-white text-blue-600 shadow-sm'
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
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <ListTodo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-6">
                {tasks.length === 0 
                  ? "You don't have any tasks yet. Create your first task to get started!"
                  : "No tasks match your current filters. Try adjusting your search or filters."
                }
              </p>
              <button
                onClick={() => navigate('/tasks/add')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Task
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => {
              const category = getCategoryInfo(task.categoryId);
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
              
              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                    isOverdue ? 'border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompletion(task.id, task.completed);
                      }}
                      className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {task.completed ? <CheckCircle className="h-3 w-3" /> : <Circle className="h-3 w-3 opacity-0" />}
                    </button>

                    {/* Task Content */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => openTaskDetails(task)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`text-lg font-medium ${
                            task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className={`mt-1 text-sm ${
                              task.completed ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {task.description}
                            </p>
                          )}
                          
                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {/* Priority */}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            
                            {/* Category */}
                            {category && (
                              <span 
                                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: category.color }}
                              >
                                {category.name}
                              </span>
                            )}
                            
                            {/* Due Date */}
                            {task.dueDate && (
                              <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isOverdue 
                                  ? 'text-red-700 bg-red-100' 
                                  : 'text-blue-700 bg-blue-100'
                              }`}>
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(task.dueDate)}
                                {isOverdue && <span className="ml-1">(Overdue)</span>}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={closeModal}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default AllTasks;
