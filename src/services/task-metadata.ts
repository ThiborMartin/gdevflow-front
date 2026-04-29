import AsyncStorage from '@react-native-async-storage/async-storage';

export const TASK_METADATA_STORAGE_KEY = '@gdevflow:task-metadata';

export interface TaskLocalMetadata {
  dueDate?: string;
  dependencyTaskIds?: number[];
}

type TaskMetadataRecord = Record<string, TaskLocalMetadata>;

function normalizeDependencyIds(dependencyTaskIds?: number[]) {
  if (!dependencyTaskIds?.length) {
    return [];
  }

  return Array.from(
    new Set(
      dependencyTaskIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );
}

function normalizeMetadata(metadata?: TaskLocalMetadata): TaskLocalMetadata {
  return {
    dueDate: metadata?.dueDate,
    dependencyTaskIds: normalizeDependencyIds(metadata?.dependencyTaskIds),
  };
}

export async function getTaskMetadataMap() {
  try {
    const rawValue = await AsyncStorage.getItem(TASK_METADATA_STORAGE_KEY);

    if (!rawValue) {
      return {} as TaskMetadataRecord;
    }

    const parsedValue = JSON.parse(rawValue) as TaskMetadataRecord;
    const normalizedEntries = Object.entries(parsedValue).map(([taskId, metadata]) => [
      taskId,
      normalizeMetadata(metadata),
    ]);

    return Object.fromEntries(normalizedEntries) as TaskMetadataRecord;
  } catch {
    return {} as TaskMetadataRecord;
  }
}

export async function saveTaskMetadata(taskId: number, metadata: TaskLocalMetadata) {
  if (!taskId) {
    return;
  }

  const currentMap = await getTaskMetadataMap();
  currentMap[String(taskId)] = normalizeMetadata(metadata);
  await AsyncStorage.setItem(TASK_METADATA_STORAGE_KEY, JSON.stringify(currentMap));
}

export async function getTaskMetadata(taskId: number) {
  const currentMap = await getTaskMetadataMap();
  return currentMap[String(taskId)];
}
