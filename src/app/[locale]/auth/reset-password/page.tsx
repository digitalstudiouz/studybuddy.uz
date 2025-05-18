// This is the reset password page.
// It handles the redirect from the Supabase password reset email link.

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@supabase/supabase-js';
import '@/app/[locale]/globals.css';


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null); // Keep track if a token was found
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract tokens from URL hash provided by Supabase recovery email
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // remove #
    const token = params.get('access_token');
    const type = params.get('type'); // Should be 'recovery' for password reset

    if (token && type === 'recovery') {
      // Supabase client should automatically pick up the token from the hash
      // and set the session for subsequent authenticated calls.
      setRecoveryToken(token); // Indicate that a valid recovery token was present
      setLoading(false);
    } else {
      setError('Invalid or expired password reset link. Please request a new one.');
      setLoading(false);
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // The recovery token should have already set the session implicitly via the hash.
    // We can now call updateUser directly on the authenticated client.
    setLoading(true);

    // Use the standard updateUser method for the currently authenticated session (set by the token in the hash)
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      setError(updateError.message);
    } else {
      setMessage('Password reset successfully. Redirecting to login...');
      // Clear the hash from the URL before redirecting
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000); // Reduced delay slightly
    }

    setLoading(false);
  };

  // Only show the form if a recovery token was successfully found in the hash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading password reset page...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="bg-white/5 rounded-xl p-8 shadow-lg w-96 max-w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-6 text-white">Reset Password</h2>
        {error && <p className="text-red-500 mb-4 text-sm text-center w-full">{error}</p>}
        {message && <p className="text-green-500 mb-4 text-sm text-center w-full">{message}</p>}

        {/* Show the form only if a valid recovery token was found */}
        {recoveryToken ? (
          <form onSubmit={handlePasswordReset} className="w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70" htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                className="mt-1 block w-full rounded-md border border-white/20 bg-black/80 px-3 py-2 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="mt-1 block w-full rounded-md border border-white/20 bg-black/80 px-3 py-2 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          // Show the error message if no valid token was found
          <div className="text-center w-full">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}