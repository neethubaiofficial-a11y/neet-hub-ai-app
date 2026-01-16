import React, { useState } from 'react';
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
import { Colors } from '../../constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/Spacing';
import { NEETSyllabus, Subject, Chapter } from '../../constants/Syllabus';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

type TestType = 'full' | 'subject' | 'chapter';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  chapter: string;
}

export default function TestsScreen() {
  const { user } = useAuthStore();
  const [testType, setTestType] = useState<TestType>('full');
  const [selectedClass, setSelectedClass] = useState<'class11' | 'class12'>('class12');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState<'config' | 'test' | 'results'>('config');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(180 * 60); // 3 hours in seconds
  const [timerActive, setTimerActive] = useState(false);

  const syllabusData = NEETSyllabus[selectedClass];

  const getQuestionCount = () => {
    if (testType === 'full') return 200; // Full NEET pattern
    if (testType === 'subject') return 50;
    return 30; // Chapter-wise
  };

  const startTest = async () => {
    if (testType === 'subject' && !selectedSubject) {
      alert('Please select a subject');
      return;
    }
    if (testType === 'chapter' && !selectedChapter) {
      alert('Please select a chapter');
      return;
    }

    setLoading(true);
    try {
      const count = getQuestionCount();
      let subject = 'Physics'; // Default for full test
      let chapter = 'All';

      if (testType === 'subject' && selectedSubject) {
        subject = selectedSubject.name;
      } else if (testType === 'chapter' && selectedSubject && selectedChapter) {
        subject = selectedSubject.name;
        chapter = selectedChapter.name;
      }

      const response = await api.post(
        `/questions/generate?subject=${subject}&chapter=${chapter}&count=${count}`
      );
      
      setQuestions(response.data.questions);
      setAnswers(new Array(response.data.questions.length).fill(null));
      setTestMode('test');
      setCurrentQuestionIndex(0);
      setTimerActive(true);
    } catch (error) {
      console.error('Failed to start test:', error);
      alert('Failed to start test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const submitTest = async () => {
    setTimerActive(false);
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    const accuracy = (correctCount / questions.length) * 100;
    const score = (correctCount / questions.length) * 720; // NEET scoring

    try {
      await api.post('/tests', {
        userId: user?.id,
        testType,
        subject: selectedSubject?.name,
        chapter: selectedChapter?.name,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        score,
        timeSpent: 180 * 60 - timeRemaining,
        accuracy,
        weakChapters: [],
      });
    } catch (error) {
      console.error('Failed to save test:', error);
    }

    setTestMode('results');
  };

  const resetTest = () => {
    setTestMode('config');
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setTimeRemaining(180 * 60);
    setTimerActive(false);
  };

  // Timer effect
  React.useEffect(() => {
    if (!timerActive || testMode !== 'test') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, testMode]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (testMode === 'results') {
    const correctCount = answers.filter((a, i) => a === questions[i].correctAnswer).length;
    const accuracy = (correctCount / questions.length) * 100;
    const score = (correctCount / questions.length) * 720;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Ionicons name="trophy" size={64} color={Colors.dark.warning} />
            <Text style={styles.resultsTitle}>Test Complete!</Text>
          </View>

          <View style={styles.resultsCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Score</Text>
              <Text style={styles.resultValue}>{score.toFixed(0)}/720</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Correct Answers</Text>
              <Text style={styles.resultValue}>{correctCount}/{questions.length}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Accuracy</Text>
              <Text style={styles.resultValue}>{accuracy.toFixed(1)}%</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.finishButton} onPress={resetTest}>
            <Text style={styles.finishButtonText}>Back to Tests</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (testMode === 'test' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = answers.filter((a) => a !== null).length;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.testHeader}>
          <Text style={styles.testTimer}>{formatTime(timeRemaining)}</Text>
          <Text style={styles.testProgress}>
            {currentQuestionIndex + 1}/{questions.length}
          </Text>
          <TouchableOpacity onPress={() => {
            if (confirm('Are you sure you want to submit the test?')) {
              submitTest();
            }
          }}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.testContent}>
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionSubject}>{currentQuestion.subject}</Text>
              <Text style={styles.questionChapter}>{currentQuestion.chapter}</Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestionIndex] === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => handleAnswerSelect(currentQuestionIndex, index)}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.optionCircle,
                        isSelected && styles.optionCircleSelected,
                      ]}
                    />
                    <Text style={styles.optionText}>{option}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                currentQuestionIndex === 0 && styles.navButtonDisabled,
              ]}
              onPress={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.dark.text} />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                currentQuestionIndex === questions.length - 1 && styles.navButtonDisabled,
              ]}
              onPress={() =>
                setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))
              }
              disabled={currentQuestionIndex === questions.length - 1}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.questionPalette}>
            <Text style={styles.paletteTitle}>
              Question Palette ({answeredCount}/{questions.length} answered)
            </Text>
            <View style={styles.paletteGrid}>
              {questions.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.paletteButton,
                    answers[index] !== null && styles.paletteButtonAnswered,
                    currentQuestionIndex === index && styles.paletteButtonCurrent,
                  ]}
                  onPress={() => setCurrentQuestionIndex(index)}
                >
                  <Text
                    style={[
                      styles.paletteButtonText,
                      (answers[index] !== null || currentQuestionIndex === index) &&
                        styles.paletteButtonTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mock Tests</Text>
        <Text style={styles.headerSubtitle}>NEET Pattern Practice</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Test Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Test Type</Text>
          <View style={styles.testTypeGrid}>
            <TouchableOpacity
              style={[
                styles.testTypeCard,
                testType === 'full' && styles.testTypeCardActive,
              ]}
              onPress={() => setTestType('full')}
            >
              <Ionicons
                name="document-text"
                size={32}
                color={testType === 'full' ? Colors.dark.primary : Colors.dark.textSecondary}
              />
              <Text
                style={[
                  styles.testTypeTitle,
                  testType === 'full' && styles.testTypeTitleActive,
                ]}
              >
                Full Test
              </Text>
              <Text style={styles.testTypeSubtitle}>200 Questions</Text>
              <Text style={styles.testTypeSubtitle}>3 Hours</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.testTypeCard,
                testType === 'subject' && styles.testTypeCardActive,
              ]}
              onPress={() => setTestType('subject')}
            >
              <Ionicons
                name="book"
                size={32}
                color={testType === 'subject' ? Colors.dark.primary : Colors.dark.textSecondary}
              />
              <Text
                style={[
                  styles.testTypeTitle,
                  testType === 'subject' && styles.testTypeTitleActive,
                ]}
              >
                Subject Test
              </Text>
              <Text style={styles.testTypeSubtitle}>50 Questions</Text>
              <Text style={styles.testTypeSubtitle}>45 Minutes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.testTypeCard,
                testType === 'chapter' && styles.testTypeCardActive,
              ]}
              onPress={() => setTestType('chapter')}
            >
              <Ionicons
                name="list"
                size={32}
                color={testType === 'chapter' ? Colors.dark.primary : Colors.dark.textSecondary}
              />
              <Text
                style={[
                  styles.testTypeTitle,
                  testType === 'chapter' && styles.testTypeTitleActive,
                ]}
              >
                Chapter Test
              </Text>
              <Text style={styles.testTypeSubtitle}>30 Questions</Text>
              <Text style={styles.testTypeSubtitle}>30 Minutes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {testType !== 'full' && (
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
        )}

        {testType !== 'full' && (
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
        )}

        {testType === 'chapter' && selectedSubject && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Chapter</Text>
            <View style={styles.chapterList}>
              {selectedSubject.chapters.slice(0, 10).map((chapter, index) => (
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
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Start Test Button */}
        <TouchableOpacity
          style={[styles.startButton, loading && styles.startButtonDisabled]}
          onPress={startTest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.dark.background} />
          ) : (
            <>
              <Text style={styles.startButtonText}>Start Test</Text>
              <Ionicons name="play" size={20} color={Colors.dark.background} />
            </>
          )}
        </TouchableOpacity>
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
  testTypeGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  testTypeCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  testTypeCardActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.surfaceLight,
  },
  testTypeTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
  },
  testTypeTitleActive: {
    color: Colors.dark.primary,
  },
  testTypeSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.dark.textTertiary,
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
  startButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.background,
  },
  // Test Mode Styles
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  testTimer: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark.warning,
  },
  testProgress: {
    fontSize: FontSize.md,
    color: Colors.dark.text,
  },
  submitText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.error,
  },
  testContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  questionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
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
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  optionCircleSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary,
  },
  optionText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.dark.text,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  navButton: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: FontSize.md,
    color: Colors.dark.text,
  },
  questionPalette: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  paletteTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  paletteButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  paletteButtonAnswered: {
    backgroundColor: Colors.dark.accent,
  },
  paletteButtonCurrent: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  paletteButtonText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
  },
  paletteButtonTextActive: {
    color: Colors.dark.background,
    fontWeight: FontWeight.semibold,
  },
  // Results Styles
  resultsContainer: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  resultsTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
    marginTop: Spacing.md,
  },
  resultsCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  resultLabel: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
  },
  resultValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.primary,
  },
  finishButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.background,
  },
});