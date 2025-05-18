'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Howl } from 'howler';

interface SoundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const soundOptions = [
  { name: 'Rain', icon: '🌧️', src: '/sounds/rain.mp3' },
  { name: 'Ocean', icon: '🌊', src: '/sounds/ocean.mp3' },
  { name: 'Wind', icon: '🌪️', src: '/sounds/wind.mp3' },
  { name: 'Fireplace', icon: '🔥', src: '/sounds/fireplace.mp3' },
  { name: 'Cafe', icon: '☕', src: '/sounds/cafe.mp3' },
  { name: 'Thunder', icon: '⛈️', src: '/sounds/thunder.mp3' },
  { name: 'Night', icon: '🌙', src: '/sounds/night.mp3' },
  { name: 'Birds', icon: '🐦', src: '/sounds/birds.mp3' },
];

export function SoundModal({ isOpen, onClose }: SoundModalProps) {
  const t = useTranslations('Dashboard');
  const [currentSound, setCurrentSound] = useState<Howl | null>(null);
  const [currentSoundName, setCurrentSoundName] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const playSound = (src: string, name: string) => {
    if (currentSound) {
      currentSound.stop();
    }
    const sound = new Howl({
      src: [src],
      loop: true,
      volume: 0.5,
    });
    sound.play();
    setCurrentSound(sound);
    setCurrentSoundName(name);
  };

  const stopSound = () => {
    if (currentSound) {
      currentSound.stop();
      setCurrentSound(null);
      setCurrentSoundName(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-neutral-900/90 rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <span className="text-xl font-semibold text-white">{t('sound')}</span>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl px-2">×</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {soundOptions.map(opt => (
            <button
              key={opt.name}
              className={`flex flex-col items-center justify-center bg-white hover:bg-gray-100 rounded-xl p-4 transition group text-black ${currentSoundName === opt.name ? 'ring-2 ring-black' : ''}`}
              onClick={() => playSound(opt.src, opt.name)}
            >
              <span className="text-3xl mb-2">{opt.icon}</span>
              <span className="text-sm text-black text-center whitespace-nowrap">{opt.name}</span>
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
  );
} 