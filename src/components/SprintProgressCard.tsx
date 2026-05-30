import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SprintProgress } from '../types/progress';
import { theme } from '../styles/theme';
import { formatPeriod } from '../utils/date';
import { StatusBadge } from './StatusBadge';
import { TaskProgressItem } from './TaskProgressItem';

interface SprintProgressCardProps {
  sprint: SprintProgress;
  actionLabel?: string;
  onPress?: () => void;
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function SprintProgressCard({
  sprint,
  actionLabel,
  onPress,
}: SprintProgressCardProps) {
  const progressPercentage = clampProgress(sprint.progressPercentage);
  const hasAction = Boolean(actionLabel && onPress);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>SPRINT</Text>
          <Text style={styles.title}>{sprint.name}</Text>
        </View>

        <StatusBadge status={sprint.status} />
      </View>

      <Text style={styles.period}>{formatPeriod(sprint.startDate, sprint.endDate)}</Text>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Progresso da sprint</Text>
        <Text style={styles.progressValue}>{progressPercentage}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
      </View>

      <View style={styles.metricsRow}>
        <Text style={styles.metricText}>{sprint.doneTasks} concluídas</Text>
        <Text style={styles.metricText}>{sprint.totalTasks} tarefas</Text>
      </View>

      {hasAction ? (
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.88}
          onPress={onPress}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.tasksSection}>
        <Text style={styles.tasksTitle}>Tarefas da sprint</Text>

        {sprint.tasks.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma tarefa vinculada a esta sprint ainda.
          </Text>
        ) : (
          sprint.tasks.map((task) => (
            <TaskProgressItem key={task.id} task={task} />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    gap: 12,
  },
  titleBlock: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  period: {
    marginTop: 12,
    fontSize: 13,
    color: '#586576',
    fontWeight: '600',
  },
  progressHeader: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '700',
  },
  progressValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '800',
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
  metricsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  actionButton: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E1EB',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  tasksSection: {
    marginTop: 18,
  },
  tasksTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },
});
