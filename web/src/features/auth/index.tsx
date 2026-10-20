import { useEffect, useRef, useState, type FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { KeyRound, Loader2, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrandPanel } from './brand-panel';
import { cn } from '@/lib/utils';

/** Server-side resend window: one code per minute. */
const RESEND_COOLDOWN_SECONDS = 60;

interface LoginUser {
  id: number;
  email: string;
  nickname: string;
}

/**
 * The axios interceptor deliberately stays silent for the public auth
 * endpoints (401 there means "invalid code", not "session expired", and it
 * cannot know the page's copy). The login page therefore owns the feedback and
 * shows exactly ONE visible signal: the localized inline banner (F1/F6, Y12).
 */
function isInvalidCodeRejection(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
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
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);
  // Synchronous re-entry guards: state updates are async, so a fast double
  // submit could otherwise fire two auth POSTs (G10).
  const sendLockRef = useRef(false);
  const verifyLockRef = useRef(false);

  // Tick the resend cooldown down to zero, then stop.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  async function sendCode() {
    if (!email || isSendingCode || cooldown > 0 || sendLockRef.current) return;
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    sendLockRef.current = true;
    setIsSendingCode(true);
    setError('');
    try {
      await api.post('/auth/send-code', { email });
      setCodeSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      // The next step is the code, so move the caret there (F1).
      codeInputRef.current?.focus();
    } catch {
      // Y12: the localized inline banner is the single visible failure signal
      // for public auth endpoints (the interceptor stays silent for them).
      setError('验证码发送失败，请稍后重试');
    } finally {
      sendLockRef.current = false;
      setIsSendingCode(false);
    }
  }

  async function verifyLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !code || isVerifying || verifyLockRef.current) return;
    verifyLockRef.current = true;
    setIsVerifying(true);
    setError('');
    try {
      const resp = await api.post<{ data: { user: LoginUser; token: string } }>(
        '/auth/verify-login',
        { email, code },
      );
      const { user, token } = resp.data.data;
      setUser(user, token);
      void navigate({ to: '/' });
    } catch (err) {
      setError(
        isInvalidCodeRejection(err) ? '验证码无效或已过期，请检查后重试' : '登录失败，请稍后重试',
      );
    } finally {
      verifyLockRef.current = false;
      setIsVerifying(false);
    }
  }

  const sendLabel = isSendingCode
    ? '发送中...'
    : cooldown > 0
      ? `${cooldown}s 后重发`
      : codeSent
        ? '重新发送'
        : t('auth.sendCode');

  return (
    <div className="relative grid min-h-dvh md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
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
          <CardContent>
            <form className="space-y-5" onSubmit={verifyLogin} noValidate>
              {/* Inline banner stays the primary, always-visible failure signal;
                  role=alert lets screen readers announce it without stealing focus. */}
              <div role="alert" aria-live="assertive">
                {error && (
                  <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>

              <Field label={t('auth.email')}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="you@example.com"
                    className="pl-9"
                  />
                </div>
              </Field>

              <Field label={t('auth.verifyCode')}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={codeInputRef}
                      value={code}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      onChange={(e) => {
                        setCode(e.target.value);
                        if (error) setError('');
                      }}
                      maxLength={6}
                      placeholder="123456"
                      className="pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void sendCode()}
                    disabled={isSendingCode || !email || isVerifying || cooldown > 0}
                    className="min-h-[44px] shrink-0"
                  >
                    {isSendingCode ? <Loader2 className="size-4 animate-spin" /> : sendLabel}
                  </Button>
                </div>
                {codeSent && <p className="text-xs text-muted-foreground">{t('auth.codeSent')}</p>}
              </Field>

              <Button
                type="submit"
                disabled={isVerifying || !email || !code}
                className="min-h-[44px] w-full"
              >
                {isVerifying ? <Loader2 className="size-4 animate-spin" /> : t('auth.loginButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
