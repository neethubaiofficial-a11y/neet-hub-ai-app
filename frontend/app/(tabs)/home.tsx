import React, { useEffect, useState } from 'react';
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
import { format } from 'date-fns';

interface DailyQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  chapter: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestion | null>(null);
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Calculate days until NEET 2026 (May 4, 2026)
  const neetDate = new Date('2026-05-04');
  const today = new Date();
  const daysUntilNeet = Math.ceil((neetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    loadDailyContent();
  }, []);

  const loadDailyContent = async () => {
    try {
      const [questionRes, motivationRes] = await Promise.all([
        api.get('/questions/daily'),
        api.get('/ai/motivation'),
      ]);
      setDailyQuestion(questionRes.data);
      setMotivation(motivationRes.data.message);
    } catch (error) {
      console.error('Failed to load daily content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    setShowExplanation(true);
  };

  const isCorrect = selectedAnswer === dailyQuestion?.correctAnswer;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name}! 👋</Text>
            <Text style={styles.date}>{format(today, 'EEEE, MMMM d, yyyy')}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={40} color={Colors.dark.primary} />
          </TouchableOpacity>
        </View>

        {/* NEET Countdown */}
        <View style={styles.countdownCard}>
          <View style={styles.countdownContent}>
            <Text style={styles.countdownLabel}>Days Until NEET 2026</Text>
            <Text style={styles.countdownNumber}>{daysUntilNeet}</Text>
            <Text style={styles.countdownSubtext}>Stay focused, stay consistent!</Text>
          </View>
        </View>

        {/* Daily Motivation */}
        {motivation && (
          <View style={styles.motivationCard}>
            <Ionicons name="bulb" size={24} color={Colors.dark.warning} />
            <Text style={styles.motivationText}>{motivation}</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/practice')}>
              <Ionicons name="play-circle" size={32} color={Colors.dark.primary} />
              <Text style={styles.actionText}>Start Practice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/tests')}>
              <Ionicons name="document-text" size={32} color={Colors.dark.accent} />
              <Text style={styles.actionText}>Take Test</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/ai-buddy')}>
              <Ionicons name="chatbubbles" size={32} color={Colors.dark.info} />
              <Text style={styles.actionText}>AI Buddy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/progress')}>
              <Ionicons name="trending-up" size={32} color={Colors.dark.warning} />
              <Text style={styles.actionText}>Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/study-plan')}>
              <Ionicons name="calendar" size={32} color={Colors.dark.success} />
              <Text style={styles.actionText}>Study Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/focus-mode')}>
              <Ionicons name="timer" size={32} color={Colors.dark.error} />
              <Text style={styles.actionText}>Focus Mode</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Question */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily NEET Question</Text>
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={Colors.dark.primary} />
              <Text style={styles.loadingText}>Generating today's question...</Text>
            </View>
          ) : dailyQuestion ? (
            <View style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionSubject}>{dailyQuestion.subject}</Text>
                <Text style={styles.questionChapter}>{dailyQuestion.chapter}</Text>
              </View>
              <Text style={styles.questionText}>{dailyQuestion.question}</Text>
              
              <View style={styles.optionsContainer}>
                {dailyQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectOption = index === dailyQuestion.correctAnswer;
                  const showCorrect = showExplanation && isCorrectOption;
                  const showWrong = showExplanation && isSelected && !isCorrect;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        isSelected && !showExplanation && styles.optionSelected,
                        showCorrect && styles.optionCorrect,
                        showWrong && styles.optionWrong,
                      ]}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={showExplanation}
                    >
                      <View style={styles.optionContent}>
                        <View
                          style={[
                            styles.optionCircle,
                            isSelected && !showExplanation && styles.optionCircleSelected,
                            showCorrect && styles.optionCircleCorrect,
                            showWrong && styles.optionCircleWrong,
                          ]}
                        >
                          {showCorrect && (
                            <Ionicons name="checkmark" size={12} color={Colors.dark.background} />
                          )}
                          {showWrong && (
                            <Ionicons name="close" size={12} color={Colors.dark.background} />
                          )}
                        </View>
                        <Text style={styles.optionText}>{option}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {!showExplanation && selectedAnswer !== null && (
                <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
                  <Text style={styles.checkButtonText}>Check Answer</Text>
                </TouchableOpacity>
              )}

              {showExplanation && (
                <View style={[styles.explanationCard, isCorrect ? styles.explanationCorrect : styles.explanationWrong]}>
                  <View style={styles.explanationHeader}>
                    <Ionicons
                      name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={24}
                      color={isCorrect ? Colors.dark.success : Colors.dark.error}
                    />
                    <Text style={styles.explanationTitle}>
                      {isCorrect ? 'Correct! 🎉' : 'Incorrect'}
                    </Text>
                  </View>
                  <Text style={styles.explanationText}>{dailyQuestion.explanation}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>No question available today</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  profileButton: {
    padding: Spacing.xs,
  },
  countdownCard: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  countdownContent: {
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.dark.background,
    marginBottom: Spacing.sm,
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: FontWeight.bold,
    color: Colors.dark.background,
  },
  countdownSubtext: {
    fontSize: FontSize.sm,
    color: Colors.dark.background,
    marginTop: Spacing.xs,
  },
  motivationCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  motivationText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.dark.text,
    lineHeight: 22,
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
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    width: '31%',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.dark.text,
    textAlign: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
  },
  questionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  questionSubject: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.primary,
  },
  questionChapter: {
    fontSize: FontSize.xs,
    color: Colors.dark.textSecondary,
  },
  questionText: {
    fontSize: FontSize.md,
    color: Colors.dark.text,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  optionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionButton: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  optionSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.surface,
  },
  optionCorrect: {
    borderColor: Colors.dark.success,
    backgroundColor: `${Colors.dark.success}15`,
  },
  optionWrong: {
    borderColor: Colors.dark.error,
    backgroundColor: `${Colors.dark.error}15`,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCircleSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary,
  },
  optionCircleCorrect: {
    borderColor: Colors.dark.success,
    backgroundColor: Colors.dark.success,
  },
  optionCircleWrong: {
    borderColor: Colors.dark.error,
    backgroundColor: Colors.dark.error,
  },
  optionText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.dark.text,
  },
  checkButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.background,
  },
  explanationCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 2,
  },
  explanationCorrect: {
    borderColor: Colors.dark.success,
    backgroundColor: `${Colors.dark.success}15`,
  },
  explanationWrong: {
    borderColor: Colors.dark.error,
    backgroundColor: `${Colors.dark.error}15`,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  explanationTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
  },
  explanationText: {
    fontSize: FontSize.sm,
    color: Colors.dark.text,
    lineHeight: 20,
  },
});