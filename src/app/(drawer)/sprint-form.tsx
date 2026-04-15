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
import {
  createSprint,
  getSprintById,
  updateSprint,
} from '../../services/projects';
import { theme } from '../../styles/theme';
import { formatDate } from '../../utils/date';

const sprintStatuses = [
  { label: 'Planejada', value: 'PLANNED' },
  { label: 'Em andamento', value: 'IN_PROGRESS' },
  { label: 'Concluída', value: 'DONE' },
  { label: 'Cancelada', value: 'CANCELLED' },
];

type DateField = 'startDate' | 'endDate';

interface SprintFormErrors {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

function toApiDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function getPickerValue(value: string) {
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

export default function SprintForm() {
  const params = useLocalSearchParams<{
    projectId?: string;
    sprintId?: string;
  }>();
  const projectId = useMemo(() => Number(params.projectId), [params.projectId]);
  const sprintId = useMemo(() => Number(params.sprintId), [params.sprintId]);
  const isEditMode = Number.isFinite(sprintId) && sprintId > 0;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(toApiDate(new Date()));
  const [endDate, setEndDate] = useState(toApiDate(new Date()));
  const [status, setStatus] = useState('PLANNED');
  const [errors, setErrors] = useState<SprintFormErrors>({});
  const [activePicker, setActivePicker] = useState<DateField | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSprint() {
      if (!isEditMode) {
        return;
      }

      try {
        setLoading(true);
        const sprint = await getSprintById(sprintId);
        setName(sprint.name || '');
        setDescription(sprint.description || '');
        setStartDate(sprint.startDate || toApiDate(new Date()));
        setEndDate(sprint.endDate || toApiDate(new Date()));
        setStatus(sprint.status || 'PLANNED');
      } catch (error: any) {
        Alert.alert(
          'Erro ao carregar sprint',
          error?.response?.data?.message || 'Não foi possível carregar a sprint.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadSprint();
  }, [isEditMode, sprintId]);

  function validateForm() {
    const nextErrors: SprintFormErrors = {};
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      nextErrors.name = 'Informe o nome da sprint.';
    } else if (trimmedName.length < 3) {
      nextErrors.name = 'O nome deve ter pelo menos 3 caracteres.';
    }

    if (!trimmedDescription) {
      nextErrors.description = 'Informe a descrição da sprint.';
    } else if (trimmedDescription.length < 10) {
      nextErrors.description = 'A descrição deve ter pelo menos 10 caracteres.';
    }

    if (!startDate) {
      nextErrors.startDate = 'Selecione a data de início.';
    }

    if (!endDate) {
      nextErrors.endDate = 'Selecione a data de fim.';
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      nextErrors.endDate = 'A data de fim deve ser igual ou posterior à data de início.';
    }

    if (!status) {
      nextErrors.status = 'Selecione o status da sprint.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function clearFieldError(field: keyof SprintFormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleDateChange(field: DateField, event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== 'ios') {
      setActivePicker(null);
    }

    if (event.type === 'dismissed' || !date) {
      return;
    }

    const formattedDate = toApiDate(date);

    if (field === 'startDate') {
      setStartDate(formattedDate);
      setErrors((current) => ({
        ...current,
        startDate: undefined,
        endDate: undefined,
      }));
    } else {
      setEndDate(formattedDate);
      setErrors((current) => ({ ...current, endDate: undefined }));
    }
  }

  async function handleSave() {
    if (!validateForm()) {
      return;
    }

    if (!projectId) {
      Alert.alert(
        'Projeto inválido',
        'Não foi possível identificar o projeto da sprint.'
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        startDate,
        endDate,
        status,
      };

      if (isEditMode) {
        await updateSprint(sprintId, payload);
        Alert.alert('Sucesso', 'Sprint atualizada com sucesso.');
      } else {
        await createSprint(projectId, payload);
        Alert.alert('Sucesso', 'Sprint criada com sucesso.');
      }

      router.replace({
        pathname: '/(drawer)/project-details',
        params: { projectId: String(projectId) },
      });
    } catch (error: any) {
      Alert.alert(
        'Erro ao salvar sprint',
        error?.response?.data?.message || 'Não foi possível salvar a sprint.'
      );
    } finally {
      setSaving(false);
    }
  }

  function renderDateField(
    label: string,
    field: DateField,
    value: string,
    error?: string
  ) {
    const isPickerOpen = activePicker === field;

    return (
      <View style={styles.dateSection}>
        <Text style={styles.label}>{label}</Text>

        <TouchableOpacity
          style={[styles.dateInput, error && styles.dateInputError]}
          activeOpacity={0.85}
          onPress={() => setActivePicker((current) => (current === field ? null : field))}
        >
          <Text style={styles.dateValue}>{formatDate(value)}</Text>
          <Text style={styles.dateAction}>Selecionar</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isPickerOpen ? (
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={getPickerValue(value)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
              onChange={(event, selectedDate) =>
                handleDateChange(field, event, selectedDate)
              }
            />

            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                style={styles.closePickerButton}
                onPress={() => setActivePicker(null)}
              >
                <Text style={styles.closePickerText}>Fechar calendário</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ScreenState loading title="Carregando sprint..." />
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
          {isEditMode ? 'Editar sprint' : 'Nova sprint'}
        </Text>
        <Text style={styles.subtitle}>
          Cadastre o período, descrição e status da sprint dentro do projeto.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Nome</Text>
          <Input
            placeholder="Ex: Sprint 1"
            value={name}
            onChangeText={(value) => {
              setName(value);
              clearFieldError('name');
            }}
            error={errors.name}
          />

          <Text style={styles.label}>Descrição</Text>
          <Input
            placeholder="Descreva o objetivo da sprint"
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              clearFieldError('description');
            }}
            multiline
            numberOfLines={4}
            error={errors.description}
          />

          {renderDateField('Data de início', 'startDate', startDate, errors.startDate)}
          {renderDateField('Data de fim', 'endDate', endDate, errors.endDate)}

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusGrid}>
            {sprintStatuses.map((item) => {
              const selected = item.value === status;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.statusOption,
                    selected && styles.statusOptionSelected,
                  ]}
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
          {errors.status ? <Text style={styles.statusErrorText}>{errors.status}</Text> : null}

          <Button
            title={saving ? 'Salvando...' : 'Salvar sprint'}
            onPress={handleSave}
            disabled={saving}
          />
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
  errorText: {
    marginTop: 6,
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
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
  statusErrorText: {
    marginBottom: 12,
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
});
