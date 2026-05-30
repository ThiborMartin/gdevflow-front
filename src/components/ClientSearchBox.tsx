import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { searchClientsByEmail } from '../services/clients';
import { theme } from '../styles/theme';
import { ClientSearchResult } from '../types/client';
import { Button } from './Button';
import { Input } from './Input';

interface ClientSearchBoxProps {
  onSelectClient?: (client: ClientSearchResult | null) => void;
}

export function ClientSearchBox({ onSelectClient }: ClientSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  function handleQueryChange(value: string) {
    setQuery(value);
    setError('');
  }

  async function handleSearch() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError('Informe um email para buscar clientes.');
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setHasSearched(true);

      const data = await searchClientsByEmail(trimmedQuery);
      setResults(data);
    } catch (searchError: any) {
      setResults([]);
      setError(
        searchError?.response?.data?.message || 'Não foi possível buscar clientes agora.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectClient(client: ClientSearchResult) {
    setSelectedClient(client);
    onSelectClient?.(client);
  }

  function clearSelection() {
    setSelectedClient(null);
    onSelectClient?.(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar cliente por e-mail</Text>
      <Text style={styles.description}>
        Localize um cliente cadastrado e selecione-o para vincular ao projeto.
      </Text>

      <Input
        placeholder="Ex: cliente@email.com"
        value={query}
        onChangeText={handleQueryChange}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        title={loading ? 'Buscando...' : 'Buscar'}
        onPress={handleSearch}
        disabled={loading}
      />

      {selectedClient ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>Cliente selecionado</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={clearSelection}>
              <Text style={styles.clearAction}>Limpar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.selectedName}>{selectedClient.name}</Text>
          <Text style={styles.selectedEmail}>{selectedClient.email}</Text>
        </View>
      ) : null}

      {hasSearched && !loading && !error && results.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum cliente encontrado.</Text>
      ) : null}

      {results.length > 0 ? (
        <View style={styles.resultsList}>
          {results.map((client) => {
            const isSelected = selectedClient?.id === client.id;

            return (
              <TouchableOpacity
                key={client.id}
                style={[styles.resultCard, isSelected && styles.resultCardSelected]}
                activeOpacity={0.88}
                onPress={() => handleSelectClient(client)}
              >
                <View style={styles.resultTextBlock}>
                  <Text style={styles.resultName}>{client.name}</Text>
                  <Text style={styles.resultEmail}>{client.email}</Text>
                </View>
                <Text style={styles.resultRole}>Cliente</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  description: {
    marginTop: 6,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
  },
  errorText: {
    marginTop: -6,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#D32F2F',
  },
  selectedCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  clearAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  selectedEmail: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.muted,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 13,
    color: theme.colors.muted,
  },
  resultsList: {
    marginTop: 14,
    gap: 10,
  },
  resultCard: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  resultCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF9D9',
  },
  resultTextBlock: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  resultEmail: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.muted,
  },
  resultRole: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7A5E00',
    textTransform: 'uppercase',
  },
});
