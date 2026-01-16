import AsyncStorage from '@react-native-async-storage/async-storage';

interface TestSession {
  testId: string;
  userId: string;
  testType: 'full' | 'subject' | 'chapter';
  questionIds: string[];
  answers: Record<string, string>;
  currentIndex: number;
  timeRemaining: number;
  startedAt: number;
}

const SESSION_KEY = 'active_test_session';

export const testSessionService = {
  // Save test session to AsyncStorage
  async saveSession(session: TestSession): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving test session:', error);
    }
  },

  // Load test session from AsyncStorage
  async loadSession(): Promise<TestSession | null> {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error loading test session:', error);
      return null;
    }
  },

  // Clear test session
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Error clearing test session:', error);
    }
  },

  // Auto-save every 30 seconds
  startAutoSave(session: TestSession, updateCallback: () => TestSession): NodeJS.Timeout {
    return setInterval(() => {
      const currentSession = updateCallback();
      this.saveSession(currentSession);
    }, 30000); // 30 seconds
  },

  stopAutoSave(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }
};