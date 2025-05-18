'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@supabase/supabase-js';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import '@/app/[locale]/globals.css';
import { motion } from 'framer-motion';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function FocusPage() {
  const t = useTranslations('Dashboard');
  const [completedSessions, setCompletedSessions] = useState(0);

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_type', 'focus')
        .order('created_at', { ascending: false });

      if (sessions) {
        setCompletedSessions(sessions.length);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Top buttons */}
      <div className="fixed top-6 left-6 flex flex-row gap-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md rounded-xl p-4"
        >
          <div className="text-sm text-white/60 mb-1">{t('completedSessions')}</div>
          <div className="text-2xl font-bold">{completedSessions}</div>
        </motion.div>
      </div>

      {/* Main timer */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="w-full max-w-3xl mx-auto px-4"
      >
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8">
          <PomodoroTimer onSessionComplete={() => setCompletedSessions(prev => prev + 1)} />
        </div>
      </motion.div>
    </div>
  );
} 