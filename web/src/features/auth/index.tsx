import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendCode() {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-code', { email });
      setCodeSent(true);
    } catch {
      setError('Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function verifyLogin() {
    if (!email || !code) return;
    setLoading(true);
    setError('');
    try {
      const resp = await api.post('/auth/verify-login', { email, code });
      const { user, token } = resp.data;
      setUser(user, token);
      void navigate({ to: '/' });
    } catch {
      setError('Invalid code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">{t('app.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('app.subtitle')}</p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium text-foreground">
              {t('auth.verifyCode')}
            </label>
            <div className="flex gap-2">
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="123456"
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={loading || !email}
                className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
              >
                {t('auth.sendCode')}
              </button>
            </div>
            {codeSent && <p className="text-xs text-muted-foreground">{t('auth.codeSent')}</p>}
          </div>

          <button
            type="button"
            onClick={verifyLogin}
            disabled={loading || !email || !code}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {t('auth.loginButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
