import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { api, TOKEN_STORAGE_KEY } from '../services/api';
import { SocialButton } from '@/components/SocialButton';
import { isValidEmail } from '../utils/validation';

interface LoginErrors {
  email?: string;
  password?: string;
  form?: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);

  function validateForm() {
    const nextErrors: LoginErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Informe seu email.';
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = 'Informe um email válido.';
    }

    if (!password) {
      nextErrors.password = 'Informe sua senha.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setErrors((current) => ({ ...current, email: undefined, form: undefined }));
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setErrors((current) => ({ ...current, password: undefined, form: undefined }));
  }

  async function handleLogin() {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const { token } = response.data;

      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);

      Alert.alert('Sucesso', 'Login realizado com sucesso');
      router.replace('/(drawer)');
    } catch {
      setErrors({
        form: 'Email ou senha inválidos. Verifique os dados e tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Logo />

        <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <Input
          placeholder="Email"
          value={email}
          onChangeText={handleEmailChange}
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />

        <Input
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={handlePasswordChange}
          error={errors.password}
        />

        <Button
          title={loading ? 'Entrando...' : 'Entrar'}
          onPress={handleLogin}
          disabled={loading}
        />

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
  formError: {
    backgroundColor: '#FDECEA',
    color: '#B71C1C',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
