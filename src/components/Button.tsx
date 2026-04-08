import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ title, onPress, disabled, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, variant === 'danger' && styles.dangerText]}>
        {title}
      </Text>
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
  secondary: {
    backgroundColor: '#EAF0F6',
  },
  danger: {
    backgroundColor: '#FDECEA',
  },
  dangerText: {
    color: '#B71C1C',
  },
  disabled: {
    opacity: 0.6,
  },
});
