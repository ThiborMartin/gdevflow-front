import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { MetricCard } from '../../components/MetricCard';
import { ProgressCircle } from '../../components/ProgressCircle';
import { ProjectStatusBadge } from '../../components/ProjectStatusBadge';
import { ScreenState } from '../../components/ScreenState';
import { SprintProgressCard } from '../../components/SprintProgressCard';
import { useUserRole } from '../../hooks/useUserRole';
import { getProjectProgress } from '../../services/tasks';
import { theme } from '../../styles/theme';
import { ProjectProgress } from '../../types/progress';

export default function ProjectProgressScreen() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = useMemo(() => Number(params.projectId), [params.projectId]);
  const [progress, setProgress] = useState<ProjectProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { isFreelancer, loading: roleLoading } = useUserRole();

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

        const progressData = await getProjectProgress(projectId);
        setProgress(progressData);
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
    [projectId]
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
        <View style={styles.retryWrapper}>
          <Button title="Tentar novamente" onPress={() => loadProgress()} />
        </View>
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
        <View style={styles.heroHeader}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.eyebrow}>PAINEL DO PROJETO</Text>
            <Text style={styles.title}>{progress.projectName || 'Projeto selecionado'}</Text>
            <Text style={styles.subtitle}>
              {progress.projectDescription || 'Sem descricao cadastrada para este projeto.'}
            </Text>
          </View>

          <ProgressCircle value={progress.progressPercentage} label="Concluido" size={112} />
        </View>

        <View style={styles.heroMetaRow}>
          <ProjectStatusBadge status={progress.projectStatus} />
          <Text style={styles.heroMetaText}>
            Freelancer: {progress.freelancer?.name || 'Nao informado'}
          </Text>
        </View>

        {progress.freelancer?.email ? (
          <Text style={styles.heroEmail}>{progress.freelancer.email}</Text>
        ) : null}

        <Text style={styles.heroSummary}>
          {progress.progressPercentage}% concluido no total do projeto.
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="Total de sprints"
          value={progress.totalSprints}
          helper="Ciclos planejados"
          accentColor={theme.colors.primary}
        />
        <MetricCard
          label="Total de tarefas"
          value={progress.totalTasks}
          helper="Backlog do projeto"
          accentColor="#111827"
        />
        <MetricCard
          label="Concluidas"
          value={progress.doneTasks}
          helper="Entregas finalizadas"
          accentColor="#16A34A"
        />
        <MetricCard
          label="Em andamento"
          value={progress.inProgressTasks}
          helper="Execucao ativa"
          accentColor="#2563EB"
        />
        <MetricCard
          label="Pendentes"
          value={progress.todoTasks}
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

      {progress.totalTasks === 0 ? (
        <View style={styles.emptyWrapper}>
          <ScreenState
            title="Nenhuma tarefa cadastrada"
            description="Assim que o freelancer adicionar tarefas a este projeto, o progresso detalhado aparecera aqui."
          />
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sprints do projeto</Text>
        <Text style={styles.sectionSubtitle}>
          {!roleLoading && isFreelancer
            ? 'Acompanhe o progresso de cada sprint e abra as tarefas quando precisar.'
            : 'Acompanhe cada sprint e o status das tarefas vinculadas.'}
        </Text>
      </View>

      {progress.sprints.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <ScreenState
            title="Nenhuma sprint encontrada"
            description="Assim que as sprints forem criadas, o projeto exibira o andamento detalhado aqui."
          />
        </View>
      ) : (
        progress.sprints.map((sprint) => (
          <SprintProgressCard
            key={sprint.id}
            sprint={sprint}
            actionLabel={!roleLoading && isFreelancer ? 'Ver tarefas' : undefined}
            onPress={
              !roleLoading && isFreelancer
                ? () =>
                    router.push({
                      pathname: '/(drawer)/tasks',
                      params: {
                        projectId: String(projectId),
                        sprintId: String(sprint.id),
                        projectName: progress.projectName,
                        sprintName: sprint.name,
                        sprintStatus: sprint.status,
                        sprintStartDate: sprint.startDate,
                        sprintEndDate: sprint.endDate,
                      },
                    })
                : undefined
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
  heroHeader: {
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
  heroMetaRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroMetaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  heroEmail: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  heroSummary: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
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
    marginBottom: 24,
  },
});
