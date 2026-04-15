import { Link, router } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { api } from '../services/api';
import { isValidEmail, MIN_PASSWORD_LENGTH } from '../utils/validation';

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);

  function validateForm() {
    const nextErrors: RegisterErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      nextErrors.name = 'Informe seu nome.';
    } else if (trimmedName.length < 2) {
      nextErrors.name = 'O nome deve ter pelo menos 2 caracteres.';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Informe seu email.';
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = 'Informe um email válido.';
    }

    if (!password) {
      nextErrors.password = 'Informe uma senha.';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirme sua senha.';
    } else if (password && confirmPassword !== password) {
      nextErrors.confirmPassword = 'As senhas não coincidem.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function clearFieldError(field: keyof RegisterErrors) {
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  async function handleRegister() {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso');
      router.replace('/login');
    } catch (error: any) {
      setErrors({
        form:
          error?.response?.data?.message ||
          'Não foi possível criar a conta. Verifique os dados e tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Logo />

          <Text style={styles.subtitle}>Crie sua conta no G Dev Flow</Text>

          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

          <Input
            placeholder="Nome"
            value={name}
            onChangeText={(value) => {
              setName(value);
              clearFieldError('name');
            }}
            error={errors.name}
          />

          <Input
            placeholder="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearFieldError('email');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.email}
          />

          <Input
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              clearFieldError('password');
              clearFieldError('confirmPassword');
            }}
            error={errors.password}
          />

          <Text style={styles.helperText}>
            Use pelo menos {MIN_PASSWORD_LENGTH} caracteres.
          </Text>

          <Input
            placeholder="Confirmar senha"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              clearFieldError('confirmPassword');
            }}
            error={errors.confirmPassword}
          />

          <Button
            title={loading ? 'Criando conta...' : 'Criar conta'}
            onPress={handleRegister}
            disabled={loading}
          />

          <Link href="/login" style={styles.link}>
            Voltar para login
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  helperText: {
    marginTop: -10,
    marginBottom: 14,
    color: '#777',
    fontSize: 12,
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
    color: '#007AFF',
  },
});
