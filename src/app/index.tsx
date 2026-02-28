import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  useEffect(() => {
    async function checkAuth() {
      const token = await AsyncStorage.getItem('@gdevflow:token');

      if (token) {
        router.replace('/(drawer)');
      } else {
        router.replace('/login');
      }
    }

    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
