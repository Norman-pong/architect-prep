import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">{t('app.title')}</CardTitle>
          <CardDescription className="text-center">{t('app.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Field label={t('auth.email')}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label={t('auth.verifyCode')}>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                placeholder="123456"
                className="flex-1"
              />
              <Button variant="secondary" onClick={sendCode} disabled={loading || !email}>
                {t('auth.sendCode')}
              </Button>
            </div>
            {codeSent && <p className="text-xs text-muted-foreground">{t('auth.codeSent')}</p>}
          </Field>

          <Button onClick={verifyLogin} disabled={loading || !email || !code} className="w-full">
            {t('auth.loginButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
