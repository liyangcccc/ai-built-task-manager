import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Download,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  Flame,
  Award,
  Users,
  FolderOpen,
  FileText
} from 'lucide-react';
import BackButton from '../components/common/BackButton';
import { Category } from '../types/Task';
import { reportsApi, categoryApi } from '../services/api';

interface ReportsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
    overdueTasks: number;
    productiveDays: number;
    currentStreak: number;
    totalRoutines: number;
    activeRoutines: number;
  };
  priorityDistribution: {
    URGENT: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  categoryDistribution: Record<string, {
    total: number;
    completed: number;
    color: string;
  }>;
  topCategories: Array<{
    name: string;
    total: number;
    completed: number;
    color: string;
  }>;
  summary: {
    today: {
      total: number;
      completed: number;
      completionRate: number;
    };
    week: {
      total: number;
      completed: number;
      completionRate: number;
    };
    month: {
      total: number;
      completed: number;
      completionRate: number;
    };
  };
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

const Reports: React.FC = () => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [reportsResponse, categoriesResponse] = await Promise.all([
        reportsApi.getReports({
          period: selectedPeriod,
          categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        }),
        categoryApi.getCategories(),
      ]);

      if (reportsResponse.success && categoriesResponse.success) {
        setReportsData(reportsResponse.data);
        setCategories(categoriesResponse.data);
      } else {
        setError(reportsResponse.error || categoriesResponse.error || 'Failed to load reports');
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportReports = async () => {
    try {
      // Simple text export for now - could be enhanced with PDF later
      const data = {
        overview: reportsData?.overview,
        summary: reportsData?.summary,
        period: selectedPeriod,
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-reports-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting reports:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading reports...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">Start using the task manager to see your reports.</p>
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
                <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
                Reports & Analytics
              </h1>
              <p className="text-gray-600 mt-2">Track your productivity and task management insights.</p>
            </div>
            <button
              onClick={exportReports}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export Reports
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.overview.totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.overview.completedTasks}</p>
                <p className="text-xs text-green-600">
                  {reportsData.overview.completionRate.toFixed(1)}% completion rate
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.overview.pendingTasks}</p>
                {reportsData.overview.overdueTasks > 0 && (
                  <p className="text-xs text-red-600">
                    {reportsData.overview.overdueTasks} overdue
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Flame className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.overview.currentStreak}</p>
                <p className="text-xs text-purple-600">
                  {reportsData.overview.productiveDays} productive days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Today</h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tasks:</span>
                <span className="font-medium">{reportsData.summary.today.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">{reportsData.summary.today.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate:</span>
                <span className="font-medium">{reportsData.summary.today.completionRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tasks:</span>
                <span className="font-medium">{reportsData.summary.week.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">{reportsData.summary.week.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate:</span>
                <span className="font-medium">{reportsData.summary.week.completionRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
              <Award className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tasks:</span>
                <span className="font-medium">{reportsData.summary.month.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">{reportsData.summary.month.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate:</span>
                <span className="font-medium">{reportsData.summary.month.completionRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Priority Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Priority Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(reportsData.priorityDistribution).map(([priority, count]) => {
                const total = Object.values(reportsData.priorityDistribution).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total * 100) : 0;
                
                return (
                  <div key={priority} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded ${getPriorityColor(priority)}`}></div>
                    <div className="flex-1 flex justify-between items-center">
                      <span className="text-sm text-gray-600">{priority}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FolderOpen className="h-5 w-5 mr-2 text-blue-600" />
              Top Categories
            </h3>
            <div className="space-y-3">
              {reportsData.topCategories.length > 0 ? (
                reportsData.topCategories.map((category, index) => (
                  <div key={category.name} className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div className="flex-1 flex justify-between items-center">
                      <span className="text-sm text-gray-600">{category.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{category.total}</span>
                        <span className="text-xs text-green-600">
                          ({category.completed} completed)
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No categories found</p>
              )}
            </div>
          </div>
        </div>

        {/* Routines Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Routines Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{reportsData.overview.totalRoutines}</p>
              <p className="text-sm text-gray-600 mt-1">Total Routines</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{reportsData.overview.activeRoutines}</p>
              <p className="text-sm text-gray-600 mt-1">Active Routines</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
