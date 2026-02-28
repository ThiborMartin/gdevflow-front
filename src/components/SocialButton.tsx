import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export function SocialButton({ title }: { title: string }) {
  return (
    <TouchableOpacity style={styles.button}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  text: {
    fontWeight: '500',
  },
});