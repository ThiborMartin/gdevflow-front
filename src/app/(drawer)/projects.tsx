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
import { ClientProjectCard } from '../../components/ClientProjectCard';
import { ProjectStatusBadge } from '../../components/ProjectStatusBadge';
import { ScreenState } from '../../components/ScreenState';
import { useUserRole } from '../../hooks/useUserRole';
import { getClientProjects } from '../../services/client-projects';
import { getProjects } from '../../services/projects';
import { theme } from '../../styles/theme';
import { ClientProject } from '../../types/client-project';
import { Project } from '../../types/project';
import { formatDate } from '../../utils/date';

export default function Projects() {
  const [freelancerProjects, setFreelancerProjects] = useState<Project[]>([]);
  const [clientProjects, setClientProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { isClient, loading: roleLoading } = useUserRole();

  const loadProjects = useCallback(
    async (showLoader = true) => {
      if (roleLoading) {
        return;
      }

      try {
        setError('');

        if (showLoader) {
          setLoading(true);
        }

        if (isClient) {
          const data = await getClientProjects();
          setClientProjects(data);
          setFreelancerProjects([]);
        } else {
          const data = await getProjects();
          setFreelancerProjects(data);
          setClientProjects([]);
        }
      } catch (loadError: any) {
        setError(
          loadError?.response?.data?.message ||
            'Nao foi possivel buscar seus projetos.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isClient, roleLoading]
  );

  useFocusEffect(
    useCallback(() => {
      if (!roleLoading) {
        loadProjects();
      }
    }, [loadProjects, roleLoading])
  );

  async function handleRefresh() {
    if (roleLoading) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    await loadProjects(false);
  }

  function openProject(project: { id: number; name: string }) {
    if (isClient) {
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

  if (loading || roleLoading) {
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

  if (isClient) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Meus Projetos</Text>
          <Text style={styles.subtitle}>
            Acompanhe os projetos vinculados ao seu perfil.
          </Text>
        </View>

        <FlatList
          data={clientProjects}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={
            clientProjects.length === 0 ? styles.emptyContent : styles.listContent
          }
          ListEmptyComponent={
            <ScreenState
              title="Voce ainda nao possui projetos vinculados."
              description="Quando um freelancer adicionar voce a um projeto, ele aparecera aqui."
            />
          }
          renderItem={({ item }) => (
            <ClientProjectCard project={item} onPress={() => openProject(item)} />
          )}
        />
      </View>
    );
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

      <FlatList
        data={freelancerProjects}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={
          freelancerProjects.length === 0 ? styles.emptyContent : styles.listContent
        }
        ListEmptyComponent={
          <ScreenState
            title="Nenhum projeto encontrado"
            description="Crie seu primeiro projeto para comecar a organizar as sprints."
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

            <Text style={styles.createdAt}>
              Criado em {formatDate(item.createdAt)}
            </Text>
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
