import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/Spacing';
import api from '../../utils/api';

interface StudyPlan {
  id: string;
  title: string;
  duration: number;
  dailyHours: number;
  plan: any;
}

export default function StudyPlanScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [dailyHours, setDailyHours] = useState('6');
  const [duration, setDuration] = useState('7');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get(`/study-plan/${user?.id}`);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to load study plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const response = await api.post(
        `/study-plan/generate?userId=${user?.id}&dailyHours=${dailyHours}&duration=${duration}&prepLevel=${user?.prepLevel || 'class12'}`
      );
      setPlans([response.data, ...plans]);
      setShowGenerator(false);
    } catch (error) {
      console.error('Failed to generate study plan:', error);
      alert('Failed to generate study plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Plans</Text>
        <TouchableOpacity onPress={() => setShowGenerator(!showGenerator)}>
          <Ionicons name="add-circle" size={24} color={Colors.dark.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showGenerator && (
          <View style={styles.generatorCard}>
            <Text style={styles.generatorTitle}>Generate New Plan</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (days)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholder="7"
                placeholderTextColor={Colors.dark.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Daily study hours</Text>
              <TextInput
                style={styles.input}
                value={dailyHours}
                onChangeText={setDailyHours}
                keyboardType="number-pad"
                placeholder="6"
                placeholderTextColor={Colors.dark.textTertiary}
              />
            </View>
            <TouchableOpacity
              style={[styles.generateButton, generating && styles.generateButtonDisabled]}
              onPress={generatePlan}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color={Colors.dark.background} />
              ) : (
                <Text style={styles.generateButtonText}>Generate Plan</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Loading your study plans...</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.dark.textSecondary} />
            <Text style={styles.emptyText}>No study plans yet</Text>
            <Text style={styles.emptySubtext}>Generate a personalized AI study plan to get started!</Text>
          </View>
        ) : (
          plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Ionicons name="document-text" size={24} color={Colors.dark.primary} />
                <View style={styles.planHeaderText}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planSubtitle}>
                    {plan.duration} days • {plan.dailyHours}h/day
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.viewPlanButton}>
                <Text style={styles.viewPlanButtonText}>View Plan</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.dark.primary} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  generatorCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  generatorTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  generateButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  planHeaderText: {
    flex: 1,
  },
  planTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
  },
  planSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  viewPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  viewPlanButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.primary,
  },
});