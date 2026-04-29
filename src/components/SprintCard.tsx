import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../styles/theme';
import { Sprint } from '../types/project';
import { formatPeriod } from '../utils/date';
import { StatusBadge } from './StatusBadge';

interface SprintCardProps {
  sprint: Sprint;
  progress: number;
  onPress?: () => void;
  actionLabel?: string;
  footerPrimaryText?: string;
  footerSecondaryText?: string;
}

export function SprintCard({
  sprint,
  progress,
  onPress,
  actionLabel,
  footerPrimaryText,
  footerSecondaryText,
}: SprintCardProps) {
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const description = sprint.description?.trim() || sprint.descricao?.trim();
  const leftFooterText =
    footerPrimaryText ||
    (typeof sprint.totalTasks === 'number'
      ? `${sprint.totalTasks} tarefas na sprint`
      : 'Planejamento da sprint');
  const rightFooterText =
    footerSecondaryText ||
    (typeof sprint.completedTasks === 'number'
      ? `${sprint.completedTasks} concluidas`
      : 'Acompanhamento em tempo real');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrapper}>
          <Text style={styles.eyebrow}>SPRINT</Text>
          <Text style={styles.name}>{sprint.name}</Text>
        </View>
        <StatusBadge status={sprint.status} />
      </View>

      <Text style={styles.period}>{formatPeriod(sprint.startDate, sprint.endDate)}</Text>

      <Text style={styles.description} numberOfLines={2}>
        {description || 'Sem descricao cadastrada.'}
      </Text>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Progresso da sprint</Text>
        <Text style={styles.progressValue}>{normalizedProgress}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${normalizedProgress}%` }]} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>{leftFooterText}</Text>
        <Text style={styles.footerText}>{rightFooterText}</Text>
      </View>

      {actionLabel && onPress ? (
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.88}
          onPress={onPress}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  name: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  period: {
    marginTop: 12,
    fontSize: 13,
    color: '#586576',
    fontWeight: '600',
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#465465',
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
  track: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E8EDF3',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E1EB',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
});
