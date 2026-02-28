import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { theme } from '../../styles/theme';

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visão Geral</Text>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Projetos</Text>
          <Text style={styles.cardValue}>3 ativos</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tarefas</Text>
          <Text style={styles.cardValue}>12 pendentes</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Atrasos</Text>
          <Text style={styles.cardValue}>2 tarefas</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F4F6F8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
  },
  cards: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    width: 220,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    color: theme.colors.text,
  },
});