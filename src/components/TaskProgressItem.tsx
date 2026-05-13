import { StyleSheet, Text, View } from 'react-native';
import { TaskProgress } from '../types/progress';
import { formatDate } from '../utils/date';
import { theme } from '../styles/theme';
import { StatusBadge } from './StatusBadge';

interface TaskProgressItemProps {
  task: TaskProgress;
}

export function TaskProgressItem({ task }: TaskProgressItemProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{task.title}</Text>
          {task.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}
        </View>

        <StatusBadge status={task.status} />
      </View>

      <Text style={styles.meta}>
        {task.dueDate ? `Data limite: ${formatDate(task.dueDate)}` : 'Sem data limite definida'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  header: {
    gap: 10,
  },
  titleBlock: {
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: '#526171',
  },
  meta: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});
