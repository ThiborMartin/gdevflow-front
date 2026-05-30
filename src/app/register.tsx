import { Link, router } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { theme } from '../styles/theme';
import { UserRole } from '../types/auth';
import { isValidEmail, MIN_PASSWORD_LENGTH } from '../utils/validation';

type AccountRole = Exclude<UserRole, 'UNKNOWN'>;

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  form?: string;
}

const ACCOUNT_OPTIONS: { role: AccountRole; title: string; description: string }[] = [
  {
    role: 'FREELANCER',
    title: 'Sou Freelancer',
    description: 'Quero gerenciar projetos, sprints e tarefas.',
  },
  {
    role: 'CLIENT',
    title: 'Sou Cliente',
    description: 'Quero acompanhar projetos e entregas.',
  },
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AccountRole>('FREELANCER');
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

    if (!role) {
      nextErrors.role = 'Escolha como pretende usar o GDevFlow.';
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
        role,
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso');
      router.replace('/login');
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message as string | undefined;
      const apiErrors = error?.response?.data?.errors as
        | Partial<Record<keyof RegisterErrors, string>>
        | undefined;

      if (error?.response?.status === 409) {
        setErrors({
          email: apiMessage || 'Este email já está em uso.',
        });
        return;
      }

      if (apiErrors) {
        setErrors({
          name: apiErrors.name,
          email: apiErrors.email,
          password: apiErrors.password,
          role: apiErrors.role,
          form: apiMessage && apiMessage !== 'Payload inválido' ? apiMessage : undefined,
        });
        return;
      }

      setErrors({
        form: apiMessage || 'Não foi possível criar a conta. Verifique os dados e tente novamente.',
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

          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>Como você pretende usar o GDevFlow?</Text>
            <Text style={styles.roleHint}>
              Freelancer para gerenciar projetos ou Cliente para acompanhar entregas.
            </Text>

            <View style={styles.roleOptions}>
              {ACCOUNT_OPTIONS.map((option) => {
                const isSelected = role === option.role;

                return (
                  <TouchableOpacity
                    key={option.role}
                    style={[
                      styles.roleOption,
                      isSelected && styles.roleOptionSelected,
                      errors.role && styles.roleOptionWithError,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setRole(option.role);
                      clearFieldError('role');
                    }}
                  >
                    <View
                      style={[
                        styles.roleIndicator,
                        isSelected && styles.roleIndicatorSelected,
                      ]}
                    />

                    <View style={styles.roleTextContent}>
                      <Text
                        style={[
                          styles.roleOptionTitle,
                          isSelected && styles.roleOptionTitleSelected,
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text style={styles.roleOptionDescription}>{option.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {errors.role ? <Text style={styles.roleError}>{errors.role}</Text> : null}
          </View>

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
  roleSection: {
    marginBottom: 20,
  },
  roleLabel: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  roleHint: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  roleOptions: {
    gap: 10,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  roleOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF9D9',
  },
  roleOptionWithError: {
    borderColor: '#D32F2F',
  },
  roleIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#B7C0C8',
    marginRight: 12,
    backgroundColor: '#FFF',
  },
  roleIndicatorSelected: {
    borderColor: '#D8A700',
    backgroundColor: theme.colors.primary,
  },
  roleTextContent: {
    flex: 1,
  },
  roleOptionTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleOptionTitleSelected: {
    color: '#7A5E00',
  },
  roleOptionDescription: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  roleError: {
    marginTop: 8,
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
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
