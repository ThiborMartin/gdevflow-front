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
import { MetricCard } from '../../components/MetricCard';
import { ProgressCircle } from '../../components/ProgressCircle';
import { ScreenState } from '../../components/ScreenState';
import { SprintCard } from '../../components/SprintCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getProjectById, getProjectSprints } from '../../services/projects';
import { theme } from '../../styles/theme';
import { Project, Sprint } from '../../types/project';
import { formatDate } from '../../utils/date';

const sprintProgressByStatus: Record<string, number> = {
  DONE: 100,
  CLOSED: 100,
  IN_PROGRESS: 55,
  ACTIVE: 55,
  PLANNED: 15,
  OPEN: 15,
  CANCELLED: 0,
};

function getSprintProgress(status?: string) {
  return sprintProgressByStatus[status?.toUpperCase() || 'PLANNED'] ?? 0;
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const projectClosed = project?.status?.toUpperCase() === 'CLOSED';

  const dashboard = useMemo(() => {
    const totalSprints = sprints.length;
    const doneSprints = sprints.filter(
      (sprint) => sprint.status?.toUpperCase() === 'DONE'
    ).length;
    const runningSprints = sprints.filter(
      (sprint) => sprint.status?.toUpperCase() === 'IN_PROGRESS'
    ).length;
    const pendingSprints = sprints.filter((sprint) =>
      ['PLANNED', 'OPEN'].includes(sprint.status?.toUpperCase() || '')
    ).length;
    const projectProgress =
      totalSprints === 0
        ? 0
        : Math.round(
            sprints.reduce(
              (sum, sprint) => sum + getSprintProgress(sprint.status),
              0
            ) / totalSprints
          );

    return {
      projectProgress,
      totalSprints,
      doneSprints,
      runningSprints,
      pendingSprints,
      currentSprint: getCurrentSprintLabel(sprints),
    };
  }, [sprints]);

  const loadProjectData = useCallback(async (showLoader = true) => {
    if (!projectId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }

      const [projectData, sprintData] = await Promise.all([
        getProjectById(projectId),
        getProjectSprints(projectId),
      ]);

      setProject(projectData);
      setSprints(sprintData);
    } catch (error: any) {
      Alert.alert(
        'Erro ao carregar projeto',
        error?.response?.data?.message ||
          'Não foi possível carregar os dados do projeto.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      loadProjectData();
    }, [loadProjectData])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadProjectData(false);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenState loading title="Carregando projeto..." />
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
              <StatusBadge status={project.status} />
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
          Resumo operacional do backlog e execução.
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
          label="Pendentes"
          value={dashboard.pendingSprints}
          helper="Planejadas/abertas"
          accentColor="#9333EA"
        />
        <MetricCard
          label="Tarefas"
          value="--"
          helper="Preparado para futura integração"
          accentColor="#0F766E"
        />
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Ações do projeto</Text>
        <Text style={styles.sectionSubtitle}>
          Gerencie sprints e atualize as definições do projeto.
        </Text>

        <View style={styles.actionButtons}>
          <Button
            title="Criar sprint"
            onPress={() =>
              router.push({
                pathname: '/(drawer)/sprint-form',
                params: { projectId: project.id },
              })
            }
            disabled={projectClosed}
          />

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
        </View>

        {projectClosed ? (
          <Text style={styles.closedNotice}>
            Projeto encerrado. Novas sprints estão bloqueadas.
          </Text>
        ) : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sprints</Text>
        <Text style={styles.sectionSubtitle}>
          Acompanhe planejamento, status e andamento de cada ciclo.
        </Text>
      </View>

      <FlatList
        data={sprints}
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
            progress={getSprintProgress(item.status)}
            onPress={() =>
              router.push({
                pathname: '/(drawer)/sprint-form',
                params: {
                  projectId: project.id,
                  sprintId: item.id,
                },
              })
            }
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
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
  emptyStateWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
});
