import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrandPanel } from './brand-panel';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 2 19 4M14.5 6.5 16 8M17.5 3.5 19 5M21 6 16 11l-2-2 5-5z" />
      <path d="m13 13 6 6-4 4-6-6v-4h4z" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  async function sendCode() {
    if (!email) return;
    setIsSendingCode(true);
    setError('');
    try {
      await api.post('/auth/send-code', { email });
      setCodeSent(true);
    } catch {
      setError('Failed to send code');
      toast.error('验证码发送失败，请稍后重试');
    } finally {
      setIsSendingCode(false);
    }
  }

  async function verifyLogin() {
    if (!email || !code) return;
    setIsVerifying(true);
    setError('');
    try {
      const resp = await api.post('/auth/verify-login', { email, code });
      const { user, token } = resp.data.data;
      setUser(user, token);
      void navigate({ to: '/' });
    } catch {
      setError('Invalid code');
      toast.error('验证码无效或已过期，请检查后重试');
    } finally {
      setIsVerifying(false);
    }
  }
  return (
    <div className="relative grid min-h-screen md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* Brand panel (md+) */}
      <BrandPanel />

      {/* Form area */}
      <div className="relative flex items-center justify-center overflow-hidden bg-background p-4">
        {/* Decorative blobs (mobile only — desktop has the brand panel) */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl md:hidden',
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -bottom-32 -right-24 size-96 rounded-full bg-accent/30 blur-3xl md:hidden',
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute right-1/4 top-1/3 size-40 rounded-full bg-primary/10 blur-2xl md:hidden',
          )}
        />

        <Card className="relative w-full max-w-sm shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-xl md:hidden">{t('app.title')}</CardTitle>
            <CardTitle className="text-center text-xl">登录账号</CardTitle>
            <CardDescription className="text-center">使用邮箱接收验证码</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Field label={t('auth.email')}>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9"
                />
              </div>
            </Field>

            <Field label={t('auth.verifyCode')}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    placeholder="123456"
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={sendCode}
                  disabled={isSendingCode || !email}
                  className="shrink-0"
                >
                  {isSendingCode ? <SpinnerIcon className="size-4" /> : t('auth.sendCode')}
                </Button>
              </div>
              {codeSent && <p className="text-xs text-muted-foreground">{t('auth.codeSent')}</p>}
            </Field>

            <Button
              onClick={verifyLogin}
              disabled={isVerifying || !email || !code}
              className="w-full"
            >
              {isVerifying ? <SpinnerIcon className="size-4" /> : t('auth.loginButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
