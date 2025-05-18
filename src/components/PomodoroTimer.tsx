'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { Howl } from 'howler';
import { createClient } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const SESSIONS_BEFORE_LONG_BREAK = 4;

interface PomodoroTimerProps {
  onSessionComplete: () => void;
}

// Helper to get timer values from localStorage 
function getPomodoroSettings() {
  return {
    work: Number(localStorage.getItem('sb-work') || 25) * 60,
    short: Number(localStorage.getItem('sb-shortBreak') || 5) * 60,
    long: Number(localStorage.getItem('sb-longBreak') || 15) * 60,
  };
}

export function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const t = useTranslations('Focus');
  
  // Load settings into state
  const [settings, setSettings] = useState(getPomodoroSettings());
  
  const [timeLeft, setTimeLeft] = useState(settings.work);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkTime, setIsWorkTime] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Sound effect for notifications
  const notificationSound = new Howl({
    src: ['/sounds/notification.wav'],
    volume: 0.4,
  });

  // Load completed sessions count on component mount
  useEffect(() => {
    const loadSessions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_type', 'focus')
        .order('created_at', { ascending: false });

      if (sessions) {
        setSessionsCompleted(sessions.length);
      }
    };

    loadSessions();
  }, []);

  // Update timer settings whenever localStorage changes
  const updateTimerSettings = useCallback(() => {
    const newSettings = getPomodoroSettings();
    setSettings(newSettings);
    
    // Reset the current timer if settings have changed
    if (isWorkTime && timeLeft > 0) {
      // Only reset if we're not in the middle of a running timer
      if (!isRunning) {
        setTimeLeft(newSettings.work);
      }
    } else if (!isWorkTime) {
      // For break timers, update even if running
      if (isLongBreak && !isRunning) {
        setTimeLeft(newSettings.long);
      } else if (!isLongBreak && !isRunning) {
        setTimeLeft(newSettings.short);
      }
    }
  }, [isWorkTime, isLongBreak, isRunning, timeLeft]);

  // Always update timer values from localStorage when the component is shown
  useEffect(() => {
    updateTimerSettings();
    
    // Check for settings changes when the tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimerSettings();
      }
    };
    
    // Setup event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', updateTimerSettings);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', updateTimerSettings);
    };
  }, [updateTimerSettings]);

  const saveSession = useCallback(async (duration: number, sessionType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const endTime = new Date();
    const startTime = sessionStartTime || new Date(endTime.getTime() - duration * 1000);

    await supabase
      .from('pomodoro_sessions')
      .insert([
        {
          user_id: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          session_type: sessionType,
        },
      ]);

    // Update statistics
    const today = new Date().toISOString().split('T')[0];
    const { data: existingStats } = await supabase
      .from('statistics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (existingStats) {
      await supabase
        .from('statistics')
        .update({
          focus_time_minutes: existingStats.focus_time_minutes + Math.floor(duration / 60)
        })
        .eq('id', existingStats.id);
    } else {
      await supabase
        .from('statistics')
        .insert([
          {
            user_id: user.id,
            date: today,
            focus_time_minutes: Math.floor(duration / 60),
            completed_tasks: 0,
            completed_habits: 0,
            reviewed_flashcards: 0
          }
        ]);
    }
  }, [sessionStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      notificationSound.play();
      
      if (isWorkTime) {
        setSessionsCompleted((prev) => {
          const newCount = prev + 1;
          if (newCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
            setIsLongBreak(true);
            setTimeLeft(settings.long);
          } else {
            setIsLongBreak(false);
            setTimeLeft(settings.short);
          }
          return newCount;
        });
        setIsWorkTime(false);
        saveSession(settings.work, 'focus');
        onSessionComplete();
      } else {
        setIsWorkTime(true);
        setTimeLeft(settings.work);
        saveSession(isLongBreak ? settings.long : settings.short, isLongBreak ? 'long_break' : 'short_break');
      }
      setIsRunning(false);
      setSessionStartTime(null);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isWorkTime, saveSession, onSessionComplete, isLongBreak, settings, sessionStartTime]);

  const toggleTimer = () => {
    if (!isRunning) {
      setSessionStartTime(new Date());
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isWorkTime ? settings.work : (isLongBreak ? settings.long : settings.short));
    setSessionStartTime(null);
  };

  const skipBreak = () => {
    setIsWorkTime(true);
    setTimeLeft(settings.work);
    setIsRunning(false);
    setSessionStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress based on current state and dynamic settings
  const calculateProgress = () => {
    const totalTime = isWorkTime 
      ? settings.work 
      : (isLongBreak ? settings.long : settings.short);
    
    return (totalTime - timeLeft) / totalTime;
  };

  const progress = calculateProgress();

  return (
    <div className="flex flex-col items-center justify-center -mt-8">
      <div className="relative w-[400px] h-[400px]">
        {/* Progress circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="200"
            cy="200"
            r="180"
            stroke="currentColor"
            strokeWidth="20"
            fill="none"
            className="text-white/10"
          />
          <motion.circle
            cx="200"
            cy="200"
            r="180"
            stroke="currentColor"
            strokeWidth="20"
            fill="none"
            className="text-white"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={timeLeft}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-6xl font-bold tracking-tight"
            >
              {formatTime(timeLeft)}
            </motion.div>
          </AnimatePresence>
          <div className="text-xl text-white/60 mt-4">
            {isWorkTime ? t('focusTime') : (isLongBreak ? t('longBreak') : t('shortBreak'))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-8">
        <Button
          variant="outline"
          className="rounded-full w-16 h-16 bg-white/10 hover:bg-white/20"
          onClick={toggleTimer}
        >
          {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </Button>
        <Button
          variant="outline"
          className="rounded-full w-16 h-16 bg-white/10 hover:bg-white/20"
          onClick={resetTimer}
        >
          <RotateCcw className="w-8 h-8" />
        </Button>
        {!isWorkTime && (
          <Button
            variant="outline"
            className="rounded-full w-16 h-16 bg-white/10 hover:bg-white/20"
            onClick={skipBreak}
          >
            <SkipForward className="w-8 h-8" />
          </Button>
        )}
      </div>
      <div className="mt-4 text-white/60">
        {t('sessionsCompleted')}: {sessionsCompleted}
      </div>
    </div>
  );
}