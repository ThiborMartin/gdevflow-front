import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { ProjectStatusBadge } from '../../components/ProjectStatusBadge';
import { ScreenState } from '../../components/ScreenState';
import { useUserRole } from '../../hooks/useUserRole';
import { getProjects } from '../../services/projects';
import { theme } from '../../styles/theme';
import { Project } from '../../types/project';
import { formatDate } from '../../utils/date';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { isClient, loading: roleLoading } = useUserRole();

  async function loadProjects(showLoader = true) {
    try {
      setError('');

      if (showLoader) {
        setLoading(true);
      }

      const data = await getProjects();
      setProjects(data);
    } catch (loadError: any) {
      setError(
        loadError?.response?.data?.message ||
          'Nao foi possivel buscar seus projetos.'
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

  function openProject(project: Project) {
    if (!roleLoading && isClient) {
      router.push({
        pathname: './project-progress',
        params: {
          projectId: project.id,
          projectName: project.name,
        },
      });
      return;
    }

    router.push({
      pathname: '/(drawer)/project-details',
      params: {
        projectId: project.id,
        projectName: project.name,
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenState loading title="Carregando projetos..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScreenState title="Erro ao carregar projetos" description={error} />
        <Button title="Tentar novamente" onPress={() => loadProjects()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isClient ? 'Projetos acompanhados' : 'Meus projetos'}</Text>
        <Text style={styles.subtitle}>
          {isClient
            ? 'Acesse o progresso dos projetos, sprints e tarefas em tempo real.'
            : 'Organize seus projetos e acesse as sprints de cada entrega.'}
        </Text>

        {!roleLoading && !isClient ? (
          <Button
            title="Novo projeto"
            onPress={() => router.push('/(drawer)/project-form')}
          />
        ) : null}
      </View>

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
            description={
              isClient
                ? 'Assim que um projeto for vinculado a voce, ele aparecera aqui.'
                : 'Crie seu primeiro projeto para comecar a organizar as sprints.'
            }
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => openProject(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.projectName}>{item.name}</Text>
              <ProjectStatusBadge status={item.status} />
            </View>

            <Text style={styles.description} numberOfLines={2}>
              {item.description || 'Sem descricao cadastrada.'}
            </Text>

            <Text style={styles.createdAt}>Criado em {formatDate(item.createdAt)}</Text>
          </TouchableOpacity>
        )}
      />
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
