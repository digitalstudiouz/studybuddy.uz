'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SiSpotify } from 'react-icons/si';
import { Music } from 'lucide-react';
import { useLocale } from 'next-intl';

interface Playlist {
  id: string;
  name: string;
  uri: string;
}

interface MusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlay: (player: { service: 'spotify' | 'yandex', uri: string }) => void;
}

const SPOTIFY_CLIENT_ID = '0a984f452ca0421fa9572648a9b9c659'; // TODO: Replace with your real client ID
const SPOTIFY_SCOPES = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';

export function MusicModal({ isOpen, onClose, onPlay }: MusicModalProps) {
  const locale = useLocale();
  const SPOTIFY_REDIRECT_URI = `http://172.35.14.195:3000/${locale}/dashboard`;
  const [showSpotify, setShowSpotify] = useState(false);
  const [showYandex, setShowYandex] = useState(false);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<Playlist[]>([]);
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [yandexUrl, setYandexUrl] = useState('');
  const [yandexError, setYandexError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle OAuth redirect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const token = params.get('access_token');
      if (token) {
        setSpotifyToken(token);
        window.location.hash = '';
      }
    }
  }, []);

  // Fetch Spotify playlists
  useEffect(() => {
    if (!spotifyToken) return;
    setLoadingSpotify(true);
    fetch('https://api.spotify.com/v1/me/playlists', {
      headers: { Authorization: `Bearer ${spotifyToken}` },
    })
      .then(res => res.json())
      .then(data => {
        setSpotifyPlaylists(
          (data.items || []).map((pl: any) => ({
            id: pl.id,
            name: pl.name,
            uri: pl.uri,
          }))
        );
        setLoadingSpotify(false);
      });
  }, [spotifyToken]);

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

  const handleSpotifyConnect = () => {
    const url = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
      SPOTIFY_REDIRECT_URI
    )}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}`;
    window.location.href = url;
  };

  const handleYandexPlay = () => {
    if (!yandexUrl.includes('music.yandex.ru')) {
      setYandexError('Please enter a valid Yandex Music link.');
      return;
    }
    setYandexError('');
    onPlay({ service: 'yandex', uri: yandexUrl });
    onClose();
  };

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
            className="bg-neutral-900/95 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-2xl font-bold text-white">Music Connect</span>
              <button onClick={onClose} className="text-white/60 hover:text-white text-2xl px-2">×</button>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 justify-center">
                <Button
                  variant={showSpotify ? 'default' : 'outline'}
                  className="flex items-center gap-2 px-6 py-3 text-lg text-black"
                  onClick={() => { setShowSpotify(true); setShowYandex(false); }}
                >
                  <SiSpotify className="w-6 h-6 text-green-500" /> Spotify
                </Button>
                <Button
                  variant={showYandex ? 'default' : 'outline'}
                  className="flex items-center gap-2 px-6 py-3 text-lg text-black"
                  onClick={() => { setShowYandex(true); setShowSpotify(false); }}
                >
                  <Music className="w-6 h-6 text-yellow-400" /> Yandex Music
                </Button>
              </div>
              {showSpotify && (
                <div className="mt-4">
                  {!spotifyToken ? (
                    <Button onClick={handleSpotifyConnect} className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3 rounded-xl flex items-center justify-center gap-2">
                      <SiSpotify className="w-6 h-6" /> Connect to Spotify
                    </Button>
                  ) : loadingSpotify ? (
                    <div className="text-white/70 text-center">Loading your playlists...</div>
                  ) : (
                    <div>
                      <div className="text-white/80 mb-2">Your Playlists:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {spotifyPlaylists.map(pl => (
                          <Button key={pl.id} className="w-full justify-start" onClick={() => { onPlay({ service: 'spotify', uri: pl.uri }); onClose(); }}>
                            <SiSpotify className="w-5 h-5 mr-2 text-green-500" /> {pl.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {showYandex && (
                <div className="mt-4">
                  <div className="mb-2 text-white/80">Paste a public Yandex Music playlist or album link:</div>
                  <input
                    type="text"
                    value={yandexUrl}
                    onChange={e => setYandexUrl(e.target.value)}
                    className="w-full rounded-lg px-4 py-2 bg-neutral-800 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="https://music.yandex.ru/users/.../playlists/..."
                  />
                  {yandexError && <div className="text-red-400 text-sm mt-1">{yandexError}</div>}
                  <Button className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" onClick={handleYandexPlay}>
                    Play Yandex Music
                  </Button>
                </div>
              )}
              {(!showSpotify && !showYandex) && (
                <div className="text-center text-white/70 text-base mt-4">
                  Connect your favorite music service to listen while you study.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 