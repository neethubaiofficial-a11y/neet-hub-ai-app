import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/Spacing';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

type PrepLevel = 'class11' | 'class12' | 'dropper';

export default function Onboarding() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [prepLevel, setPrepLevel] = useState<PrepLevel>('class12');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (step === 1) {
      if (!name.trim()) {
        alert('Please enter your name');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!email.trim()) {
        alert('Please enter your email');
        return;
      }
      setStep(3);
    } else {
      // Create user
      setLoading(true);
      try {
        const response = await api.post('/users', {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          prepLevel,
        });
        await login(response.data);
        router.replace('/(tabs)/home');
      } catch (error) {
        console.error('Failed to create user:', error);
        alert('Failed to create account. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>NEET HUB.AI</Text>
          <Text style={styles.subtitle}>
            Your AI-powered NEET preparation companion
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
        </View>

        {step === 1 && (
          <View style={styles.stepContent}>
            <Ionicons name="person-outline" size={64} color={Colors.dark.primary} />
            <Text style={styles.stepTitle}>What's your name?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.dark.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Ionicons name="mail-outline" size={64} color={Colors.dark.primary} />
            <Text style={styles.stepTitle}>What's your email?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Colors.dark.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Ionicons name="school-outline" size={64} color={Colors.dark.primary} />
            <Text style={styles.stepTitle}>What's your preparation level?</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.option,
                  prepLevel === 'class11' && styles.optionSelected,
                ]}
                onPress={() => setPrepLevel('class11')}
              >
                <Text
                  style={[
                    styles.optionText,
                    prepLevel === 'class11' && styles.optionTextSelected,
                  ]}
                >
                  Class 11
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.option,
                  prepLevel === 'class12' && styles.optionSelected,
                ]}
                onPress={() => setPrepLevel('class12')}
              >
                <Text
                  style={[
                    styles.optionText,
                    prepLevel === 'class12' && styles.optionTextSelected,
                  ]}
                >
                  Class 12
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.option,
                  prepLevel === 'dropper' && styles.optionSelected,
                ]}
                onPress={() => setPrepLevel('dropper')}
              >
                <Text
                  style={[
                    styles.optionText,
                    prepLevel === 'dropper' && styles.optionTextSelected,
                  ]}
                >
                  Dropper
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.dark.background} />
          ) : (
            <Text style={styles.continueButtonText}>
              {step === 3 ? 'Get Started' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.xl,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.surfaceLight,
  },
  progressDotActive: {
    backgroundColor: Colors.dark.primary,
  },
  stepContent: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  stepTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.dark.text,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  optionsContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  option: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  optionSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.surfaceLight,
  },
  optionText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.dark.primary,
  },
  continueButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: 'auto',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.background,
  },
});