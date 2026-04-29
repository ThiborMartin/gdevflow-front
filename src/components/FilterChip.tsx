import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#101827',
    borderColor: '#101827',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#425466',
  },
  labelSelected: {
    color: '#FFF',
  },
});
