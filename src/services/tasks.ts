import { api } from './api';
import { ProjectProgress, SprintProgress, TaskProgress } from '../types/progress';
import {
  CreateTaskPayload,
  Task,
  TaskDependency,
  TaskStatus,
  UpdateTaskPayload,
} from '../types/task';
import {
  getTaskMetadata,
  getTaskMetadataMap,
  saveTaskMetadata,
  TaskLocalMetadata,
} from './task-metadata';
import { normalizeTaskStatus } from '../utils/task';

function toNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function countTaskStatuses(tasks: TaskProgress[]) {
  return tasks.reduce(
    (summary, task) => {
      const status = normalizeTaskStatus(task.status);

      if (status === 'DONE') {
        summary.done += 1;
      } else if (status === 'IN_PROGRESS') {
        summary.inProgress += 1;
      } else if (status === 'BLOCKED') {
        summary.blocked += 1;
      } else {
        summary.todo += 1;
      }

      return summary;
    },
    { todo: 0, done: 0, inProgress: 0, blocked: 0 }
  );
}

function parseDependencyIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const dependencyIds = value
    .map((dependency) => {
      if (typeof dependency === 'number' || typeof dependency === 'string') {
        return Number(dependency);
      }

      if (dependency && typeof dependency === 'object') {
        return Number(
          (dependency as { id?: number | string; taskId?: number | string }).id ??
            (dependency as { id?: number | string; taskId?: number | string }).taskId
        );
      }

      return NaN;
    })
    .filter((dependencyId) => Number.isFinite(dependencyId) && dependencyId > 0);

  return Array.from(new Set(dependencyIds));
}

function parseDependencyTasks(value: unknown): TaskDependency[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<TaskDependency[]>((dependencies, dependency) => {
      if (!dependency || typeof dependency !== 'object') {
        return dependencies;
      }

      const dependencyId = Number(
        (dependency as { id?: number | string; taskId?: number | string }).id ??
          (dependency as { id?: number | string; taskId?: number | string }).taskId
      );

      if (!Number.isFinite(dependencyId) || dependencyId <= 0) {
        return dependencies;
      }

      dependencies.push({
        id: dependencyId,
        title: normalizeText(
          (dependency as { title?: string; name?: string }).title ??
            (dependency as { title?: string; name?: string }).name
        ),
        status: normalizeTaskStatus(
          (dependency as { status?: string }).status
        ),
      });

      return dependencies;
    }, []);
}

function sanitizeTaskPayload(payload: CreateTaskPayload | UpdateTaskPayload) {
  const normalizedStatus = normalizeTaskStatus(payload.status);
  const dependencyTaskIds = parseDependencyIds(payload.dependencyTaskIds || []);
  const requestPayload: Record<string, unknown> = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    status: normalizedStatus,
    dueDate: payload.dueDate,
    deadline: payload.dueDate,
    limitDate: payload.dueDate,
    sprintId: payload.sprintId,
    projectId: payload.projectId,
    dependencyTaskIds,
    dependencyIds: dependencyTaskIds,
    dependsOnTaskIds: dependencyTaskIds,
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

function normalizeTask(task: any, metadata?: TaskLocalMetadata): Task {
  const normalizedStatus = normalizeTaskStatus(task?.status);
  const rawProject = task?.project || {};
  const rawSprint = task?.sprint || {};
  const rawResponsible = task?.responsible || task?.assignee || {};
  const apiDependencyTasks = parseDependencyTasks(
    task?.dependencies || task?.dependencyTasks || task?.dependsOn || task?.blockedByTasks
  );
  const apiDependencyIds = parseDependencyIds(
    task?.dependencyTaskIds ||
      task?.dependencyIds ||
      task?.dependsOnTaskIds ||
      task?.dependencies ||
      task?.dependencyTasks ||
      task?.dependsOn
  );
  const effectiveDependencyIds =
    apiDependencyIds.length > 0 ? apiDependencyIds : metadata?.dependencyTaskIds || [];
  const effectiveDueDate =
    task?.dueDate || task?.deadline || task?.limitDate || metadata?.dueDate;

  return {
    id: toNumber(task?.id),
    title: normalizeText(task?.title || task?.name),
    description: normalizeText(task?.description || task?.details),
    status: normalizedStatus,
    createdAt: task?.createdAt || task?.creationDate,
    updatedAt: task?.updatedAt || task?.lastUpdatedAt,
    dueDate: effectiveDueDate,
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
    dependencyTaskIds: effectiveDependencyIds,
    dependencyTasks: apiDependencyTasks.length > 0 ? apiDependencyTasks : undefined,
  };
}

function normalizeTaskProgress(task: any): TaskProgress {
  return {
    id: toNumber(task?.id ?? task?.taskId),
    title: normalizeText(task?.title || task?.name),
    description: normalizeText(task?.description || task?.details),
    status: normalizeTaskStatus(task?.status),
    dueDate: task?.dueDate || task?.deadline || task?.limitDate,
  };
}

function normalizeSprintProgress(progress: any): SprintProgress {
  const tasks = Array.isArray(progress?.tasks)
    ? progress.tasks.map(normalizeTaskProgress)
    : [];
  const taskSummary = countTaskStatuses(tasks);
  const totalTasks = toNumber(progress?.totalTasks ?? progress?.tasksTotal, tasks.length);
  const doneTasks = toNumber(
    progress?.doneTasks ?? progress?.completedTasks ?? progress?.tasksCompleted,
    taskSummary.done
  );

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
    totalTasks,
    doneTasks,
    completedTasks: doneTasks,
    inProgressTasks: toNumber(
      progress?.inProgressTasks ??
        progress?.doingTasks ??
        progress?.tasksInProgress,
      taskSummary.inProgress
    ),
    pendingTasks: toNumber(
      progress?.pendingTasks ?? progress?.todoTasks ?? progress?.tasksPending,
      taskSummary.todo
    ),
    blockedTasks: toNumber(
      progress?.blockedTasks ?? progress?.tasksBlocked ?? progress?.impededTasks,
      taskSummary.blocked
    ),
    tasks,
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
    projectDescription: normalizeText(
      progress?.projectDescription || progress?.description
    ),
    projectStatus: progress?.projectStatus || progress?.status || 'IN_PROGRESS',
    freelancer: progress?.freelancer || progress?.owner || null,
    progressPercentage: toNumber(
      progress?.progressPercentage ??
        progress?.completionPercentage ??
        progress?.progress ??
        progress?.percentage
    ),
    completionPercentage: toNumber(
      progress?.completionPercentage ??
        progress?.progressPercentage ??
        progress?.progress ??
        progress?.percentage
    ),
    totalSprints: toNumber(progress?.totalSprints ?? sprints.length),
    totalTasks: toNumber(progress?.totalTasks ?? progress?.tasksTotal),
    todoTasks: toNumber(
      progress?.todoTasks ?? progress?.pendingTasks ?? progress?.tasksPending
    ),
    doneTasks: toNumber(
      progress?.doneTasks ?? progress?.completedTasks ?? progress?.tasksCompleted
    ),
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
  const metadata = await getTaskMetadata(taskId);

  if (responseData && typeof responseData === 'object' && Object.keys(responseData).length > 0) {
    return normalizeTask(responseData, metadata);
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

  const normalizedTask = normalizeTask(response.data, {
    dueDate: payload.dueDate,
    dependencyTaskIds: payload.dependencyTaskIds,
  });

  await saveTaskMetadata(normalizedTask.id, {
    dueDate: payload.dueDate,
    dependencyTaskIds: payload.dependencyTaskIds,
  });

  return normalizedTask;
}

export async function getSprintTasks(projectId: number, sprintId: number) {
  const response = await api.get<Task[] | { tasks?: Task[]; content?: Task[] }>(
    `/projects/${projectId}/sprints/${sprintId}/tasks`
  );
  const metadataMap = await getTaskMetadataMap();

  const responseData = response.data;
  const tasks = Array.isArray(responseData)
    ? responseData
    : responseData.tasks || responseData.content || [];

  return tasks.map((task) =>
    normalizeTask(task, metadataMap[String(toNumber((task as { id?: number }).id))])
  );
}

export async function getTaskById(taskId: number) {
  const response = await api.get<Task>(`/tasks/${taskId}`);
  const metadata = await getTaskMetadata(taskId);
  return normalizeTask(response.data, metadata);
}

export async function updateTask(taskId: number, payload: UpdateTaskPayload) {
  const response = await api.put<Task>(`/tasks/${taskId}`, sanitizeTaskPayload(payload));
  const normalizedTask = normalizeTask(response.data, {
    dueDate: payload.dueDate,
    dependencyTaskIds: payload.dependencyTaskIds,
  });

  await saveTaskMetadata(taskId, {
    dueDate: payload.dueDate,
    dependencyTaskIds: payload.dependencyTaskIds,
  });

  return normalizedTask;
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
