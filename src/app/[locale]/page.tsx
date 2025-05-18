"use client";
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion, useAnimation } from 'framer-motion';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import '@/app/[locale]/globals.css';
import { useEffect, useMemo } from 'react';

const navLinks = [
  { href: '/about', label: 'about' },
  { href: '/download', label: 'download' },
  { href: '/premium', label: 'premium' },
  { href: '/contacts', label: 'contacts' },
];

const locales = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
];

export default function HomePage() {
  const t = useTranslations('HomePage');
  const locale = useLocale();
  const logoControls = useAnimation();

  // Logo slow left-right animation (only PNG)
  useEffect(() => {
    const animate = async () => {
      while (true) {
        await logoControls.start({ rotate: 10 }, { duration: 4, ease: 'easeInOut' });
        await logoControls.start({ rotate: -10 }, { duration: 4, ease: 'easeInOut' });
      }
    };
    animate();
  }, [logoControls]);

  // Language switcher handler (ALWAYS go to /[locale] root)
  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    if (newLocale !== locale) {
      window.location.pathname = `/${newLocale}`;
    } 
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col">
      {/* Minimalistic Cloud Gradient - beige, gold, violet, subtle and soft */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] rounded-full"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 50%, #f5e7c6cc 0%, #e7c58599 40%, #a78bfa66 80%, transparent 100%)",
            filter: "blur(60px)",
            opacity: 0.55,
          }}
          animate={{
            scale: [1, 1.03, 1],
            x: [0, 10, 0],
            y: [0, -10, 0],
          }}
          transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Animated Stars */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {[...Array(80)].map((_, i) => {
          // UseMemo to keep star properties stable across renders
          const starProps = useMemo(() => {
            const size = Math.random() * 2 + 1;
            const left = `${Math.random() * 100}%`;
            const top = `${Math.random() * 100}%`;
            const baseOpacity = Math.random() * 0.7 + 0.3;
            const moveY = Math.random() * 10 - 5;
            const moveX = Math.random() * 10 - 5;
            const moveDuration = 60 + Math.random() * 40; // 60-100s
            const pulseDuration = 18 + Math.random() * 12; // 18-30s
            const delay = Math.random() * 10;
            return { size, left, top, baseOpacity, moveY, moveX, moveDuration, pulseDuration, delay };
          }, [i]);
          return (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: starProps.size,
                height: starProps.size,
                left: starProps.left,
                top: starProps.top,
              }}
              animate={{
                y: [0, starProps.moveY, 0],
                x: [0, starProps.moveX, 0],
                opacity: [starProps.baseOpacity, starProps.baseOpacity + 0.25, starProps.baseOpacity],
              }}
              transition={{
                y: { duration: starProps.moveDuration, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                x: { duration: starProps.moveDuration, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                opacity: { duration: starProps.pulseDuration, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                delay: starProps.delay,
              }}
            />
          );
        })}
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 md:px-16">
        <div className="flex items-center gap-3">
          <motion.div animate={logoControls} className="inline-block">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded-full shadow-lg" />
          </motion.div>
          <span className="text-2xl font-bold text-white tracking-tight select-none">Study Buddy</span>
        </div>
        {/* <nav className="hidden md:flex gap-8 items-center">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-lg font-medium text-white hover:text-white/80 transition-colors duration-200"
            >
              {t(link.label)}
            </Link>
          ))}
        </nav> */}
        <div className="flex gap-3 items-center">
          <Link href={`/dashboard`} className="px-5 py-2 rounded-full border border-white text-white bg-black/40 hover:bg-white/10 transition-all font-semibold text-sm md:text-base shadow-md">
            {t('login')}
          </Link>
          {/* Language Switcher */}
          <div className="relative ml-2 group">
            <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
            <select
              className="appearance-none bg-black/40 border border-white text-white rounded-full pl-8 pr-8 py-1 text-sm focus:outline-none min-w-[60px] cursor-pointer transition-all focus:ring-2 focus:ring-white/50 hover:bg-white/10"
              value={locale}
              onChange={handleLocaleChange}
              aria-label="Select language"
            >
              {locales.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 8 8"><path d="M2 3l2 2 2-2"/></svg>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 flex flex-1 flex-col items-center justify-center text-center px-6 py-16 md:py-32">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-6"
        >
          {t('heroTitle')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-lg md:text-2xl text-white/80 max-w-2xl mx-auto mb-10"
        >
          {t('heroSubtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-col md:flex-row gap-4 justify-center"
        >
          <Link href={`/dashboard`} className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg shadow-xl hover:bg-white/80 transition-all">
            {t('getStarted')}
          </Link>
          {/* <Link href="/about" className="px-8 py-4 rounded-full border border-white text-white bg-black/40 hover:bg-white/10 font-bold text-lg shadow-xl transition-all">
            {t('learnMore')}
          </Link> */}
        </motion.div>
      </main>
    </div>
  );
}