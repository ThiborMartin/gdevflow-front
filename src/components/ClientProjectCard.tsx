import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ClientProject } from '../types/client-project';
import { theme } from '../styles/theme';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { formatDate } from '../utils/date';

interface ClientProjectCardProps {
  project: ClientProject;
  onPress: () => void;
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function ClientProjectCard({ project, onPress }: ClientProjectCardProps) {
  const progressPercentage = clampProgress(project.progressPercentage);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{project.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {project.description || 'Sem descrição cadastrada.'}
          </Text>
        </View>

        <ProjectStatusBadge status={project.status} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Freelancer responsável</Text>
        <Text style={styles.metaValue}>{project.owner.name}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Criado em</Text>
        <Text style={styles.metaValue}>{formatDate(project.createdAt)}</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{progressPercentage}%</Text>
          <Text style={styles.metricLabel}>Progresso</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {project.doneTasks}/{project.totalTasks}
          </Text>
          <Text style={styles.metricLabel}>Tarefas concluídas</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{project.totalSprints}</Text>
          <Text style={styles.metricLabel}>Sprints</Text>
        </View>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Andamento do projeto</Text>
        <Text style={styles.progressValue}>{progressPercentage}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
      </View>

      <Text style={styles.progressSummary}>
        {project.doneTasks} de {project.totalTasks} tarefas concluídas
      </Text>

      <TouchableOpacity style={styles.actionButton} activeOpacity={0.88} onPress={onPress}>
        <Text style={styles.actionText}>Ver progresso</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    gap: 12,
  },
  titleBlock: {
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#465465',
  },
  metaRow: {
    marginTop: 14,
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  metricsRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  progressHeader: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  progressTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E8EDF3',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  progressSummary: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  actionButton: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
});
