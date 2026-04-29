import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../styles/theme';
import { Task, TaskStatus } from '../types/task';
import { formatDate } from '../utils/date';
import { normalizeTaskStatus, TASK_STATUS_OPTIONS } from '../utils/task';
import { StatusBadge } from './StatusBadge';

interface TaskCardProps {
  task: Task;
  canManage?: boolean;
  busy?: boolean;
  onPress?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  dependencyNames?: string[];
  blockedDependencyNames?: string[];
}

export function TaskCard({
  task,
  canManage,
  busy,
  onPress,
  onStatusChange,
  dependencyNames,
  blockedDependencyNames,
}: TaskCardProps) {
  const responsibleName = task.responsibleName || task.assigneeName;
  const currentStatus = normalizeTaskStatus(task.status);
  const hasBlockedDependencies = (blockedDependencyNames?.length || 0) > 0;

  return (
    <TouchableOpacity
      style={[styles.card, onPress && styles.cardInteractive]}
      activeOpacity={onPress ? 0.9 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <Text style={styles.eyebrow}>TASK</Text>
          <Text style={styles.title}>{task.title}</Text>
        </View>

        <StatusBadge status={task.status} />
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {task.description || 'Sem descricao cadastrada.'}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Criada em {formatDate(task.createdAt)}</Text>
        {task.dueDate ? (
          <Text style={styles.metaText}>Data limite: {formatDate(task.dueDate)}</Text>
        ) : null}
        {responsibleName ? (
          <Text style={styles.metaText}>Responsavel: {responsibleName}</Text>
        ) : null}
        {dependencyNames?.length ? (
          <Text style={styles.metaText}>
            Depende de: {dependencyNames.join(', ')}
          </Text>
        ) : null}
        {hasBlockedDependencies ? (
          <Text style={styles.blockedText}>
            Conclusao bloqueada por: {blockedDependencyNames?.join(', ')}
          </Text>
        ) : null}
      </View>

      <View style={styles.statusSection}>
        {canManage ? (
          <Text style={styles.statusHint}>
            {busy
              ? 'Atualizando status...'
              : hasBlockedDependencies
                ? 'Conclua as dependencias antes de finalizar esta tarefa'
                : 'Toque no card para editar'}
          </Text>
        ) : null}

        <View style={styles.statusRow}>
          {TASK_STATUS_OPTIONS.map((statusOption) => {
            const selected = currentStatus === statusOption.value;
            const blockedByDependency =
              statusOption.value === 'DONE' && hasBlockedDependencies && !selected;
            const disabled = !canManage || busy || selected || blockedByDependency;

            return (
              <TouchableOpacity
                key={statusOption.value}
                style={[
                  styles.statusButton,
                  selected && styles.statusButtonSelected,
                  blockedByDependency && styles.statusButtonBlocked,
                  disabled && !selected && styles.statusButtonDisabled,
                ]}
                activeOpacity={0.88}
                onPress={() => onStatusChange?.(statusOption.value)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    selected && styles.statusButtonTextSelected,
                  ]}
                >
                  {statusOption.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
    borderColor: '#E8EDF3',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInteractive: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#465465',
  },
  metaRow: {
    marginTop: 14,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A8B',
  },
  blockedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B71C1C',
  },
  statusSection: {
    marginTop: 16,
  },
  statusHint: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A8B',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#EEF3F8',
    borderWidth: 1,
    borderColor: '#D8E1EB',
  },
  statusButtonSelected: {
    backgroundColor: '#101827',
    borderColor: '#101827',
  },
  statusButtonBlocked: {
    borderColor: '#F1B5B5',
    backgroundColor: '#FFF5F5',
  },
  statusButtonDisabled: {
    opacity: 0.7,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#223244',
  },
  statusButtonTextSelected: {
    color: '#FFF',
  },
});
