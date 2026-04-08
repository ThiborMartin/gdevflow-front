import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../styles/theme';

export function Input(props: TextInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={[styles.input, props.multiline && styles.multiline, props.style]}
        placeholderTextColor={theme.colors.muted}
      />
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
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
