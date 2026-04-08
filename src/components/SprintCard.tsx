import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../styles/theme';
import { Sprint } from '../types/project';
import { formatPeriod } from '../utils/date';
import { StatusBadge } from './StatusBadge';

interface SprintCardProps {
  sprint: Sprint;
  progress: number;
  onPress: () => void;
}

export function SprintCard({ sprint, progress, onPress }: SprintCardProps) {
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleWrapper}>
          <Text style={styles.eyebrow}>SPRINT</Text>
          <Text style={styles.name}>{sprint.name}</Text>
        </View>
        <StatusBadge status={sprint.status} />
      </View>

      <Text style={styles.period}>{formatPeriod(sprint.startDate, sprint.endDate)}</Text>

      <Text style={styles.description} numberOfLines={2}>
        {sprint.description || 'Sem descrição cadastrada.'}
      </Text>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Progresso da sprint</Text>
        <Text style={styles.progressValue}>{normalizedProgress}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${normalizedProgress}%` }]} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Tarefas: em breve</Text>
        <Text style={styles.footerText}>Concluídas/Pendentes: --</Text>
      </View>
    </TouchableOpacity>
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
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600',
  },
});
