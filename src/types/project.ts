import { UserRole } from './auth';

export type ProjectStatus =
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT_APPROVAL'
  | 'COMPLETED';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  completedAt?: string | null;
  status: ProjectStatus;
  owner: UserSummary;
  client: UserSummary | null;
}

export interface Sprint {
  id: number;
  projectId?: number;
  projectName?: string;
  name: string;
  description?: string;
  descricao?: string;
  descricaoSprint?: string;
  sprintDescription?: string;
  startDate: string;
  endDate: string;
  status: string;
  progressPercentage?: number;
  totalTasks?: number;
  completedTasks?: number;
  inProgressTasks?: number;
  pendingTasks?: number;
  blockedTasks?: number;
}

export interface ProjectPayload {
  name: string;
  description: string;
}

export interface SprintPayload {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
}
