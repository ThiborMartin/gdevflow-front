export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  status?: string;
  closed?: boolean;
  ownerId?: number | null;
  ownerName?: string | null;
  clientId?: number | null;
  clientName?: string | null;
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
  clientId?: number | null;
}

export interface SprintPayload {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
}
