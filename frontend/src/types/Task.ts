export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  categoryId?: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  icon?: string;
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    routines: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
  description?: string;
  icon?: string;
  defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  description?: string;
  icon?: string;
  defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  categoryId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  completed?: boolean;
  dueDate?: string;
  categoryId?: string;
}

// Scheduled Task types (extends regular Task)
export interface ScheduledTask extends Task {
  dueDate: string; // Required for scheduled tasks
  dueTime?: string; // Optional time component
  startDate?: string; // Optional start date
}

export interface CreateScheduledTaskRequest {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  dueTime?: string;
  startDate?: string;
  categoryId?: string;
}

export interface UpdateScheduledTaskRequest {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  completed?: boolean;
  dueDate?: string;
  dueTime?: string;
  startDate?: string;
  categoryId?: string;
}

export type TaskStatus = 'overdue' | 'due-today' | 'due-soon' | 'future' | 'completed';

// Routine-related types
export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface RoutineSchedule {
  recurrenceType: RecurrenceType;
  interval?: number; // For CUSTOM: every X days
  daysOfWeek?: string[]; // For WEEKLY: ['MON', 'WED', 'FRI']
  dayOfMonth?: number; // For MONTHLY: 1-31
  time?: string; // Optional time "09:30"
}

export interface Routine {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  category?: Category;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  schedule: RoutineSchedule;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateRoutineRequest {
  title: string;
  description?: string;
  categoryId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  schedule: RoutineSchedule;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface UpdateRoutineRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  schedule?: RoutineSchedule;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}