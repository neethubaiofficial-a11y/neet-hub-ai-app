import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/Colors';
import { FontSize, Spacing } from '../constants/Spacing';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // User is logged in, go to main app
        router.replace('/(tabs)/home');
      } else {
        // User not logged in, go to onboarding
        router.replace('/auth/onboarding');
      }
    }
  }, [isAuthenticated, isLoading, user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEET HUB.AI</Text>
      <ActivityIndicator size="large" color={Colors.dark.primary} style={styles.loader} />
      <Text style={styles.subtitle}>Loading your study companion...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSize.display,
    fontWeight: '700',
    color: Colors.dark.primary,
    marginBottom: Spacing.lg,
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
  },
});