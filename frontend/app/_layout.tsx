import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F172A' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="account/index" />
        <Stack.Screen name="ai-buddy/index" />
        <Stack.Screen name="study-plan/index" />
        <Stack.Screen name="progress/index" />
        <Stack.Screen name="focus-mode/index" />
      </Stack>
    </SafeAreaProvider>
  );
}