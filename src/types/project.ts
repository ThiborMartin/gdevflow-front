export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  status?: string;
}

export interface Sprint {
  id: number;
  projectId?: number;
  name: string;
  description?: string;
  descricao?: string;
  descricaoSprint?: string;
  sprintDescription?: string;
  startDate: string;
  endDate: string;
  status: string;
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
