import { db } from '../config/firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

interface TopicProgress {
  userId: string;
  subject: string;
  chapter: string;
  topic: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  classification: 'Strong' | 'Needs Revision' | 'Weak';
  lastPracticed: any;
  updatedAt: any;
}

// Classification logic from architecture
function classifyTopic(accuracy: number): 'Strong' | 'Needs Revision' | 'Weak' {
  if (accuracy >= 70) return 'Strong';
  if (accuracy >= 40) return 'Needs Revision';
  return 'Weak';
}

export const progressService = {
  // Update topic progress after practice
  async updateTopicProgress(
    userId: string,
    subject: string,
    chapter: string,
    topic: string,
    correct: number,
    total: number
  ): Promise<void> {
    try {
      const progressId = `${userId}_${subject}_${chapter}_${topic}`.replace(/\s+/g, '_');
      const progressRef = doc(db, 'topicProgress', progressId);
      
      // Get existing progress
      const progressSnap = await getDoc(progressRef);
      
      let newTotalAttempts = total;
      let newCorrectAttempts = correct;
      
      if (progressSnap.exists()) {
        const existing = progressSnap.data();
        newTotalAttempts += existing.totalAttempts || 0;
        newCorrectAttempts += existing.correctAttempts || 0;
      }
      
      const accuracy = (newCorrectAttempts / newTotalAttempts) * 100;
      const classification = classifyTopic(accuracy);
      
      await setDoc(progressRef, {
        userId,
        subject,
        chapter,
        topic,
        totalAttempts: newTotalAttempts,
        correctAttempts: newCorrectAttempts,
        accuracy: Math.round(accuracy * 10) / 10,
        classification,
        lastPracticed: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating topic progress:', error);
      throw error;
    }
  },

  // Get all topic progress for user
  async getUserProgress(userId: string): Promise<TopicProgress[]> {
    try {
      const q = query(
        collection(db, 'topicProgress'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as TopicProgress);
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  },

  // Get weak topics
  async getWeakTopics(userId: string): Promise<TopicProgress[]> {
    try {
      const q = query(
        collection(db, 'topicProgress'),
        where('userId', '==', userId),
        where('classification', '==', 'Weak')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as TopicProgress);
    } catch (error) {
      console.error('Error getting weak topics:', error);
      throw error;
    }
  }
};