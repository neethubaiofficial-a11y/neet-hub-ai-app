import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/Spacing';
import { NEETSyllabus } from '../../constants/Syllabus';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ClassType = 'class11' | 'class12';
type Status = 'not_started' | 'in_progress' | 'completed' | 'revision';

export default function SyllabusScreen() {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<ClassType>('class12');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, Status>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);

  const syllabusData = NEETSyllabus[selectedClass];

  useEffect(() => {
    loadProgress();
  }, [selectedClass]);

  const loadProgress = async () => {
    try {
      const key = `syllabus_progress_${user?.id}_${selectedClass}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setProgress(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const saveProgress = async (newProgress: Record<string, Status>) => {
    try {
      const key = `syllabus_progress_${user?.id}_${selectedClass}`;
      await AsyncStorage.setItem(key, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
    setExpandedChapter(null);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const openStatusModal = (subject: any, chapter: any, topic: any) => {
    setSelectedTopic({ subject, chapter, topic });
    setModalVisible(true);
  };

  const updateTopicStatus = async (status: Status) => {
    if (!selectedTopic) return;
    
    const key = `${selectedTopic.subject.id}_${selectedTopic.chapter.id}_${selectedTopic.topic.id}`;
    const newProgress = { ...progress, [key]: status };
    await saveProgress(newProgress);
    setModalVisible(false);
  };

  const getTopicStatus = (subjectId: string, chapterId: string, topicId: string): Status => {
    const key = `${subjectId}_${chapterId}_${topicId}`;
    return progress[key] || 'not_started';
  };

  // Calculate chapter completion status
  const getChapterStatus = (subjectId: string, chapter: any): Status => {
    const topicStatuses = chapter.topics.map((topic: any) =>
      getTopicStatus(subjectId, chapter.id, topic.id)
    );
    
    const allCompleted = topicStatuses.every((s: Status) => s === 'completed');
    const someCompleted = topicStatuses.some((s: Status) => s === 'completed');
    const anyInProgress = topicStatuses.some((s: Status) => s === 'in_progress');
    const anyRevision = topicStatuses.some((s: Status) => s === 'revision');
    
    if (allCompleted) return 'completed';
    if (anyRevision) return 'revision';
    if (anyInProgress || someCompleted) return 'in_progress';
    return 'not_started';
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'completed':
        return { name: 'checkmark-circle' as const, color: Colors.dark.success };
      case 'in_progress':
        return { name: 'time' as const, color: Colors.dark.warning };
      case 'revision':
        return { name: 'refresh-circle' as const, color: Colors.dark.info };
      default:
        return { name: 'ellipse-outline' as const, color: Colors.dark.textTertiary };
    }
  };

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'revision': return 'Needs Revision';
      default: return 'Not Started';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NEET Syllabus</Text>
        <Text style={styles.headerSubtitle}>Track Your Progress</Text>
      </View>

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
                {subject.chapters.map((chapter, index) => {
                  const chapterStatus = getChapterStatus(subject.id, chapter);
                  const chapterStatusIcon = getStatusIcon(chapterStatus);
                  const isCompleted = chapterStatus === 'completed';
                  
                  return (
                    <View key={chapter.id} style={[
                      styles.chapterCard,
                      isCompleted && styles.chapterCardCompleted
                    ]}>
                      <TouchableOpacity
                        style={styles.chapterHeader}
                        onPress={() => toggleChapter(chapter.id)}
                      >
                        <View style={styles.chapterTitleRow}>
                          <Text style={[
                            styles.chapterNumber,
                            isCompleted && styles.chapterNumberCompleted
                          ]}>{index + 1}</Text>
                          <Text style={[
                            styles.chapterTitle,
                            isCompleted && styles.chapterTitleCompleted
                          ]}>{chapter.name}</Text>
                          <Ionicons
                            name={chapterStatusIcon.name}
                            size={20}
                            color={chapterStatusIcon.color}
                          />
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
                          {chapter.topics.map((topic) => {
                            const status = getTopicStatus(subject.id, chapter.id, topic.id);
                            const statusIcon = getStatusIcon(status);
                            
                            return (
                              <TouchableOpacity
                                key={topic.id}
                                style={styles.topicRow}
                                onPress={() => openStatusModal(subject, chapter, topic)}
                              >
                                <Ionicons
                                  name={statusIcon.name}
                                  size={18}
                                  color={statusIcon.color}
                                />
                                <Text style={styles.topicText}>{topic.name}</Text>
                                <Text style={[styles.topicStatus, { color: statusIcon.color }]}>
                                  {getStatusLabel(status)}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            
            {selectedTopic && (
              <Text style={styles.modalSubtitle}>{selectedTopic.topic.name}</Text>
            )}

            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={styles.statusOption}
                onPress={() => updateTopicStatus('not_started')}
              >
                <Ionicons name="ellipse-outline" size={24} color={Colors.dark.textTertiary} />
                <Text style={styles.statusOptionText}>Not Started</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusOption}
                onPress={() => updateTopicStatus('in_progress')}
              >
                <Ionicons name="time" size={24} color={Colors.dark.warning} />
                <Text style={styles.statusOptionText}>In Progress</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusOption}
                onPress={() => updateTopicStatus('completed')}
              >
                <Ionicons name="checkmark-circle" size={24} color={Colors.dark.success} />
                <Text style={styles.statusOptionText}>Completed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusOption}
                onPress={() => updateTopicStatus('revision')}
              >
                <Ionicons name="refresh-circle" size={24} color={Colors.dark.info} />
                <Text style={styles.statusOptionText}>Needs Revision</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chapterCardCompleted: {
    borderColor: Colors.dark.success,
    backgroundColor: `${Colors.dark.success}15`,
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
  chapterNumberCompleted: {
    color: Colors.dark.success,
  },
  chapterTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.dark.text,
    flex: 1,
  },
  chapterTitleCompleted: {
    color: Colors.dark.success,
    fontWeight: FontWeight.semibold,
  },
  topicsContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  topicText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.dark.text,
  },
  topicStatus: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  modalSubtitle: {
    fontSize: FontSize.md,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.lg,
  },
  statusOptions: {
    gap: Spacing.sm,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.dark.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statusOptionText: {
    fontSize: FontSize.md,
    color: Colors.dark.text,
    fontWeight: FontWeight.medium,
  },
});