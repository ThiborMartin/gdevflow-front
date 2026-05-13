import { ProjectStatus, UserSummary } from './project';

export interface ClientProject {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  status: ProjectStatus;
  owner: UserSummary;
  progressPercentage: number;
  totalSprints: number;
  totalTasks: number;
  doneTasks: number;
}
