import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  ListTodo,
  FolderOpen,
  BarChart3,
  Cog,
  ArrowRight
} from 'lucide-react';
import { taskApi } from '../services/api';
import TaskDetailModal from '../components/common/TaskDetailModal';
import { Task as APITask } from '../types/Task';
import { useLanguage } from '../contexts/LanguageContext';

interface Task {
  id: string;
  title: string;
  category: string;
  type: 'routine' | 'scheduled';
  dueDate?: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface TodoItem {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dueWithinDays, setDueWithinDays] = useState(7);
  const [todayTodos, setTodayTodos] = useState<TodoItem[]>([]);
  const [dueWithinDaysTasks, setDueWithinDaysTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTasksCount, setAllTasksCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<APITask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<APITask[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [dueWithinDays]);

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const response = await taskApi.updateTask(taskId, { completed: !completed });
      if (response.success) {
        // Refresh dashboard data to get updated task states
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  // Open task details
  const openTaskDetails = (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  // Handle task updated in modal
  const handleTaskUpdated = () => {
    loadDashboardData();
    closeModal();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskApi.getTasks();
      
      if (response.success) {
        const tasks = response.data;
        setAllTasks(tasks); // Store all tasks for modal access
        setAllTasksCount(tasks.length);
        
        // Get today's date string for comparison
        const todayString = new Date().toISOString().split('T')[0];
        
        // Filter tasks for today (tasks with no due date or due today)
        const todaysTasks = tasks.filter(task => {
          if (!task.dueDate) return !task.completed; // Include incomplete tasks without due date
          const taskDateString = task.dueDate.split('T')[0];
          return taskDateString === todayString;
        });
        
        // Convert to TodoItem format
        const todayTodosData: TodoItem[] = todaysTasks.map(task => ({
          id: task.id,
          title: task.title,
          category: task.category?.name || 'Uncategorized',
          completed: task.completed,
          priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high'
        }));
        
        setTodayTodos(todayTodosData);
        
        // Filter tasks due within specified days
        const dueWithinDaysData = tasks.filter(task => {
          if (!task.dueDate || task.completed) return false;
          const taskDateString = task.dueDate.split('T')[0];
          
          // Calculate future date string
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + dueWithinDays);
          const futureDateString = futureDate.toISOString().split('T')[0];
          
          return taskDateString > todayString && taskDateString <= futureDateString;
        });
        
        // Convert to Task format
        const dueWithinDaysFormatted: Task[] = dueWithinDaysData.map(task => ({
          id: task.id,
          title: task.title,
          category: task.category?.name || 'Uncategorized',
          type: 'scheduled' as const,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completed: task.completed,
          priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high'
        }));
        
        setDueWithinDaysTasks(dueWithinDaysFormatted);
        
        // Filter overdue tasks
        const overdueData = tasks.filter(task => {
          if (!task.dueDate || task.completed) return false;
          const taskDateString = task.dueDate.split('T')[0];
          return taskDateString < todayString;
        });
        
        // Convert to Task format
        const overdueFormatted: Task[] = overdueData.map(task => ({
          id: task.id,
          title: task.title,
          category: task.category?.name || 'Uncategorized',
          type: 'scheduled' as const,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completed: task.completed,
          priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high'
        }));
        
        setOverdueTasks(overdueFormatted);
      } else {
        setError('Failed to load tasks from server');
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Cannot connect to server. Working in offline mode.');
      // Set some default demo data for offline mode
      setTodayTodos([]);
      setDueWithinDaysTasks([]);
      setOverdueTasks([]);
      setAllTasksCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Navigation card counts
  const counts = {
    allTasks: allTasksCount,
    routines: todayTodos.length,
    scheduled: dueWithinDaysTasks.length,
    categories: 6, // Will be updated when categories API is integrated
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Work': 'bg-blue-100 text-blue-800',
      'Study': 'bg-purple-100 text-purple-800',
      'Health': 'bg-green-100 text-green-800',
      'Personal': 'bg-pink-100 text-pink-800',
      'Finance': 'bg-yellow-100 text-yellow-800',
      'Projects': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const navigationCards = [
    {
      title: t('allTasks'),
      description: 'View and manage all your tasks',
      icon: ListTodo,
      count: counts.allTasks,
      path: '/tasks',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    {
      title: t('routines'),
      description: 'Daily, weekly, and monthly routines',
      icon: Clock,
      count: counts.routines,
      path: '/routines',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300'
    },
    {
      title: t('scheduledTasks'),
      description: 'Tasks with specific due dates',
      icon: Calendar,
      count: counts.scheduled,
      path: '/scheduled',
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300'
    },
    {
      title: t('categories'),
      description: 'Organize tasks by category',
      icon: FolderOpen,
      count: counts.categories,
      path: '/categories',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-700 dark:text-orange-300'
    },
    {
      title: t('reports'),
      description: 'Generate and export reports',
      icon: BarChart3,
      count: null,
      path: '/reports',
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-700 dark:text-indigo-300'
    },
    {
      title: t('settings'),
      description: 'Configure your preferences',
      icon: Cog,
      count: null,
      path: '/settings',
      color: 'bg-slate-500',
      bgColor: 'bg-slate-50 dark:bg-slate-900/20',
      textColor: 'text-slate-700 dark:text-slate-300'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">{t('welcomeBack')}</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">{t('todaysOverview')}</p>
          
          {/* Error Banner */}
          {error && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <p className="text-yellow-700 dark:text-yellow-300">{error}</p>
                <button
                  onClick={loadDashboardData}
                  className="ml-auto px-3 py-1 text-sm bg-yellow-600 dark:bg-yellow-700 text-white rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Section: Today's Tasks and Due Within 7 Days */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Today's To-Do */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Clock className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                  {t('todaysTodos')}
                </h2>
                <button 
                  onClick={() => navigate('/tasks/add')}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title="Add new task"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {todayTodos.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tasks for today</p>
              ) : (
                <div className="space-y-3">
                  {todayTodos.map((todo) => (
                    <div key={todo.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div 
                        className="flex items-center space-x-3 flex-1 cursor-pointer"
                        onClick={() => openTaskDetails(todo.id)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompletion(todo.id, todo.completed);
                          }}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            todo.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {todo.completed && <CheckCircle className="h-3 w-3" />}
                        </button>
                        <div>
                          <p className={`font-medium ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {todo.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(todo.category)}`}>
                              {todo.category}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                              {todo.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Due Within N Days */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="h-6 w-6 mr-3 text-green-600 dark:text-green-400" />
                Due Within 
                <input
                  type="number"
                  value={dueWithinDays}
                  onChange={(e) => setDueWithinDays(parseInt(e.target.value) || 7)}
                  className="w-16 text-xl font-bold text-gray-900 dark:text-white border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:ring-inset mx-2"
                  min="1"
                  max="30"
                />
                days
              </h2>
            </div>
            <div className="p-6">
              {dueWithinDaysTasks.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tasks due soon</p>
              ) : (
                <div className="space-y-3">
                  {dueWithinDaysTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div 
                        className="flex items-center space-x-3 flex-1 cursor-pointer"
                        onClick={() => openTaskDetails(task.id)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompletion(task.id, task.completed);
                          }}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            task.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {task.completed && <CheckCircle className="h-3 w-3" />}
                        </button>
                        <div>
                          <p className={`font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
                              {task.category}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Due {task.dueDate?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Overdue Tasks ({overdueTasks.length})
              </h3>
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                    <div 
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                      onClick={() => openTaskDetails(task.id)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompletion(task.id, task.completed);
                        }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-red-300 dark:border-red-600 hover:border-green-400'
                        }`}
                      >
                        {task.completed && <CheckCircle className="h-3 w-3" />}
                      </button>
                      <div>
                        <p className={`font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
                            {task.category}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                            Overdue by {Math.ceil((Date.now() - (task.dueDate?.getTime() || 0)) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        Was due {task.dueDate?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section: Navigation Cards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {navigationCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  onClick={() => navigate(card.path)}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-105 transition-all duration-200 text-left"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${card.bgColor}`}>
                      <Icon className={`h-6 w-6 ${card.textColor}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{card.description}</p>
                  
                  {card.count !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{card.count}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">items</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
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

export default Dashboard;
