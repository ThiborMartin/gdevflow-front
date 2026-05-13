import { ProjectStatus, UserSummary } from './project';
import { TaskStatus } from './task';

export interface TaskProgress {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus | string;
  dueDate?: string;
}

export interface SprintProgress {
  id: number;
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  progressPercentage: number;
  totalTasks: number;
  doneTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  tasks: TaskProgress[];
}

export interface ProjectProgress {
  projectId: number;
  projectName: string;
  projectDescription: string;
  projectStatus: ProjectStatus;
  freelancer: UserSummary | null;
  progressPercentage: number;
  completionPercentage: number;
  totalSprints: number;
  totalTasks: number;
  todoTasks: number;
  doneTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  sprints: SprintProgress[];
}
