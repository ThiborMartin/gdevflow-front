import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../styles/theme';

interface ProgressCircleProps {
  value: number;
  label?: string;
  size?: number;
}

const SEGMENTS = 24;

export function ProgressCircle({
  value,
  label = 'Concluído',
  size = 108,
}: ProgressCircleProps) {
  const normalizedValue = Math.max(0, Math.min(100, Math.round(value)));
  const activeSegments = Math.round((normalizedValue / 100) * SEGMENTS);
  const segmentHeight = size * 0.14;
  const segmentOffset = size / 2 - segmentHeight / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {Array.from({ length: SEGMENTS }).map((_, index) => (
        <View
          key={`segment-${index}`}
          style={[
            styles.segment,
            {
              height: segmentHeight,
              backgroundColor:
                index < activeSegments ? theme.colors.primary : '#E8EDF3',
              transform: [
                { rotate: `${(360 / SEGMENTS) * index}deg` },
                { translateY: -segmentOffset },
              ],
            },
          ]}
        />
      ))}

      <View style={[styles.innerCircle, { width: size * 0.7, height: size * 0.7 }]}>
        <Text style={styles.value}>{normalizedValue}%</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    position: 'absolute',
    width: 5,
    borderRadius: 999,
  },
  innerCircle: {
    borderRadius: 999,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '700',
  },
});
