import { View, TextInput, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export function Input(props: any) {
  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={styles.input}
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
});