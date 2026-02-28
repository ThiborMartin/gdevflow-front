import { Link, router } from 'expo-router';
import { StyleSheet, Text, View, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { api } from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);

      await api.post('/auth/register', {
        name,
        email,
        password,
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso');
      router.replace('/login');
    } catch (error: any) {
      console.error(error);

      Alert.alert(
        'Erro ao cadastrar',
        error?.response?.data?.message || 'Erro inesperado'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Logo />

        <Text style={styles.subtitle}>
          Crie sua conta no G Dev Flow
        </Text>

        <Input
          placeholder="Nome"
          value={name}
          onChangeText={setName}
        />

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Input
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Input
          placeholder="Confirmar senha"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
        marginTop: 16,
        textAlign: 'center',
        fontWeight: '500',
        color: '#007AFF',
    },
});