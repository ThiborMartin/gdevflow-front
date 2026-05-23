import { api } from './api';
import { ProjectMessage } from '../types/chat';

function toNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeRole(value: unknown) {
  if (value === 'FREELANCER' || value === 'CLIENT') {
    return value;
  }

  return 'UNKNOWN';
}

function normalizeProjectMessage(message: any): ProjectMessage {
  return {
    id: toNumber(message?.id),
    content: normalizeText(message?.content),
    createdAt: message?.createdAt,
    projectId: toNumber(message?.projectId),
    senderId: toNumber(message?.senderId),
    senderName: normalizeText(message?.senderName),
    senderRole: normalizeRole(message?.senderRole),
  };
}

export async function getProjectMessages(projectId: number) {
  const response = await api.get<ProjectMessage[]>(`/projects/${projectId}/messages`);
  return response.data.map(normalizeProjectMessage);
}

export async function sendProjectMessage(projectId: number, content: string) {
  const response = await api.post<ProjectMessage>(`/projects/${projectId}/messages`, {
    content: content.trim(),
  });

  return normalizeProjectMessage(response.data);
}
