"use client";
import { useEffect, useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Home, ListTodo, Brain, Timer, Music, Settings, Volume2, Image as ImageIcon, Maximize2, CalendarCheck } from 'lucide-react';
import Image from 'next/image';
import '@/app/[locale]/globals.css';
import { useRouter } from '@/i18n/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Howl } from 'howler';
import { BackgroundModal } from '@/components/BackgroundModal';
import { MusicModal } from '@/components/MusicModal';


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const menuItems = [
  { icon: <Home />, label: 'menuHome', href: '/dashboard' },
  { icon: <Timer />, label: 'menuFocus', href: '/dashboard/focus' },
  { icon: <ListTodo />, label: 'menuTasks', href: '/dashboard/tasks' },
  // { icon: <CalendarDays />, label: 'menuHabits', href: '/dashboard/habits' },
  // { icon: <NotebookPen />, label: 'menuNotepad', href: '/notepad' },
  // { icon: <LayoutGrid />, label: 'menuEisenhower', href: '/eisenhower' },
  { icon: <Brain />, label: 'menuFlashcards', href: '/dashboard/flashcards' },
  // { icon: <BarChart />, label: 'menuStats', href: '/statistics' },
  // { icon: <HeartPulse />, label: 'menuRelax', href: '/relax' },
  { icon: <CalendarCheck />, label: 'menuPlanner', href: '/dashboard/planner' },
];

interface TaskType {
  id: string;
  user_id: string;
  title: string;
  priority: string;
  due_date: string | null;
  is_done: boolean;
  created_at: string;
}

interface NotificationType {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
  set_id?: string;
  set_name?: string;
}

const soundOptions = [
  { name: 'Rain', icon: '🌧️', src: '/sounds/rain.mp3' },
  { name: 'Ocean', icon: '🌊', src: '/sounds/ocean.mp3' },
  { name: 'Wind', icon: '💨', src: '/sounds/wind.mp3' },
  { name: 'Fireplace', icon: '🔥', src: '/sounds/fireplace.mp3' },
  { name: 'Cafe', icon: '☕', src: '/sounds/cafe.mp3' },
  { name: 'Thunder', icon: '⛈️', src: '/sounds/thunder.mp3' },
  { name: 'Night', icon: '🌙', src: '/sounds/night.mp3' },
  { name: 'Birds', icon: '🐦', src: '/sounds/birds.mp3' },
];

// Scrambler effect for title
function ScrambleText({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    let frame = 0;
    let interval: NodeJS.Timeout;
    const chars = '!<>-_\/[]{}—=+*^?#________';
    const scramble = () => {
      setDisplay(prev => {
        return text.split('').map((c, i) => {
          if (i < frame) return text[i];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
      });
      frame++;
      if (frame > text.length) clearInterval(interval);
    };
    setDisplay(''.padEnd(text.length, '_'));
    interval = setInterval(scramble, 30);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{display}</span>;
}

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const router = useRouter();
  const [time, setTime] = useState(new Date());
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const soundModalRef = useRef<HTMLDivElement>(null);
  const [currentSound, setCurrentSound] = useState<Howl | null>(null);
  const [currentSoundName, setCurrentSoundName] = useState<string | null>(null);
  const [showBgModal, setShowBgModal] = useState(false);
  const [background, setBackground] = useState<any>(null);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [musicPlayer, setMusicPlayer] = useState<{ service: 'spotify' | 'yandex'; uri: string } | null>(null);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/auth/login');
        } else {
          setUserId(user.id);
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth error:", error);
        router.replace('/auth/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // Update clock every second
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch today's tasks
  useEffect(() => {
    if (loading || !userId) return;
    
    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        
        // Fetch tasks that are due today OR have no due date (to include tasks from tasks page)
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .or(`due_date.eq.${today},due_date.is.null`)
          .eq('is_done', false)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        console.log('Fetched tasks:', data);
        setTasks(data || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoadingTasks(false);
      }
    };
    
    fetchTasks();
    
    // Set up real-time subscription for task changes
    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('Task change received:', payload);
          // Refresh tasks on any change
          fetchTasks();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(tasksSubscription);
    };
  }, [loading, userId]);

  // Fetch unread notifications
  useEffect(() => {
    if (loading || !userId) return;
    
    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .eq("read", false)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
        setNotifications(data || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoadingNotifications(false);
      }
    };
    
    fetchNotifications();
    
    // Set up real-time subscription for notifications
    const notificationsSubscription = supabase
      .channel('notifications-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        () => {
          fetchNotifications();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  }, [loading, userId]);

  // Close modal on outside click or Esc
  useEffect(() => {
    if (!showSoundModal) return;
    
    const handleClick = (e: MouseEvent) => {
      if (soundModalRef.current && !soundModalRef.current.contains(e.target as Node)) {
        setShowSoundModal(false);
      }
    };
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSoundModal(false);
    };
    
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showSoundModal]);

  // Fullscreen toggle with error handling
  const handleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  // Check fullscreen change from browser controls
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const playSound = (src: string, name: string) => {
    if (currentSound) {
      currentSound.stop();
    }
    
    try {
      const sound = new Howl({ 
        src: [src], 
        loop: true, 
        volume: 0.7,
        onloaderror: (id, err) => console.error("Sound loading error:", err)
      });
      
      sound.play();
      setCurrentSound(sound);
      setCurrentSoundName(name);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const stopSound = () => {
    if (currentSound) {
      currentSound.stop();
      setCurrentSound(null);
      setCurrentSoundName(null);
    }
  };

  // Load saved background
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dashboard-bg');
      if (saved) {
        if (saved.trim().startsWith('{')) {
          setBackground(JSON.parse(saved));
        } else {
          setBackground({ src: saved, type: 'image' });
        }
      }
    } catch (error) {
      console.error("Error loading background:", error);
      setBackground(null);
    }
  }, []);

  const handleSelectBg = (bg: any) => {
    setBackground(bg);
    try {
      localStorage.setItem('dashboard-bg', JSON.stringify(bg));
    } catch (error) {
      console.error("Error saving background:", error);
    }
    setShowBgModal(false);
  };

  const markTaskDone = async (taskId: string) => {
    try {
      await supabase
        .from('tasks')
        .update({ is_done: true })
        .eq('id', taskId);
      
      // Remove from local state for immediate UI update
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error("Error marking task done:", error);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      // Remove from local state for immediate UI update
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white text-2xl">Loading...</div>;
  }

  // Format time
  const timeStr = time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });

  // Priority tasks to display (up to 5)
  const priorityTasks = tasks
    .filter(task => !task.is_done)
    .sort((a, b) => {
      // Sort by priority first (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      if (priorityA !== priorityB) return priorityB - priorityA;
      
      // Then by creation date
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .slice(0, 5); // Limit to 5 tasks for display

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center">
      {/* Video background */}
      {background && background.type === 'video' && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-0"
          src={background.src}
        />
      )}
      {/* Image background */}
      {background && background.type === 'image' && (
        <div
          className="fixed inset-0 w-full h-full object-cover z-0"
          style={{ backgroundImage: `url(${background.src})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 0.5s' }}
        />
      )}

      {/* Logo top left */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-full" />
        <span className="font-bold text-lg hidden md:block">Study Buddy</span>
      </div>

      {/* Today's tasks top right */}
      <div className="absolute top-6 right-6 w-72 max-w-[90vw] bg-white/5 backdrop-blur-md rounded-xl shadow-lg p-4 flex flex-col gap-2">
        <div className="font-semibold mb-2 text-lg">
          <ScrambleText text={t('tasksToday')} />
        </div>
        <div className="max-h-[176px] overflow-y-auto pr-2 space-y-2"> {/* 2 items at 80px + gap */}
          {/* AI notifications */}
          {notifications.length > 0 && (
            <div className="space-y-2">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  className="bg-white/10 hover:bg-white/15 transition-colors rounded-lg p-2 text-sm font-medium flex items-center justify-between group cursor-pointer min-h-[56px]"
                  onClick={() => n.set_id && router.push(`/dashboard/flashcards/${n.set_id}`)}
                >
                  <div className="flex-1">
                    <div className="text-white/90">{n.message}</div>
                    {n.set_name && (
                      <div className="text-white/60 text-xs mt-1">{n.set_name}</div>
                    )}
                  </div>
                  <button 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationRead(n.id);
                    }}
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Tasks */}
          {priorityTasks.length > 0 && (
            <div className="space-y-2">
              {priorityTasks.map(task => (
                <div 
                  key={task.id} 
                  className="bg-white/10 hover:bg-white/15 transition-colors rounded-lg p-2 text-sm font-medium flex items-center justify-between group min-h-[56px]"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <ListTodo className="w-4 h-4 text-gray-300" />
                    <span className={task.is_done ? 'line-through text-gray-500' : 'text-white/90'}>{task.title}</span>
                    <span
                      className={
                        'ml-2 px-2 py-0.5 rounded text-xs font-semibold ' +
                        (task.priority === 'high'
                          ? 'bg-red-500/80 text-white'
                          : task.priority === 'medium'
                            ? 'bg-yellow-400/80 text-black'
                            : 'bg-blue-400/80 text-black')
                      }
                    >
                      {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <button 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white"
                    onClick={() => markTaskDone(task.id)}
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Only show 'no tasks' if both are loaded and both are empty */}
          {(!loadingTasks && !loadingNotifications && priorityTasks.length === 0 && notifications.length === 0) && (
            <div className="text-gray-400 text-sm">{t('noTasks')}</div>
          )}
          
          {/* Loading indicator */}
          {(loadingTasks || loadingNotifications) && (
            <div className="flex justify-center py-2">
              <div className="animate-pulse w-6 h-6 bg-white/20 rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom left: settings, music */}
      <div className="absolute bottom-6 left-6 flex flex-row gap-2">
        <Button className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition" aria-label={t('settings')} onClick={() => router.push(`/dashboard/settings`)}><Settings className="w-5 h-5" /></Button>
        {/* <Button className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition" aria-label={t('musicConnect')} onClick={() => setShowMusicModal(true)}><Music className="w-5 h-5" /></Button> */}
      </div>

      {/* Bottom right: sound, bg, fullscreen (horizontal) */}
      <div className="absolute bottom-6 right-6 flex flex-row gap-2 z-40">
        <Button className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition" aria-label={t('sound')} onClick={() => setShowSoundModal(true)}><Volume2 className="w-5 h-5" /></Button>
        <Button className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition" aria-label={t('background')} onClick={() => setShowBgModal(true)}><ImageIcon className="w-5 h-5" /></Button>
        <Button className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition" aria-label={t('fullscreen')} onClick={handleFullscreen}><Maximize2 className="w-5 h-5" /></Button>
      </div>

      {/* Center clock */}
      <div className="flex flex-col items-center justify-center select-none z-10">
        <div className="text-[16vw] md:text-[10vw] font-extrabold tracking-tight mb-2" style={{ letterSpacing: '-0.05em' }}>{timeStr}</div>
        <div className="text-lg md:text-2xl text-white/70 mb-8">{dateStr}</div>
      </div>

      {/* macOS-style menu bar */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-6 bg-white/5 rounded-2xl px-12 py-2 shadow-2xl backdrop-blur-md border border-white/10 min-w-[600px] max-w-[90vw] h-16 items-center justify-center">
        {menuItems.map(item => (
          <a key={item.href} href={`/${locale}${item.href}`} className="relative group flex items-center justify-center">
            <span className="p-2 rounded-full group-hover:bg-white/10 transition-colors">{item.icon}</span>
            {/* Tooltip on hover */}
            <span className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/90 text-white text-xs rounded shadow opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {t(item.label)}
            </span>
          </a>
        ))}
      </nav>

      {/* Sound Picker Modal */}
      <AnimatePresence>
        {showSoundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              ref={soundModalRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-neutral-900/90 rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-semibold text-white">{t('sound')}</span>
                <button onClick={() => setShowSoundModal(false)} className="text-white/60 hover:text-white text-2xl px-2">×</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {soundOptions.map(opt => (
                  <button
                    key={opt.name}
                    className={`flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl p-4 transition group ${currentSoundName === opt.name ? 'ring-2 ring-white' : ''}`}
                    onClick={() => playSound(opt.src, opt.name)}
                  >
                    <span className="text-3xl mb-2">{opt.icon}</span>
                    <span className="text-sm text-white/80 group-hover:text-white text-center whitespace-nowrap">{opt.name}</span>
                  </button>
                ))}
              </div>
              {currentSound && (
                <div className="flex justify-center mt-6">
                  <Button variant="outline" className="rounded-full px-6 py-2 text-black" onClick={stopSound}>Stop</Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <BackgroundModal
        isOpen={showBgModal}
        onClose={() => setShowBgModal(false)}
        onSelect={handleSelectBg}
        selected={background}
      />
      <MusicModal isOpen={showMusicModal} onClose={() => setShowMusicModal(false)} onPlay={setMusicPlayer} />
      {/* Persistent music player (outside modal) */}
      {musicPlayer && musicPlayer.service === 'spotify' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl">
          <iframe
            style={{ borderRadius: 12 }}
            src={`https://open.spotify.com/embed/${musicPlayer.uri.replace('spotify:', '').replace('playlist:', 'playlist/').replace('track:', 'track/')}`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
        </div>
      )}
      {musicPlayer && musicPlayer.service === 'yandex' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl">
          <iframe
            frameBorder="0"
            style={{ borderRadius: 12 }}
            width="100%"
            height="80"
            src={musicPlayer.uri.replace('https://music.yandex.ru/', 'https://music.yandex.ru/iframe/#')}
          ></iframe>
        </div>
      )}
    </div>
  );
}