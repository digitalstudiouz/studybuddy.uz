"use client";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { createClient, User as SupabaseUser } from '@supabase/supabase-js';
import Image from 'next/image';
import { Settings, LogOut, Timer, User } from 'lucide-react';
import '@/app/[locale]/globals.css';
import { useTranslations } from 'next-intl';


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Section = 'general' | 'pomodoro' | 'profile';

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [section, setSection] = useState<Section>('general');
  const [language, setLanguage] = useState('ru');
  const [work, setWork] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [savedGeneral, setSavedGeneral] = useState(false);
  const [savedPomodoro, setSavedPomodoro] = useState(false);
  const t = useTranslations('Settings');

  // Load settings from localStorage
  useEffect(() => {
    setLanguage(localStorage.getItem('sb-language') || 'ru');
    setWork(Number(localStorage.getItem('sb-work') || 25));
    setShortBreak(Number(localStorage.getItem('sb-shortBreak') || 5));
    setLongBreak(Number(localStorage.getItem('sb-longBreak') || 15));
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // Save settings to localStorage
  const saveGeneral = () => {
    localStorage.setItem('sb-language', language);
  };
  const savePomodoro = () => {
    localStorage.setItem('sb-work', String(work));
    localStorage.setItem('sb-shortBreak', String(shortBreak));
    localStorage.setItem('sb-longBreak', String(longBreak));
  };

  // Language change: redirect to /[locale]/dashboard/settings
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('sb-language', lang);
    
    // Use the next-intl router to change the locale while preserving the current path
    // This is the correct way to handle locale changes with next-intl
    router.push('/dashboard/settings', { locale: lang });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  // Get logo (replace with your logo path)
  const logo = '/logo.png';

  return (
    <div className="min-h-screen bg-black text-white flex flex-row">
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10 flex flex-col justify-between py-6 px-4 min-h-screen">
        <div>
          <div 
            className="flex items-center gap-3 mb-6 cursor-pointer hover:opacity-80 transition"
            onClick={() => router.push('/dashboard')}
          >
            <Image src={logo} alt="Logo" width={36} height={36} className="rounded-full" />
            <span className="font-bold text-xl tracking-tight">{t('settings')}</span>
          </div>
          <nav className="flex flex-col gap-2">
            <button className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-white/80 ${section==='general'?'bg-white/10':''}`} onClick={()=>setSection('general')}>
              <Settings className="w-5 h-5" /> {t('general')}
            </button>
            <button className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-white/80 ${section==='pomodoro'?'bg-white/10':''}`} onClick={()=>setSection('pomodoro')}>
              <Timer className="w-5 h-5" /> {t('pomodoro')}
            </button>
            <button className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-white/80 ${section==='profile'?'bg-white/10':''}`} onClick={()=>setSection('profile')}>
              <User className="w-5 h-5" /> {t('profile')}
            </button>
          </nav>
        </div>
        {/* Profile at bottom */}
        <div className="flex flex-col items-center gap-2 mt-8">
          {user && user.user_metadata?.avatar_url && (
            <Image src={user.user_metadata.avatar_url} alt="User Photo" width={48} height={48} className="rounded-full" />
          )}
          <div className="text-xs text-white/60">{user?.email}</div>
          <button onClick={handleLogout} className="mt-2 bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1 text-xs flex items-center gap-1"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-12 px-4 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {section === 'general' && (
            <section className="bg-white/5 rounded-2xl p-6 shadow flex flex-col gap-3">
              <h2 className="font-bold text-lg mb-2">{t('language')}</h2>
              <select
                className="bg-black/80 border border-white/20 rounded px-3 py-2 text-white w-48"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="uz">Oʻzbekcha</option>
              </select>
              <button onClick={() => { saveGeneral(); handleLanguageChange(language); setSavedGeneral(true); setTimeout(()=>setSavedGeneral(false), 1500); }} className="mt-4 bg-white text-black hover:bg-gray-200 rounded px-4 py-2 self-end transition">{t('save')}</button>
              {savedGeneral && <div className="text-green-400 mt-2 text-sm text-right">{t('saved')}</div>}
            </section>
          )}
          {section === 'pomodoro' && (
            <section className="bg-white/5 rounded-2xl p-6 shadow flex flex-col gap-3">
              <h2 className="font-bold text-lg mb-2">{t('pomodoro')}</h2>
              <div className="flex flex-col gap-2">
                <label>{t('work')}: <input type="number" min={1} max={90} className="bg-black/80 border border-white/20 rounded px-2 py-1 ml-2 w-16" value={work} onChange={e => setWork(Number(e.target.value))} /></label>
                <label>{t('shortBreak')}: <input type="number" min={1} max={30} className="bg-black/80 border border-white/20 rounded px-2 py-1 ml-2 w-16" value={shortBreak} onChange={e => setShortBreak(Number(e.target.value))} /></label>
                <label>{t('longBreak')}: <input type="number" min={1} max={60} className="bg-black/80 border border-white/20 rounded px-2 py-1 ml-2 w-16" value={longBreak} onChange={e => setLongBreak(Number(e.target.value))} /></label>
              </div>
              <button onClick={() => { savePomodoro(); setSavedPomodoro(true); setTimeout(()=>{ setSavedPomodoro(false); window.location.reload(); }, 1200); }} className="mt-4 bg-white text-black hover:bg-gray-200 rounded px-4 py-2 self-end transition">{t('save')}</button>
              {savedPomodoro && <div className="text-green-400 mt-2 text-sm text-right">{t('saved')}</div>}
            </section>
          )}
          {section === 'profile' && (
            <section className="bg-white/5 rounded-2xl p-6 shadow flex flex-col gap-3 items-center">
              <h2 className="font-bold text-lg mb-2">{t('profile')}</h2>
              {user && user.user_metadata?.avatar_url && (
                <Image src={user.user_metadata.avatar_url} alt="User Photo" width={64} height={64} className="rounded-full mb-2" />
              )}
              <div className="text-white/80 text-center">
                <div>{t('email')}: {user?.email}</div>
                <div className="text-xs text-white/50 mt-1">{t('userId')}: {user?.id}</div>
              </div>
              <button onClick={handleLogout} className="mt-4 bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2">{t('logout')}</button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}