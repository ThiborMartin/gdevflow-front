import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { TOKEN_STORAGE_KEY } from '../../services/api';

export default function DrawerLayout() {
  const [loading, setLoading] = useState(true);

  async function handleLogout() {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Drawer>
      <Drawer.Screen 
        name="index" 
        options={{
          title: 'Visão Geral',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
              <Text style={{ color: '#E53935', fontWeight: 'bold', fontSize: 16 }}>
                Sair
              </Text>
            </TouchableOpacity>
          ),
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
    </Drawer>
  );
}
