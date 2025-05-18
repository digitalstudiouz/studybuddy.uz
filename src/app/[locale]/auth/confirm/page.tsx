"use client";
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import '@/app/[locale]/globals.css';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ConfirmPage() {
  const t = useTranslations('Auth');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const handleResend = async () => {
    setError('');
    setSent(false);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) setError(t('resendError'));
    else setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-white/5 p-8 rounded-xl shadow-xl w-full max-w-md flex flex-col gap-6 items-center">
        <h1 className="text-2xl font-bold text-center text-white mb-2">{t('confirmTitle')}</h1>
        <p className="text-white/80 text-center">{t('confirmMessage')}</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="w-full max-w-xs p-2 rounded bg-white/10 text-white border border-white/20 focus:border-white/40 focus:outline-none"
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        {sent && <div className="text-green-500 text-sm text-center">{t('resendSuccess')}</div>}
        <Button onClick={handleResend} className="w-full max-w-xs">{t('resendLink')}</Button>
      </div>
    </div>
  );
} 