import { Link } from 'expo-router';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { theme } from '../styles/theme';

export default function Register() {
  return (
    <View style={styles.page}>
        <View style={styles.card}>
            <Logo />

            <Text style={styles.subtitle}>
                Crie sua conta no G Dev Flow
            </Text>

            <Input placeholder="Nome" />
            <Input placeholder="Email" />
            <Input placeholder="Senha" secureTextEntry />
            <Input placeholder="Confirmar senha" secureTextEntry />

            <Button title="Criar conta" />

            <Link href="./login" style={styles.link}>
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