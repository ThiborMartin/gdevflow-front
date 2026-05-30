import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { ClientSearchBox } from '../../components/ClientSearchBox';
import { MetricCard } from '../../components/MetricCard';
import { ProgressCircle } from '../../components/ProgressCircle';
import { ProjectStatusBadge } from '../../components/ProjectStatusBadge';
import { ScreenState } from '../../components/ScreenState';
import { SprintCard } from '../../components/SprintCard';
import { useUserRole } from '../../hooks/useUserRole';
import { assignClientToProject, getProjectById, getProjectSprints } from '../../services/projects';
import { getProjectProgress } from '../../services/tasks';
import { theme } from '../../styles/theme';
import { ClientSearchResult } from '../../types/client';
import { Project, Sprint } from '../../types/project';
import { ProjectProgress } from '../../types/progress';
import { formatDate } from '../../utils/date';

const fallbackSprintProgressByStatus: Record<string, number> = {
  DONE: 100,
  CLOSED: 100,
  IN_PROGRESS: 55,
  ACTIVE: 55,
  PLANNED: 15,
  OPEN: 15,
  CANCELLED: 0,
};

function getSprintFallbackProgress(status?: string) {
  return fallbackSprintProgressByStatus[status?.toUpperCase() || 'PLANNED'] ?? 0;
}

function getProjectInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getCurrentSprintLabel(sprints: Sprint[]) {
  const runningSprint = sprints.find(
    (sprint) => sprint.status?.toUpperCase() === 'IN_PROGRESS'
  );

  if (runningSprint) {
    return runningSprint.name;
  }

  return sprints[0]?.name || 'Sem sprint ativa';
}

export default function ProjectDetails() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = useMemo(() => Number(params.projectId), [params.projectId]);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [progress, setProgress] = useState<ProjectProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);
  const [assigningClient, setAssigningClient] = useState(false);
  const [clientAssignmentError, setClientAssignmentError] = useState('');
  const { isClient, isFreelancer, loading: roleLoading } = useUserRole();

  const mergedSprints = useMemo(() => {
    const sprintProgressMap = new Map(
      progress?.sprints.map((sprintProgress) => [sprintProgress.id, sprintProgress]) || []
    );

    return sprints.map((sprint) => {
      const sprintProgress = sprintProgressMap.get(sprint.id);

      if (!sprintProgress) {
        return sprint;
      }

      return {
        ...sprint,
        progressPercentage: sprintProgress.progressPercentage,
        totalTasks: sprintProgress.totalTasks,
        completedTasks: sprintProgress.completedTasks,
        inProgressTasks: sprintProgress.inProgressTasks,
        pendingTasks: sprintProgress.pendingTasks,
        blockedTasks: sprintProgress.blockedTasks,
      };
    });
  }, [progress?.sprints, sprints]);

  const dashboard = useMemo(() => {
    const totalSprints = mergedSprints.length;
    const doneSprints = mergedSprints.filter(
      (sprint) => sprint.status?.toUpperCase() === 'DONE'
    ).length;
    const runningSprints = mergedSprints.filter(
      (sprint) => sprint.status?.toUpperCase() === 'IN_PROGRESS'
    ).length;
    const pendingSprints = mergedSprints.filter((sprint) =>
      ['PLANNED', 'OPEN'].includes(sprint.status?.toUpperCase() || '')
    ).length;
    const projectProgress =
      progress?.completionPercentage ??
      (totalSprints === 0
        ? 0
        : Math.round(
            mergedSprints.reduce(
              (sum, sprint) =>
                sum + (sprint.progressPercentage ?? getSprintFallbackProgress(sprint.status)),
              0
            ) / totalSprints
          ));

    return {
      projectProgress,
      totalSprints,
      doneSprints,
      runningSprints,
      pendingSprints,
      totalTasks: progress?.totalTasks ?? '--',
      blockedTasks: progress?.blockedTasks ?? '--',
      currentSprint: getCurrentSprintLabel(mergedSprints),
    };
  }, [mergedSprints, progress]);

  const projectLocked = project?.status !== 'IN_PROGRESS';
  const projectHasClient = Boolean(project?.client);

  const loadProjectData = useCallback(
    async (showLoader = true) => {
      if (!projectId) {
        setError('Projeto inválido para carregar os detalhes.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setError('');

        if (showLoader) {
          setLoading(true);
        }

        const [projectData, sprintData] = await Promise.all([
          getProjectById(projectId),
          getProjectSprints(projectId),
        ]);

        setProject(projectData);
        setSelectedClient(null);
        setClientAssignmentError('');
        setSprints(sprintData);

        try {
          const progressData = await getProjectProgress(projectId);
          setProgress(progressData);
        } catch {
          setProgress(null);
        }
      } catch (loadError: any) {
        setError(
          loadError?.response?.data?.message ||
            'Não foi possível carregar os dados do projeto.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId]
  );

  useFocusEffect(
    useCallback(() => {
      loadProjectData();
    }, [loadProjectData])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadProjectData(false);
  }

  async function handleAssignClient() {
    if (!project || !selectedClient) {
      setClientAssignmentError('Selecione um cliente antes de vincular.');
      return;
    }

    try {
      setAssigningClient(true);
      setClientAssignmentError('');

      const updatedProject = await assignClientToProject(project.id, selectedClient.id);
      setProject(updatedProject);
      setSelectedClient(null);

      Alert.alert('Sucesso', 'Cliente vinculado ao projeto com sucesso.');
    } catch (assignError: any) {
      setClientAssignmentError(
        assignError?.response?.data?.message ||
          'Não foi possível vincular o cliente ao projeto.'
      );
    } finally {
      setAssigningClient(false);
    }
  }

  function openSprintTasks(sprint: Sprint) {
    router.push({
      pathname: '/(drawer)/tasks',
      params: {
        projectId: String(project?.id || projectId),
        sprintId: String(sprint.id),
        projectName: project?.name,
        sprintName: sprint.name,
        sprintStatus: sprint.status,
        sprintStartDate: sprint.startDate,
        sprintEndDate: sprint.endDate,
      },
    });
  }

  function openSprintEditor(sprint: Sprint) {
    router.push({
      pathname: '/(drawer)/sprint-form',
      params: {
        projectId: String(project?.id || projectId),
        sprintId: String(sprint.id),
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenState loading title="Carregando projeto..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScreenState title="Erro ao carregar projeto" description={error} />
        <View style={styles.retryWrapper}>
          <Button title="Tentar novamente" onPress={() => loadProjectData()} />
        </View>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <ScreenState
          title="Projeto não encontrado"
          description="Volte para a listagem e tente abrir o projeto novamente."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getProjectInitials(project.name)}</Text>
          </View>

          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroEyebrow}>WORKSPACE DO PROJETO</Text>
            <Text style={styles.heroTitle}>{project.name}</Text>
            <View style={styles.statusRow}>
              <ProjectStatusBadge status={project.status} />
              <Text style={styles.createdAt}>Criado em {formatDate(project.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryTextBlock}>
            <Text style={styles.sectionLabel}>Visão geral</Text>
            <Text style={styles.description}>
              {project.description || 'Sem descrição cadastrada.'}
            </Text>
            <Text style={styles.currentSprintLabel}>Sprint em foco</Text>
            <Text style={styles.currentSprintValue}>{dashboard.currentSprint}</Text>
          </View>

          <ProgressCircle value={dashboard.projectProgress} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Indicadores rápidos</Text>
        <Text style={styles.sectionSubtitle}>
          Resumo operacional do backlog e do andamento atual.
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="Total de sprints"
          value={dashboard.totalSprints}
          helper={`${dashboard.doneSprints} concluídas`}
          accentColor={theme.colors.primary}
        />
        <MetricCard
          label="Em andamento"
          value={dashboard.runningSprints}
          helper="Sprints ativas agora"
          accentColor="#2563EB"
        />
        <MetricCard
          label="Tarefas"
          value={dashboard.totalTasks}
          helper="Backlog do projeto"
          accentColor="#0F766E"
        />
        <MetricCard
          label="Bloqueios"
          value={dashboard.blockedTasks}
          helper={`${dashboard.pendingSprints} sprints pendentes`}
          accentColor="#DC2626"
        />
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Ações do projeto</Text>
        <Text style={styles.sectionSubtitle}>
          Abra o dashboard de progresso e acompanhe as sprints do projeto.
        </Text>

        <View style={styles.actionButtons}>
          <Button
            title="Visualizar progresso"
            onPress={() =>
              router.push({
                pathname: './project-progress',
                params: { projectId: project.id, projectName: project.name },
              })
            }
          />

          <Button
            title="Abrir chat"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: './project-chat',
                params: { projectId: project.id, projectName: project.name },
              })
            }
            disabled={!projectHasClient}
          />

          {!roleLoading && isFreelancer ? (
            <Button
              title="Editar projeto"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/(drawer)/project-form',
                  params: { projectId: project.id },
                })
              }
            />
          ) : null}
        </View>

        {projectLocked && !roleLoading && isFreelancer ? (
          <Text style={styles.closedNotice}>
            Este projeto não está mais em andamento. Novas sprints ficam bloqueadas até a próxima etapa do fluxo.
          </Text>
        ) : null}

        {!roleLoading && isClient ? (
          <Text style={styles.clientNotice}>
            Modo cliente ativo: acompanhamento somente para leitura.
          </Text>
        ) : null}
      </View>

      <View style={styles.clientCard}>
        <Text style={styles.sectionTitle}>Cliente do projeto</Text>

        {projectHasClient ? (
          <>
            <Text style={styles.sectionSubtitle}>
              Este projeto já possui um cliente vinculado.
            </Text>

            <View style={styles.clientSummaryCard}>
              <Text style={styles.clientSummaryLabel}>Cliente vinculado</Text>
              <Text style={styles.clientSummaryName}>{project.client?.name}</Text>
              <Text style={styles.clientSummaryEmail}>
                {project.client?.email || 'E-mail não disponível'}
              </Text>
            </View>
          </>
        ) : !roleLoading && isFreelancer ? (
          <>
            <Text style={styles.sectionSubtitle}>
              Vincule um cliente para que ele acompanhe o progresso deste projeto.
            </Text>

            <ClientSearchBox
              onSelectClient={(client) => {
                setSelectedClient(client);
                setClientAssignmentError('');
              }}
            />

            {selectedClient ? (
              <Text style={styles.clientSelectionHint}>
                Cliente selecionado: {selectedClient.name} ({selectedClient.email})
              </Text>
            ) : null}

            {clientAssignmentError ? (
              <Text style={styles.clientAssignmentError}>{clientAssignmentError}</Text>
            ) : null}

            <Button
              title={assigningClient ? 'Vinculando cliente...' : 'Vincular cliente'}
              onPress={handleAssignClient}
              disabled={assigningClient || !selectedClient}
            />
          </>
        ) : (
          <Text style={styles.sectionSubtitle}>
            Ainda não há cliente vinculado a este projeto.
          </Text>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Sprints</Text>
          {!roleLoading && isFreelancer ? (
            <TouchableOpacity
              style={[
                styles.createSprintButton,
                projectLocked && styles.createSprintButtonDisabled,
              ]}
              activeOpacity={0.88}
              onPress={() =>
                router.push({
                  pathname: '/(drawer)/sprint-form',
                  params: { projectId: project.id },
                })
              }
              disabled={projectLocked}
            >
              <Text style={styles.createSprintButtonText}>Criar sprint</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.sectionSubtitle}>
          Toque em uma sprint para abrir a lista de tarefas correspondente.
        </Text>
      </View>

      <FlatList
        data={mergedSprints}
        keyExtractor={(item) => String(item.id)}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyStateWrapper}>
            <ScreenState
              title="Nenhuma sprint cadastrada"
              description="Crie a primeira sprint para organizar a execução deste projeto."
            />
          </View>
        }
        renderItem={({ item }) => (
          <SprintCard
            sprint={item}
            progress={item.progressPercentage ?? getSprintFallbackProgress(item.status)}
            actionLabel="Ver tarefas"
            secondaryActionLabel={!roleLoading && isFreelancer ? 'Editar sprint' : undefined}
            footerPrimaryText={
              typeof item.totalTasks === 'number'
                ? `${item.totalTasks} tarefas`
                : 'Sem total de tarefas ainda'
            }
            footerSecondaryText={
              typeof item.completedTasks === 'number'
                ? `${item.completedTasks} concluídas`
                : 'Progresso via status da sprint'
            }
            onPress={() => openSprintTasks(item)}
            onSecondaryActionPress={() => openSprintEditor(item)}
          />
        )}
      />
    </ScrollView>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  heroTitleBlock: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: theme.colors.muted,
  },
  heroTitle: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statusRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  createdAt: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  summaryRow: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
  },
  summaryTextBlock: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#465465',
  },
  currentSprintLabel: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
  currentSprintValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  createSprintButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  createSprintButtonDisabled: {
    opacity: 0.45,
  },
  createSprintButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 24,
  },
  actionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  clientCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  actionButtons: {
    marginTop: 14,
    gap: 6,
  },
  closedNotice: {
    marginTop: 12,
    fontSize: 13,
    color: '#B71C1C',
    fontWeight: '600',
  },
  clientNotice: {
    marginTop: 12,
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  clientSummaryCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  clientSummaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: theme.colors.muted,
  },
  clientSummaryName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  clientSummaryEmail: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  clientSelectionHint: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  clientAssignmentError: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#B71C1C',
  },
  emptyStateWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
});
