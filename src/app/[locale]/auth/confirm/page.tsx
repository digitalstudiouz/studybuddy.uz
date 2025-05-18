"use client";
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import '@/app/[locale]/globals.css';
import { useLocale } from 'next-intl';
import { Check, Loader2, Mail } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ConfirmPage() {
  const t = useTranslations('Auth'); 
  const locale = useLocale();
  const router = useRouter();
  
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(''); 

  // Handle email confirmation from Supabase email link
  
useEffect(() => {
  const confirmEmail = async () => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.substring(1); // отрезаем '#'
    const urlParams = new URLSearchParams(hash);

    const accessToken = urlParams.get('access_token') || '';
    const refreshToken = urlParams.get('refresh_token') || '';
    const type = urlParams.get('type');

    if ((accessToken || refreshToken) && (type === 'email_confirmation' || type === 'signup')) {
      setVerifying(true);
      try {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        setVerified(true);
        setTimeout(() => {
          router.push(`/dashboard`);
        }, 2000);
      } catch (err) {
        console.error('Error confirming email:', err);
        setError(t('emailConfirmError'));
      } finally {
        setVerifying(false);
      }
    }
  };
  confirmEmail();
}, [router, locale, t]);


  // Resend confirmation email
  const handleResendConfirmation = async () => {
    setVerifying(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: localStorage.getItem('pendingConfirmationEmail') || '',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });
      
      if (error) throw error;
      alert(t('emailResent'));
    } catch (err) {
      console.error('Error resending confirmation:', err);
      setError(t('emailResendError'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-white/5 p-8 rounded-xl shadow-xl w-full max-w-md flex flex-col gap-6 items-center">
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          {verified ? t('emailConfirmed') : t('confirmEmail')}
        </h1>
        
        <div className="text-center text-white">
          {verified ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-green-500/20 p-4 rounded-full">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <p>{t('redirectingToDashboard')}</p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-blue-500/20 p-4 rounded-full">
                  <Mail className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <p>{t('checkEmailForConfirmation')}</p>
              <p className="mt-2 text-sm opacity-80">{t('checkSpamFolder')}</p>
            </>
          )}
        </div>
        
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        
        {!verified && (
          <Button 
            onClick={handleResendConfirmation} 
            className="mt-4" 
            disabled={verifying}
          >
            {verifying ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
            {t('resendConfirmationEmail')}
          </Button>
        )}
        
        <div className="text-sm mt-4">
          <a href={`/auth/login`} className="text-white hover:underline">
            {t('backToLogin')}
          </a>
        </div>
      </div>
    </div>
  );
}