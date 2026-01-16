import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/Spacing';
import { NEETSyllabus, Subject, Chapter } from '../../constants/Syllabus';
import api from '../../utils/api';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  chapter: string;
}

export default function PracticeScreen() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<'class11' | 'class12'>('class12');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [practiceMode, setPracticeMode] = useState<'selection' | 'practice'>('selection');

  const syllabusData = NEETSyllabus[selectedClass];

  const startPractice = async () => {
    if (!selectedSubject || !selectedChapter) {
      alert('Please select a subject and chapter');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        `/questions/generate?subject=${selectedSubject.name}&chapter=${selectedChapter.name}&count=${questionCount}`
      );
      setQuestions(response.data.questions);
      setPracticeMode('practice');
      setCurrentQuestionIndex(0);
      setScore(0);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    const currentQuestion = questions[currentQuestionIndex];
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Practice complete
      alert(`Practice Complete!\n\nScore: ${score + (selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 1 : 0)}/${questions.length}\nAccuracy: ${Math.round(((score + (selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 1 : 0)) / questions.length) * 100)}%`);
      resetPractice();
    }
  };

  const resetPractice = () => {
    setPracticeMode('selection');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
  };

  if (practiceMode === 'practice' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.practiceHeader}>
          <TouchableOpacity onPress={resetPractice}>
            <Ionicons name="close" size={28} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.practiceProgress}>
            {currentQuestionIndex + 1} / {questions.length}
          </Text>
          <Text style={styles.practiceScore}>
            Score: {score}/{questions.length}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === currentQuestion.correctAnswer;
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
                        <Ionicons name="checkmark" size={16} color={Colors.dark.background} />
                      )}
                      {showWrong && (
                        <Ionicons name="close" size={16} color={Colors.dark.background} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        (showCorrect || showWrong) && styles.optionTextBold,
                      ]}
                    >
                      {option}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {showExplanation && (
            <View style={[styles.explanationCard, isCorrect ? styles.explanationCorrect : styles.explanationWrong]}>
              <View style={styles.explanationHeader}>
                <Ionicons
                  name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={isCorrect ? Colors.dark.success : Colors.dark.error}
                />
                <Text style={styles.explanationTitle}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Text>
              </View>
              <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
            </View>
          )}

          {!showExplanation && selectedAnswer !== null && (
            <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
              <Text style={styles.checkButtonText}>Check Answer</Text>
            </TouchableOpacity>
          )}

          {showExplanation && (
            <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Practice'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.dark.background} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice Zone</Text>
        <Text style={styles.headerSubtitle}>AI-Generated NEET Questions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Class Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Class</Text>
          <View style={styles.classSelector}>
            <TouchableOpacity
              style={[
                styles.classButton,
                selectedClass === 'class11' && styles.classButtonActive,
              ]}
              onPress={() => setSelectedClass('class11')}
            >
              <Text
                style={[
                  styles.classButtonText,
                  selectedClass === 'class11' && styles.classButtonTextActive,
                ]}
              >
                Class 11
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.classButton,
                selectedClass === 'class12' && styles.classButtonActive,
              ]}
              onPress={() => setSelectedClass('class12')}
            >
              <Text
                style={[
                  styles.classButtonText,
                  selectedClass === 'class12' && styles.classButtonTextActive,
                ]}
              >
                Class 12
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subject Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Subject</Text>
          <View style={styles.subjectGrid}>
            {syllabusData.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectCard,
                  selectedSubject?.id === subject.id && styles.subjectCardActive,
                ]}
                onPress={() => {
                  setSelectedSubject(subject);
                  setSelectedChapter(null);
                }}
              >
                <Ionicons
                  name={
                    subject.name === 'Physics'
                      ? 'flash'
                      : subject.name === 'Chemistry'
                      ? 'flask'
                      : 'leaf'
                  }
                  size={32}
                  color={
                    selectedSubject?.id === subject.id
                      ? Colors.dark.primary
                      : Colors.dark.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.subjectCardText,
                    selectedSubject?.id === subject.id && styles.subjectCardTextActive,
                  ]}
                >
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chapter Selector */}
        {selectedSubject && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Chapter</Text>
            <View style={styles.chapterList}>
              {selectedSubject.chapters.map((chapter, index) => (
                <TouchableOpacity
                  key={chapter.id}
                  style={[
                    styles.chapterItem,
                    selectedChapter?.id === chapter.id && styles.chapterItemActive,
                  ]}
                  onPress={() => setSelectedChapter(chapter)}
                >
                  <Text style={styles.chapterNumber}>{index + 1}</Text>
                  <Text
                    style={[
                      styles.chapterItemText,
                      selectedChapter?.id === chapter.id && styles.chapterItemTextActive,
                    ]}
                  >
                    {chapter.name}
                  </Text>
                  {selectedChapter?.id === chapter.id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Question Count Selector */}
        {selectedChapter && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Questions</Text>
            <View style={styles.questionCountSelector}>
              {[10, 15, 20, 30].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.countButton,
                    questionCount === count && styles.countButtonActive,
                  ]}
                  onPress={() => setQuestionCount(count)}
                >
                  <Text
                    style={[
                      styles.countButtonText,
                      questionCount === count && styles.countButtonTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Start Button */}
        {selectedChapter && (
          <TouchableOpacity
            style={[styles.startButton, loading && styles.startButtonDisabled]}
            onPress={startPractice}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.dark.background} />
            ) : (
              <>
                <Text style={styles.startButtonText}>Generate Questions</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.dark.background} />
              </>
            )}
          </TouchableOpacity>
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
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
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
  classSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  classButton: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  classButtonActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.surfaceLight,
  },
  classButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  classButtonTextActive: {
    color: Colors.dark.primary,
  },
  subjectGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  subjectCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  subjectCardActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.surfaceLight,
  },
  subjectCardText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.dark.textSecondary,
  },
  subjectCardTextActive: {
    color: Colors.dark.primary,
  },
  chapterList: {
    gap: Spacing.sm,
  },
  chapterItem: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  chapterItemActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.surfaceLight,
  },
  chapterNumber: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark.primary,
    width: 24,
  },
  chapterItemText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
  },
  chapterItemTextActive: {
    color: Colors.dark.text,
  },
  questionCountSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  countButton: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  countButtonActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary,
  },
  countButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  countButtonTextActive: {
    color: Colors.dark.background,
  },
  startButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.background,
  },
  // Practice Mode Styles
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  practiceProgress: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  practiceScore: {
    fontSize: FontSize.md,
    color: Colors.dark.primary,
    fontWeight: FontWeight.semibold,
  },
  questionContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  questionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  questionText: {
    fontSize: FontSize.lg,
    color: Colors.dark.text,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  optionButton: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  optionSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.surfaceLight,
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
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontSize: FontSize.md,
    color: Colors.dark.text,
  },
  optionTextBold: {
    fontWeight: FontWeight.semibold,
  },
  explanationCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
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
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  explanationTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
  },
  explanationText: {
    fontSize: FontSize.md,
    color: Colors.dark.text,
    lineHeight: 22,
  },
  checkButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.background,
  },
  nextButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  nextButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.background,
  },
});