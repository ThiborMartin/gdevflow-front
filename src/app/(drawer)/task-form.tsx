import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenState } from '../../components/ScreenState';
import { useUserRole } from '../../hooks/useUserRole';
import {
  completeTask,
  createTask,
  getTaskById,
  updateTask,
  updateTaskStatus,
} from '../../services/tasks';
import { theme } from '../../styles/theme';
import { CreateTaskPayload, UpdateTaskPayload } from '../../types/task';

const taskStatuses = [
  { label: 'A fazer', value: 'TODO' },
  { label: 'Em andamento', value: 'IN_PROGRESS' },
  { label: 'Concluida', value: 'DONE' },
  { label: 'Bloqueada', value: 'BLOCKED' },
];

interface TaskFormErrors {
  title?: string;
  description?: string;
  status?: string;
  project?: string;
  sprint?: string;
}

export default function TaskForm() {
  const params = useLocalSearchParams<{
    taskId?: string;
    projectId?: string;
    sprintId?: string;
    projectName?: string;
    sprintName?: string;
  }>();
  const taskId = useMemo(() => Number(params.taskId), [params.taskId]);
  const initialProjectId = useMemo(() => Number(params.projectId), [params.projectId]);
  const initialSprintId = useMemo(() => Number(params.sprintId), [params.sprintId]);
  const isEditMode = Number.isFinite(taskId) && taskId > 0;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [responsibleName, setResponsibleName] = useState('');
  const [projectId, setProjectId] = useState(
    Number.isFinite(initialProjectId) ? initialProjectId : 0
  );
  const [sprintId, setSprintId] = useState(
    Number.isFinite(initialSprintId) ? initialSprintId : 0
  );
  const [projectName, setProjectName] = useState(params.projectName || '');
  const [sprintName, setSprintName] = useState(params.sprintName || '');
  const [responsibleId, setResponsibleId] = useState<number | null>(null);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { isClient, loading: roleLoading } = useUserRole();

  useEffect(() => {
    async function loadTask() {
      if (!isEditMode) {
        return;
      }

      try {
        setLoading(true);
        setFormError('');
        const task = await getTaskById(taskId);

        setTitle(task.title || '');
        setDescription(task.description || '');
        setStatus(task.status || 'TODO');
        setResponsibleId(task.responsibleId || task.assigneeId || null);
        setResponsibleName(task.responsibleName || task.assigneeName || '');
        setProjectId(task.projectId || initialProjectId || 0);
        setSprintId(task.sprintId || initialSprintId || 0);
        setProjectName(task.projectName || params.projectName || '');
        setSprintName(task.sprintName || params.sprintName || '');
      } catch (loadError: any) {
        setFormError(
          loadError?.response?.data?.message ||
            'Nao foi possivel carregar os dados da tarefa.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadTask();
  }, [
    initialProjectId,
    initialSprintId,
    isEditMode,
    params.projectName,
    params.sprintName,
    taskId,
  ]);

  function clearFieldError(field: keyof TaskFormErrors) {
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setFormError('');
  }

  function validateForm() {
    const nextErrors: TaskFormErrors = {};
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      nextErrors.title = 'Informe o titulo da tarefa.';
    } else if (trimmedTitle.length < 3) {
      nextErrors.title = 'O titulo deve ter pelo menos 3 caracteres.';
    }

    if (!trimmedDescription) {
      nextErrors.description = 'Informe a descricao da tarefa.';
    } else if (trimmedDescription.length < 8) {
      nextErrors.description = 'A descricao deve ter pelo menos 8 caracteres.';
    }

    if (!status) {
      nextErrors.status = 'Selecione o status da tarefa.';
    }

    if (!projectId) {
      nextErrors.project = 'Projeto nao identificado.';
    }

    if (!sprintId) {
      nextErrors.sprint = 'Sprint nao identificada.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildPayload(): CreateTaskPayload | UpdateTaskPayload {
    return {
      title: title.trim(),
      description: description.trim(),
      status,
      projectId,
      sprintId,
      responsibleId,
      responsibleName: responsibleName.trim() || undefined,
      assigneeId: responsibleId,
      assigneeName: responsibleName.trim() || undefined,
    };
  }

  function goBackToSprintTasks() {
    router.replace({
      pathname: '/(drawer)/tasks',
      params: {
        projectId: String(projectId),
        sprintId: String(sprintId),
        projectName,
        sprintName,
      },
    });
  }

  async function handleSave() {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      if (isEditMode) {
        await updateTask(taskId, buildPayload() as UpdateTaskPayload);
        Alert.alert('Sucesso', 'Tarefa atualizada com sucesso.');
      } else {
        await createTask(projectId, sprintId, buildPayload() as CreateTaskPayload);
        Alert.alert('Sucesso', 'Tarefa criada com sucesso.');
      }

      goBackToSprintTasks();
    } catch (saveError: any) {
      setFormError(
        saveError?.response?.data?.message ||
          'Nao foi possivel salvar a tarefa.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate() {
    if (!isEditMode || !status) {
      return;
    }

    try {
      setStatusSaving(true);
      setFormError('');
      const updatedTask = await updateTaskStatus(taskId, status);
      setStatus(updatedTask.status || status);
      Alert.alert('Sucesso', 'Status atualizado com sucesso.');
    } catch (statusError: any) {
      setFormError(
        statusError?.response?.data?.message ||
          'Nao foi possivel atualizar o status da tarefa.'
      );
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleComplete() {
    if (!isEditMode) {
      return;
    }

    try {
      setCompleting(true);
      setFormError('');
      const updatedTask = await completeTask(taskId);
      setStatus(updatedTask.status || 'DONE');
      Alert.alert('Sucesso', 'Tarefa marcada como concluida.');
    } catch (completeError: any) {
      setFormError(
        completeError?.response?.data?.message ||
          'Nao foi possivel concluir a tarefa.'
      );
    } finally {
      setCompleting(false);
    }
  }

  if (roleLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ScreenState loading title="Carregando permissao..." />
      </View>
    );
  }

  if (isClient) {
    return (
      <View style={styles.blockedContainer}>
        <ScreenState
          title="Acesso restrito"
          description="Clientes podem apenas visualizar o progresso do projeto e das tarefas."
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ScreenState loading title="Carregando tarefa..." />
      </View>
    );
  }

  if (!projectId || !sprintId) {
    return (
      <View style={styles.blockedContainer}>
        <ScreenState
          title="Contexto invalido"
          description="Nao foi possivel identificar o projeto e a sprint desta tarefa."
        />
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
          {isEditMode ? 'Editar tarefa' : 'Nova tarefa'}
        </Text>
        <Text style={styles.subtitle}>
          Organize o backlog da sprint com titulo, descricao e status.
        </Text>

        <View style={styles.card}>
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Text style={styles.label}>Projeto vinculado</Text>
          <View style={styles.staticField}>
            <Text style={styles.staticValue}>{projectName || `Projeto #${projectId}`}</Text>
          </View>
          {errors.project ? <Text style={styles.errorText}>{errors.project}</Text> : null}

          <Text style={styles.label}>Sprint selecionada</Text>
          <View style={styles.staticField}>
            <Text style={styles.staticValue}>{sprintName || `Sprint #${sprintId}`}</Text>
          </View>
          {errors.sprint ? <Text style={styles.errorText}>{errors.sprint}</Text> : null}

          <Text style={styles.label}>Titulo</Text>
          <Input
            placeholder="Ex: Implementar tela mobile da sprint"
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              clearFieldError('title');
            }}
            error={errors.title}
          />

          <Text style={styles.label}>Descricao</Text>
          <Input
            placeholder="Resuma o que precisa ser feito"
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              clearFieldError('description');
            }}
            multiline
            numberOfLines={5}
            error={errors.description}
          />

          <Text style={styles.label}>Responsavel (opcional)</Text>
          <Input
            placeholder="Ex: Gabriel"
            value={responsibleName}
            onChangeText={(value) => {
              setResponsibleName(value);
              setFormError('');
            }}
          />

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusGrid}>
            {taskStatuses.map((item) => {
              const selected = item.value === status;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.statusOption, selected && styles.statusOptionSelected]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setStatus(item.value);
                    clearFieldError('status');
                  }}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      selected && styles.statusOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.status ? <Text style={styles.errorText}>{errors.status}</Text> : null}

          <Button
            title={saving ? 'Salvando...' : 'Salvar tarefa'}
            onPress={handleSave}
            disabled={saving || statusSaving || completing}
          />

          {isEditMode ? (
            <Button
              title={statusSaving ? 'Atualizando status...' : 'Atualizar status'}
              variant="secondary"
              onPress={handleStatusUpdate}
              disabled={saving || statusSaving || completing}
            />
          ) : null}

          {isEditMode && status !== 'DONE' ? (
            <Button
              title={completing ? 'Concluindo...' : 'Marcar como concluida'}
              variant="secondary"
              onPress={handleComplete}
              disabled={saving || statusSaving || completing}
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
  blockedContainer: {
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
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  staticField: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  staticValue: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '600',
  },
  statusGrid: {
    gap: 10,
    marginBottom: 8,
  },
  statusOption: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFF',
  },
  statusOptionSelected: {
    backgroundColor: '#FFF9D9',
    borderColor: theme.colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    color: '#4F5D6B',
    fontWeight: '600',
  },
  statusOptionTextSelected: {
    color: theme.colors.text,
  },
  errorText: {
    marginTop: -10,
    marginBottom: 12,
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
});
