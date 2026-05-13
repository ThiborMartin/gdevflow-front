import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenState } from '../../components/ScreenState';

export default function DashboardRedirect() {
  useEffect(() => {
    router.replace('/(drawer)/projects');
  }, []);

  return (
    <View style={styles.container}>
      <ScreenState loading title="Preparando painel..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F4F6F8',
  },
});
