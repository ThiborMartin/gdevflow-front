import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenState } from '../../components/ScreenState';
import { useUserRole } from '../../hooks/useUserRole';
import { getProjectMessages, sendProjectMessage } from '../../services/messages';
import { getProjectProgress } from '../../services/tasks';
import { theme } from '../../styles/theme';
import { ProjectMessage } from '../../types/chat';
import { ProjectProgress } from '../../types/progress';

function formatMessageTimestamp(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export default function ProjectChatScreen() {
  const params = useLocalSearchParams<{ projectId?: string; projectName?: string }>();
  const projectId = useMemo(() => Number(params.projectId), [params.projectId]);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress | null>(null);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const { role, isClient, loading: roleLoading } = useUserRole();

  const chatEnabled = Boolean(projectProgress?.client);
  const counterpartName = useMemo(() => {
    if (!projectProgress) {
      return '';
    }

    return isClient
      ? projectProgress.freelancer?.name || ''
      : projectProgress.client?.name || '';
  }, [isClient, projectProgress]);

  const loadChat = useCallback(
    async (showLoader = true) => {
      if (!projectId) {
        setError('Projeto invalido para carregar o chat.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setError('');

        if (showLoader) {
          setLoading(true);
        }

        const [progressData, messagesData] = await Promise.all([
          getProjectProgress(projectId),
          getProjectMessages(projectId),
        ]);

        setProjectProgress(progressData);
        setMessages(messagesData);
      } catch (loadError: any) {
        setError(
          loadError?.response?.data?.message ||
            'Nao foi possivel carregar a conversa deste projeto.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId]
  );

  useFocusEffect(
    useCallback(() => {
      void loadChat();

      if (!projectId) {
        return undefined;
      }

      const intervalId = setInterval(() => {
        void loadChat(false);
      }, 5000);

      return () => clearInterval(intervalId);
    }, [loadChat, projectId])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadChat(false);
  }

  async function handleSendMessage() {
    const trimmedMessage = messageContent.trim();

    if (!projectId || !trimmedMessage || sending || !chatEnabled) {
      return;
    }

    try {
      setSending(true);
      setError('');

      const createdMessage = await sendProjectMessage(projectId, trimmedMessage);
      setMessages((currentMessages) => [...currentMessages, createdMessage]);
      setMessageContent('');
    } catch (sendError: any) {
      setError(
        sendError?.response?.data?.message ||
          'Nao foi possivel enviar sua mensagem agora.'
      );
    } finally {
      setSending(false);
    }
  }

  if (loading || roleLoading) {
    return (
      <View style={styles.stateContainer}>
        <ScreenState loading title="Carregando conversa..." />
      </View>
    );
  }

  if (error && !projectProgress) {
    return (
      <View style={styles.stateContainer}>
        <ScreenState title="Erro ao carregar chat" description={error} />
        <View style={styles.retryWrapper}>
          <Button title="Tentar novamente" onPress={() => loadChat()} />
        </View>
      </View>
    );
  }

  if (!projectProgress) {
    return (
      <View style={styles.stateContainer}>
        <ScreenState
          title="Chat indisponivel"
          description="Nao foi possivel identificar o projeto desta conversa."
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>CHAT DO PROJETO</Text>
          <Text style={styles.title}>
            {projectProgress.projectName || params.projectName || 'Projeto selecionado'}
          </Text>
          <Text style={styles.subtitle}>
            {counterpartName
              ? `Conversa com ${counterpartName}.`
              : 'Conversa entre freelancer e cliente deste projeto.'}
          </Text>

          {!chatEnabled ? (
            <Text style={styles.notice}>
              Vincule um cliente ao projeto para liberar a conversa.
            </Text>
          ) : null}
        </View>

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}

        <View style={styles.messagesCard}>
          {messages.length === 0 ? (
            <ScreenState
              title="Nenhuma mensagem ainda"
              description={
                chatEnabled
                  ? 'Envie a primeira mensagem para iniciar a conversa deste projeto.'
                  : 'O chat ficara disponivel assim que um cliente for vinculado ao projeto.'
              }
            />
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderRole === role;

              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    isOwnMessage && styles.ownMessageRow,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
                    ]}
                  >
                    <Text style={styles.messageAuthor}>
                      {isOwnMessage ? 'Voce' : message.senderName || 'Participante'}
                    </Text>
                    <Text
                      style={[
                        styles.messageContent,
                        isOwnMessage && styles.ownMessageContent,
                      ]}
                    >
                      {message.content}
                    </Text>
                    <Text
                      style={[
                        styles.messageTimestamp,
                        isOwnMessage && styles.ownMessageTimestamp,
                      ]}
                    >
                      {formatMessageTimestamp(message.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.composerCard}>
          <Text style={styles.composerTitle}>Nova mensagem</Text>
          <Text style={styles.composerSubtitle}>
            Use este espaco para alinhar entregas, feedbacks e proximos passos.
          </Text>

          <Input
            placeholder="Escreva sua mensagem..."
            value={messageContent}
            onChangeText={setMessageContent}
            multiline
            numberOfLines={4}
            editable={!sending && chatEnabled}
          />

          <Button
            title={sending ? 'Enviando...' : 'Enviar mensagem'}
            onPress={handleSendMessage}
            disabled={!messageContent.trim() || sending || !chatEnabled}
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
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F4F6F8',
  },
  retryWrapper: {
    paddingHorizontal: 24,
  },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: theme.colors.muted,
  },
  title: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#465465',
  },
  notice: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 20,
    color: '#92400E',
    fontWeight: '700',
  },
  inlineError: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FDECEA',
    color: '#B71C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  messagesCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
    gap: 12,
  },
  messageRow: {
    alignItems: 'flex-start',
  },
  ownMessageRow: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  otherMessageBubble: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  ownMessageBubble: {
    backgroundColor: '#0A1E32',
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
  },
  ownMessageContent: {
    color: '#FFF',
  },
  messageTimestamp: {
    marginTop: 8,
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  ownMessageTimestamp: {
    color: '#CBD5E1',
  },
  composerCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  composerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  composerSubtitle: {
    marginTop: 6,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
  },
});
