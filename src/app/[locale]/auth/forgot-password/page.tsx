"use client";
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@supabase/supabase-js';
import '@/app/[locale]/globals.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Send } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + `/${locale}/auth/reset-password` });
    setLoading(false);
    if (error) setError(t('resetError'));
    else setSuccess(t('resetSuccess'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form onSubmit={handleReset} className="bg-white/5 p-8 rounded-xl shadow-xl w-full max-w-md flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center text-white mb-2">{t('forgotPasswordTitle')}</h1>
        <div>
          <label className="block text-white mb-1" htmlFor="email">{t('email')}</label>
          <div className="relative">
            <Input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className="pr-10" />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        {success && <div className="text-green-500 text-sm text-center">{success}</div>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5 mr-2" />} {t('sendResetLink')}</Button>
        <div className="flex justify-between text-sm mt-2">
          <a href={`/${locale}/auth/login`} className="text-white hover:underline">{t('backToLogin')}</a>
        </div>
      </form>
    </div>
  );
} 