import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LogOut, RefreshCw, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useThemeStore } from '@/stores/theme-store';
import { useAuthStore } from '@/stores/auth-store';
import { useSetHeader } from '@/components/layout/header-context';

// ── Settings feature ─────────────────────────────────────────────────────
// Per B-010: account + appearance + data. Nickname is stored locally only
// for v1 — a backend PUT /auth/profile endpoint can persist it across
// devices later (annotated below).
// ─────────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const { auth, setUser, reset } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Page title lives in the layout Header (B-010: settings page now lives
  // in features/settings and is responsible for its own header identity).
  useSetHeader({ title: '设置' });

  // Local draft of the nickname — v1: write to zustand + persist only.
  // v2 (TODO): also call PUT /api/v1/auth/profile to mirror server-side.
  const [nicknameDraft, setNicknameDraft] = useState(auth.user?.nickname ?? '');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleSaveNickname = useCallback(() => {
    if (!auth.user) return;
    const trimmed = nicknameDraft.trim();
    if (!trimmed || trimmed === auth.user.nickname) {
      return;
    }
    // TODO v2: await api.put('/auth/profile', { nickname: trimmed }) before
    // updating local state. For v1 we trust the local update and rely on
    // the next /api/v1/auth/me poll to re-sync.
    setUser({ ...auth.user, nickname: trimmed }, auth.token ?? '');
    toast.success('昵称已保存');
  }, [auth, nicknameDraft, setUser]);

  const handleLogout = useCallback(() => {
    reset();
    queryClient.clear();
    void navigate({ to: '/login' });
  }, [reset, queryClient, navigate]);

  const handleClearCache = useCallback(() => {
    // Clear all TanStack Query caches + every localStorage key except auth.
    queryClient.removeQueries({ queryKey: ['chapters'] });
    queryClient.removeQueries({ queryKey: ['learning'] });
    queryClient.removeQueries({ queryKey: ['practice-stats'] });
    queryClient.removeQueries({ queryKey: ['wrong-questions'] });
    queryClient.removeQueries({ queryKey: ['search'] });
    queryClient.removeQueries({ queryKey: ['review'] });
    queryClient.removeQueries({ queryKey: ['knowledge-points'] });

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key !== 'auth-storage' && key !== 'theme-storage') {
        localStorage.removeItem(key);
      }
    }
    // Force re-fetch on next page by invalidating everything.
    void queryClient.invalidateQueries();
    toast.success('缓存已清空');
  }, [queryClient]);

  return (
    <div className="space-y-4">
      {/* ─── Account ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">账户</CardTitle>
          <CardDescription>登录身份与昵称（昵称仅保存在本机，v2 接后端同步）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="邮箱">
            <Input value={auth.user?.email ?? ''} readOnly disabled />
          </Field>
          <Field label="昵称" description="保存后立即生效">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={nicknameDraft}
                onChange={(e) => setNicknameDraft(e.target.value)}
                placeholder="设置昵称"
                maxLength={32}
                className="flex-1"
              />
              <Button
                onClick={handleSaveNickname}
                disabled={!nicknameDraft.trim() || nicknameDraft.trim() === auth.user?.nickname}
                className="sm:w-28"
              >
                保存
              </Button>
            </div>
          </Field>
          <div className="border-t border-border pt-4">
            <Button
              variant="destructive"
              onClick={() => setLogoutDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <LogOut className="size-4" />
              退出登录
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Appearance ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">外观</CardTitle>
          <CardDescription>主题模式 — 移动端纵向排列，桌面端横向</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile (<640px): 3 buttons stack vertically and stretch full
              width. Desktop: 3 buttons sit on a single row, right-aligned
              (matches the previous justified-end look). Each button hits
              min-h-[44px] for an Apple HIG compliant tap target. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant={theme === 'light' ? 'primary' : 'outline'}
              onClick={() => setTheme('light')}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              {t('theme.light')}
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'outline'}
              onClick={() => setTheme('dark')}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              {t('theme.dark')}
            </Button>
            <Button
              variant={theme === 'system' ? 'primary' : 'outline'}
              onClick={() => setTheme('system')}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              {t('theme.system')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Data ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">数据</CardTitle>
          <CardDescription>清缓存保留登录信息；退出登录会清空所有数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={handleClearCache} className="w-full sm:w-auto">
            <RefreshCw className="size-4" />
            清空缓存
          </Button>
          <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              关于：本项目是软考架构师备考练习工具，基于 FSRS 间隔重复算法智能安排每日复习。
            </span>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="确认登出?"
        description="登出后将清空本地缓存,需要重新使用邮箱登录"
        confirmLabel="登出"
        cancelLabel="取消"
        variant="destructive"
        onConfirm={handleLogout}
      />
    </div>
  );
}
