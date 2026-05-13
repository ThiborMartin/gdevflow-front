import { api } from './api';
import { ClientProject } from '../types/client-project';

function toNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeClientProject(project: ClientProject): ClientProject {
  return {
    ...project,
    description: project.description || '',
    progressPercentage: toNumber(project.progressPercentage),
    totalSprints: toNumber(project.totalSprints),
    totalTasks: toNumber(project.totalTasks),
    doneTasks: toNumber(project.doneTasks),
  };
}

export async function getClientProjects() {
  const response = await api.get<ClientProject[]>('/projects/client');
  return response.data.map(normalizeClientProject);
}
