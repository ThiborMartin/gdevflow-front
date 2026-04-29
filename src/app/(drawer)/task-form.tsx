import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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
import { StatusBadge } from '../../components/StatusBadge';
import { useUserRole } from '../../hooks/useUserRole';
import {
  completeTask,
  createTask,
  getTaskById,
  getSprintTasks,
  updateTask,
  updateTaskStatus,
} from '../../services/tasks';
import { theme } from '../../styles/theme';
import { CreateTaskPayload, Task, UpdateTaskPayload } from '../../types/task';
import {
  TASK_STATUS_OPTIONS,
  getIncompleteTaskDependencies,
  normalizeTaskStatus,
  resolveTaskDependencies,
} from '../../utils/task';
import { formatDate, getDatePickerValue, toApiDate } from '../../utils/date';

type DateField = 'dueDate';

interface TaskFormErrors {
  title?: string;
  description?: string;
  dueDate?: string;
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
  const [dueDate, setDueDate] = useState(toApiDate(new Date()));
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
  const [selectedDependencyIds, setSelectedDependencyIds] = useState<number[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [formError, setFormError] = useState('');
  const [activePicker, setActivePicker] = useState<DateField | null>(null);
  const [loading, setLoading] = useState(isEditMode || !initialProjectId || !initialSprintId);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { isClient, loading: roleLoading } = useUserRole();

  const dependencyCandidates = useMemo(
    () => availableTasks.filter((task) => task.id !== taskId),
    [availableTasks, taskId]
  );
  const selectedDependencyTasks = useMemo(
    () => dependencyCandidates.filter((task) => selectedDependencyIds.includes(task.id)),
    [dependencyCandidates, selectedDependencyIds]
  );
  const selectedTaskPreview = useMemo<Task>(
    () => ({
      id: taskId || -1,
      title,
      description,
      status,
      dueDate,
      sprintId,
      sprintName,
      projectId,
      projectName,
      responsibleId,
      responsibleName,
      assigneeId: responsibleId,
      assigneeName: responsibleName,
      dependencyTaskIds: selectedDependencyIds,
    }),
    [
      description,
      dueDate,
      projectId,
      projectName,
      responsibleId,
      responsibleName,
      selectedDependencyIds,
      sprintId,
      sprintName,
      status,
      taskId,
      title,
    ]
  );
  const incompleteDependencies = useMemo(
    () => getIncompleteTaskDependencies(selectedTaskPreview, dependencyCandidates),
    [dependencyCandidates, selectedTaskPreview]
  );
  const allDependenciesResolved = incompleteDependencies.length === 0;

  useEffect(() => {
    async function loadFormData() {
      try {
        setLoading(true);
        setFormError('');

        let nextProjectId = initialProjectId || 0;
        let nextSprintId = initialSprintId || 0;
        let currentTask: Task | null = null;

        if (isEditMode) {
          currentTask = await getTaskById(taskId);
          nextProjectId = currentTask.projectId || nextProjectId;
          nextSprintId = currentTask.sprintId || nextSprintId;
        }

        const sprintTasks =
          nextProjectId && nextSprintId
            ? await getSprintTasks(nextProjectId, nextSprintId)
            : [];

        setAvailableTasks(sprintTasks);
        setProjectId(nextProjectId);
        setSprintId(nextSprintId);

        if (currentTask) {
          setTitle(currentTask.title || '');
          setDescription(currentTask.description || '');
          setStatus(currentTask.status || 'TODO');
          setDueDate(currentTask.dueDate || toApiDate(new Date()));
          setResponsibleId(currentTask.responsibleId || currentTask.assigneeId || null);
          setResponsibleName(currentTask.responsibleName || currentTask.assigneeName || '');
          setProjectName(currentTask.projectName || params.projectName || '');
          setSprintName(currentTask.sprintName || params.sprintName || '');
          setSelectedDependencyIds(currentTask.dependencyTaskIds || []);
        }
      } catch (loadError: any) {
        setFormError(
          loadError?.response?.data?.message ||
            'Nao foi possivel carregar os dados da tarefa.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadFormData();
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

    if (!dueDate) {
      nextErrors.dueDate = 'Selecione a data limite da tarefa.';
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

    if (normalizeTaskStatus(status) === 'DONE' && !allDependenciesResolved) {
      nextErrors.status = 'Conclua antes as tarefas dependentes.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildPayload(): CreateTaskPayload | UpdateTaskPayload {
    return {
      title: title.trim(),
      description: description.trim(),
      status,
      dueDate,
      projectId,
      sprintId,
      responsibleId,
      responsibleName: responsibleName.trim() || undefined,
      assigneeId: responsibleId,
      assigneeName: responsibleName.trim() || undefined,
      dependencyTaskIds: selectedDependencyIds,
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

  function toggleDependency(dependencyId: number) {
    setSelectedDependencyIds((currentIds) => {
      if (currentIds.includes(dependencyId)) {
        return currentIds.filter((id) => id !== dependencyId);
      }

      return [...currentIds, dependencyId];
    });
    setFormError('');
    setErrors((currentErrors) => ({
      ...currentErrors,
      status: undefined,
    }));
  }

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== 'ios') {
      setActivePicker(null);
    }

    if (event.type === 'dismissed' || !date) {
      return;
    }

    setDueDate(toApiDate(date));
    clearFieldError('dueDate');
  }

  function ensureCompletionAllowed() {
    if (allDependenciesResolved) {
      return true;
    }

    Alert.alert(
      'Dependencias pendentes',
      `Conclua primeiro: ${incompleteDependencies
        .map((dependency) => dependency.title)
        .join(', ')}.`
    );

    return false;
  }

  async function handleSave() {
    if (!validateForm()) {
      return;
    }

    if (normalizeTaskStatus(status) === 'DONE' && !ensureCompletionAllowed()) {
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

    if (normalizeTaskStatus(status) === 'DONE' && !ensureCompletionAllowed()) {
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

    if (!ensureCompletionAllowed()) {
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
          Organize o backlog com data limite, dependencias e status da entrega.
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

          <View style={styles.dateSection}>
            <Text style={styles.label}>Data limite</Text>
            <TouchableOpacity
              style={[styles.dateInput, errors.dueDate && styles.dateInputError]}
              activeOpacity={0.85}
              onPress={() =>
                setActivePicker((currentPicker) =>
                  currentPicker === 'dueDate' ? null : 'dueDate'
                )
              }
            >
              <Text style={styles.dateValue}>{formatDate(dueDate)}</Text>
              <Text style={styles.dateAction}>Selecionar</Text>
            </TouchableOpacity>
            {errors.dueDate ? <Text style={styles.errorText}>{errors.dueDate}</Text> : null}

            {activePicker === 'dueDate' ? (
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={getDatePickerValue(dueDate)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                  onChange={handleDateChange}
                />

                {Platform.OS === 'ios' ? (
                  <TouchableOpacity
                    style={styles.closePickerButton}
                    onPress={() => setActivePicker(null)}
                  >
                    <Text style={styles.closePickerText}>Fechar calendario</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>

          <Text style={styles.label}>Responsavel (opcional)</Text>
          <Input
            placeholder="Ex: Gabriel"
            value={responsibleName}
            onChangeText={(value) => {
              setResponsibleName(value);
              setFormError('');
            }}
          />

          <Text style={styles.label}>Dependencias da tarefa</Text>
          <Text style={styles.helperText}>
            Esta tarefa so podera ser concluida depois que todas as dependencias estiverem concluidas.
          </Text>

          {dependencyCandidates.length === 0 ? (
            <View style={styles.dependenciesEmptyState}>
              <Text style={styles.dependenciesEmptyText}>
                Nenhuma outra tarefa disponivel nesta sprint para vincular como dependencia.
              </Text>
            </View>
          ) : (
            <View style={styles.dependenciesList}>
              {dependencyCandidates.map((dependencyTask) => {
                const selected = selectedDependencyIds.includes(dependencyTask.id);

                return (
                  <TouchableOpacity
                    key={dependencyTask.id}
                    style={[
                      styles.dependencyOption,
                      selected && styles.dependencyOptionSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => toggleDependency(dependencyTask.id)}
                  >
                    <View style={styles.dependencyHeader}>
                      <View style={styles.dependencyTextBlock}>
                        <Text style={styles.dependencyTitle}>{dependencyTask.title}</Text>
                        {dependencyTask.dueDate ? (
                          <Text style={styles.dependencyMeta}>
                            Limite: {formatDate(dependencyTask.dueDate)}
                          </Text>
                        ) : null}
                      </View>

                      <StatusBadge status={dependencyTask.status} />
                    </View>

                    <Text style={styles.dependencyToggleText}>
                      {selected ? 'Selecionada como dependencia' : 'Toque para marcar como dependencia'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {selectedDependencyTasks.length > 0 ? (
            <View style={styles.selectedDependenciesCard}>
              <Text style={styles.selectedDependenciesTitle}>Dependencias selecionadas</Text>
              {resolveTaskDependencies(selectedTaskPreview, dependencyCandidates).map(
                (dependency) => (
                  <Text key={dependency.id} style={styles.selectedDependencyItem}>
                    - {dependency.title}
                  </Text>
                )
              )}
            </View>
          ) : null}

          {!allDependenciesResolved ? (
            <Text style={styles.blockedNotice}>
              Conclusao bloqueada ate finalizar: {incompleteDependencies
                .map((dependency) => dependency.title)
                .join(', ')}.
            </Text>
          ) : null}

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusGrid}>
            {TASK_STATUS_OPTIONS.map((item) => {
              const selected = item.value === status;
              const blockedByDependency =
                item.value === 'DONE' && !allDependenciesResolved && !selected;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.statusOption,
                    selected && styles.statusOptionSelected,
                    blockedByDependency && styles.statusOptionBlocked,
                  ]}
                  activeOpacity={0.85}
                  disabled={blockedByDependency}
                  onPress={() => {
                    setStatus(item.value);
                    clearFieldError('status');
                  }}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      selected && styles.statusOptionTextSelected,
                      blockedByDependency && styles.statusOptionTextBlocked,
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

          {isEditMode && normalizeTaskStatus(status) !== 'DONE' ? (
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
  helperText: {
    marginTop: -2,
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
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
  dateSection: {
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputError: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFF8F8',
  },
  dateValue: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dateAction: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  pickerWrapper: {
    marginTop: 8,
  },
  closePickerButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  closePickerText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dependenciesEmptyState: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  dependenciesEmptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },
  dependenciesList: {
    gap: 10,
    marginBottom: 16,
  },
  dependencyOption: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFF',
  },
  dependencyOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFBEA',
  },
  dependencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dependencyTextBlock: {
    flex: 1,
  },
  dependencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dependencyMeta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dependencyToggleText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  selectedDependenciesCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  selectedDependenciesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  selectedDependencyItem: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
  blockedNotice: {
    marginBottom: 16,
    fontSize: 12,
    lineHeight: 18,
    color: '#B71C1C',
    fontWeight: '700',
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
  statusOptionBlocked: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F1B5B5',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#4F5D6B',
    fontWeight: '600',
  },
  statusOptionTextSelected: {
    color: theme.colors.text,
  },
  statusOptionTextBlocked: {
    color: '#B45309',
  },
  errorText: {
    marginTop: -10,
    marginBottom: 12,
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
});
