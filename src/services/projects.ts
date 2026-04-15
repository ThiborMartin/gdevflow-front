import { api } from "./api";
import { Project, ProjectPayload, Sprint, SprintPayload } from "../types/project";

function normalizeSprint(sprint: Sprint): Sprint {
  const rawSprint = sprint as Sprint & {
    descricaoSprint?: string;
    sprintDescription?: string;
  };

  return {
    ...sprint,
    description:
      sprint.description ||
      sprint.descricao ||
      rawSprint.descricaoSprint ||
      rawSprint.sprintDescription ||
      "",
  };
}

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
