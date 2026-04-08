import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../styles/theme';

interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
  accentColor?: string;
}

export function MetricCard({
  label,
  value,
  helper,
  accentColor = theme.colors.primary,
}: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  accent: {
    width: 24,
    height: 4,
    borderRadius: 999,
    marginBottom: 14,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  label: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#3F4C5A',
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 16,
  },
});
