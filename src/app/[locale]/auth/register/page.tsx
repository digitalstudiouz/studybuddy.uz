"use client";
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import '@/app/[locale]/globals.css';
import { Eye, EyeOff, Loader2, User, Mail, UserPlus } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function RegisterPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/${locale}/dashboard`
      }
    });
    setLoading(false);
    if (error) setError(t('registerError'));
    else router.replace(`/auth/confirm`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form onSubmit={handleRegister} className="bg-white/5 p-8 rounded-xl shadow-xl w-full max-w-md flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center text-white mb-2">{t('registerTitle')}</h1>
        <div>
          <label className="block text-white mb-1" htmlFor="username">{t('username')}</label>
          <div className="relative">
            <Input id="username" type="text" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required className="pr-10" />
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
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
            <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required className="pr-10" />
            <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}</button>
          </div>
        </div>
        <div>
          <label className="block text-white mb-1" htmlFor="confirmPassword">{t('confirmPassword')}</label>
          <div className="relative">
            <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="pr-10" />
          </div>
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin w-5 h-5" /> : <UserPlus className="w-5 h-5 mr-2" />} {t('register')}</Button>
        <div className="flex justify-between text-sm mt-2">
          <a href={`/${locale}/auth/login`} className="text-white hover:underline">{t('haveAccount')}</a>
        </div>
      </form>
    </div>
  );
} 