import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/Spacing';
import { NEETSyllabus } from '../../constants/Syllabus';

type ClassType = 'class11' | 'class12';

export default function SyllabusScreen() {
  const [selectedClass, setSelectedClass] = useState<ClassType>('class12');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const syllabusData = NEETSyllabus[selectedClass];

  const toggleSubject = (subjectId: string) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
    setExpandedChapter(null);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NEET Syllabus</Text>
        <Text style={styles.headerSubtitle}>Complete Class 11 & 12 Coverage</Text>
      </View>

      {/* Class Selector */}
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {syllabusData.map((subject) => (
          <View key={subject.id} style={styles.subjectCard}>
            <TouchableOpacity
              style={styles.subjectHeader}
              onPress={() => toggleSubject(subject.id)}
            >
              <View style={styles.subjectTitleRow}>
                <Ionicons
                  name={
                    subject.name === 'Physics'
                      ? 'flash'
                      : subject.name === 'Chemistry'
                      ? 'flask'
                      : 'leaf'
                  }
                  size={24}
                  color={Colors.dark.primary}
                />
                <Text style={styles.subjectTitle}>{subject.name}</Text>
                <Text style={styles.chapterCount}>
                  {subject.chapters.length} Chapters
                </Text>
              </View>
              <Ionicons
                name={expandedSubject === subject.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.dark.textSecondary}
              />
            </TouchableOpacity>

            {expandedSubject === subject.id && (
              <View style={styles.chaptersContainer}>
                {subject.chapters.map((chapter, index) => (
                  <View key={chapter.id} style={styles.chapterCard}>
                    <TouchableOpacity
                      style={styles.chapterHeader}
                      onPress={() => toggleChapter(chapter.id)}
                    >
                      <View style={styles.chapterTitleRow}>
                        <Text style={styles.chapterNumber}>{index + 1}</Text>
                        <Text style={styles.chapterTitle}>{chapter.name}</Text>
                      </View>
                      <Ionicons
                        name={
                          expandedChapter === chapter.id
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={16}
                        color={Colors.dark.textSecondary}
                      />
                    </TouchableOpacity>

                    {expandedChapter === chapter.id && (
                      <View style={styles.topicsContainer}>
                        {chapter.topics.map((topic) => (
                          <View key={topic.id} style={styles.topicRow}>
                            <Ionicons
                              name="ellipse"
                              size={8}
                              color={Colors.dark.accent}
                            />
                            <Text style={styles.topicText}>{topic.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
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
  classSelector: {
    flexDirection: 'row',
    padding: Spacing.md,
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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  subjectCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  subjectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  subjectTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
  },
  chapterCount: {
    fontSize: FontSize.xs,
    color: Colors.dark.textSecondary,
    marginLeft: 'auto',
    marginRight: Spacing.sm,
  },
  chaptersContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  chapterCard: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  chapterNumber: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark.primary,
    width: 24,
  },
  chapterTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.dark.text,
    flex: 1,
  },
  topicsContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  topicText: {
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
  },
});