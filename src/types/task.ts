export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskDependency {
  id: number;
  title: string;
  status: TaskStatus | string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus | string;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
  sprintId: number;
  sprintName?: string;
  projectId: number;
  projectName?: string;
  responsibleId?: number | null;
  responsibleName?: string;
  assigneeId?: number | null;
  assigneeName?: string;
  dependencyTaskIds?: number[];
  dependencyTasks?: TaskDependency[];
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  status: TaskStatus | string;
  dueDate: string;
  sprintId: number;
  projectId: number;
  responsibleId?: number | null;
  responsibleName?: string;
  assigneeId?: number | null;
  assigneeName?: string;
  dependencyTaskIds?: number[];
}

export interface UpdateTaskPayload {
  title: string;
  description: string;
  status: TaskStatus | string;
  dueDate: string;
  sprintId: number;
  projectId: number;
  responsibleId?: number | null;
  responsibleName?: string;
  assigneeId?: number | null;
  assigneeName?: string;
  dependencyTaskIds?: number[];
}
