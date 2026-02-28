import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: '#0A1E32' },
        headerTintColor: '#FFF',
        drawerActiveTintColor: '#F5C400',
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ title: 'Visão Geral' }}
      />
      <Drawer.Screen
        name="projects"
        options={{ title: 'Meus Projetos' }}
      />
      <Drawer.Screen
        name="tasks"
        options={{ title: 'Minhas Tarefas' }}
      />
      <Drawer.Screen
        name="create-project"
        options={{ title: 'Novo Projeto' }}
      />
    </Drawer>
  );
}