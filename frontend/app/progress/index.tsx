import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/Spacing';
import api from '../../utils/api';

interface Analytics {
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  subjectStats: Record<string, any>;
  testsAttempted: number;
  avgTestScore: number;
  studyTimeHours: number;
}

export default function ProgressScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await api.get(`/analytics/${user?.id}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Loading your progress...</Text>
          </View>
        ) : analytics ? (
          <>
            {/* Overall Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.dark.success} />
                <Text style={styles.statNumber}>{analytics.totalCorrect}</Text>
                <Text style={styles.statLabel}>Correct Answers</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="help-circle" size={32} color={Colors.dark.info} />
                <Text style={styles.statNumber}>{analytics.totalQuestions}</Text>
                <Text style={styles.statLabel}>Total Questions</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={32} color={Colors.dark.primary} />
                <Text style={styles.statNumber}>{analytics.overallAccuracy.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={32} color={Colors.dark.warning} />
                <Text style={styles.statNumber}>{analytics.studyTimeHours}h</Text>
                <Text style={styles.statLabel}>Study Time</Text>
              </View>
            </View>

            {/* Subject Performance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subject Performance</Text>
              {Object.keys(analytics.subjectStats).map((subject) => {
                const stats = analytics.subjectStats[subject];
                return (
                  <View key={subject} style={styles.subjectCard}>
                    <View style={styles.subjectHeader}>
                      <Ionicons
                        name={
                          subject === 'Physics'
                            ? 'flash'
                            : subject === 'Chemistry'
                            ? 'flask'
                            : 'leaf'
                        }
                        size={24}
                        color={Colors.dark.primary}
                      />
                      <Text style={styles.subjectName}>{subject}</Text>
                    </View>
                    <View style={styles.subjectStats}>
                      <View style={styles.subjectStat}>
                        <Text style={styles.subjectStatValue}>{stats.attempted}</Text>
                        <Text style={styles.subjectStatLabel}>Questions</Text>
                      </View>
                      <View style={styles.subjectStat}>
                        <Text style={styles.subjectStatValue}>{stats.correct}</Text>
                        <Text style={styles.subjectStatLabel}>Correct</Text>
                      </View>
                      <View style={styles.subjectStat}>
                        <Text style={[styles.subjectStatValue, { color: Colors.dark.success }]}>
                          {stats.accuracy.toFixed(1)}%
                        </Text>
                        <Text style={styles.subjectStatLabel}>Accuracy</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Test Performance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test Performance</Text>
              <View style={styles.testStatsCard}>
                <View style={styles.testStat}>
                  <Text style={styles.testStatNumber}>{analytics.testsAttempted}</Text>
                  <Text style={styles.testStatLabel}>Tests Attempted</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.testStat}>
                  <Text style={styles.testStatNumber}>{analytics.avgTestScore.toFixed(0)}</Text>
                  <Text style={styles.testStatLabel}>Avg Score</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color={Colors.dark.textSecondary} />
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>Start practicing to see your progress!</Text>
          </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  subjectCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  subjectName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
  },
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  subjectStat: {
    alignItems: 'center',
  },
  subjectStatValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  subjectStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  testStatsCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  testStat: {
    alignItems: 'center',
  },
  testStatNumber: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.primary,
  },
  testStatLabel: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
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
  },
});