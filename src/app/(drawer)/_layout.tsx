import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TOKEN_STORAGE_KEY } from '../../services/api';
import { clearSession } from '../../services/session';

type RouteParams = Record<string, string | string[] | undefined>;

interface HistoryEntry {
  href: string;
  key: string;
}

function buildHref(pathname: string, params: RouteParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params)
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item != null) {
            searchParams.append(key, String(item));
          }
        });

        return;
      }

      if (value != null) {
        searchParams.append(key, String(value));
      }
    });

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function createHistoryEntry(pathname: string, params: RouteParams): HistoryEntry {
  const href = buildHref(pathname, params);

  return {
    href,
    key: href,
  };
}

export default function DrawerLayout() {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useGlobalSearchParams() as RouteParams;
  const historyRef = useRef<HistoryEntry[]>([]);
  const currentEntry = useMemo(
    () => createHistoryEntry(pathname, searchParams),
    [pathname, searchParams]
  );

  async function handleLogout() {
    await clearSession();
    router.replace('/login');
  }

  useEffect(() => {
    async function checkAuth() {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token) {
        router.replace('/login');
      } else {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    const currentHistory = historyRef.current;
    const lastEntry = currentHistory[currentHistory.length - 1];

    if (lastEntry?.key === currentEntry.key) {
      return;
    }

    currentHistory.push(currentEntry);

    if (currentHistory.length > 50) {
      currentHistory.shift();
    }
  }, [currentEntry]);

  function handleBack() {
    const currentHistory = historyRef.current;

    while (currentHistory.length > 0) {
      const lastEntry = currentHistory[currentHistory.length - 1];

      if (lastEntry.key !== currentEntry.key) {
        break;
      }

      currentHistory.pop();
    }

    const previousEntry = currentHistory[currentHistory.length - 1];

    if (previousEntry) {
      router.replace(previousEntry.href as never);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(drawer)/projects');
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Drawer
      screenOptions={({ route }) => ({
        headerRight: () => {
          const isHomeScreen = route.name === 'index' || route.name === 'projects';

          if (isHomeScreen) {
            return (
              <TouchableOpacity onPress={handleLogout} style={styles.headerAction}>
                <Text style={[styles.headerActionText, styles.logoutText]}>Sair</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity onPress={handleBack} style={styles.headerAction}>
              <Text style={styles.headerActionText}>Voltar</Text>
            </TouchableOpacity>
          );
        },
      })}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Visão Geral',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen name="projects" options={{ title: 'Projetos' }} />
      <Drawer.Screen
        name="project-details"
        options={{
          title: 'Detalhe do projeto',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="project-form"
        options={{
          title: 'Projeto',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="sprint-form"
        options={{
          title: 'Sprint',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="create-project"
        options={{
          title: 'Criar projeto',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="tasks"
        options={{
          title: 'Tarefas',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="task-form"
        options={{
          title: 'Tarefa',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="project-progress"
        options={{
          title: 'Progresso do projeto',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="project-chat"
        options={{
          title: 'Chat do projeto',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerAction: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A1E32',
  },
  logoutText: {
    color: '#E53935',
  },
});
