import { api } from './api';
import { ClientSearchResult } from '../types/client';

export async function searchClientsByEmail(email: string) {
  const response = await api.get<ClientSearchResult[]>('/clients/search', {
    params: {
      email: email.trim(),
    },
  });

  return response.data;
}
