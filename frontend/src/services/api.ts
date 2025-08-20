import axios from 'axios';
import { Task, CreateTaskRequest, UpdateTaskRequest, Category, CreateCategoryRequest, UpdateCategoryRequest, Routine, CreateRoutineRequest, UpdateRoutineRequest, ScheduledTask, CreateScheduledTaskRequest, UpdateScheduledTaskRequest } from '../types/Task';
import { auth } from '../utils/auth';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use(async (config) => {
  let token = auth.getToken();
  
  // If no token, try to auto-login with demo user
  if (!token) {
    console.log('No token found, attempting auto-login...');
    const loginSuccess = await auth.autoLoginDemo();
    if (loginSuccess) {
      token = auth.getToken();
      console.log('Auto-login successful, token obtained');
    } else {
      console.log('Auto-login failed');
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('Response interceptor triggered, error status:', error.response?.status);
    if (error.response?.status === 401 && !error.config._retry) {
      console.log('401 error detected, attempting re-authentication...');
      error.config._retry = true; // Prevent infinite loops
      
      // Try to re-authenticate
      auth.removeToken();
      const loginSuccess = await auth.autoLoginDemo();
      if (loginSuccess) {
        console.log('Re-authentication successful, retrying original request...');
        // Retry the original request
        const originalRequest = error.config;
        originalRequest.headers.Authorization = `Bearer ${auth.getToken()}`;
        return api.request(originalRequest);
      } else {
        console.log('Re-authentication failed');
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}

export const taskApi = {
  // Get all tasks
  getTasks: async (params?: {
    completed?: boolean;
    priority?: string;
    categoryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Task[]>> => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // Get single task
  getTask: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create task
  createTask: async (task: CreateTaskRequest): Promise<ApiResponse<Task>> => {
    const response = await api.post('/tasks', task);
    return response.data;
  },

  // Update task
  updateTask: async (id: string, task: UpdateTaskRequest): Promise<ApiResponse<Task>> => {
    const response = await api.put(`/tasks/${id}`, task);
    return response.data;
  },

  // Delete task
  deleteTask: async (id: string): Promise<ApiResponse<{ id: string }>> => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

export const categoryApi = {
  // Get all categories
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Get single category
  getCategory: async (id: string): Promise<ApiResponse<Category>> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Create category
  createCategory: async (category: CreateCategoryRequest): Promise<ApiResponse<Category>> => {
    const response = await api.post('/categories', category);
    return response.data;
  },

  // Update category
  updateCategory: async (id: string, category: UpdateCategoryRequest): Promise<ApiResponse<Category>> => {
    const response = await api.put(`/categories/${id}`, category);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: string, reassignTo?: string): Promise<ApiResponse<{ id: string }>> => {
    const params = reassignTo ? { reassignTo } : {};
    const response = await api.delete(`/categories/${id}`, { params });
    return response.data;
  },

  // Merge categories
  mergeCategories: async (sourceId: string, targetId: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/categories/${sourceId}/merge/${targetId}`);
    return response.data;
  },

  // Get category analytics
  getCategoryAnalytics: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/categories/${id}/analytics`);
    return response.data;
  },
};

export const routineApi = {
  // Get all routines
  getRoutines: async (params?: {
    isActive?: boolean;
    recurrenceType?: string;
    categoryId?: string;
    search?: string;
  }): Promise<ApiResponse<Routine[]>> => {
    const response = await api.get('/routines', { params });
    return response.data;
  },

  // Get single routine
  getRoutine: async (id: string): Promise<ApiResponse<Routine>> => {
    const response = await api.get(`/routines/${id}`);
    return response.data;
  },

  // Create routine
  createRoutine: async (routine: CreateRoutineRequest): Promise<ApiResponse<Routine>> => {
    const response = await api.post('/routines', routine);
    return response.data;
  },

  // Update routine
  updateRoutine: async (id: string, routine: UpdateRoutineRequest): Promise<ApiResponse<Routine>> => {
    const response = await api.put(`/routines/${id}`, routine);
    return response.data;
  },

  // Delete routine
  deleteRoutine: async (id: string): Promise<ApiResponse<{ id: string }>> => {
    const response = await api.delete(`/routines/${id}`);
    return response.data;
  },

  // Toggle routine active status
  toggleRoutineStatus: async (id: string, isActive: boolean): Promise<ApiResponse<Routine>> => {
    const response = await api.patch(`/routines/${id}/status`, { isActive });
    return response.data;
  },
};

export const scheduledTaskApi = {
  // Get all scheduled tasks (tasks with due dates)
  getScheduledTasks: async (params?: {
    completed?: boolean;
    priority?: string;
    categoryId?: string;
    search?: string;
    status?: string; // overdue, due-today, due-soon, future, completed
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<ScheduledTask[]>> => {
    // Add filter to only get tasks with due dates
    const queryParams = { ...params, hasDeadline: true };
    const response = await api.get('/tasks', { params: queryParams });
    return response.data;
  },

  // Get single scheduled task
  getScheduledTask: async (id: string): Promise<ApiResponse<ScheduledTask>> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create scheduled task
  createScheduledTask: async (task: CreateScheduledTaskRequest): Promise<ApiResponse<ScheduledTask>> => {
    const response = await api.post('/tasks', task);
    return response.data;
  },

  // Update scheduled task
  updateScheduledTask: async (id: string, task: UpdateScheduledTaskRequest): Promise<ApiResponse<ScheduledTask>> => {
    const response = await api.put(`/tasks/${id}`, task);
    return response.data;
  },

  // Delete scheduled task
  deleteScheduledTask: async (id: string): Promise<ApiResponse<{ id: string }>> => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Toggle task completion status
  toggleTaskComplete: async (id: string, completed: boolean): Promise<ApiResponse<ScheduledTask>> => {
    const response = await api.patch(`/tasks/${id}/complete`, { completed });
    return response.data;
  },
};

export const reportsApi = {
  // Get comprehensive reports data
  getReports: async (params?: {
    period?: 'today' | 'week' | 'month' | 'all';
    categoryId?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  // Get productivity trends
  getTrends: async (params?: {
    period?: string; // number of days
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/reports/trends', { params });
    return response.data;
  },
};

// Settings interfaces
interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh';
  timezone: string;
}

export const settingsApi = {
  // Get user settings
  getSettings: async (): Promise<ApiResponse<UserSettings>> => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Update user settings
  updateSettings: async (settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> => {
    const response = await api.put('/settings', settings);
    return response.data;
  },

  // Reset settings to defaults
  resetSettings: async (): Promise<ApiResponse<UserSettings>> => {
    const response = await api.post('/settings/reset');
    return response.data;
  },
};

export default api;