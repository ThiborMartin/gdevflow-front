import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenState } from '../../components/ScreenState';
import {
  closeProject,
  createProject,
  getProjectById,
  updateProject,
} from '../../services/projects';
import { theme } from '../../styles/theme';

export default function ProjectForm() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = useMemo(() => Number(params.projectId), [params.projectId]);
  const isEditMode = Number.isFinite(projectId) && projectId > 0;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProject() {
      if (!isEditMode) {
        return;
      }

      try {
        setLoading(true);
        const project = await getProjectById(projectId);
        setName(project.name || '');
        setDescription(project.description || '');
        setStatus(project.status);
      } catch (error: any) {
        Alert.alert(
          'Erro ao carregar projeto',
          error?.response?.data?.message || 'Não foi possível carregar o projeto.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [isEditMode, projectId]);

  async function handleSave() {
    if (!name.trim() || !description.trim()) {
      Alert.alert('Campos obrigatórios', 'Informe nome e descrição do projeto.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        description: description.trim(),
      };

      if (isEditMode) {
        await updateProject(projectId, payload);
        Alert.alert('Sucesso', 'Projeto atualizado com sucesso.');
        router.back();
      } else {
        await createProject(payload);
        Alert.alert('Sucesso', 'Projeto criado com sucesso.');
        router.replace('/(drawer)/projects');
      }
    } catch (error: any) {
      Alert.alert(
        'Erro ao salvar projeto',
        error?.response?.data?.message || 'Não foi possível salvar o projeto.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCloseProject() {
    Alert.alert(
      'Encerrar projeto',
      'Tem certeza que deseja encerrar este projeto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await closeProject(projectId);
              Alert.alert('Sucesso', 'Projeto encerrado com sucesso.');
              router.back();
            } catch (error: any) {
              Alert.alert(
                'Erro ao encerrar projeto',
                error?.response?.data?.message ||
                  'Não foi possível encerrar o projeto.'
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ScreenState loading title="Carregando projeto..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {isEditMode ? 'Editar projeto' : 'Novo projeto'}
        </Text>
        <Text style={styles.subtitle}>
          Preencha as informações principais para organizar seu trabalho.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Nome</Text>
          <Input
            placeholder="Ex: Aplicativo institucional"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Descrição</Text>
          <Input
            placeholder="Descreva brevemente o escopo do projeto"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
          />

          <Button
            title={saving ? 'Salvando...' : 'Salvar projeto'}
            onPress={handleSave}
            disabled={saving}
          />

          {isEditMode && status?.toUpperCase() !== 'CLOSED' ? (
            <Button
              title="Encerrar projeto"
              variant="danger"
              onPress={handleCloseProject}
              disabled={saving}
            />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
