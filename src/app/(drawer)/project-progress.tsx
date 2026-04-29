import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MetricCard } from '../../components/MetricCard';
import { ProgressCircle } from '../../components/ProgressCircle';
import { ScreenState } from '../../components/ScreenState';
import { SprintCard } from '../../components/SprintCard';
import { getProjectById } from '../../services/projects';
import { getProjectProgress } from '../../services/tasks';
import { theme } from '../../styles/theme';
import { ProjectProgress } from '../../types/progress';

export default function ProjectProgressScreen() {
  const params = useLocalSearchParams<{ projectId?: string; projectName?: string }>();
  const projectId = useMemo(() => Number(params.projectId), [params.projectId]);
  const [progress, setProgress] = useState<ProjectProgress | null>(null);
  const [projectName, setProjectName] = useState(params.projectName || '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProgress = useCallback(
    async (showLoader = true) => {
      if (!projectId) {
        setError('Projeto invalido para carregar o progresso.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setError('');

        if (showLoader) {
          setLoading(true);
        }

        const [progressData, projectData] = await Promise.all([
          getProjectProgress(projectId),
          getProjectById(projectId).catch(() => null),
        ]);

        setProgress(progressData);
        setProjectName(progressData.projectName || projectData?.name || params.projectName || '');
      } catch (loadError: any) {
        setError(
          loadError?.response?.data?.message ||
            'Nao foi possivel carregar o progresso do projeto.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [params.projectName, projectId]
  );

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadProgress(false);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenState loading title="Carregando progresso..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScreenState title="Erro ao carregar progresso" description={error} />
      </View>
    );
  }

  if (!progress) {
    return (
      <View style={styles.container}>
        <ScreenState
          title="Progresso indisponivel"
          description="Nao foi possivel encontrar indicadores para este projeto."
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
        <View style={styles.heroRow}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.eyebrow}>PROJECT DASHBOARD</Text>
            <Text style={styles.title}>{projectName || 'Projeto selecionado'}</Text>
            <Text style={styles.subtitle}>
              Acompanhe a evolucao das sprints e das tarefas em um unico lugar.
            </Text>
          </View>

          <ProgressCircle value={progress.completionPercentage} label="Concluido" />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="Total de sprints"
          value={progress.totalSprints}
          helper="Ciclos do projeto"
          accentColor={theme.colors.primary}
        />
        <MetricCard
          label="Total de tarefas"
          value={progress.totalTasks}
          helper="Backlog geral"
          accentColor="#111827"
        />
        <MetricCard
          label="Concluidas"
          value={progress.completedTasks}
          helper="Entregas finalizadas"
          accentColor="#16A34A"
        />
        <MetricCard
          label="Em andamento"
          value={progress.inProgressTasks}
          helper="Itens em execucao"
          accentColor="#2563EB"
        />
        <MetricCard
          label="Pendentes"
          value={progress.pendingTasks}
          helper="Ainda nao iniciadas"
          accentColor="#7C3AED"
        />
        <MetricCard
          label="Bloqueadas"
          value={progress.blockedTasks}
          helper="Precisam de atencao"
          accentColor="#DC2626"
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sprints</Text>
        <Text style={styles.sectionSubtitle}>
          Progresso individual de cada sprint do projeto.
        </Text>
      </View>

      {progress.sprints.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <ScreenState
            title="Nenhuma sprint encontrada"
            description="Assim que as sprints forem criadas, o dashboard exibira o progresso aqui."
          />
        </View>
      ) : (
        progress.sprints.map((sprint) => (
          <SprintCard
            key={sprint.id}
            sprint={{
              id: sprint.id,
              name: sprint.name,
              description: sprint.description,
              startDate: sprint.startDate || '',
              endDate: sprint.endDate || '',
              status: sprint.status || 'PLANNED',
              totalTasks: sprint.totalTasks,
              completedTasks: sprint.completedTasks,
            }}
            progress={sprint.progressPercentage}
            actionLabel="Ver tarefas"
            footerPrimaryText={`${sprint.totalTasks} tarefas`}
            footerSecondaryText={`${sprint.completedTasks} concluidas`}
            onPress={() =>
              router.push({
                pathname: '/(drawer)/tasks',
                params: {
                  projectId: String(projectId),
                  sprintId: String(sprint.id),
                  projectName,
                  sprintName: sprint.name,
                  sprintStatus: sprint.status,
                  sprintStartDate: sprint.startDate,
                  sprintEndDate: sprint.endDate,
                },
              })
            }
          />
        ))
      )}
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  heroTextBlock: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: theme.colors.muted,
  },
  title: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#465465',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 24,
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
  emptyWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
});
