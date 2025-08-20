import React, { createContext, useContext, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

// Translation keys and values
export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    allTasks: 'All Tasks',
    routines: 'Routines',
    scheduledTasks: 'Scheduled Tasks',
    categories: 'Categories',
    reports: 'Reports',
    settings: 'Settings',
    
    // Dashboard
    welcomeBack: 'Welcome back!',
    todaysOverview: "Here's your task overview for today",
    todaysTodos: "Today's To-Do",
    dueWithinDays: 'Due within {days} days',
    overdueTasks: 'Overdue Tasks',
    quickActions: 'Quick Actions',
    addNewTask: 'Add New Task',
    
    // Tasks
    taskTitle: 'Task Title',
    description: 'Description',
    notes: 'Notes',
    category: 'Category',
    priority: 'Priority',
    dueDate: 'Due Date',
    dueTime: 'Due Time',
    startDate: 'Start Date',
    completed: 'Completed',
    pending: 'Pending',
    overdue: 'Overdue',
    
    // Priority levels
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
    
    // Actions
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    update: 'Update',
    reset: 'Reset',
    back: 'Back',
    loading: 'Loading...',
    
    // Settings
    theme: 'Theme',
    language: 'Language',
    timezone: 'Timezone',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    english: 'English',
    chinese: 'Chinese',
    saveChanges: 'Save Changes',
    resetToDefaults: 'Reset to Defaults',
    settingsSaved: 'Settings saved successfully!',
    currentSettings: 'Current Settings',
    
    // Messages
    noTasksFound: 'No tasks found',
    loadingTasks: 'Loading tasks...',
    errorLoadingTasks: 'Error loading tasks',
    taskCreated: 'Task created successfully!',
    taskUpdated: 'Task updated successfully!',
    taskDeleted: 'Task deleted successfully!',
  },
  zh: {
    // Navigation
    dashboard: '仪表板',
    allTasks: '所有任务',
    routines: '例行任务',
    scheduledTasks: '计划任务',
    categories: '分类',
    reports: '报告',
    settings: '设置',
    
    // Dashboard
    welcomeBack: '欢迎回来！',
    todaysOverview: '这是您今天的任务概览',
    todaysTodos: '今日待办',
    dueWithinDays: '{days}天内到期',
    overdueTasks: '逾期任务',
    quickActions: '快速操作',
    addNewTask: '添加新任务',
    
    // Tasks
    taskTitle: '任务标题',
    description: '描述',
    notes: '备注',
    category: '分类',
    priority: '优先级',
    dueDate: '截止日期',
    dueTime: '截止时间',
    startDate: '开始日期',
    completed: '已完成',
    pending: '待处理',
    overdue: '逾期',
    
    // Priority levels
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
    
    // Actions
    save: '保存',
    cancel: '取消',
    edit: '编辑',
    delete: '删除',
    create: '创建',
    update: '更新',
    reset: '重置',
    back: '返回',
    loading: '加载中...',
    
    // Settings
    theme: '主题',
    language: '语言',
    timezone: '时区',
    light: '浅色',
    dark: '深色',
    system: '系统',
    english: '英语',
    chinese: '中文',
    saveChanges: '保存更改',
    resetToDefaults: '重置为默认值',
    settingsSaved: '设置保存成功！',
    currentSettings: '当前设置',
    
    // Messages
    noTasksFound: '未找到任务',
    loadingTasks: '加载任务中...',
    errorLoadingTasks: '加载任务出错',
    taskCreated: '任务创建成功！',
    taskUpdated: '任务更新成功！',
    taskDeleted: '任务删除成功！',
  }
};

type TranslationKey = keyof typeof translations.en;
type Language = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { settings } = useSettings();
  
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const translation = translations[settings.language]?.[key] || translations.en[key] || key;
    
    // Handle parameter substitution
    if (params && typeof translation === 'string') {
      return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return translation;
  };

  const contextValue: LanguageContextType = {
    language: settings.language,
    t
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;