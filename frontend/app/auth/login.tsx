import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/Spacing';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Simulate Google login (in production, use actual Google OAuth)
      const mockGoogleUser = {
        id: `google_${Date.now()}`,
        email: 'student@gmail.com',
        name: 'Google User',
        prepLevel: 'class12' as const,
        loginMethod: 'google',
      };

      // Create user in backend
      const response = await api.post('/users', mockGoogleUser);
      await login(response.data);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Google login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const guestUser = {
        id: `guest_${Date.now()}`,
        email: 'guest@neethub.ai',
        name: 'Guest User',
        prepLevel: 'class12' as const,
        loginMethod: 'guest',
      };

      // Create guest user in backend
      const response = await api.post('/users', guestUser);
      await login(response.data);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Guest login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo & Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="fitness" size={64} color={Colors.dark.primary} />
          </View>
          <Text style={styles.title}>NEET HUB.AI</Text>
          <Text style={styles.subtitle}>Your AI-powered NEET preparation companion</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.dark.success} />
            <Text style={styles.featureText}>AI-Generated Practice Questions</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.dark.success} />
            <Text style={styles.featureText}>Complete NEET Syllabus Coverage</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.dark.success} />
            <Text style={styles.featureText}>Mock Tests & Analytics</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.dark.success} />
            <Text style={styles.featureText}>Personalized Study Plans</Text>
          </View>
        </View>

        {/* Login Buttons */}
        <View style={styles.loginButtons}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading || guestLoading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.dark.background} />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color={Colors.dark.background} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guestButton, guestLoading && styles.buttonDisabled]}
            onPress={handleGuestLogin}
            disabled={loading || guestLoading}
          >
            {guestLoading ? (
              <ActivityIndicator color={Colors.dark.text} />
            ) : (
              <>
                <Ionicons name="person" size={24} color={Colors.dark.text} />
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  features: {
    marginBottom: Spacing.xxxl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureText: {
    fontSize: FontSize.md,
    color: Colors.dark.text,
  },
  loginButtons: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  googleButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  googleButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.background,
  },
  guestButton: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  guestButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  terms: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});