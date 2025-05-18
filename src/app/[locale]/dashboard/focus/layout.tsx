'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Home, ListTodo, Brain, BarChart, Timer, Music, Settings, Volume2, Image as ImageIcon, Maximize2, NotebookPen, LayoutGrid, HeartPulse, CalendarCheck, CalendarDays } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BackgroundModal } from '@/components/BackgroundModal';
import { MusicModal } from '@/components/MusicModal';
import { SoundModal } from '@/components/SoundModal';

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

export default function FocusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const router = useRouter();
  const [showBgModal, setShowBgModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [musicPlayer, setMusicPlayer] = useState<{ service: 'spotify' | 'yandex', uri: string } | null>(null);
  const [background, setBackground] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('focus-bg');
    if (saved) {
      try {
        if (saved.trim().startsWith('{')) {
          setBackground(JSON.parse(saved));
        } else {
          setBackground({ src: saved, type: 'image' });
        }
      } catch {
        setBackground(null);
      }
    }
  }, []);

  const handleSelectBg = (bg: any) => {
    setBackground(bg);
    localStorage.setItem('focus-bg', JSON.stringify(bg));
    setShowBgModal(false);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white relative">
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

      {/* Top right: settings, music, sound, bg, fullscreen */}
      <div className="fixed top-6 right-6 flex flex-row gap-2 z-40">
        <Button  className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition" aria-label={t('settings')}><Settings className="w-5 h-5" /></Button>
        <Button  className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition" aria-label={t('musicConnect')} onClick={() => setShowMusicModal(true)}><Music className="w-5 h-5" /></Button>
        <Button  className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition" aria-label={t('sound')} onClick={() => setShowSoundModal(true)}><Volume2 className="w-5 h-5" /></Button>
        <Button  className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition" aria-label={t('background')} onClick={() => setShowBgModal(true)}><ImageIcon className="w-5 h-5" /></Button>
        <Button  className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition" aria-label={t('fullscreen')} onClick={handleFullscreen}><Maximize2 className="w-5 h-5" /></Button>
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

      {/* Persistent music player */}
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

      {/* Modals */}
      <AnimatePresence>
        {showBgModal && (
          <BackgroundModal isOpen={showBgModal} onClose={() => setShowBgModal(false)} onSelect={handleSelectBg} selected={background} />
        )}
        {showMusicModal && (
          <MusicModal isOpen={showMusicModal} onClose={() => setShowMusicModal(false)} onPlay={setMusicPlayer} />
        )}
        {showSoundModal && (
          <SoundModal isOpen={showSoundModal} onClose={() => setShowSoundModal(false)} />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 