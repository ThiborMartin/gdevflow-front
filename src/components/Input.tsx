import { View, TextInput, StyleSheet, TextInputProps, Text } from 'react-native';
import { theme } from '../styles/theme';

interface InputProps extends TextInputProps {
  error?: string;
}

export function Input({ error, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={[
          styles.input,
          error && styles.inputError,
          props.multiline && styles.multiline,
          props.style,
        ]}
        placeholderTextColor={theme.colors.muted}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFF8F8',
  },
  errorText: {
    marginTop: 6,
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
