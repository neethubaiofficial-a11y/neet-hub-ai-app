import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/Spacing';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { signInWithEmailAndPassword, signInAnonymously, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Simulate Google login (OAuth flow requires additional setup)
      const mockUser = {
        id: `google_${Date.now()}`,
        email: 'student@gmail.com',
        name: 'NEET Student',
        prepLevel: 'class12' as const,
        loginMethod: 'google',
      };

      const response = await api.post('/users', mockUser);
      await login(response.data);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Google login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      
      if (isSignup) {
        // Create new account
        if (!name) {
          alert('Please enter your name');
          setLoading(false);
          return;
        }
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      
      // Save to backend
      const userData = {
        id: user.uid,
        email: user.email || email,
        name: isSignup ? name : (user.displayName || 'NEET Student'),
        prepLevel: 'class12' as const,
        loginMethod: 'email',
        createdAt: new Date().toISOString(),
      };

      const response = await api.post('/users', userData);
      await login(response.data);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('Email login failed:', error);
      let errorMessage = 'Login failed';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already registered. Please login.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      // Firebase Anonymous Authentication
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      const guestUser = {
        id: user.uid,
        email: 'guest@neethub.ai',
        name: 'Guest User',
        prepLevel: 'class12' as const,
        loginMethod: 'guest',
        createdAt: new Date().toISOString(),
      };

      const response = await api.post('/users', guestUser);
      await login(response.data);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Guest login failed:', error);
      alert('Guest login failed. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  if (showEmailForm) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.formScrollContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowEmailForm(false)}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
            </TouchableOpacity>

            <View style={styles.formHeader}>
              <View style={styles.logoContainer}>
                <Ionicons name="fitness" size={48} color={Colors.dark.primary} />
              </View>
              <Text style={styles.formTitle}>
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isSignup ? 'Sign up to start your NEET preparation' : 'Login to continue'}
              </Text>
            </View>

            <View style={styles.formContent}>
              {isSignup && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.dark.textTertiary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.dark.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleEmailLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.dark.background} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignup ? 'Sign Up' : 'Login'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsSignup(!isSignup)}
              >
                <Text style={styles.switchButtonText}>
                  {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="fitness" size={64} color={Colors.dark.primary} />
          </View>
          <Text style={styles.title}>NEET HUB.AI</Text>
          <Text style={styles.subtitle}>Your AI-powered NEET preparation companion</Text>
        </View>

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
            style={[styles.emailButton, loading && styles.buttonDisabled]}
            onPress={() => setShowEmailForm(true)}
            disabled={loading || guestLoading}
          >
            <Ionicons name="mail" size={24} color={Colors.dark.text} />
            <Text style={styles.emailButtonText}>Continue with Email</Text>
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
  emailButton: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  emailButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
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
  // Email Form Styles
  keyboardView: {
    flex: 1,
  },
  formScrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    zIndex: 1,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  formTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  formSubtitle: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  formContent: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.dark.text,
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.dark.text,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  submitButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.background,
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: FontSize.sm,
    color: Colors.dark.primary,
    fontWeight: FontWeight.medium,
  },
});