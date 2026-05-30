import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_STORAGE_KEY } from './api';
import { UserRole } from '../types/auth';

export const USER_ROLE_STORAGE_KEY = '@gdevflow:user-role';

function normalizeRole(value?: string | null): UserRole {
  const normalizedValue = value?.trim().toUpperCase();

  if (normalizedValue === 'FREELANCER' || normalizedValue === 'CLIENT') {
    return normalizedValue;
  }

  if (normalizedValue === 'ROLE_FREELANCER') {
    return 'FREELANCER';
  }

  if (normalizedValue === 'ROLE_CLIENT') {
    return 'CLIENT';
  }

  return 'UNKNOWN';
}

function decodeBase64Url(value: string) {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalizedValue.length % 4 || 4)) % 4);
  const base64Value = `${normalizedValue}${padding}`;

  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(base64Value);
  }

  const bufferApi = (globalThis as any).Buffer;

  if (bufferApi) {
    return bufferApi.from(base64Value, 'base64').toString('utf-8');
  }

  throw new Error('Não foi possível decodificar o token.');
}

function readRoleCandidate(source: any): UserRole {
  if (!source) {
    return 'UNKNOWN';
  }

  if (Array.isArray(source)) {
    for (const item of source) {
      const role = readRoleCandidate(item);

      if (role !== 'UNKNOWN') {
        return role;
      }
    }
  }

  if (typeof source === 'string') {
    return normalizeRole(source);
  }

  if (typeof source === 'object') {
    const directCandidates = [
      source.role,
      source.userRole,
      source.authority,
      source.name,
    ];

    for (const candidate of directCandidates) {
      const role = normalizeRole(candidate);

      if (role !== 'UNKNOWN') {
        return role;
      }
    }

    const nestedCandidates = [source.roles, source.authorities, source.user];

    for (const candidate of nestedCandidates) {
      const role = readRoleCandidate(candidate);

      if (role !== 'UNKNOWN') {
        return role;
      }
    }

    return 'UNKNOWN';
  }

  return 'UNKNOWN';
}

function extractRoleFromToken(token?: string | null): UserRole {
  if (!token) {
    return 'UNKNOWN';
  }

  try {
    const [, payload] = token.split('.');

    if (!payload) {
      return 'UNKNOWN';
    }

    const parsedPayload = JSON.parse(decodeBase64Url(payload));
    return readRoleCandidate(parsedPayload);
  } catch {
    return 'UNKNOWN';
  }
}

export async function persistSession(data: any) {
  const token = data?.token;

  if (!token) {
    throw new Error('Resposta de autenticação sem token.');
  }

  const roleFromResponse = readRoleCandidate(data);
  const role = roleFromResponse !== 'UNKNOWN' ? roleFromResponse : extractRoleFromToken(token);

  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);

  if (role !== 'UNKNOWN') {
    await AsyncStorage.setItem(USER_ROLE_STORAGE_KEY, role);
  } else {
    await AsyncStorage.removeItem(USER_ROLE_STORAGE_KEY);
  }
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_ROLE_STORAGE_KEY]);
}

export async function getStoredUserRole(): Promise<UserRole> {
  const storedRole = normalizeRole(await AsyncStorage.getItem(USER_ROLE_STORAGE_KEY));

  if (storedRole !== 'UNKNOWN') {
    return storedRole;
  }

  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  const tokenRole = extractRoleFromToken(token);

  if (tokenRole !== 'UNKNOWN') {
    await AsyncStorage.setItem(USER_ROLE_STORAGE_KEY, tokenRole);
  }

  return tokenRole;
}
