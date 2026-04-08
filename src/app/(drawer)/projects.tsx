import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { ScreenState } from '../../components/ScreenState';
import { StatusBadge } from '../../components/StatusBadge';
import { getProjects } from '../../services/projects';
import { theme } from '../../styles/theme';
import { Project } from '../../types/project';
import { formatDate } from '../../utils/date';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadProjects(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await getProjects();
      setProjects(data);
    } catch (error: any) {
      Alert.alert(
        'Erro ao carregar projetos',
        error?.response?.data?.message || 'Não foi possível buscar seus projetos.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadProjects(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus projetos</Text>
        <Text style={styles.subtitle}>
          Organize seus projetos e acesse as sprints de cada entrega.
        </Text>

        <Button
          title="Novo projeto"
          onPress={() => router.push('/(drawer)/project-form')}
        />
      </View>

      {loading ? (
        <ScreenState loading title="Carregando projetos..." />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={
            projects.length === 0 ? styles.emptyContent : styles.listContent
          }
          ListEmptyComponent={
            <ScreenState
              title="Nenhum projeto encontrado"
              description="Crie seu primeiro projeto para começar a organizar as sprints."
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/(drawer)/project-details',
                  params: { projectId: item.id },
                })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.projectName}>{item.name}</Text>
                <StatusBadge status={item.status} />
              </View>

              <Text style={styles.description} numberOfLines={2}>
                {item.description || 'Sem descrição cadastrada.'}
              </Text>

              <Text style={styles.createdAt}>
                Criado em {formatDate(item.createdAt)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 8,
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    gap: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  description: {
    marginTop: 12,
    color: '#4F5D6B',
    fontSize: 14,
    lineHeight: 20,
  },
  createdAt: {
    marginTop: 16,
    color: theme.colors.muted,
    fontSize: 12,
  },
});
