import { api } from "./api";
import { Project, ProjectPayload, Sprint, SprintPayload } from "../types/project";

function normalizeProject(project: Project): Project {
  const rawProject = project as Project & {
    closed?: boolean;
    owner?: { id?: number; name?: string; email?: string };
    client?: { id?: number; name?: string; email?: string };
  };

  const status =
    project.status ||
    (rawProject.closed ? "CLOSED" : "ACTIVE");

  return {
    ...project,
    description: project.description || "",
    status,
    closed: rawProject.closed ?? status === "CLOSED",
    ownerId: project.ownerId ?? rawProject.owner?.id ?? null,
    ownerName: project.ownerName ?? rawProject.owner?.name ?? null,
    ownerEmail: project.ownerEmail ?? rawProject.owner?.email ?? null,
    clientId: project.clientId ?? rawProject.client?.id ?? null,
    clientName: project.clientName ?? rawProject.client?.name ?? null,
    clientEmail: project.clientEmail ?? rawProject.client?.email ?? null,
  };
}

function normalizeSprint(sprint: Sprint): Sprint {
  const rawSprint = sprint as Sprint & {
    descricaoSprint?: string;
    sprintDescription?: string;
    project?: { id?: number; name?: string };
  };

  return {
    ...sprint,
    description:
      sprint.description ||
      sprint.descricao ||
      rawSprint.descricaoSprint ||
      rawSprint.sprintDescription ||
      "",
    projectId: sprint.projectId ?? rawSprint.project?.id,
    projectName: sprint.projectName ?? rawSprint.project?.name,
  };
}

export async function getProjects() {
  const response = await api.get<Project[]>("/projects");
  return response.data.map(normalizeProject);
}

export async function getProjectById(id: number) {
  const response = await api.get<Project>(`/projects/${id}`);
  return normalizeProject(response.data);
}

export async function createProject(payload: ProjectPayload) {
  const response = await api.post<Project>("/projects", payload);
  return normalizeProject(response.data);
}

export async function updateProject(id: number, payload: ProjectPayload) {
  const response = await api.put<Project>(`/projects/${id}`, payload);
  return normalizeProject(response.data);
}

export async function assignClientToProject(projectId: number, clientId: number) {
  const response = await api.patch<Project>(`/projects/${projectId}/client`, {
    clientId,
  });

  return normalizeProject(response.data);
}

export async function closeProject(id: number) {
  await api.patch(`/projects/${id}/close`);
}

export async function getProjectSprints(projectId: number) {
  const response = await api.get<Sprint[]>(`/projects/${projectId}/sprints`);
  const sprints = response.data.map(normalizeSprint);

  const enrichedSprints = await Promise.all(
    sprints.map(async (sprint) => {
      if (sprint.description) {
        return sprint;
      }

      try {
        const details = await getSprintById(sprint.id);
        return {
          ...sprint,
          ...details,
          description: details.description || sprint.description || "",
        };
      } catch {
        return sprint;
      }
    })
  );

  return enrichedSprints;
}

export async function getSprintById(id: number) {
  const response = await api.get<Sprint>(`/sprints/${id}`);
  return normalizeSprint(response.data);
}

export async function createSprint(projectId: number, payload: SprintPayload) {
  const response = await api.post<Sprint>(`/projects/${projectId}/sprints`, payload);
  return response.data;
}

export async function updateSprint(id: number, payload: SprintPayload) {
  const response = await api.put<Sprint>(`/sprints/${id}`, payload);
  return response.data;
}
