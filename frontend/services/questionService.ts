import { db } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Question {
  id?: string;
  subject: string;
  chapter: string;
  topic: string;
  difficulty: 'Easy' | 'Moderate';
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
  createdAt?: any;
  usageCount?: number;
}

// Master MCQ Generator Prompt (from architecture)
const generateMCQPrompt = (subject: string, chapter: string, topic: string, difficulty: string) => `
You are an expert NEET-UG question creator aligned strictly with NCERT syllabus.

Generate EXACTLY 5 multiple-choice questions based on:
- Subject: ${subject}
- Chapter: ${chapter}
- Topic: ${topic}
- Difficulty: ${difficulty}

Requirements:
1. Questions must be NCERT-aligned (Class 11/12 level)
2. Each question has 4 options (A, B, C, D) with exactly ONE correct answer
3. Include a 1-line explanation for the correct answer
4. Difficulty "Easy" = direct recall, "Moderate" = conceptual application
5. No ambiguous wording, no coaching tricks
6. Medical entrance exam standard only

Output MUST be valid JSON in this EXACT format:
{
  "subject": "${subject}",
  "chapter": "${chapter}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "Question text here",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correct": "B",
      "explanation": "Brief one-line explanation using NCERT terminology"
    }
  ]
}

Generate all 5 questions now. Return ONLY the JSON, no extra text.
`;

export const questionService = {
  // Check Firestore for existing questions
  async getQuestions(subject: string, chapter: string, topic: string, count: number = 5): Promise<Question[]> {
    try {
      // First try cache
      const cacheKey = `questions_${subject}_${chapter}_${topic}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const questions = JSON.parse(cached);
        if (questions.length >= count) {
          return questions.slice(0, count);
        }
      }

      // Check Firestore
      const q = query(
        collection(db, 'questions'),
        where('subject', '==', subject),
        where('chapter', '==', chapter),
        where('topic', '==', topic)
      );

      const snapshot = await getDocs(q);
      const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));

      if (questions.length >= count) {
        // Cache and return
        await AsyncStorage.setItem(cacheKey, JSON.stringify(questions));
        return questions.slice(0, count);
      }

      // Need to generate new questions
      return await this.generateAndStoreQuestions(subject, chapter, topic, 'Moderate');
    } catch (error) {
      console.error('Error getting questions:', error);
      throw error;
    }
  },

  // Generate questions using AI and store in Firestore
  async generateAndStoreQuestions(
    subject: string,
    chapter: string,
    topic: string,
    difficulty: 'Easy' | 'Moderate'
  ): Promise<Question[]> {
    try {
      const prompt = generateMCQPrompt(subject, chapter, topic, difficulty);
      
      // Call your AI backend
      const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/ai/generate-mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      const generatedQuestions = data.questions;

      // Store in Firestore
      const storedQuestions: Question[] = [];
      for (const q of generatedQuestions) {
        const docRef = await addDoc(collection(db, 'questions'), {
          subject,
          chapter,
          topic,
          difficulty,
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
          createdAt: serverTimestamp(),
          usageCount: 0
        });
        storedQuestions.push({ id: docRef.id, ...q });
      }

      // Cache
      const cacheKey = `questions_${subject}_${chapter}_${topic}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(storedQuestions));

      return storedQuestions;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  },

  // Get daily question (cached)
  async getDailyQuestion(): Promise<Question | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `daily_question_${today}`;
      
      // Check cache first
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch random question from Firestore
      const snapshot = await getDocs(collection(db, 'questions'));
      const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      
      if (questions.length === 0) return null;
      
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      // Cache for today
      await AsyncStorage.setItem(cacheKey, JSON.stringify(randomQuestion));
      
      return randomQuestion;
    } catch (error) {
      console.error('Error getting daily question:', error);
      return null;
    }
  }
};