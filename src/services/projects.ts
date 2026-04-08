import { api } from "./api";
import { Project, ProjectPayload, Sprint, SprintPayload } from "../types/project";

export async function getProjects() {
  const response = await api.get<Project[]>("/projects");
  return response.data;
}

export async function getProjectById(id: number) {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
}

export async function createProject(payload: ProjectPayload) {
  const response = await api.post<Project>("/projects", payload);
  return response.data;
}

export async function updateProject(id: number, payload: ProjectPayload) {
  const response = await api.put<Project>(`/projects/${id}`, payload);
  return response.data;
}

export async function closeProject(id: number) {
  await api.patch(`/projects/${id}/close`);
}

export async function getProjectSprints(projectId: number) {
  const response = await api.get<Sprint[]>(`/projects/${projectId}/sprints`);
  return response.data;
}

export async function getSprintById(id: number) {
  const response = await api.get<Sprint>(`/sprints/${id}`);
  return response.data;
}

export async function createSprint(projectId: number, payload: SprintPayload) {
  const response = await api.post<Sprint>(`/projects/${projectId}/sprints`, payload);
  return response.data;
}

export async function updateSprint(id: number, payload: SprintPayload) {
  const response = await api.put<Sprint>(`/sprints/${id}`, payload);
  return response.data;
}
