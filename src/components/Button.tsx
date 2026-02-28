import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export function Button({ title, onPress }: any) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.colors.text,
  },
});