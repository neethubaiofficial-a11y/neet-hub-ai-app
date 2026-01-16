import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/Spacing';

export default function FocusModeScreen() {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'pomodoro' | 'short' | 'long'>('pomodoro');

  const durations = {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsRunning(false);
      Alert.alert('Time\'s Up!', 'Great job! Take a break.');
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (newMode: 'pomodoro' | 'short' | 'long') => {
    setMode(newMode);
    setTimeRemaining(durations[newMode]);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeRemaining(durations[mode]);
    setIsRunning(false);
  };

  const progress = 1 - timeRemaining / durations[mode];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus Mode</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'pomodoro' && styles.modeButtonActive]}
            onPress={() => handleModeChange('pomodoro')}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'pomodoro' && styles.modeButtonTextActive,
              ]}
            >
              Pomodoro
            </Text>
            <Text style={styles.modeButtonTime}>25:00</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'short' && styles.modeButtonActive]}
            onPress={() => handleModeChange('short')}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'short' && styles.modeButtonTextActive,
              ]}
            >
              Short Break
            </Text>
            <Text style={styles.modeButtonTime}>5:00</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'long' && styles.modeButtonActive]}
            onPress={() => handleModeChange('long')}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'long' && styles.modeButtonTextActive,
              ]}
            >
              Long Break
            </Text>
            <Text style={styles.modeButtonTime}>15:00</Text>
          </TouchableOpacity>
        </View>

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <View style={[styles.timerCircle, { borderColor: Colors.dark.primary }]}>
            <View style={[styles.progressCircle, { transform: [{ rotate: `${progress * 360}deg` }] }]} />
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.playButton]}
            onPress={toggleTimer}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={40}
              color={Colors.dark.background}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
            <Ionicons name="refresh" size={32} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="information-circle" size={20} color={Colors.dark.info} />
          <Text style={styles.tipsText}>
            Use Pomodoro technique: 25 min focus + 5 min break. After 4 cycles, take a 15 min break.
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxxl,
  },
  modeButton: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  modeButtonActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.surfaceLight,
  },
  modeButtonText: {
    fontSize: FontSize.xs,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  modeButtonTextActive: {
    color: Colors.dark.primary,
    fontWeight: FontWeight.semibold,
  },
  modeButtonTime: {
    fontSize: FontSize.sm,
    color: Colors.dark.textTertiary,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  timerText: {
    fontSize: 72,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xxxl,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: Colors.dark.primary,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  tipsCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tipsText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
});