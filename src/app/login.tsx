import { View, Text, StyleSheet, Platform } from 'react-native';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { SocialButton } from '../components/SocialButton';
import { Link } from 'expo-router';

export default function Login() {
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Logo />

        <Text style={styles.subtitle}>
          Acesse sua conta para continuar
        </Text>

        <Input placeholder="Email" />
        <Input placeholder="Senha" secureTextEntry />

        <Button title="Entrar" />

        <Text style={styles.divider}>ou continue com</Text>

        <SocialButton title="Entrar com Google" />
        <SocialButton title="Entrar com GitHub" />

        <Link href="/register" style={styles.link}>
          Criar conta
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 420 : '100%',
    backgroundColor: '#FFF',
    padding: 32,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  divider: {
    textAlign: 'center',
    marginVertical: 8,
    color: '#999',
    fontSize: 12,
  },
  link: {
    marginTop: 1,
    textAlign: 'center',
    fontWeight: '500',
    color: '#007AFF',
  },
});