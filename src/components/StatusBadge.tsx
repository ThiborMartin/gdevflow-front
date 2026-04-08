import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../styles/theme';

interface StatusBadgeProps {
  status?: string;
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  PLANNED: 'Planejado',
  DONE: 'Concluído',
  CLOSED: 'Encerrado',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: '#E8F5E9', text: '#1B5E20' },
  OPEN: { bg: '#E3F2FD', text: '#0D47A1' },
  IN_PROGRESS: { bg: '#FFF8E1', text: '#8A5B00' },
  PLANNED: { bg: '#EEF2FF', text: '#3730A3' },
  DONE: { bg: '#E8F5E9', text: '#1B5E20' },
  CLOSED: { bg: '#ECEFF1', text: '#455A64' },
  CANCELLED: { bg: '#FDECEA', text: '#B71C1C' },
  SEM_STATUS: { bg: '#EEF2F6', text: theme.colors.text },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status?.toUpperCase() || 'SEM_STATUS';
  const colors = statusColors[normalizedStatus] || statusColors.SEM_STATUS;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {statusLabels[normalizedStatus] || status || 'Sem status'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
});
