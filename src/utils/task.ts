import { Task, TaskDependency, TaskStatus } from '../types/task';

export type TaskFilterValue = 'ALL' | TaskStatus;
export type TaskStatusOption = { label: string; value: TaskStatus };

export const TASK_FILTERS: { label: string; value: TaskFilterValue }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'A fazer', value: 'TODO' },
  { label: 'Em andamento', value: 'IN_PROGRESS' },
  { label: 'Concluídas', value: 'DONE' },
  { label: 'Bloqueadas', value: 'BLOCKED' },
];

export const TASK_STATUS_OPTIONS: TaskStatusOption[] = [
  { label: 'A fazer', value: 'TODO' },
  { label: 'Em andamento', value: 'IN_PROGRESS' },
  { label: 'Concluída', value: 'DONE' },
  { label: 'Bloqueada', value: 'BLOCKED' },
];

const taskStatusAliases: Record<string, TaskStatus> = {
  TODO: 'TODO',
  TO_DO: 'TODO',
  PENDING: 'TODO',
  OPEN: 'TODO',
  A_FAZER: 'TODO',
  AFAZER: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  EM_ANDAMENTO: 'IN_PROGRESS',
  DOING: 'IN_PROGRESS',
  WIP: 'IN_PROGRESS',
  DONE: 'DONE',
  COMPLETED: 'DONE',
  COMPLETE: 'DONE',
  CONCLUIDA: 'DONE',
  CONCLUIDO: 'DONE',
  FINISHED: 'DONE',
  BLOCKED: 'BLOCKED',
  BLOQUEADA: 'BLOCKED',
  BLOQUEADO: 'BLOCKED',
};

export function normalizeTaskStatus(value?: string | null): TaskStatus {
  const normalizedValue = value?.trim().toUpperCase() || 'TODO';
  return taskStatusAliases[normalizedValue] || 'TODO';
}

export function filterTasksByStatus(tasks: Task[], status: TaskFilterValue) {
  if (status === 'ALL') {
    return tasks;
  }

  return tasks.filter((task) => normalizeTaskStatus(task.status) === status);
}

export function getTaskSummary(tasks: Pick<Task, 'status'>[]) {
  return tasks.reduce(
    (summary, task) => {
      const normalizedStatus = normalizeTaskStatus(task.status);

      summary.total += 1;

      if (normalizedStatus === 'DONE') {
        summary.completed += 1;
      } else if (normalizedStatus === 'IN_PROGRESS') {
        summary.inProgress += 1;
      } else if (normalizedStatus === 'BLOCKED') {
        summary.blocked += 1;
      } else {
        summary.pending += 1;
      }

      return summary;
    },
    {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      blocked: 0,
    }
  );
}

export function getTaskCompletionPercentage(tasks: Pick<Task, 'status'>[]) {
  if (tasks.length === 0) {
    return 0;
  }

  const summary = getTaskSummary(tasks);
  return Math.round((summary.completed / summary.total) * 100);
}

export function resolveTaskDependencies(task: Task, allTasks: Task[]): TaskDependency[] {
  const tasksById = new Map(allTasks.map((item) => [item.id, item]));
  const dependencyIds = task.dependencyTaskIds || [];
  const dependencyTasks = task.dependencyTasks || [];

  return dependencyIds.reduce<TaskDependency[]>((dependencies, dependencyId) => {
      const fullTask = tasksById.get(dependencyId);

      if (fullTask) {
        dependencies.push({
          id: fullTask.id,
          title: fullTask.title,
          status: normalizeTaskStatus(fullTask.status),
        });
        return dependencies;
      }

      const fallbackTask = dependencyTasks.find((dependency) => dependency.id === dependencyId);

      if (fallbackTask) {
        dependencies.push({
          id: fallbackTask.id,
          title: fallbackTask.title,
          status: normalizeTaskStatus(fallbackTask.status),
        });
        return dependencies;
      }

      return dependencies;
    }, []);
}

export function getIncompleteTaskDependencies(task: Task, allTasks: Task[]) {
  return resolveTaskDependencies(task, allTasks).filter(
    (dependency) => normalizeTaskStatus(dependency.status) !== 'DONE'
  );
}

export function canTaskBeCompleted(task: Task, allTasks: Task[]) {
  return getIncompleteTaskDependencies(task, allTasks).length === 0;
}
