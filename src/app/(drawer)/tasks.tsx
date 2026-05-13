import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { FilterChip } from '../../components/FilterChip';
import { MetricCard } from '../../components/MetricCard';
import { ProgressCircle } from '../../components/ProgressCircle';
import { ScreenState } from '../../components/ScreenState';
import { TaskCard } from '../../components/TaskCard';
import { useUserRole } from '../../hooks/useUserRole';
import { getProjectById, getSprintById } from '../../services/projects';
import { completeTask, getSprintTasks, updateTaskStatus } from '../../services/tasks';
import { theme } from '../../styles/theme';
import { Task, TaskStatus } from '../../types/task';
import {
  TASK_FILTERS,
  TaskFilterValue,
  canTaskBeCompleted,
  filterTasksByStatus,
  getIncompleteTaskDependencies,
  getTaskCompletionPercentage,
  getTaskSummary,
  resolveTaskDependencies,
} from '../../utils/task';

interface SprintHeaderState {
  projectName: string;
  sprintName: string;
  sprintStatus?: string;
  sprintPeriod?: string;
}

function buildPeriodLabel(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) {
    return '';
  }

  return `${startDate || '-'} a ${endDate || '-'}`;
}

export default function Tasks() {
  const params = useLocalSearchParams<{
    projectId?: string;
    sprintId?: string;
    projectName?: string;
    sprintName?: string;
    sprintStatus?: string;
    sprintStartDate?: string;
    sprintEndDate?: string;
  }>();
  const projectId = useMemo(() => Number(params.projectId), [params.projectId]);
  const sprintId = useMemo(() => Number(params.sprintId), [params.sprintId]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [header, setHeader] = useState<SprintHeaderState>({
    projectName: params.projectName || '',
    sprintName: params.sprintName || '',
    sprintStatus: params.sprintStatus,
    sprintPeriod: buildPeriodLabel(params.sprintStartDate, params.sprintEndDate),
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<TaskFilterValue>('ALL');
  const [actionTaskId, setActionTaskId] = useState<number | null>(null);
  const { isFreelancer, loading: roleLoading } = useUserRole();

  const filteredTasks = useMemo(
    () => filterTasksByStatus(tasks, selectedFilter),
    [selectedFilter, tasks]
  );
  const summary = useMemo(() => getTaskSummary(tasks), [tasks]);
  const completionPercentage = useMemo(
    () => getTaskCompletionPercentage(tasks),
    [tasks]
  );

  const loadTasks = useCallback(
    async (showLoader = true) => {
      if (!projectId || !sprintId) {
        setError('Projeto ou sprint invalidos para carregar as tarefas.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setError('');

        if (showLoader) {
          setLoading(true);
        }

        const [taskData, sprintData, projectData] = await Promise.all([
          getSprintTasks(projectId, sprintId),
          getSprintById(sprintId).catch(() => null),
          getProjectById(projectId).catch(() => null),
        ]);

        setTasks(taskData);
        setHeader({
          projectName: projectData?.name || params.projectName || '',
          sprintName: sprintData?.name || params.sprintName || '',
          sprintStatus: sprintData?.status || params.sprintStatus,
          sprintPeriod:
            buildPeriodLabel(sprintData?.startDate, sprintData?.endDate) ||
            buildPeriodLabel(params.sprintStartDate, params.sprintEndDate),
        });
      } catch (loadError: any) {
        setError(
          loadError?.response?.data?.message ||
            'Nao foi possivel carregar as tarefas da sprint.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      params.projectName,
      params.sprintEndDate,
      params.sprintName,
      params.sprintStartDate,
      params.sprintStatus,
      projectId,
      sprintId,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadTasks(false);
  }

  function openTaskForm(taskId?: number) {
    router.push({
      pathname: './task-form',
      params: {
        projectId: String(projectId),
        sprintId: String(sprintId),
        projectName: header.projectName,
        sprintName: header.sprintName,
        taskId: taskId ? String(taskId) : undefined,
      },
    });
  }

  async function handleStatusChange(taskId: number, status: TaskStatus) {
    const currentTask = tasks.find((task) => task.id === taskId);

    if (!currentTask) {
      return;
    }

    if (status === 'DONE' && !canTaskBeCompleted(currentTask, tasks)) {
      const blockedDependencies = getIncompleteTaskDependencies(currentTask, tasks);

      Alert.alert(
        'Dependencias pendentes',
        `Conclua primeiro: ${blockedDependencies
          .map((dependency) => dependency.title)
          .join(', ')}.`
      );
      return;
    }

    try {
      setActionTaskId(taskId);
      const updatedTask =
        status === 'DONE'
          ? await completeTask(taskId)
          : await updateTaskStatus(taskId, status);

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedTask, status: updatedTask.status } : task
        )
      );

      if (status === 'DONE') {
        Alert.alert('Sucesso', 'Tarefa concluida com sucesso.');
      }
    } catch (statusError: any) {
      Alert.alert(
        'Erro ao atualizar status',
        statusError?.response?.data?.message ||
          'Nao foi possivel atualizar o status da tarefa.'
      );
    } finally {
      setActionTaskId(null);
    }
  }

  function renderTaskItem(item: Task) {
    const dependencyTasks = resolveTaskDependencies(item, tasks);
    const blockedDependencies = getIncompleteTaskDependencies(item, tasks);

    return (
      <TaskCard
        task={item}
        canManage={!roleLoading && isFreelancer}
        busy={actionTaskId === item.id}
        dependencyNames={dependencyTasks.map((dependency) => dependency.title)}
        blockedDependencyNames={blockedDependencies.map((dependency) => dependency.title)}
        onPress={!roleLoading && isFreelancer ? () => openTaskForm(item.id) : undefined}
        onComplete={() => handleStatusChange(item.id, 'DONE')}
        onStatusChange={(status) => handleStatusChange(item.id, status)}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenState loading title="Carregando tarefas..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScreenState title="Erro ao carregar tarefas" description={error} />
        <View style={styles.retryWrapper}>
          <Button title="Tentar novamente" onPress={() => loadTasks()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroTextBlock}>
                  <Text style={styles.eyebrow}>SPRINT BOARD</Text>
                  <Text style={styles.title}>{header.sprintName || 'Sprint selecionada'}</Text>
                  <Text style={styles.subtitle}>
                    {header.projectName || 'Projeto sem nome'}
                  </Text>
                  {header.sprintPeriod ? (
                    <Text style={styles.period}>{header.sprintPeriod}</Text>
                  ) : null}
                </View>

                <ProgressCircle value={completionPercentage} label="Conclusao" size={96} />
              </View>

              {!roleLoading && isFreelancer ? (
                <Button title="Nova tarefa" onPress={() => openTaskForm()} />
              ) : !roleLoading ? (
                <Text style={styles.viewerNotice}>
                  Modo cliente: acompanhamento apenas para leitura.
                </Text>
              ) : null}
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard
                label="Total"
                value={summary.total}
                helper="Tarefas da sprint"
                accentColor={theme.colors.primary}
              />
              <MetricCard
                label="Concluidas"
                value={summary.completed}
                helper="Itens entregues"
                accentColor="#16A34A"
              />
              <MetricCard
                label="Em andamento"
                value={summary.inProgress}
                helper="Execucao ativa"
                accentColor="#2563EB"
              />
              <MetricCard
                label="Bloqueadas"
                value={summary.blocked}
                helper="Precisam destravar"
                accentColor="#DC2626"
              />
            </View>

            <View style={styles.filtersSection}>
              <Text style={styles.filtersTitle}>Filtrar por status</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersRow}
              >
                {TASK_FILTERS.map((filter) => (
                  <FilterChip
                    key={filter.value}
                    label={filter.label}
                    selected={selectedFilter === filter.value}
                    onPress={() => setSelectedFilter(filter.value)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <ScreenState
              title={
                selectedFilter === 'ALL'
                  ? 'Nenhuma tarefa cadastrada'
                  : 'Nenhuma tarefa encontrada neste filtro'
              }
              description={
                selectedFilter === 'ALL'
                  ? 'Cadastre a primeira tarefa desta sprint para comecar a acompanhar a execucao.'
                  : 'Tente trocar o filtro para visualizar mais tarefas.'
              }
            />
          </View>
        }
        renderItem={({ item }) => renderTaskItem(item)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  retryWrapper: {
    paddingHorizontal: 24,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  heroTextBlock: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.muted,
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#465465',
  },
  period: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7A8B',
    fontWeight: '600',
  },
  viewerNotice: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 20,
  },
  filtersSection: {
    marginBottom: 8,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
  },
  filtersRow: {
    paddingRight: 8,
  },
  emptyWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
});
