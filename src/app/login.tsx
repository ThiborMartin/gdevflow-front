import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { api } from '../services/api';
import { SocialButton } from '@/components/SocialButton';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!email || !password) {
        Alert.alert('Erro', 'Preencha email e senha');
        return;
        }

        try {
        setLoading(true);

        const response = await api.post('/auth/login', {
            email,
            password,
        });

        const { token } = response.data;

        await AsyncStorage.setItem('@gdevflow:token', token);

        // redireciona pro app logado
        Alert.alert('Sucesso', 'Login realizado com sucesso');
        router.replace('/(drawer)');
        } catch (error: any) {
        Alert.alert(
            'Erro ao logar',
            error?.response?.data?.message || 'Credenciais inválidas'
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
          Acesse sua conta para continuar
        </Text>

        <Input 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} />
        
        <Input placeholder="Senha" 
        secureTextEntry value={password} 
        onChangeText={setPassword} />

        <Button 
        title={loading ? 'Entrando...' : 'Entrar'}
        onPress={handleLogin}
        disabled={loading} />

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