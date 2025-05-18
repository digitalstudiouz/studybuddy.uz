'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const backgrounds = [
  {
    name: 'None',
    src: '/backgrounds/black.jpg',
    animated: false,
    plus: false,
    type: 'image',
  },
  {
    name: 'Snowy Winter Cabin',
    src: '/backgrounds/snowy-cabin.mp4',
    animated: true,
    plus: false,
    type: 'video',
  },
  {
    name: 'Countryside',
    src: '/backgrounds/countryside.jpg',
    animated: false,
    plus: false,
    type: 'image',
  },
  {
    name: 'Rainy Cabin',
    src: '/backgrounds/rainy-cabin.mp4',
    animated: true,
    plus: false,
    type: 'video',
  },
  {
    name: 'Cyberpunk',
    src: '/backgrounds/cyberpunk.jpg',
    animated: false,
    plus: false,
    type: 'image',
  },
  {
    name: 'Japanese Room',
    src: '/backgrounds/japan-room.mp4',
    animated: true,
    plus: false,
    type: 'video',
  },
  {
    name: 'Sakura',
    src: '/backgrounds/sakura.jpg',
    animated: false,
    plus: false,
    type: 'image',
  },
  {
    name: 'Fireplace',
    src: '/backgrounds/fireplace.mp4',
    animated: true,
    plus: true,
    type: 'video',
  },
  {
    name: 'Tropical landscape',
    src: '/backgrounds/tropic.jpg',
    animated: false,
    plus: true,
    type: 'image',
  },
  {
    name: 'Cafe',
    src: '/backgrounds/cafe.mp4',
    animated: true,
    plus: false,
    type: 'video',
  },
  {
    name: 'Anime',
    src: '/backgrounds/anime.mp4',
    animated: true,
    plus: true,
    type: 'video',
  },
  {
    name: 'Forest Cabin',
    src: '/backgrounds/forest-cabin.mp4',
    animated: true,
    plus: true,
    type: 'video',
  },
  {
    name: 'Space',
    src: '/backgrounds/space.jpg',
    animated: false,
    plus: true,
    type: 'image',
  },
  {
    name: 'Fall Rain',
    src: '/backgrounds/fall-rain.mp4',
    animated: true,
    plus: true,
    type: 'video',
  },
];

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (bg: typeof backgrounds[0]) => void;
  selected: any;
}

export function BackgroundModal({ isOpen, onClose, onSelect, selected }: BackgroundModalProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-neutral-900/95 rounded-2xl shadow-2xl p-8 max-w-3xl w-full mx-4"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-2xl font-bold text-white">Ambient Worlds</span>
              <button onClick={onClose} className="text-white/60 hover:text-white text-2xl px-2">×</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {backgrounds.map((bg) => (
                <button
                  key={bg.name}
                  onClick={() => onSelect(bg)}
                  className={`relative group rounded-2xl overflow-hidden shadow-lg border-2 transition-all duration-200 ${selected?.src === bg.src ? 'border-violet-500' : 'border-transparent hover:border-white/30'}`}
                  style={{ aspectRatio: '16/9' }}
                >
                  {bg.type === 'video' ? (
                    <video src={bg.src} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" autoPlay loop muted playsInline />
                  ) : (
                    <img
                      src={bg.src}
                      alt={bg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-2 left-2 flex gap-2">
                    {bg.animated && (
                      <span className="bg-violet-700 text-xs px-2 py-0.5 rounded-full text-white font-semibold shadow">ANIMATED</span>
                    )}
                    {bg.plus && (
                      <span className="bg-blue-700 text-xs px-2 py-0.5 rounded-full text-white font-semibold shadow">PLUS</span>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <span className="bg-black/70 text-white text-base font-medium px-3 py-1 rounded-lg shadow">
                      {bg.name}
                    </span>
                  </div>
                  {selected?.src === bg.src && (
                    <div className="absolute inset-0 border-4 border-violet-500 rounded-2xl pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 