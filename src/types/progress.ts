export interface SprintProgress {
  id: number;
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  blockedTasks: number;
}

export interface ProjectProgress {
  projectId: number;
  projectName: string;
  completionPercentage: number;
  totalSprints: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  sprints: SprintProgress[];
}
