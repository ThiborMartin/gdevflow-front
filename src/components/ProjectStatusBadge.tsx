import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../styles/theme';
import { ProjectStatus } from '../types/project';

interface ProjectStatusBadgeProps {
  status?: ProjectStatus | string | null;
}

const statusLabels: Record<string, string> = {
  IN_PROGRESS: 'Em andamento',
  WAITING_CLIENT_APPROVAL: 'Aguardando aprovação',
  COMPLETED: 'Concluído',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  IN_PROGRESS: { bg: '#FFF8E1', text: '#8A5B00' },
  WAITING_CLIENT_APPROVAL: { bg: '#E8F0FE', text: '#1D4ED8' },
  COMPLETED: { bg: '#E8F5E9', text: '#1B5E20' },
  SEM_STATUS: { bg: '#EEF2F6', text: theme.colors.text },
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const normalizedStatus = status?.toUpperCase() || 'SEM_STATUS';
  const colors = statusColors[normalizedStatus] || statusColors.SEM_STATUS;
  const label = statusLabels[normalizedStatus] || 'Sem status';

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
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
