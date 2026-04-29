import { api } from './api';
import { ProjectProgress, SprintProgress } from '../types/progress';
import { CreateTaskPayload, Task, TaskStatus, UpdateTaskPayload } from '../types/task';
import { normalizeTaskStatus } from '../utils/task';

function toNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function sanitizeTaskPayload(payload: CreateTaskPayload | UpdateTaskPayload) {
  const normalizedStatus = normalizeTaskStatus(payload.status);
  const requestPayload: Record<string, unknown> = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    status: normalizedStatus,
    sprintId: payload.sprintId,
    projectId: payload.projectId,
  };

  const responsibleId = payload.responsibleId ?? payload.assigneeId;
  const responsibleName = payload.responsibleName || payload.assigneeName;

  if (responsibleId != null) {
    requestPayload.responsibleId = responsibleId;
    requestPayload.assigneeId = responsibleId;
  }

  if (responsibleName?.trim()) {
    requestPayload.responsibleName = responsibleName.trim();
    requestPayload.assigneeName = responsibleName.trim();
  }

  return requestPayload;
}

function normalizeTask(task: any): Task {
  const normalizedStatus = normalizeTaskStatus(task?.status);
  const rawProject = task?.project || {};
  const rawSprint = task?.sprint || {};
  const rawResponsible = task?.responsible || task?.assignee || {};

  return {
    id: toNumber(task?.id),
    title: normalizeText(task?.title || task?.name),
    description: normalizeText(task?.description || task?.details),
    status: normalizedStatus,
    createdAt: task?.createdAt || task?.creationDate,
    updatedAt: task?.updatedAt || task?.lastUpdatedAt,
    sprintId: toNumber(task?.sprintId ?? rawSprint?.id),
    sprintName: task?.sprintName || rawSprint?.name,
    projectId: toNumber(task?.projectId ?? rawProject?.id),
    projectName: task?.projectName || rawProject?.name,
    responsibleId: toNumber(
      task?.responsibleId ?? task?.assigneeId ?? rawResponsible?.id,
      0
    ) || null,
    responsibleName:
      task?.responsibleName ||
      task?.assigneeName ||
      rawResponsible?.name ||
      rawResponsible?.fullName,
    assigneeId: toNumber(task?.assigneeId ?? rawResponsible?.id, 0) || null,
    assigneeName:
      task?.assigneeName ||
      task?.responsibleName ||
      rawResponsible?.name ||
      rawResponsible?.fullName,
  };
}

function normalizeSprintProgress(progress: any): SprintProgress {
  return {
    id: toNumber(progress?.id ?? progress?.sprintId),
    name: normalizeText(progress?.name || progress?.sprintName),
    description: normalizeText(progress?.description || progress?.sprintDescription),
    status: progress?.status,
    startDate: progress?.startDate,
    endDate: progress?.endDate,
    progressPercentage: toNumber(
      progress?.progressPercentage ??
        progress?.completionPercentage ??
        progress?.progress ??
        progress?.percentage
    ),
    totalTasks: toNumber(progress?.totalTasks ?? progress?.tasksTotal),
    completedTasks: toNumber(
      progress?.completedTasks ?? progress?.doneTasks ?? progress?.tasksCompleted
    ),
    inProgressTasks: toNumber(
      progress?.inProgressTasks ??
        progress?.doingTasks ??
        progress?.tasksInProgress
    ),
    pendingTasks: toNumber(
      progress?.pendingTasks ?? progress?.todoTasks ?? progress?.tasksPending
    ),
    blockedTasks: toNumber(
      progress?.blockedTasks ?? progress?.tasksBlocked ?? progress?.impededTasks
    ),
  };
}

function normalizeProjectProgress(progress: any): ProjectProgress {
  const sprintList = Array.isArray(progress?.sprints)
    ? progress.sprints
    : Array.isArray(progress?.items)
      ? progress.items
      : [];

  const sprints = sprintList.map(normalizeSprintProgress);

  return {
    projectId: toNumber(progress?.projectId ?? progress?.id),
    projectName: normalizeText(progress?.projectName || progress?.name),
    completionPercentage: toNumber(
      progress?.completionPercentage ??
        progress?.progressPercentage ??
        progress?.progress ??
        progress?.percentage
    ),
    totalSprints: toNumber(progress?.totalSprints ?? sprints.length),
    totalTasks: toNumber(progress?.totalTasks ?? progress?.tasksTotal),
    completedTasks: toNumber(
      progress?.completedTasks ?? progress?.doneTasks ?? progress?.tasksCompleted
    ),
    inProgressTasks: toNumber(
      progress?.inProgressTasks ??
        progress?.doingTasks ??
        progress?.tasksInProgress
    ),
    pendingTasks: toNumber(
      progress?.pendingTasks ?? progress?.todoTasks ?? progress?.tasksPending
    ),
    blockedTasks: toNumber(
      progress?.blockedTasks ?? progress?.tasksBlocked ?? progress?.impededTasks
    ),
    sprints,
  };
}

async function resolveTaskResponse(taskId: number, responseData: any) {
  if (responseData && typeof responseData === 'object' && Object.keys(responseData).length > 0) {
    return normalizeTask(responseData);
  }

  return getTaskById(taskId);
}

export async function createTask(
  projectId: number,
  sprintId: number,
  payload: CreateTaskPayload
) {
  const response = await api.post<Task>(
    `/projects/${projectId}/sprints/${sprintId}/tasks`,
    sanitizeTaskPayload(payload)
  );

  return normalizeTask(response.data);
}

export async function getSprintTasks(projectId: number, sprintId: number) {
  const response = await api.get<Task[] | { tasks?: Task[]; content?: Task[] }>(
    `/projects/${projectId}/sprints/${sprintId}/tasks`
  );

  const responseData = response.data;
  const tasks = Array.isArray(responseData)
    ? responseData
    : responseData.tasks || responseData.content || [];

  return tasks.map(normalizeTask);
}

export async function getTaskById(taskId: number) {
  const response = await api.get<Task>(`/tasks/${taskId}`);
  return normalizeTask(response.data);
}

export async function updateTask(taskId: number, payload: UpdateTaskPayload) {
  const response = await api.put<Task>(`/tasks/${taskId}`, sanitizeTaskPayload(payload));
  return normalizeTask(response.data);
}

export async function updateTaskStatus(taskId: number, status: TaskStatus | string) {
  const response = await api.patch(
    `/tasks/${taskId}/status`,
    { status: normalizeTaskStatus(status) }
  );

  return resolveTaskResponse(taskId, response.data);
}

export async function completeTask(taskId: number) {
  const response = await api.patch(`/tasks/${taskId}/complete`);
  return resolveTaskResponse(taskId, response.data);
}

export async function getProjectProgress(projectId: number) {
  const response = await api.get<ProjectProgress>(`/projects/${projectId}/progress`);
  return normalizeProjectProgress(response.data);
}
