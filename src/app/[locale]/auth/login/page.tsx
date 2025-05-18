"use client";
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import '@/app/[locale]/globals.css';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Loader2, Mail, LogIn } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function LoginPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(t('loginError'));
      return;
    }
    // Check if email is confirmed
    const { data: { user } } = await supabase.auth.getUser();
    setLoading(false);
    if (!user?.email_confirmed_at) {
      // Store email for the confirmation page to use when resending confirmation
      localStorage.setItem('pendingConfirmationEmail', email);
      router.push(`/auth/confirm`);
    } else {
      router.push(`/dashboard`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form onSubmit={handleLogin} className="bg-white/5 p-8 rounded-xl shadow-xl w-full max-w-md flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center text-white mb-2">{t('loginTitle')}</h1>
        <div>
          <label className="block text-white mb-1" htmlFor="email">{t('email')}</label>
          <div className="relative">
            <Input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className="pr-10" />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block text-white mb-1" htmlFor="password">{t('password')}</label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required className="pr-10" />
            <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}</button>
          </div>
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin w-5 h-5" /> : <LogIn className="w-5 h-5 mr-2" />} {t('login')}</Button>
        <div className="flex justify-between text-sm mt-2">
          <a href={`/${locale}/auth/register`} className="text-white hover:underline">{t('noAccount')}</a>
          <a href={`/${locale}/auth/forgot-password`} className="text-white hover:underline">{t('forgotPassword')}</a>
        </div>
      </form>
    </div>
  ); 
}