# UI / 交互统一升级 — 设计文档

> 日期: 2026-08-06
> 状态: 已实施（含偏差清单，见 §0.6；2026-10-20 由 bento 方案补齐剩余交互缺陷）
> 范围: 全站视觉与交互统一升级(纯前端,不含后端)
> 接力: 后续由 writing-plans 输出实施计划

---

## 0. 背景与目标

### 0.1 现状

`web/src/` 已具备:

- 设计令牌系统(`styles/index.css`,oklch 色彩 + spacing/radius/text/font 主题,浅/深色完整)
- `<Card>/<Button>/<Badge>/<Input>/<Dialog>/<EmptyState>` 等 UI 原语(基于 `@base-ui/react` + `class-variance-authority`)
- Sidebar(分组导航 + 移动端抽屉)+ 统一 Header(h-12 移动 / h-16 桌面)+ `PageHero`(移动端专属动作带)
- 路由壳 `_authenticated/route.tsx` 已重构为 flex 全宽壳层;画布为 `muted/30`（桌面白卡已于 2026-10-20 移除，页面按页 max-width）
- 知识体系页已分 MobileOutline / DesktopOutline / PointReader(2026-07-14 mobile-learning-design.md)
- 6 个核心页面(仪表盘 / 知识 / 刷题 / 复习 / 错题 / 统计 / 设置)均可工作

### 0.2 待解决的问题

1. 异步加载态以裸文本 `加载中...` 出现,**无骨架屏**,首屏体验突兀
2. 设置页"保存昵称成功"用 `setTimeout(1800)` + 内联 hint;**缺全局 toast**
3. 二次确认场景仍可能使用 `window.confirm`(尚未替换)
4. 缺少入场动画、卡片悬停反馈、状态过渡等 micro-interaction
5. `quiz.tsx`(388 行)、`review-page.tsx`(251 行)超 300 行软上限,需拆分
6. 暗色模式虽已配色,但骨架 / 动画等新元素尚未对齐 token

### 0.3 目标

- 异步加载全部以**骨架屏**呈现,与真实 layout 等高(CLS≈0)
- 全局 **Toast 系统**取代内联 hint 与 mutation 失败静默
- 关键交互有**入场/状态/反馈动画**,遵循 Linear + Notion + Duolingo 调性
- 文件大小遵循分级上限;`quiz.tsx` / `review-page.tsx` 完成合理拆分
- 不引入任何第三方 UI / 动效库;只使用 `@base-ui/react` + Tailwind 4 + 纯 CSS + Web Animations API

### 0.4 非目标

- 不做 Cmd+K 命令面板
- 不加 Dashboard 增强(连胜 / 一周热力图 / 近期活动)
- 不做页面路由级 fade(Linear 范式下路由切换应是 instant nav + 元素级 motion)
- 不做键盘快捷键(1/2/3/4 打分等)
- 不动后端 API、不动路由架构、不动现有 stores 业务状态

### 0.5 设计原则

- **反馈基础设施先行**:Skeleton / Toast / motion constants 是其他 PR 的依赖,先 PR1 落地
- **每 PR 独立可编译 / 可回滚**:验收以 PR 为单位
- **令牌优先**:动效时长 / easing 走 token,与色彩/间距统一
- **可降级**:`prefers-reduced-motion: reduce` 下所有 CSS keyframes 静态化
- **类型严格**:每个新原语有完整 TS 类型,通过 `vp lint --type-aware -f agent` 0 warnings

### 0.6 实施偏差清单（2026-10-20 补齐）

本 spec 的多数条目已落地；以下为实施过程中确认的偏差，已于 2026-10-20 的「前端交互优化 + Bento」方案中修复或明确记录：

- ✅ 已修复：全站 Error 态缺失、Dashboard 数字可能停在 0、Toast 无 hover/Escape、reduced-motion 只停 keyframes、骨架与真实布局不等高、桌面「白卡套卡片」。
- ⚠️ 保留偏差：`prefers-reduced-motion` 下 transition/animation 时长压缩到 0.01ms（无动画过程），但 hover/pressed 的最终 transform 仍瞬时到位；toast 移动端避让偏移仍为 68px 硬编码。
- 📌 范围调整：仪表盘已由 3 张统计卡重做为 7 瓦片 bento（见 `docs/spec/2026-10-20-bento-layout-interaction-design.md`），不再按本 spec §3.2 的 4 卡骨架实现。

---

## 1. 架构(4 PR 分层)

### 1.1 PR 拆分

```
PR1 基础设施(Foundation)
  ├─ web/src/components/ui/skeleton.tsx              (新 primitive)
  ├─ web/src/components/ui/toast.tsx                 (新 primitive)
  ├─ web/src/components/ui/toast-viewport.tsx        (新,挂 main.tsx)
  ├─ web/src/components/ui/animated-number.tsx       (新 primitive)
  ├─ web/src/components/ui/confirm-dialog.tsx        (新 primitive)
  ├─ web/src/stores/toast-store.ts                   (新 zustand)
  ├─ web/src/lib/motion.ts                           (新,TS 端动效常量)
  ├─ web/src/hooks/use-reduced-motion.ts             (新,matchMedia)
  ├─ web/src/styles/animations.css                   (新,keyframes 集中)
  ├─ web/src/styles/index.css                        (改,@theme 加 ease / z-index token)
  ├─ web/src/main.tsx                                (改,挂 <ToastViewport/>)
  ├─ web/src/lib/api.ts                              (改,axios 拦截器触发 toast.error)
  └─ web/src/components/empty-state/index.tsx        (改,加 illustration slot + EmptyIllustration)

PR2 Dashboard 重做(基于 PR1)
  └─ web/src/routes/_authenticated/index.tsx         (改)

PR3 知识 / 刷题 / 复习
  ├─ web/src/routes/_authenticated/knowledge/index.tsx
  ├─ web/src/routes/_authenticated/practice/index.tsx
  ├─ web/src/features/practice/quiz.tsx              (拆)
  ├─ web/src/features/practice/quiz-option.tsx      (新)
  ├─ web/src/features/practice/quiz-result.tsx      (新)
  └─ web/src/features/review/review-page.tsx         (251 行仅在 ReviewCard >80 行时拆)

PR4 错题 / 统计 / 设置 / 登录
  ├─ web/src/features/practice/wrong-questions.tsx
  ├─ web/src/features/practice/stats.tsx
  ├─ web/src/features/settings/index.tsx             (savedHint → toast.success)
  ├─ web/src/features/auth/index.tsx
  └─ web/src/features/auth/brand-panel.tsx
```

### 1.2 架构硬约束

- 反馈基础设施仅落在 4 个根目录:`components/ui/` `lib/` `hooks/` `stores/`;**不侵入 features/**(features 只消费)
- 不引入任何新依赖(package.json 不变)
- 每个 PR 独立 commit + `lore commit`,不允许跨 PR 合并提交

### 1.3 文件大小分级上限

| 层                          | 上限   | 说明                       |
| --------------------------- | ------ | -------------------------- |
| `components/ui/*`           | ≤ 200  | UI 原语,应短小             |
| `components/layout/*`       | ≤ 200  | sidebar 192 已临界         |
| `features/*`                | ≤ 250  | `quiz.tsx` 388 强制拆      |
| `routes/_authenticated/*`   | ≤ 300  | 路由壳层                   |
| `stores/*` / `lib/*` / `hooks/*` | ≤ 200 | 工具类                |

> 软上限,reviewer 可允许 ±20 行浮动;但 `quiz.tsx` 必须拆。

---

## 2. 组件 / API 清单

### 2.1 PR1 — 反馈基础设施

#### 2.1.1 `<Skeleton />`

```
<Skeleton variant="text|rect|circle" w={120} h={16} r={4} className="..." />
```

- 显式 primitive,**不做** auto-mimic-children
- `text` 默认 h=16,r=4;`circle` 默认 w=h;`rect` 默认 w=full,h=16
- 内置 shimmer keyframe(由 animations.css 定义),`bg-muted/60`
- `role="status" aria-label="加载中"`
- 父容器 `<SkeletonText lines={3}>` 可生成多行递减宽度占位

#### 2.1.2 Toast 系统

**API**(消费侧):

```ts
import { toast } from '@/components/ui/toast';
toast.success('已保存');
toast.error('操作失败');
toast.info('提示信息');
toast.warning('警告', { description: '详情', durationMs: 5000 });
```

**`<ToastViewport />`**(挂 main.tsx,createPortal 到 body):

- 移动端(<640px):底部居中,`max-w-[min(420px,calc(100vw-32px))]`,贴底 16px(`bottom-4`)
- 桌面端(≥640px,`sm:`):右上,`top-4 right-4`
- 4 种 variant:success / error / info / warning(色彩 token 来自 `@theme`)
- auto-dismiss 3500ms(可被 options.durationMs 覆盖)
- hover 暂停剩余计时
- Escape 关闭最新一条
- 显式关闭按钮(`×`)
- success / info / warning → `role="status" aria-live="polite"`
- error → `role="alert" aria-live="assertive"`
- 同 `msg + variant` 在 500ms 内**去重**
- **不持久**:zustand 不挂 `persist` 中间件;刷新即清空(避免回到登录页还看到登出 toast)

#### 2.1.3 `<AnimatedNumber />`

```
<AnimatedNumber value={42} duration={400} className="..." />
```

- rAF + easeOutQuart,首次 mount 从 0 播到 value
- **2026-10-20 调整**：`value` 变化时从当前显示值继续动画到新值（修复数据晚到导致永久停在 0）；调用方不再需要传 `key` 强制重挂载
- 无变化/小于 0.5 的 delta、`prefers-reduced-motion`、`document.hidden`、元素不在视口时直接显示目标值
- 跳过条件:`document.hidden` || 不在视口(用 IntersectionObserver)
- 收尾阈值:|`current - target`| < 0.5 时 setState(target) 停止
- 渲染 `Math.round(currentValue)`(默认 0 位小数;`decimals={1}` 可配)

#### 2.1.4 `<ConfirmDialog />`

```
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="确认登出?"
  description="登出后将清空本地数据,需要重新登录"
  confirmLabel="登出"
  variant="destructive"
  onConfirm={handleLogout}
/>
```

- 基于 `@base-ui/react` Dialog,无新依赖
- 替换现有场景:`window.confirm`(登出 / 清缓存)
- variant `destructive` 时按钮使用 `bg-destructive`

#### 2.1.5 `<EmptyIllustration />`

```
<EmptyState
  illustration={<EmptyIllustration name="empty-questions" />}
  title="暂无题目"
/>
```

- 单文件多 svg(export `name: 'empty-questions' | 'empty-wrong' | 'empty-done'`)
- 颜色 `currentColor`;父级控制色(token)

#### 2.1.6 motion 常量(`lib/motion.ts`)

```ts
export const DURATION = { fast: 120, base: 200, slow: 320 } as const;
export const EASE = {
  outQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  inOut:    'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
```

- 数值与 CSS `@theme` 中 `--ease-out-quart` / `--duration-*` 同步

#### 2.1.7 z-index 分层

在 `styles/index.css` 的 `@theme` 中定义:

```css
--z-base: 0;
--z-sticky: 20;
--z-toast: 80;
--z-dialog: 90;
--z-modal: 100;
```

消费:`z-toast` < `z-dialog` < `z-modal`,绝不打架。

### 2.2 PR1 期间**不**做(YAGNI)

- 不做 `<PageTransition />`(路由级 fade);Linear 范式是 instant nav + 元素级 motion
- 不抽 `<AccuracyRing />` 到 `components/ui/`(仅 stats 一处用,等第二次复用再抽)
- 不引入 `useEnterAnimation` hook(PR2 在 Dashboard 内部实现一次即可)

### 2.3 拆分裁定

| 文件 | 当前行数 | 处理 |
| --- | --- | --- |
| `features/practice/quiz.tsx` | 388 | 拆为 `quiz.tsx`(≤200)+ `quiz-option.tsx`(≥40)+ `quiz-result.tsx`(≥40) |
| `features/review/review-page.tsx` | 251 | 仅当 `ReviewCard` 超过 ~80 行时拆;否则保持内聚 |
| `features/auth/index.tsx` | 199 | 接近上限,不强拆 |

---

## 3. 数据流

### 3.1 Toast

```
features/foo.tsx
  └─ import { toast } from '@/components/ui/toast'
       └─ toast.success('已保存')
            └─ toast-store (zustand)
                 └─ <ToastViewport />  (挂 main.tsx, createPortal)
                      └─ 渲染队列中的 toast
                           └─ setTimeout(3500) → store.remove(id)
                           └─ hover 暂停 / Escape 关闭 → store.remove(id)
```

### 3.2 Skeleton

```
features/foo.tsx
  const { data, isLoading } = useQuery(...)
  if (isLoading) return <FooSkeleton />   // 不再 <p>加载中...</p>
```

每个页面配套一个 `<XxxSkeleton />`,与真实 layout 等高(避免 CLS):

- `<DashboardSkeleton />` — CTA + 4 卡占位
- `<KnowledgeOutlineSkeleton />` — 12 行 chapter 占位
- `<QuizSkeleton />` — 标题块 + 4 选项块 + 提交按钮占位
- `<ReviewCardSkeleton />` — 240px 卡片 + 4 评分按钮占位
- `<StatsSkeleton />` — 1 ring + 2 stat 卡占位

`<XxxSkeleton />` 各自在 `features/<area>/` 内与页面配对;UI 层只放 primitive `<Skeleton />`。

### 3.3 `AnimatedNumber` 流

```
<DashHero value={dueCount} />
  └─ <AnimatedNumber value={...} duration={400} />
       └─ useRef(currentValue)
            └─ useEffect on mount:
                  rAF(t) → easeOutQuart(t/duration) * (target - start) + start
                       until |current - target| < 0.5 → setState(target)
            └─ 渲染 Math.round(currentValue)
                 └─ skip if !mounted || document.hidden || not in viewport
```

### 3.4 `prefers-reduced-motion` 接入(单源)

```
styles/animations.css
  @keyframes shimmer { ... }
  @keyframes fadeIn  { ... }
  @keyframes slideUp { ... }

  @media (prefers-reduced-motion: reduce) {
    @keyframes shimmer { 0%, 100% { opacity: .6; } }
    @keyframes fadeIn  { 0%, 100% { opacity: 1; } }
    @keyframes slideUp { 0%, 100% { transform: none; } }
  }
```

JS 端 `useReducedMotion()` 只服务于 rAF 驱动的 `AnimatedNumber`;CSS keyframes 由 media query 自动接管。

---

## 4. 错误处理 / 测试 / 验收

### 4.1 错误处理映射

| 场景                          | 当前                        | 改造后                                                  |
| ----------------------------- | --------------------------- | ------------------------------------------------------- |
| 登录验证码错误/发送失败       | 内联红条 `error` 状态       | 保留内联(error 必须贴近输入框);**额外** toast.error 一次 |
| 设置页"保存昵称"成功          | `setSavedHint(true)` + 1.8s | toast.success('昵称已保存');移除 savedHint state       |
| 设置页"清缓存"成功            | 无反馈                      | toast.success('缓存已清空')                              |
| TanStack Query mutation 失败  | 静默失败                    | axios 拦截器统一 toast.error('操作失败,请重试')          |
| 网络断开                      | query 静默 retry            | 复用 toast 队列即可                                      |
| 路由 404 / 异常               | 缺                          | 本期**不引入** ErrorBoundary                            |

**统一接入点**:`lib/api.ts` 在已有 401 → hard-redirect 之外,**新增一条 response 拦截器**,对非 401 错误(`status >= 400`)调用 `toast.error('操作失败,请重试')`。401 仍走原有 hard-redirect 分支,**不**触发 toast(避免"操作失败"与跳登录页同时出现)。

**mutation `onError` 简化**:业务 mutation 在 `onError` 内不必再单独 `toast.error`;拦截器已统一处理。仅当需要定制文案时(如"昵称保存失败:XXX"),才在业务层覆盖。

### 4.2 测试

| 阶段             | 内容                                                                | 工具                              |
| ---------------- | ------------------------------------------------------------------- | --------------------------------- |
| PR 每次提交前    | `cd web && bunx tsc --noEmit` 0 errors                              | tsc                               |
| PR 每次提交前    | `vp check`(format + lint + type)                                    | vp                                |
| PR 每次提交前    | `vp lint --type-aware -f agent` 0 warnings                          | vp                                |
| PR1 单元测试     | toast / skeleton / animated-number vitest 覆盖:dismiss / dedup / reduced-motion fallback / rAF 收尾 | vitest + RTL |
| 浏览器手测       | F1-F10 + 暗色模式 + 移动端 390px                                    | 人工                              |
| Reduced motion   | DevTools Rendering 切 `prefers-reduced-motion: reduce`              | 人工                              |
| 跨浏览器         | Chromium + Safari(Firefox 不强求)                                  | 人工                              |

### 4.3 PR 验收 checklist

- [ ] 0 个 `加载中...` / `isLoading ? '加载中...' : ...` 文本残留
- [ ] 0 处第三方动效库 / `window.confirm` / `window.alert` 引入
- [ ] 0 个文件 > 300 行(±20 行浮动允许)
- [ ] `prefers-reduced-motion: reduce` 下所有动效停止
- [ ] 移动 390px / 平板 768px / 桌面 1024px / 1280px / 1440px 五档断点 OK（2026-10-20 补充 1024/1280 最紧区间）
- [ ] 暗色模式:骨架背景 = `bg-muted/60`,与内容对比度足够
- [ ] Toast 不遮 Dialog(分层 z-index 生效)
- [ ] `vp check` + `vp lint --type-aware -f agent` 0 errors / 0 warnings
- [ ] `lore commit` + trailer `Constraint / Tested / Not-tested / Reversibility`

### 4.4 风险与回滚

| 风险                              | 缓解                                                                |
| --------------------------------- | ------------------------------------------------------------------- |
| PR1 Toast 持久状态影响现有页面    | Toast viewport 挂载但不主动调用;旧页面继续用 error 状态,互不干扰 |
| Skeleton 引入 CLS 变差            | 每个 `<XxxSkeleton/>` 与真实 layout 等高,Chrome DevTools 验证     |
| 动画在低端设备卡顿                | `prefers-reduced-motion` + `document.hidden` 双重跳过;rAF 不可见时停 |
| 任一 PR 出问题                    | 每 PR 独立可回滚;不与功能开发并发                                  |

---

## 5. 后续接力

- `writing-plans` skill 输出每个 PR 的细颗粒实施步骤(checklist + 验证命令)
- 每个 PR commit 前:`lore commit` 含 `Tested` / `Not-tested` / `Scope-risk` / `Reversibility`
- 完成后更新 `docs/index.md` 反映新增的 Phase 文档