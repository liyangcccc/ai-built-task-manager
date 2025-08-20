import { TaskStatus } from '../types/Task';

export const getTaskStatus = (dueDate: string, completed: boolean): TaskStatus => {
  if (completed) return 'completed';
  
  // Use date strings for comparison to avoid timezone issues
  const today = new Date().toISOString().split('T')[0];
  const due = dueDate.split('T')[0];
  
  if (due < today) return 'overdue';
  if (due === today) return 'due-today';
  
  // Calculate days difference for future tasks
  const todayDate = new Date(today + 'T00:00:00.000Z');
  const dueDate_ = new Date(due + 'T00:00:00.000Z');
  const diffTime = dueDate_.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 3) return 'due-soon';
  return 'future';
};

export const getTaskStatusText = (dueDate: string, completed: boolean): string => {
  if (completed) return 'Completed';
  
  // Use date strings for comparison to avoid timezone issues
  const today = new Date().toISOString().split('T')[0];
  const due = dueDate.split('T')[0];
  
  if (due < today) {
    const todayDate = new Date(today + 'T00:00:00.000Z');
    const dueDate_ = new Date(due + 'T00:00:00.000Z');
    const diffTime = todayDate.getTime() - dueDate_.getTime();
    const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`;
  }
  if (due === today) return 'Due today';
  
  // Calculate days difference for future tasks
  const todayDate = new Date(today + 'T00:00:00.000Z');
  const dueDate_ = new Date(due + 'T00:00:00.000Z');
  const diffTime = dueDate_.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  if (diffDays <= 30) return `Due in ${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''}`;
  return `Due in ${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) > 1 ? 's' : ''}`;
};

export const getTaskStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'overdue':
      return 'text-red-700 bg-red-100 border-red-200';
    case 'due-today':
      return 'text-orange-700 bg-orange-100 border-orange-200';
    case 'due-soon':
      return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    case 'future':
      return 'text-green-700 bg-green-100 border-green-200';
    case 'completed':
      return 'text-gray-700 bg-gray-100 border-gray-200';
    default:
      return 'text-gray-700 bg-gray-100 border-gray-200';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'URGENT':
      return 'text-red-700 bg-red-100 border-red-200';
    case 'HIGH':
      return 'text-orange-700 bg-orange-100 border-orange-200';
    case 'MEDIUM':
      return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    case 'LOW':
      return 'text-green-700 bg-green-100 border-green-200';
    default:
      return 'text-gray-700 bg-gray-100 border-gray-200';
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const sortTasksByDueDate = (tasks: any[], ascending: boolean = true) => {
  return [...tasks].sort((a, b) => {
    // Put completed tasks at the end
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    
    // Sort by due date
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    
    return ascending ? dateA - dateB : dateB - dateA;
  });
};