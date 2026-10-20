# 前端交互优化 + 便当盒（Bento）布局 — 设计方案

> 日期：2026-10-20 ｜ 版本：**v2.1（已按交叉评审 v1 + v2 复核 + 浏览器实测修订）** ｜ 状态：**待审阅（未实施，未改动任何源码）**
> 范围：`web/` 前端视觉与交互；不涉及后端接口改动
> 输入证据：交互审计 A（壳层/仪表盘/知识体系）、交互审计 B（刷题/复习/错题/统计/设置/登录）、浏览器实测截图与度量、交叉评审意见（见附录 A）
> 结论先行：**有明确优化空间**。分两层推进：① 先修交互正确性问题（P0/P1）；② 再用便当盒布局提升「概览/聚合」页面的信息密度与扫读效率。bento 不进入阅读器、答题、复习卡片等专注流页面。
> 数据口径：文中示例数字为 2026-10-20 16:52–17:20 审计账号快照（该账号在评审期间仍被操作，数值持续变化）。验收标准只要求「与同一 query 的其他页面一致」，**不写死具体数值**。

---

## 0. TL;DR（给审阅者的 6 句话）

1. **交互层确有明显优化空间**，但收益最大的不是「换版式」，而是先修 P0/P1 缺陷：登录 401 被全局拦截器清空并整页刷新、全站缺 Error 态/断网静默、知识体系移动抽屉失效/跨章导航错误/全部展开空、复习评分失败静默跳卡且可重复提交、标记已学无乐观更新、Dashboard 数字可能停在 0、无回首页入口等（证据见 §1.3）。
2. **版式层**：当前是「桌面白卡套卡片 + 单列 Card 堆叠」，1440 下信息密度低、留白多（Dashboard 首屏有效信息单元 4 个、PracticeStart 内容只占白卡约 74%、Stats 移动端 3 张全宽卡纵向占约 360px）。这是 bento 的直接依据。
3. **bento 适用边界**：只用于「概览/聚合」页面——仪表盘（一期）、学习统计/刷题首页/错题本/知识概览（二期候选）；阅读器正文、答题/复习专注卡、登录页、设置表单、全局壳层与弹层内部**不做** bento。
4. **便当盒系统（v2 简化）**：纯 CSS Grid，**移动 2 栏 / md+ 6 栏**（不引入 12 栏，`md` 与 `lg` 同构，无需大改既有断点规范），5 种瓦片尺寸；**零新增依赖、零新增色板**，全部复用现有 spacing / radius / color / motion token；新增 `components/ui/bento.tsx`（两个组件，≤200 行）。
5. **建议分期**：Phase 0 交互修复（约 8 个可独立回滚的 PR，不改版式）→ Phase 1 Bento 基础 + **仪表盘单页** → Phase 2 统计/刷题首页/错题本/知识概览（一期验收后另行决策）→ Phase 3 打磨与延后项。先小步落地、逐期验证。
6. **需审阅决策 6 项**（见 §10），其中最关键的是：一期是否只做 Dashboard（推荐）、是否接受移除桌面白卡 + 按页 max-width（推荐）、是否接受 2/6 栏而非 12 栏（推荐）。

---

## 1. 现状与问题定义

### 1.1 页面清单与用户任务

| 页面 | 用户来这里要完成的事 | 当前版式 | bento 适用？ |
| --- | --- | --- | --- |
| `/` 仪表盘 | 知道「今天该做什么 / 我学到哪 / 哪里弱 / 从哪继续」 | 3 段：CTA + 3 等分统计卡 + 考试信息卡 | ✅ 一期主战场 |
| `/stats` 学习统计 | 判断「我的水平如何、薄弱在哪」 | 环形正确率 + 2 数字卡 + 章节条列表（4 张 Card） | ✅ 二期候选 |
| `/practice` 刷题首页 | 决定「练多少、练哪章」并开始 | 单卡 2xl 宽，20 个章节 chip 竖排 | ✅ 二期候选 |
| `/wrong-questions` 错题本 | 找到错题、重做、看解析 | 卡片列表（错题多时首屏只能看 2–3 题） | ◐ 概览条 + 筛选；列表保持 |
| `/knowledge` 知识体系 | 「读哪一章、继续上次、跳到某知识点」 | 目录列表 / 阅读器整页切换 | ◐ 仅概览条（二期候选） |
| `/review` 今日复习 | 「一张卡一张卡地过完今日到期」 | 3 统计卡 + 单张复习卡 + 4 评分 | ❌ 专注流，仅微调 |
| `/knowledge?chapter&point` 阅读器 | 连续阅读、跨章前进 | 单列长文 + 粘性头尾栏 | ❌ 阅读列宽不可分栏 |
| `/settings` 设置 | 改昵称、主题、清缓存、登出 | 3 张表单卡 | ❌ 表单不做 bento |
| `/login` 登录 | 邮箱验证码登录 | 品牌面板 + 表单卡 | ❌ 单任务页 |

### 1.2 当前版式的三个结构性问题（截图 + 度量证据）

1. **桌面「白卡套卡片」，表面层级重复。**
   `route.tsx:37` 在所有页面外再包一层 `md:rounded-xl md:border md:bg-card md:p-6 md:shadow-sm` 的白卡，页面内又各自用 `Card`（仪表盘 5 张、知识 1 张、统计 4 张、错题 N 张）。bento 瓦片放进去会变成「画布 > 白卡 > 瓦片」三层表面，违反「Card 不嵌套 Card，内层用 article」的既有规范（`mobile-learning-design §1.5/§1.8`），也让 bento 视觉失效。

2. **信息密度低、横向空间浪费（1440 实测）。** 实测 1440 下：侧栏 240px、Header 64px、主区 1200px；桌面白卡外层约 960px、内部可用约 912px。
   - 仪表盘：3 张统计卡内容稀疏（每张约 300px 宽只放一个数字），首屏有效信息单元只有 4 个（今日复习 + 3 统计卡），其中「知识体系」卡文案是硬编码（`index.tsx:161`）。
   - 刷题首页：内容 `max-w-2xl`（672px）被居中放进 912px 可用宽度（`practice-start.tsx:31`），左右各浪费约 120px；20 个章节 chip 以 `flex-wrap` 竖排占满首屏。
   - 错题本：每道错题一张大卡（约 110–130px 高），首屏只能看 2–3 题，无筛选、无分页、无概览。
   - 统计页移动端：环形卡 + 2 张全宽数字卡纵向占约 360px，真正的章节数据被推到第二屏。
   - 知识目录：1440 下每章一行，行内容只有标题 + 进度条，右侧约 40% 为空白。

3. **概览信息分散在多个页面，没有「今日聚合视图」。**
   「今日到期/已复习」在复习页统计卡（Header 副标题是 FSRS 算法说明，不是到期数，`review-page.tsx:61-64`）；「学习覆盖率/已掌握」在仪表盘；「每章掌握度」在知识页/统计页；「错题数」在错题页；「上次学习位置」只在移动端知识目录的 FAB 里被消费——用户判断“今天该干什么”需要跨页拼接。

### 1.3 必须先修的 P0/P1 交互问题（Phase 0 范围）

> 编号沿用审计报告；证据为 `file:line` 或浏览器实测。**这些问题与 bento 无关，但会被 bento 放大（更多数据卡 = 更多错误数字/空态）。**

**A 组：全局/知识/数据（审计 A）**

| 编号 | 页面 | 问题 | 证据 | 影响 |
| --- | --- | --- | --- | --- |
| I-01 | 知识·移动目录抽屉 | 目录视图下 `pointsMap` 为空，点任意章节只关闭抽屉、**不导航**；阅读视图下只能跳当前章 | `knowledge/index.tsx:151-160`、`chapter-drawer.tsx:101-110` | 移动端唯一跨章入口失效 |
| I-02 | 知识·阅读器 | 上一/下一节仅在本章内正确：第 1 章末「下一节」禁用；先展开第 7 章再读第 3 章会**跳章**；现成 helpers 依赖相邻章 points 已加载，直接复用**无效** | `point-reader.tsx:76-82`、`knowledge/index.tsx:140-141`、`hooks.ts:155-190` | 连续阅读动线断裂；修复需先解决数据预取（§5.3） |
| I-03 | 知识·桌面目录 | 「全部展开」是空壳：父层只保留 1 个 expanded id 拉取知识点，20 章只有 1 章有内容，其余无 loading/empty | `desktop-outline.tsx:50-56,172`、`knowledge/index.tsx:140-141` | 桌面核心浏览动线失败 |
| I-04 | 知识·阅读器 | 进入/深链首帧误报「知识点不存在或已删除」：`isLoading` 只接 `chaptersLoading` | `point-reader.tsx:48-70` | 慢网下明显错误态闪烁 |
| I-05 | 全站 | **无 Error 态**：接口失败被伪装成「空/零」。仪表盘失败显示 0%/0 章且仍写「覆盖 20 章」；知识失败显示「还没有章节/运行 seed」；搜索失败与空结果同文案 | `index.tsx:26-43`、`mobile-outline.tsx:26-38`、`search-sheet.tsx:119-123` | 用户误判数据为空，可能重跑 seed |
| I-06 | 知识·标记已学 | 无乐观更新/pending 禁用/失败回滚；双击会发多个 POST，状态需等 invalidate 回填 | `point-reader.tsx:169-181`、`hooks.ts:81-94` | 每次标记有可感延迟，弱网像没点上 |
| I-07 | 仪表盘 | `AnimatedNumber` mount-only 且 review/stats 无 loading 门控：若其他查询先完成，CTA 可能**永久显示 0 张**，与 Header「今日到期」矛盾 | `animated-number.tsx:32-74`、`index.tsx:37-43,88` | 首页主 CTA 数据错误 |
| I-08 | 全局壳层 | 没有回仪表盘入口：Sidebar 6 项无 `/`，品牌文字不可点 | `sidebar.tsx:32-48,119-121` | 进入任意页后无法一键回首页 |
| I-21 | 全局数据 | queryKey 分叉：仪表盘用 `['practice','stats']/['review','stats']`，其余模块用 `['practice-stats']/['review-stats']`，失效打偏（审计定为 P2，但直接造成首页数字错误；与审计 B 的 F24 同一问题） | `index.tsx:30,37`、`review/queries.ts:10-15`、`quiz.tsx:176` | 复习/刷题后回首页可能看到旧数字 |

**B 组：页面级 P0/P1（审计 B，F 编号；明细见附录 A 报告）**

| 编号 | 页面/流程 | 问题（实测/代码可证） | 证据 | 影响 |
| --- | --- | --- | --- | --- |
| F1 | 登录（**P0**） | 验证码错误 = 后端 401；全局拦截器把它当会话过期：清 `auth-storage` + `window.location.href='/login'` 整页刷新 → 内联错误与 toast 全被清掉、输入被重置 | `lib/api.ts:50-63`、`features/auth/index.tsx:74-112` | 登录失败零可见反馈，用户卡死 |
| F2 | 复习 | 评分失败静默跳卡：`onSettled` 无条件 `setIndex+1` | `review-page.tsx:70-92` | 失败卡被“吞掉”，计数错乱 |
| F3 | 复习 | 220ms 淡出窗口无同步锁，双击同卡评两次（实测 2×POST） | 同上 | 重复评分、污染 FSRS 计划 |
| F4 | 全站提交 | 断网时提交类操作完全静默：拦截器只处理有 `response` 的错误；axios 无 timeout | `lib/api.ts:50-63` | 用户不知道失败，重复操作 |
| F5 | 统计/复习/错题 | 查询失败伪装空态：stats「还没有练习记录」、review「今日复习已完成」（KPI 仍显示到期 N）、wrong「暂无错题」 | 三页 `isLoading` 分支 | 与 I-05 同源，页面级表现 |
| F6 | 登录 | 失败三重反馈：通用 toast + 业务 toast + 英文内联；英文错误未本地化 | `auth/index.tsx:90,107`、`api.ts:57` | 噪音、语言不一致 |
| F7 | 主题 | system + OS dark 时首次点「切换主题」无视觉变化（`toggleTheme` 对 system 一律置 dark，与当前实际主题相同） | `theme-store.ts:28-31` | 用户以为按钮坏了 |
| F8 | 主题 | 系统主题变化不响应（`applyTheme` 只在 setTheme/水合时调用，无 `matchMedia('change')` 监听）；UserMenu 只能在 light/dark 间切换，无法回 system（设置页可以） | `theme-store.ts:12-23`、`user-menu.tsx:100-108` | 交互不对称、跟随系统名不副实 |
| F9 | 刷题（桌面） | 答题中「退出」只在移动端 `PageHero` 里渲染（`md:hidden`），桌面无退出入口 | `quiz.tsx:226-236`、`page-hero.tsx:25` | 桌面只能靠浏览器返回 |
| F10 | 错题（桌面） | 错题数徽标只在移动端 PageHero 出现，桌面消失 | `wrong-questions.tsx:52-54,95,111` | 桌面缺少数量上下文 |
| F11 | 刷题 | 完成后不清 session：localStorage 残留 → 刷新结果页出现「继续练习 已做 3/3」幽灵卡；结果页刷新即丢 | `session.ts:6-14,29-32`、`quiz.tsx:71-73` | 状态错乱 |
| F12 | 刷题 | 开始练习无 loading/disabled：实测双击发出 2×GET random，第二个覆盖题包 | `practice-start.tsx:136-147` | 题包被意外替换 |
| F13 | 刷题 | 0 答案会话无法继续/放弃，开始新练习会静默覆盖旧题包 | `session.ts:12-22`、`practice-start.tsx` | 旧进度丢失 |
| F14 | 刷题（移动） | 提交后「下一题」按钮 top=866 > 视口 844，每题多一次滚动 | 实测 390 | 操作成本高 |
| F15 | 复习（移动） | 评分按钮 top≈828、底 884 > 视口 844（KPI 三卡堆叠占约 362px） | 实测 390 | 评分需先滚动 |
| F16 | 全站 | 触控目标系统性 <44px（退出 32 / 提交 40 / 重做 32 / 范围 pill 34 / 汉堡 36 / toast 关闭 28） | 实测 + 代码 | 违 `mobile-learning §0.3` |
| F17 | 复习 | 复习卡是 `<div onClick>`，无 role/tabIndex → 纯键盘用户永远无法翻卡评分 | `review-page.tsx:160-190` | 阻断核心流程（与被 Rejected 的 1/2/3/4 快捷键无关） |
| F18 | 设置 | 清缓存无 ConfirmDialog 且静默删除 practice-session | `settings/index.tsx:52-73` | 不可逆数据删除无确认 |

### 1.4 P2 交互缺口（摘要，实施时逐条跟踪）

| 主题 | 缺口（证据见审计报告） |
| --- | --- |
| 导航 | 侧栏无「今日到期」徽标；无 `aria-current`；移动抽屉导航项高 36px（<44）；Header 桌面标题被 `justify-center` 居中（`header.tsx:67`，实测标题组中心与 Header 中心仅差 4px）；侧栏 UserMenu 退出登录**无确认**而设置页有确认（V12，两处不一致）；知识页移动端 Header 有两个「汉堡」语义（侧栏 + 目录）易混淆（V13）；768–1023 侧栏常驻导致内容仅约 456px，可考虑折叠（Phase 3 可选） |
| 反馈 | Toast 缺 hover 暂停 / Escape 关闭（spec §2.1.2 承诺）；移动端 toast 压住阅读器底栏；骨架与真实布局不等高（Dashboard 4 卡 vs 3 卡、知识 12 行 vs 20 章）；`role=status` 在页面容器与每个 Skeleton 上重复 |
| 弹层 | 知识目录抽屉/搜索 Sheet 手写 dialog：**无焦点陷阱**（实测打开后 Tab 逃逸到背后章节列表/主题按钮，V7）、条件挂载导致无入场动画（I-13）；滚动锁实测可用（抽屉打开时 `<main>.scrollTop` 保持 0），但依赖遮罩覆盖，建议仍收敛到 `ui/dialog` |
| 深链 | 桌面 `?chapter=` 不自动展开；阅读器返回清 `chapter`；搜索结果丢弃 `q`；刷新后展开态/滚动位置丢失（I-14） |
| 搜索 | 结果无上限/分页（实测 157 条全量渲染）、无关键词高亮、关闭后输入/结果残留（实测重开仍保留旧 query 与 157 条结果）、错误与空态同文案、结果显示**原始 Markdown**（`##/**/```mermaid`，V8）（**已有 250ms 防抖**，`search-sheet.tsx:43-56`） |
| 阅读器 | 短内容时底部栏不贴视口、文末多约 100px 空白；「本章真题」显示章题数却跳不带章节筛选的 `/practice`（I-16） |
| 可达性 | 自建按钮几乎无 `focus-visible`（浏览器默认 outline 是唯一可见焦点）；无 skip link；知识目录标题层级 h1→h3；搜索输入无 label；阅读器/评分结果无 `aria-live`（V16） |
| 一致性 | 裸写 `z-30/40/50/[60]` 未消费 token；reduced-motion 只停 keyframes，transition/transform 仍在动；图标两套来源；中英文案混用；登录品牌面板在深色主题下不变暗（浏览器实测）；`knowledge/index.tsx` 374 行 / `quiz.tsx` 319 行超限 |
| 移动端 | `h-screen` 而非 `h-dvh`；内容区无底部 padding / safe-area；Header 副标题移动端隐藏但注释称用于移动端；仪表盘 CTA 在 390 断字成「待复/习」（V15）；复习页 3 KPI 竖堆占首屏、评分按钮在首屏外（V14/F15） |
| 性能 | 阅读器每次进入固定 7 个请求（含进度全量刷新）；搜索全量渲染；Dashboard 与统计页重复请求同一 stats 端点 |

### 1.5 已具备、bento 必须复用的能力

- 深浅双主题 oklch token（`styles/index.css:65-151`）与 spacing/radius/text/motion token 单一来源；
- `Skeleton / Toast / AnimatedNumber / ConfirmDialog / EmptyState` 反馈原语；
- 每页骨架屏、`EmptyState` 插画、URL 深链（`?chapter=&point=`）、practice session 本地持久化；
- Base UI 1.6.0 已有 `dialog / drawer / progress / use-render`（`@base-ui/react` exports 已核对），可零新增依赖复用；
- 既有动效约定：`--duration-fast/base/slow`、`--ease-out-quart`、`animate-fadeIn`、hover `-translate-y-0.5`。

---

## 2. 设计目标与原则

### 2.1 目标（按用户任务，而非按组件）

1. **一屏回答「今天做什么」**：仪表盘首屏聚合「今日复习 + 继续学习 + 学习进度 + 刷题水平 + 错题 + 薄弱章节」。
2. **扫读优先**：数字、进度、强弱项用可比较的瓦片呈现；需要读的（题目、正文、解析）保持单列。
3. **减少无谓跳转**：概览瓦片整卡可点直达目标页；错题本概览条 + 筛选减少滚动；练习首页可选「薄弱章节」。
4. **状态可信**：每个数据瓦片独立 Loading / Empty / Error（含重试），不再「失败=空」。
5. **移动端更紧凑但不拥挤**：<768 用 2 栏 mosaic，触控目标 ≥44px，首屏有效信息瓦片从 3–4 个提升到 5–7 个。
6. **不破坏专注流**：答题、复习、阅读的布局与交互节奏不变。

### 2.2 设计原则

- **信息优先于装饰**：每个瓦片必须回答一个用户问题；瓦片内容上限：hero ≤4 个信息元素（数字/标签/进度/CTA），其余 ≤3 个；不能回答问题的瓦片不加。
- **单一表面**：去掉桌面白卡；bento 瓦片自身即表面（`article` + 边框，不嵌套 Card）。默认**无阴影**，仅可交互瓦片 hover 时 `shadow-md`。
- **密度有度**：瓦片内边距 16/20px（当前 Card 为 24px）；瓦片数量上限：仪表盘 7、统计 5、练习首页 4、错题概览 3、知识概览 2。
- **可点才动**：可点击瓦片有 hover + `focus-visible` ring；不可点击瓦片无 hover（修复现有「3 张统计卡 hover 但不可点」的假 affordance）。
- **状态完整**：四态（Loading/Success/Empty/Error）是瓦片的组成部分，不是页面级补丁。
- **令牌优先 + 零新依赖**：颜色/间距/圆角/动效全部复用现有 token；不引入第三方 grid/动效/图表库（Lore Constraint）。

### 2.3 非目标（明确不做）

- 不做**路由级淡入/PageTransition**、**Cmd+K 命令面板**、**连胜/热力图/近期活动流**、**1/2/3/4 键盘快捷键**——均为已有 Rejected 决策，除非另行重新决策（`docs/spec/2026-08-06-ui-upgrade-design.md §0.4` + Lore）。
- 不做**后端接口改造**；不新增趋势图/时间范围筛选/活动流（需要后端时间序列接口，另立方案）。
- 不做**全站视觉换肤**、不改品牌色/字体；不新增第三方 UI/动效/图表库；瓦片不做 hover 预览弹层、不内嵌图表库。
- 不把**知识章节列表**改成卡片网格（见 §4.5 的理由与 Option B）。
- 不重构**登录/设置**的表单结构，只做交互修复。

---

## 3. 便当盒系统（Bento Grid System）

### 3.1 适用边界

| 页面 | 一期/二期 | 方案 | 理由 |
| --- | --- | --- | --- |
| 仪表盘 | **一期** | 完整 bento（7 瓦片） | 异构概览信息，最适合 |
| 学习统计 | 二期候选 | 完整 bento（5 瓦片） | 多指标聚合，横向对比 |
| 刷题首页 | 二期候选 | bento（4 瓦片） | 填充桌面空白，提供决策信息 |
| 错题本 | 二期候选 | 概览条 3 瓦片 + 筛选 + 列表 | 概览可聚合，题目需按序阅读 |
| 知识体系 | 二期候选（待二期决策） | 概览条 2 瓦片（md+） | 目录需顺序扫描，列表更合适 |
| 今日复习 | Phase 0/3 | 微调（指标 strip 紧凑化 + 今日进度） | 专注流，一屏一决策 |
| 阅读器 / 答题 / 登录 / 设置 / 壳层 / 弹层 | 不做 | 只做交互修复 | 阅读列宽、单任务、表单语义 |

> 知识体系「Option B：20 章卡片网格」需要修改 `mobile-learning-design §1.3`（桌面双栏范式），本期不推荐；若后续希望目录更像“进度地图”，再单独立项。

### 3.2 网格与断点（v2：2 / 6 栏，不引入 12 栏）

| 断点 | 栏数 | 列间距 | 容器 | 说明 |
| --- | --- | --- | --- | --- |
| < 768（移动） | **2** | 12px（`gap-3`） | 全宽，页面 `px-3` | 大部分瓦片 span 2；数字瓦片可 1+1 并排 |
| ≥ 768（md/lg 同构） | **6** | 16px（`gap-4`） | `max-w-6xl` 居中，`p-6/p-8` | 不新增 `lg` 列数变化，**不使用 `xl`**；无需修改 `mobile-learning-design §1.7` 的断点约定 |

- **为什么不用 12 栏**：Dashboard 的全部比例都可由 6 栏表达（4+2 = 2:1；2+2+2 = 1:1:1；4+2 = 2:1）。12 栏只在需要 3:1/1:4 等更细比例时才必要，却会多出一层 `lg` span 映射、`md/lg` 双套布局与规范变更成本。若二期某页确需更细比例，再单独立项引入 12 栏（D3-B）。
- 移除白卡后内容宽（实测/几何）：390=366、768=480、1024=720、1280=976、1440=1088。
- 6 栏关键跨度（宽 = n×col + (n−1)×gap）：

| 视口 | col | span2 | span3 | span4 | span6 |
| --- | --- | --- | --- | --- | --- |
| 768 | 66.7 | 149 | 232 | 315 | 480 |
| 1024 | 106.7 | 229 | 352 | 475 | 720 |
| 1280 | 149.3 | 315 | 480 | 645 | 976 |
| 1440 | 168 | 352 | 536 | 720 | 1088 |

- 行高规则：同一行瓦片由 CSS Grid 自动等高（`items-stretch`）；每行 **md 之和 = 6、移动之和 = 2 的倍数**；移动端若瓦片数为奇数，最后一枚 `span 2`（避免半行空洞）。1024–1279 为最紧区间，验收必须覆盖 1024。
- 平板 768–1023：侧栏常驻（240px）后内容约 480–720px，仍用 6 栏；数值瓦片 span2 约 149–229px，内容只放「数字 + 短标签」。

### 3.3 瓦片尺寸（5 种）与最小高度

| size | 移动 span(2) | md span(6) | 默认 minH | 用途 |
| --- | --- | --- | --- | --- |
| `hero` | 2 | 4 | `hero`（192px / `min-h-48`） | 主行动 / 首屏主指标 |
| `wide` | 2 | 4 | `wide`（240px） | 列表 / 矩阵 / 分布 |
| `half` | 2 | 3 | `half`（160px / `min-h-40`） | 半行两列 |
| `third` | 2 | 2 | `third`（128px / `min-h-32`） | 三等分 / 文本动作 |
| `stat` | **1** | 2 | `stat`（96px / `min-h-24`） | 单数字指标 |

- `minH` 与 `size` 解耦，可取值为 `'stat'(96) | 'third'(128) | 'half'(160) | 'hero'(192) | 'wide'(240)`，默认跟随 `size`；需要更高的数字瓦片时可 `size="stat" minH="half"`。
- 移动端允许 1+1 并排的只有 `stat`（宽约 177px）；`hero/wide/half/third` 移动端恒为整行。
- 尺寸与最小高度分离：`BentoCard` 用 `size` 控制 span、`minH` 控制最小高度（如「学习进度」用 `size="stat"` + `minH="half"`：移动端 1 栏、桌面 2 栏，高度 160px）。

### 3.4 视觉规范

- **表面**：`article` 元素，`rounded-xl border border-border bg-card`（圆角 16px，大于当前 Card 的 12px）。
- **色调（仅两种）**：
  - `default`：`bg-card border-border`；
  - `hero`：`border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent` + 左侧 4px `bg-primary` accent bar（沿用现有今日复习卡，`index.tsx:70-77`）。
  - 语义色（success/warning/destructive）只用于**状态与强弱表达**（如薄弱章节、错误），不作装饰底色。**不设 muted tone**（画布已是 `muted/30`，同色瓦片只剩边框）；静态信息（考试信息）使用 default，不做特殊底色。
- **阴影**：默认 `shadow-none`（仅边框）；可交互瓦片 hover `shadow-md`；禁止瓦片内再放带阴影容器（与 `mobile-learning-design §1.5` 一致）。
- **内边距**：`stat/third` → 16px（`p-4`）；`half/wide` → 20px（`p-5`）；`hero` 桌面 `p-6`。
- **字号层级**：瓦片标题 `text-sm font-semibold`；主数字 `text-3xl font-bold tabular-nums`；辅助说明 `text-xs/text-sm text-muted-foreground`；hero 标题 `text-lg font-semibold`。
- **图标**：统一 lucide-react，`size-4`（标题旁）/ `size-5`（hero），图标容器 `size-10 rounded-full bg-primary/10 text-primary`（沿用现有 CTA）。
- **对比度**：所有 tone 在浅/深两套 token 下验证正文对比度 ≥ 4.5:1（验收项）。

### 3.5 交互与状态规范

| 状态 | 规范 |
| --- | --- |
| Default | 静态表面；只有可点击瓦片带 hover/focus 反馈 |
| Hover（可点击） | `-translate-y-0.5 shadow-md`，200ms `--ease-out-quart`（沿用现有） |
| Focus-visible（可点击） | `ring-2 ring-ring ring-offset-2 ring-offset-background`；整卡可点且 Tab 一次到达 |
| Pressed | `active:scale-[0.995]`（reduced-motion 下不缩放，见 §3.6） |
| Disabled | 仅瓦片内部按钮；`opacity-50 cursor-not-allowed`（复用 Button 规范） |
| Loading | 瓦片级骨架，尺寸与该瓦片真实内容一致（**禁止整页骨架**） |
| Empty | 瓦片级空态文案 + 一个明确 CTA（如「还没有练习记录 → 去刷题」） |
| Error | 瓦片级「加载失败」+ 重试按钮（`refetch`），不阻断其他瓦片 |

- **整卡可点与嵌套交互互斥**：整卡是链接时，不嵌套第二个交互元素；CTA 用视觉按钮样式呈现（非 `<button>`），避免 `<a>` 内含 `<a>/<button>`。
- **可访问性约束**：整卡只合入 `<a>`/`<Link>`（HTML 内容模型允许块级内容）；**不允许**整卡合入 `<button>`（button 只允许 phrasing content）。瓦片内部的动作按钮不包裹在整卡链接内。
- 交互瓦片用 `@base-ui/react/use-render` 的 `render` prop 合入 `<Link>`；`BentoLinkCard` 与静态 `BentoCard` 拆成两个组件，避免「interactive 但无 render」的假交互通过类型检查。

### 3.6 动效规范

- 入场：首批瓦片 `animate-fadeIn`，stagger 40ms（与现有 Dashboard 一致），最多 6 个；
- hover：transform + shadow，200ms，`--ease-out-quart`；
- 数字：`AnimatedNumber`，400–500ms，mount 或 value 变化时播放（需先修 I-07 / 更新旧 spec 契约，见 §9）；
- `prefers-reduced-motion: reduce`：除现有 keyframes 外，**新增 transition/transform 抑制**（单源落在 `styles/index.css`；hover 位移、pressed 缩放、抽屉/Sheet 位移、进度条 transition 全部静态化）；
- 不新增 keyframes；不使用第三方动效库。

### 3.7 响应式降级与逐页 span 矩阵

**通用规则**

1. 移动（2 栏）：`hero/wide/half/third` → span 2；`stat` → span 1；**奇数瓦片时最后一枚 span 2，该例外优先于 size 默认值**（避免半行空洞）。
2. md（6 栏）：每行之和 = 6；不允许半行空洞。
3. 长文本 `line-clamp-2` / `truncate`；数字 `tabular-nums`；不使用横向滚动容器。
4. 1024–1279：验收时若瓦片内文字折行超过 2 行，则降级 span（`third→half` 或 `half→wide`）。

**逐页矩阵**

| 页面 | 移动（2 栏） | md（6 栏） |
| --- | --- | --- |
| 仪表盘（7） | hero2 / continue2 / **progress1 + practice1** / wrong2 / coverage2 / exam2 | row1: hero4 + progress2；row2: continue2 + practice2 + wrong2；row3: coverage4 + exam2 |
| 学习统计（5） | accuracy2 / **totals1 + review1** / chapters2 / coverage2 | row1: accuracy2 + totals2 + review2；row2: chapters4 + coverage2 |
| 刷题首页（4） | config2 / level2 / weak2 / wrong2 | row1: config4 + level2；row2: weak4 + wrong2 |
| 错题本概览（3） | **total1 + chapters1** / favorites2 | total2 + chapters2 + favorites2 |
| 知识概览（2，md+） | 不展示（移动保持现状） | continue3 + progress3 |

> 与 v1 的差异：v1 的 12 栏五尺寸方案简化为 6 栏五尺寸；「学习进度」改为 `stat` 尺寸（移动 1 栏、md 2 栏），从而与「刷题正确率」在移动端并排。

### 3.8 组件 API 草案（实现阶段）

新增 `web/src/components/ui/bento.tsx`（≤200 行，只含布局原语，不承载业务数据）：

```tsx
// 布局容器：grid-cols-2 md:grid-cols-6 gap-3 md:gap-4
<BentoGrid>
  <BentoLinkCard size="hero" tone="hero" minH="hero" render={<Link to="/review" aria-label="进入今日复习" />}>
    <BentoStat label="今日到期" value={due} suffix="张" />
  </BentoLinkCard>
  <BentoCard size="stat" tone="default" minH="half">...</BentoCard>
</BentoGrid>
```

```ts
export type BentoSize = 'hero' | 'wide' | 'half' | 'third' | 'stat';
export type BentoTone = 'default' | 'hero';
export type BentoMinH = 'stat' | 'third' | 'half' | 'hero' | 'wide'; // 96/128/160/192/240

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface BentoCardProps extends React.HTMLAttributes<HTMLElement> {
  size?: BentoSize;     // 默认 'third'，控制 col-span
  tone?: BentoTone;     // 默认 'default'，控制底色/渐变（与 size 正交）
  minH?: BentoMinH;     // 默认跟随 size
  as?: 'article' | 'section'; // 默认 'article'
}

// BentoLinkCard：整卡可点，内部复用 useRender 合入 <Link>/<a>；不支持 render={<button/>}
export interface BentoLinkCardProps extends Omit<BentoCardProps, 'as'> {
  render: React.ReactElement; // 必须是 <a>/<Link>，且不得在内部再嵌套可聚焦元素
}
```

- `BentoStat`（数字 + 标签）体积很小，按需放在 `components/ui`（≤40 行）或直接在 `features/dashboard/` 内实现；不进入 `bento.tsx`，避免原语文件膨胀。
- 落位理由：布局原语与 `Card` 同层（`components/ui`），不侵入 `features/`；符合「反馈基础设施只在 ui|lib|hooks|stores，features 只消费」的既有约束。
- **文件预算**：`bento.tsx` ≤200 行；Dashboard 重建后路由文件 ≤120 行，瓦片拆到 `features/dashboard/`（`queries.ts` ≤100、`tiles.tsx` ≤250，超出再拆 `tiles-*.tsx`、`skeleton.tsx` ≤120）；`quiz.tsx`（319 行）在 Phase 0 拆分；`knowledge/index.tsx`（374 行）在 Phase 0 先拆分。

### 3.9 与现有 `Card`、白卡和按页最大宽度的关系

- `Card` 继续服务表单、对话框内区块、列表项等**非 bento** 场景；bento 页面不再用 `Card` 包裹瓦片列表。
- **移除 `route.tsx:37` 桌面白卡**后，bento 页面直接铺在 `bg-muted/30` 画布上，瓦片成为唯一表面。白卡同时承担了「给所有页面一个统一内容宽」的作用，因此必须同时引入**按页 max-width 策略**：

| 页面 | 内容容器 | 理由 |
| --- | --- | --- |
| 仪表盘 / 学习统计 / 刷题首页 | `max-w-6xl` | bento 需要宽度 |
| 刷题答题中 | `max-w-2xl` | 单题专注 |
| 错题本列表 | `max-w-5xl`（概览条同宽） | 长题干可读性 |
| 知识目录 | `max-w-6xl`；阅读器 `max-w-3xl` | 正文行宽约 70 中文字（保持既有阅读体验） |
| 复习 | `max-w-3xl` | 单卡专注流 |
| 设置 | `max-w-2xl` | 表单 |
| 登录 | 保持现有左右分栏 | — |

  验收：1440 下阅读器正文宽不超过约 800px；设置/复习不超过约 768px。

---

## 4. 逐页方案

### 4.1 仪表盘（Phase 1 主战场，7 瓦片）

**信息优先级**：今日复习 > 继续学习 > 学习进度 > 刷题水平 > 错题 > 薄弱章节 > 考试信息。

**桌面 md（6 栏）**

```
┌─────────────────────────────────────┬──────────────────────┐
│ 今日复习 · hero · 4/6                 │ 学习进度 · 2/6        │
│  还有 N 张卡片待复习   今日 x/y       │  ◯ 覆盖率              │
│  ▓▓▓▓▓░░░░░░░                        │  已掌握 a/b · c 章     │
│  [开始复习 →]                         │                      │
├─────────────────┬──────────────┬─────┴──────────────────────┤
│ 继续学习 · 2/6   │ 刷题正确率 2/6│ 错题本 · 2/6                  │
│ 3.2 软件架构…    │ p% · n 题     │ m 道 · 去重做 →               │
├─────────────────┴──────────────┴────────────────────────────┤
│ 薄弱章节 Top 5 · wide · 4/6             │ 考试信息 · 2/6        │
│ 5 行（章名 + 进度 + x/y，每行≥44px）     │ 综合知识 75 题/150 分 │
│                                        │ 案例分析 5 选 3/90 分 │
│                                        │ 论文写作 4 选 1/120 分│
└────────────────────────────────────────┴──────────────────────┘
```

**移动（2 栏）**

```
┌──────────────────────────────┐
│ 今日复习 · hero（2）          │
├──────────────────────────────┤
│ 继续学习（2）                 │
├───────────────┬──────────────┤
│ 学习进度（1）  │ 刷题正确率（1）│
├───────────────┴──────────────┤
│ 错题本（2）                   │
├──────────────────────────────┤
│ 薄弱章节 Top 5（2）            │
├──────────────────────────────┤
│ 考试信息（2）                 │
└──────────────────────────────┘
```

**瓦片数据与交互**

| # | 瓦片 | 内容（示例数据仅示意） | 数据来源（现有 API） | size/minH | 交互 |
| --- | --- | --- | --- | --- | --- |
| 1 | 今日复习 | 待复习数、今日已复习/今日总数进度条、CTA | `/review/stats`：`due_count / reviewed_today / total_items` | hero/hero | 整卡 → `/review`；数字 AnimatedNumber（修 I-07） |
| 2 | 学习进度 | 覆盖率环形、已掌握 a/b、章数 c | `/learning/progress` + `/knowledge/chapters` | stat/half | 整卡 → `/knowledge`（含原「知识体系」卡信息） |
| 3 | 继续学习 | 上次学习「章 · 知识点标题」+ 继续按钮；无记录时「从第 1 章开始」 | `/learning/progress.last_progress` | third/half | 整卡 → `/knowledge?chapter&point`；无记录 → 第 1 章首点 |
| 4 | 刷题正确率 | 正确率、已答题数 | `/practice/stats`：`accuracy / total_questions` | stat/half | 整卡 → `/stats` |
| 5 | 错题本 | 错题数 + 入口 | `/practice/wrong-questions?page_size=1` 的 `total`（新增 1 个轻请求） | third/half | 整卡 → `/wrong-questions`（`third` 保证移动端整行，避免半行空洞） |
| 6 | 薄弱/待学章节 Top 5 | 按掌握率升序取 5 章（tie-break：mastered 升序 → chapter_no 升序）：章名 + 进度条 + mastered/total；每行 ≥44px | `/learning/progress.per_chapter` + `/knowledge/chapters` | wide/wide | 每行 → `/knowledge?chapter=X`；瓦片头部「全部章节 →」 |
| 7 | 考试信息 | 3 种题型题量/时长（静态） | 硬编码（现状） | third/third | 只读；「开始学习」为瓦片内独立链接（不与整卡链接嵌套） |

- **章节覆盖不再用 20 格迷你条**（1024 下每格约 22px，若可点必然违反 44px 触控；v2 改为 Top 5 行 + 每行 44px）。
- **去掉假 hover**：考试信息等不可点瓦片不加上浮。
- **骨架**：每瓦片独立 skeleton（尺寸一致），页面不再整页 gate；`review/stats` 未返回时 hero 显示骨架而非 0。
- **空态**：无到期卡片 → hero「今天没有到期卡片」；无练习记录 → 刷题瓦片「还没开始刷题 → 去练习」；无 last_progress → 继续学习显示「从第 1 章开始」；无薄弱章节 → 显示「全部章节已掌握」。
- **错误态**：任一查询失败 → 对应瓦片「加载失败 + 重试」；其余瓦片正常。
- **预期收益（设计估算）**：桌面有效信息单元 4 → 7；移动首屏可见瓦片 3 → 4–5；「今日该做什么」无需跨页。
- **移动 hero 文案约束**：390 下当前 CTA 出现「待复/习」断字（V15）；bento hero 需限制文案长度/换行（数字与「张」同一行，CTA 不与文案抢宽），并纳入 390 截图验收。

### 4.2 学习统计（二期候选，5 瓦片）

```
┌──────────────┬──────────────┬──────────────────────┐
│ 正确率 · 2/6  │ 答题量 · 2/6  │ 今日复习 · 2/6        │
│ ◯ p%         │ n 题 · m 对   │ 到期 x / 已复习 y     │
├──────────────┴──────────────┼──────────────────────┤
│ 章节表现（掌握 × 正确率）· 4/6 │ 学习覆盖 · 2/6        │
│ 薄弱优先，双条对比            │ ◯ 覆盖率 · a/b · c 章 │
└─────────────────────────────┴──────────────────────┘
```

- 章节表现把「掌握度（learning/progress）」与「正确率（practice/stats）」按 `chapter_id` join 到一行双条，回答「哪章没学、哪章学了但做不对」。
- `chapter_stats` 存在**无 `chapter_id` 的全局行**（实测 `chapter_stats[0]` 无 id，是「第undefined章」根因）：前端 join 时该行显示为「未归类」，并单独提一条后端/数据缺陷（`chapter_id=0` 的题目），不在本方案内修后端。
- 保留空态（无练习记录）；新增瓦片级错误态。
- 1024–1279 验收：双条列表不折行错位。

### 4.3 刷题首页（二期候选，4 瓦片）

```
┌──────────────────────────────────────┬──────────────────────┐
│ 新练习 · 4/6                          │ 你的水平 · 2/6        │
│ 题量  [20] [50] [100]                │ ◯ p% · n 题 · m 对    │
│ 范围  [全部章节 ▾] [薄弱章节 ×3]      │                      │
│ [开始练习 →]                          │                      │
├──────────────────────────────────────┼──────────────────────┤
│ 薄弱章节 · 4/6                        │ 去错题本 · 2/6        │
│ 3 行（章名 + 正确率），每行 ≥44px      │ k 道错题 · 去重做 →   │
└──────────────────────────────────────┴──────────────────────┘
```

- **范围选择重构**：20 个章节 chip 竖排 → 一行「全部章节」下拉 + 3 个「薄弱章节」快捷 chip（数据来自 `practice/stats.chapter_stats` 正确率最低的 3 章）。
- 「你的水平」「薄弱章节」瓦片只在有练习记录时出现；无记录时右栏替换为「先来一组 20 题」引导。
- 保留「继续练习」入口（有未完成 session 时升至 hero 位置，`practice-start.tsx` 已有该逻辑）。
- 移动端：新练习 → 你的水平 → 薄弱章节 → 错题入口。
- Phase 0 先修：开始练习 loading/disabled（F12）、0 答案会话（F13）、完成后清 session（F11）、桌面退出入口（F9）、移动提交后按钮可见性（F14）。

### 4.4 错题本（二期候选，概览条 + 筛选 + 单列列表）

```
┌──────────────┬──────────────┬──────────────┐
│ 错题 n 道 1/2 │ 涉及 k 章 1/2 │ 收藏 m 道 2/2 │
├──────────────┴──────────────┴──────────────┤
│ [全部] [单选] [多选]  章节 [全部 ▾]  排序 [最近 ▾] │
├────────────────────────────────────────────┤
│ ▸ Q 单选 · ch6 · 2026/10/20          [重做] │
│ ▸ Q 多选 · ch3 · 2026/10/18          [重做] │
└────────────────────────────────────────────┘
```

- 概览条 3 个 `stat` 瓦片（移动端奇数末位 span 2，见 §3.7.1）；列表保持单列紧凑行（不 bento 列表本身）。
- **交互修复（Phase 0/2）**：分页（API 已支持 `page/page_size=`，当前固定 `page_size=100` 且用 `items.length` 计数）、按章节/题型筛选、桌面错题数徽标（F10）、`window.location.href` → `<Link>`、单题 pending 不阻塞其他题。
- **不采用「答对后乐观移除「**：后端当前不删除 `wrong_questions`（重做只写 `practice_records`），refetch 会复活；Phase 0/2 改为「重做正确后行内标记『已订正』+ 刷新 stats」，或先改后端（需产品决策）。
- **收藏页签（可选，Phase 2-5）**：后端 `/practice/favorites` 与收藏接口已存在但前端完全未使用；可作为第二个 tab（「错题 / 收藏」），属于「让已有能力可见」，不是新功能。若 D6 选 B（不做收藏），概览条「收藏 m 道」瓦片隐藏。

### 4.5 知识体系（二期候选，仅概览条）

```
┌───────────────────────┬───────────────────────┐
│ 继续学习 · 3/6         │ 总进度 · 3/6           │
│ 3.2 … [继续]          │ ▓▓▓░░ a/b · c 章       │
└───────────────────────┴───────────────────────┘
（章节目录列表保持不变：行 + 进度条 + 展开）
```

- **v2 缩减为 2 瓦片**：去掉「今日复习」瓦片（与仪表盘 hero 重复，且会给知识页新增 `/review/stats` 请求）；移动端保持现状（已有「继续学习」FAB）。
- 章节目录的「全部展开」空壳、深链不展开、跨章导航等属于 Phase 0 修复，不改列表形态。
- **不做 Option B（章节卡片网格）**：20 章是有序目录，网格会打散阅读顺序、破坏进度条对比；如未来要做「章节进度地图」，需先改 `mobile-learning-design §1.3` 并单独立项。

### 4.6 今日复习（专注流微调，Phase 0/3）

```
┌────────────────────────────────────────────────────────┐
│ 今日进度 ▓▓▓░░ x/y   到期 n   已复习 m   第 i/j 张      │  ← 紧凑指标条
├────────────────────────────────────────────────────────┤
│ 知识卡 · 来源 ch1                    第 i / j 张         │
│ ┌────────────────────────────────────────────────────┐ │
│ │  问题 · 点击查看答案                                 │ │
│ └────────────────────────────────────────────────────┘ │
│ [重答] [困难] [良好] [简单]                              │
└────────────────────────────────────────────────────────┘
```

- 移动端 3 张全宽统计卡（约 360px）→ **2×2 迷你指标格**（到期 / 已复习 / 队列位置 / 今日进度），高度约 120px；桌面保留紧凑 metrics strip。
- **指标语义**：只放「到期 / 已复习 / 队列位置」等今日指标；`total_items` 是累计复习项（非今日指标），**不作为 UI 主指标**（不进入本期 bento；如需要可作为统计页次级文字，不纳入验收）。
- 修复评分重复提交：点击后**立即**禁用评分按钮，淡出 220ms 只做视觉过渡，不再等淡出后才进入 pending（F3）。
- 复习卡改为可聚焦语义（`role="button"`/`tabIndex` + Enter/Space，或 Base UI 原语），修复 F17。
- 「迁移旧错题」按钮移至页面底部或更多菜单，避免与主流程竞争（保留功能）。

### 4.7 设置 / 登录 / 全局壳层（不做 bento，做交互修复）

- **壳层**：移除桌面白卡（D2）；Sidebar 增加「仪表盘」项 + 品牌可点回 `/`（I-08）；导航项 `aria-current`；移动导航项 ≥44px；Header 桌面标题左对齐（`header.tsx:67` 的 `justify-center`）；`h-screen` → `h-dvh`；内容区补底部 padding + safe-area；z-index 改用 token；自建按钮统一 `focus-visible`。
- **设置**：表单保持单列；修复主题切换语义（`system` 下按实际主题切换、监听 OS 变化、保留 system 入口，F7/F8）；清缓存增加确认（F18）；清缓存不再误删 practice-session。
- **登录**：区分公开端点 401 与会话过期 401（F1）；内联错误去英文（F6）、Enter 提交、验证码 60s 重发冷却、发送后聚焦验证码输入、错误在输入时清除；不做视觉改版。

### 4.8 本方案后的页面版式一览

| 页面 | 版式 | 瓦片数 | 阶段 |
| --- | --- | --- | --- |
| 仪表盘 | 6 栏 bento | 7 | 一期 |
| 学习统计 | 6 栏 bento | 5 | 二期候选 |
| 刷题首页 | 6 栏 bento | 4 | 二期候选 |
| 错题本 | 概览条 3 瓦片 + 筛选 + 单列列表 | 3 | 二期候选 |
| 知识体系 | 概览条 2 瓦片（md+）+ 目录列表 | 2 | 二期候选（待二期决策） |
| 今日复习 | 紧凑指标条 + 单卡专注流 | — | Phase 0/3 |
| 阅读器/答题/登录/设置 | 不变（仅交互修复 + 按页 max-width） | — | Phase 0 |

---

## 5. 数据与状态

### 5.1 API 复用表（**不新增后端接口**）

| 瓦片/模块 | 现有接口 | 备注 |
| --- | --- | --- |
| 今日复习 / 复习统计 | `GET /review/stats` | `due_count / reviewed_today / total_items` |
| 学习进度 / 薄弱章节 | `GET /learning/progress` | `coverage / mastered_points / total_points / per_chapter / last_progress` |
| 刷题正确率 / 薄弱章节 | `GET /practice/stats` | `accuracy / total_questions / chapter_stats`（注意无 `chapter_id` 的全局行） |
| 知识体系 / 章数 | `GET /knowledge/chapters` | 20 章 |
| 错题数 / 错题列表 / 收藏 | `GET /practice/wrong-questions`、`GET /practice/favorites` | 错题数用 `page_size=1` 的 `total`，仅仪表盘 1 个轻请求（D4 可去掉） |
| 继续学习目标 | `/learning/progress.last_progress` | 零新增 |

- 一期仪表盘查询数：4 → 5（新增错题数），并行、可缓存；若审阅认为不值得，可去掉错题瓦片（D4）。
- 二期新增查询（仅对应页面）：统计页 +`/review/stats`（今日复习瓦片）；刷题首页 +`/practice/stats`（水平瓦片）与错题 `total`（错题瓦片）；错题页 +`/practice/favorites`（收藏瓦片）。均为现有接口，无新增端点。
- 明确不做：时间范围/趋势（需后端）、跨用户对比、活动流。

### 5.2 queryKey 统一（修复 I-21 / F24）

- 抽出共享 hooks：`features/practice/queries.ts` 的 `usePracticeStats`、`features/review/queries.ts` 的 `useReviewStats`，键统一为 `['practice-stats']` / `['review-stats']`；
- 仪表盘、统计页、刷题/错题、复习页全部消费同一 hooks；
- 所有 mutation 失效逻辑统一到 hooks 内（quiz/wrong-questions/review/mark-mastered 已有分散失效，收敛）。

### 5.3 跨章阅读的数据策略（修复 I-02）

- 现状：`findCrossChapterNext/Prev` 依赖 `chapterPointsMap` 已包含相邻章 points，未加载时直接返回 null，**直接复用不会修复问题**。
- 方案（不改后端）：阅读器进入时同时预取「上一章 + 下一章」points（`useQueries` 或 `queryClient.prefetchQuery`，enabled 依赖 chapter 顺序），保留 helpers 为纯函数并补单测（边界：首章/末章/相邻章未加载/章内首末点）。
- 成本：阅读器请求从 1 次变为最多 3 次（章节 points，5 分钟缓存）；可接受，后续若后端提供 next/prev 端点再优化。
- 「全部展开」同理：每章按需 query + 每章独立 loading/error 骨架，避免父层只取 1 个 expanded id。

### 5.4 数据快照与验收口径

- 文中示例数字仅为设计示意；审计账号在评审期间仍在被操作，数值会变化。
- 验收标准：同一 query 在「仪表盘 / 统计 / 复习 / 错题」之间一致；不写死具体数值。

---

## 6. 实施分期与 PR 拆分

> 原则：每期独立可编译、可回滚；bento 与交互修复分开，先修正确性。估算为相对工作量（S/M/L），不是承诺工期。

### Phase 0 — 交互修复（不改版式）

| PR | 内容 | 关键文件 | 验收 |
| --- | --- | --- | --- |
| 0-1 | 反馈与错误态：新增 `ErrorState`（或 `EmptyState` 变体）+ 页面 `isError` 分支与重试；区分登录公开端点 401 与会话过期 401；axios timeout + 网络错误 toast；登录内联错误 + 单条 toast | `components/ui/*`、`lib/api.ts`、`features/auth/*`、各页面 | 断网/500 显示「加载失败 + 重试」；登录失败保留输入、只有一条可见反馈 |
| 0-2 | 数据一致性：共享 stats hooks、统一 queryKey；`AnimatedNumber` 支持 value 变化同步（需更新旧 spec 契约）；Dashboard 骨架门控 | `features/*/queries.ts`、`ui/animated-number.tsx`、`routes/_authenticated/index.tsx` | 刷题/复习后回首页数字一致；慢网仪表盘不显示 0；骨架与真实布局同高 |
| 0-3 | 前置拆分：`knowledge/index.tsx`（374 行）按 URL/展开/弹层状态拆出 hook 与视图；`quiz.tsx`（319 行）拆出 runner 与结果层 | `routes/_authenticated/knowledge/index.tsx`、`features/practice/quiz.tsx` | 文件回到 `routes ≤300 / features ≤250`；行为不变 |
| 0-4 | 知识体系 P1：抽屉导航、跨章预取 + helpers、全部展开逐章加载、阅读器 loading gate、标记已学乐观更新 + pending、阅读器底栏贴底、目录骨架行数 = 实际章数（I-20 知识部分） | `features/knowledge/*`、`routes/.../knowledge/index.tsx` | 移动抽屉可跨章跳；第 1 章末可进第 2 章；全部展开 20 章有内容/骨架；骨架行数与真实章数一致；错误态可重试 |
| 0-5 | 弹层与搜索：目录抽屉/搜索 Sheet 复用 `ui/dialog`（focus trap/入场动画/显式滚动锁）；搜索关闭清 query、结果上限/分页、关键词高亮、Markdown 转纯文本、错误与空态区分 | `features/knowledge/{chapter-drawer,search-sheet}.tsx`、`ui/dialog*` | 打开弹层后背景不可滚、Tab 不逃逸、Escape 关闭；157 条结果可控；结果显示纯文本 |
| 0-6 | 壳层与导航：首页入口 + 品牌可点 + `aria-current`；Header 桌面左对齐 + 移动副标题取舍（I-9）；`h-dvh` + 底部 safe-area（I-24）；白卡移除前的容器准备 | `components/layout/*`、`routes/_authenticated/route.tsx` | 任意页可一键回仪表盘；1024/390 无横向滚动；Header 信息层级与注释一致 |
| 0-7 | 可达性与一致性：focus-visible 统一、44px 触控目标、skip link/搜索 label/标题层级、z-index token、reduced-motion 扩展、Toast hover/Escape/44px、图标统一 lucide（I-23） | `styles/index.css`、`components/**`、`features/**` | 键盘可见焦点、主流程纯键盘可完成；reduced-motion 下无位移动画；`vp check` 无新增 warning |
| 0-8 | 页面交互修复：复习（失败不跳卡、防重复提交、键盘翻卡、移动指标压条、指标语义）；刷题（桌面退出、完成清 session、开始 loading、0 答案会话、移动按钮可见、**「本章真题」传 chapter：`/practice` 路由 search + PracticeStart 初始 scope**）；错题（桌面徽标、`Link`、分页/筛选、单题 pending）；设置（清缓存确认、主题语义） | `features/review/*`、`features/practice/*`（含 `routes/_authenticated/practice/index.tsx`）、`features/settings/*`、`stores/theme-store.ts` | 各提交类操作 loading 阻止重复；失败有可见提示；390 下评分/下一题无需滚动；从阅读器点「本章真题」进入时预选该章 |

> PR 可按评审意见合并/拆分；0-3 必须前置在 0-4 与 0-8 之前（同一文件避免二次搬迁）。

**依赖关系**

| 下游 | 依赖 | 原因 |
| --- | --- | --- |
| 0-4 / 0-8 | 0-3 | knowledge/quiz 先拆分再改，避免二次搬迁 |
| 0-8 | 0-1 | 错误态与登录反馈基础设施先就位 |
| 1-1 | 0-2 / 0-6 / 0-7 | AnimatedNumber、容器/壳层准备、styles/index.css 的 reduced-motion 扩展 |
| 1-2 | 1-1 | bento 原语与按页 max-width |
| Phase 2 各 PR | 1-1（及对应 Phase 0 项） | 复用 bento 原语与已修复的交互基线 |

### Phase 1 — Bento 基础 + 仪表盘（一期交付，D1=A）

| PR | 内容 | 验收 |
| --- | --- | --- |
| 1-1 | `components/ui/bento.tsx`（`BentoGrid/BentoCard/BentoLinkCard`，≤200 行）+ 单测（span/minH/链接语义/无嵌套交互）；移除 `route.tsx` 桌面白卡 + 按页 max-width（§3.9）；`styles/index.css` 补 reduced-motion transition 抑制 | 组件测试通过；各页在 1440/1280/1024/768/390 无横向溢出；阅读器正文 ≤约 800px；无 Card 套 Card |
| 1-2 | 仪表盘重建（7 瓦片 + 独立四态 + 骨架）+ `DashboardSkeleton` 按瓦片重写 + 数字/进度语义；瓦片拆分到 `features/dashboard/` | 五档视口 × 明暗截图；CLS≈0；四态可演示；路由 ≤120 行 |
| 1-3（可选） | Sidebar「今日复习」徽标（复用 review stats query，staleTime 60s） | 徽标与复习页一致；不新增请求风暴 |

### Phase 2 — 二期候选（Phase 1 验收后逐项决策，可独立评审）

| PR | 内容 |
| --- | --- |
| 2-1 | 学习统计 bento（5 瓦片，合并掌握×正确率双条；`未归类` 行处理） |
| 2-2 | 刷题首页 bento（范围下拉 + 薄弱章节建议 + 水平瓦片） |
| 2-3 | 错题本概览条 + 筛选 + 分页（不含「答对移除」） |
| 2-4 | 知识体系概览条（2 瓦片，仅在二期决策纳入时实施） |
| 2-5（可选） | 错题本「收藏」页签（复用已有 favorites API） |

### Phase 3 — 延后项与打磨

| 内容 |
| --- |
| 桌面深链自动展开、返回保留 chapter、搜索高亮与滚动恢复；练习结果页（成绩 hero + 逐题回看，属于新交互，需另行评审）；12 栏网格（仅在二期出现 3:1 等比例需求时） |

---

## 7. 验证方案

| 维度 | 方法 | 通过标准 |
| --- | --- | --- |
| 功能 | 每页四态（含断网/500）；按钮五态；提交类防重复 | 无「失败=空」；无重复提交；错误可重试 |
| 响应式 | **390 / 768 / 1024 / 1280 / 1440** 五档 × 明暗主题截图 | 无横向滚动；无瓦片半行空洞；文字不溢出；阅读器行宽达标 |
| 键盘/无障碍 | Tab 全流程、focus-visible、Escape 关浮层、screen reader 抽查（标题层级/aria-current/label） | 主流程纯键盘可完成；焦点可见；弹层焦点不逃逸 |
| 动效 | `prefers-reduced-motion: reduce` 下无 keyframes/transition 位移 | 全部静态 |
| CLS | 骨架→内容切换；DevTools Performance/Layout Shift | CLS < 0.05（首页） |
| 视觉 | 与 `screenshots/bento-audit/` 当前基线对比；深色对比度抽查 | 正文对比度 ≥4.5:1 |
| 工程 | `cd web && vp check`、`vp test`；文件大小上限；`package.json` 无新增依赖 | 无新增 error/warning；无超限文件 |
| 证据资产 | 代表性截图（每页首屏 1 张 + 关键态，约 12–16 张）入库存档；不提交全部 90+ 张 | 截图路径可追溯；脚本不依赖 `/tmp` |
| 文档 | `lore commit`（含 Constraint/Tested/Not-tested/Reversibility）；批准后更新 `§9` 所列文档 | trailer 齐全 |

- 截图基线：本方案的验证脚本/矩阵在 Phase 1 落地前手工执行；代表性截图存入 `screenshots/ui-baseline/`（与本次 `screenshots/bento-audit/` 的临时证据区分）。全量截图目录建议 gitignore（需单独 PR，不默认提交）。

---

## 8. 风险与回滚

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| 1024–1279 桌面过挤 | 瓦片文字折行 | 该区间强制验收；必要时把 `third` 降级为 `half`；内容上限约束 |
| 深色模式下 tone 对比不足 | 可读性 | 只用 token 透明度变体；明暗双截图 + 对比度抽查 |
| 瓦片数量失控变成“仪表盘噪音” | 认知负担 | 每页瓦片上限（§2.2）+ 单瓦片内容上限；每个瓦片对应一个用户问题 |
| 移除白卡导致其他页面视觉突变 | 全站观感 | 单独 PR + 逐页截图 + 按页 max-width（§3.9）；非 bento 页面只换画布与宽度 |
| 阅读器宽度变化 | 阅读体验 | 阅读器 `max-w-3xl`；1440 正文宽 ≤约 800px 验收 |
| 交互修复拖慢 bento 节奏 | 周期 | Phase 0/1 可拆两个迭代交付；bento 组件开发可与 0-1/0-2 并行 |
| 旧 spec 的「AnimatedNumber 不重播」「toast hover/Escape 未实现」等偏差 | 规范不一致 | §9 逐条更新并附偏差清单，不把设计债洗成“已实施” |
| 回滚 | — | 每 PR 独立可 revert；bento 组件无全局副作用；Phase 0 修复配最小测试 |

---

## 9. 规范影响（需批准的文档变更，本次不改）

> 项目当前**没有** `DESIGN.md`（`git ls-files` 无该文件），设计规则以 `docs/spec/2026-08-06-ui-upgrade-design.md` 与 `docs/architecture/mobile-learning-design.md` 为准。两份文档均受 Git 管控，**本提案不修改它们**；批准实施后需单独提交 docs 变更。

1. `docs/spec/2026-08-06-ui-upgrade-design.md §2.1.3`：`AnimatedNumber` 现约定「后续 prop 变化不重播」，Phase 0-2 要改为「value 变化同步显示（或调用方 key 强制重播）」——需同步更新契约与测试。
2. 同文档 `§0.1`：现描述「route.tsx 已重构为 flex 全宽壳层；muted/40 画布」；实际为 `muted/30`，且 D2 移除白卡后描述失效——需更新。
3. 同文档 `§4.3`：验收只列 390/768/1440；本方案扩到 **1024/1280**（六栏最紧区间），需同步。
4. 同文档状态：「已批准(待实现)」→「已实施（含偏差）」，并附实现偏差清单：Dashboard 实际 3 卡（spec 画 4 卡骨架 + 继续学习未做）、Toast 缺 hover/Escape、reduced-motion 只停 keyframes、无 Error 态。
5. `docs/architecture/mobile-learning-design.md §1.7`：现约定移动端「单列、卡片纵向堆叠」、仅 md/lg 断点且 lg 仅列数微调。本方案对 **bento 页面**引入「移动 2 栏 mosaic + md+ 6 栏」新约定（非 bento 页面保持单列）——需在该文档补充「bento 页面例外」条目并记录理由；若未来采纳 12 栏（D3-B）再单独更新。
6. 新增单测（bento 原语、跨章 helpers 纯函数）属于对既有「PR2–PR4 不强制新增单测」范围决策的重新决策，需在实施 PR 的 Lore 中显式记录。
7. `docs/index.md`：新增本 spec 索引与状态（批准后更新）。

---

## 10. 待审阅决策（请逐条选择）

| 编号 | 决策 | 选项 | 推荐 |
| --- | --- | --- | --- |
| **D1** | 一期 bento 范围 | A 仅仪表盘，二期再评估统计/刷题/错题/知识；B 一期同时做 4 页 + 知识概览条 | **A**（先把收益最重的 Dashboard 做透并验证 6 栏/四态/瓦片规范，再复制；二期按 §6 逐项评审） |
| **D2** | 桌面单一表面 | A 移除 `route.tsx` 白卡 + 按页 max-width（推荐）；B 保留白卡，bento 瓦片改为无边框分隔 | **A**（否则三层表面；但必须接受 §3.9 的按页 max-width，尤其阅读器） |
| **D3** | 网格 | A 2/6 栏（推荐，无需改断点规范）；B 2/6/12 栏（需更新 `mobile-learning-design §1.7`，并接受 1024 下更紧） | **A**（6 栏已可表达 Dashboard 全部比例） |
| **D4** | 仪表盘新增信息 | 继续学习（last_progress）、薄弱章节 Top5（per_chapter）、错题数（+1 轻请求）：全要 / 去掉错题数 / 只重排现有信息 | **全要**（均有现成数据；错题数可去掉以少一个请求） |
| **D5** | 实施顺序 | A 先 Phase 0（交互修复）再 Phase 1 bento（推荐）；B 交互修复与 bento 同迭代并行 | **A**（bento 会放大数据/状态问题） |
| **D6** | 错题本「收藏」页签 | A 纳入 Phase 2-5（复用已有 API，让能力可见）；B 不做 | **A**（低风险，可后置） |

---

## 附录 A：证据、报告与截图索引

- 审计/评审报告（已从会话临时目录复制入仓，仅作审阅证据、未跟踪）：
  - `screenshots/bento-audit/reports/audit-core.md`（交互审计 A：壳层/仪表盘/知识体系，338 行）
  - `screenshots/bento-audit/reports/audit-flows.md`（交互审计 B：刷题/复习/错题/统计/设置/登录，505 行，F1–F31）
  - `screenshots/bento-audit/reports/audit-visual.md`（浏览器实测：260 行，V1–V20、54 组度量、67 项 PASS/FAIL）
  - `screenshots/bento-audit/reports/review-proposal.md`（本提案 v1 的交叉评审：11 🔴 / 15 🟡 / 5 🟢）
  - `screenshots/bento-audit/reports/review-v2.md`（v2 复核：15 ✅ / 3 🟡 / 8 🔴 小修）
- 浏览器实测截图：`screenshots/bento-audit/`（**116 张**，约 12MB，未跟踪；矩阵 54 + 1440 full 16 + 交互态 40+；其中 12–16 张代表作见下）
  - `dashboard-1440_light.png`（白卡 + 3 卡堆叠，横向留白；内容仅占白卡高度约 63%）
  - `practice-1440_light.png`（672px 内容居中于 912px 可用宽）
  - `wrong-questions-1440_light.png`（5 条错题占满首屏）
  - `stats-390_light.png`（3 张全宽统计卡 + `第undefined章`）
  - `theme-system-dark-clean-before-1440.png` / `theme-system-dark-after-first-click-1440.png`（两次截图 SHA256 相同 → 首次点击无变化）
  - `knowledge-expand-all-1440_light.png`（「全部展开」仅 1/20 章有内容）
  - `knowledge-drawer-noncurrent-click-390_light.png`（移动抽屉点非当前章无反应，URL 不变）
  - `reader-390_light.png`、`review-390_dark.png`、`review-after-grade-390_light.png`、`login-1440_dark.png`
  - `settings-logout-confirm-390_light.png`、`search-sheet-results-390_light.png`、`error-api-fail-dashboard-1440_light.png`
- 度量数据（visual-audit）：1440 主区 1200 / 白卡 960 / Header 64 / Sidebar 240；内容宽 390=366、768=416、1024=672、≥1280=912（现状）；移除白卡后 768=480、1024=720、1280=976、1440=1088。**现状 PASS 基线**：54 组「页面×视口×主题」横向溢出 = 0；Header sticky 无遮挡；阅读器三处 sticky 坐标正确；复习评分后计数一致（10→9→8）且刷新一致。
- 数据快照：2026-10-20 16:52–17:20（审计账号持续被操作，数值会变化；验收不依赖具体值）。

## 附录 B：审计编号 → Phase 0 PR 对照

| 审计编号 | Phase 0 PR |
| --- | --- |
| F1 / F4 / F5 / F6 / V11 | 0-1 |
| I-07 / I-20（Dashboard 骨架）/ I-21 / F24 | 0-2 |
| 文件拆分前置：I-25（knowledge 374 行）/ quiz 319 行 / I-26（删除 chapter-tree 死代码，需批准） | 0-3 |
| I-01 / I-02 / I-03 / I-04 / I-06 / I-16 / I-20（知识骨架）/ V3 / V4 / V5 / V6 / V14（部分） | 0-4 |
| I-13 / I-15 / V7 / V8 | 0-5 |
| I-08 / I-17 / I-14（导航部分）/ I-9 / I-24 / V10 / V12 | 0-6 |
| I-10 / I-11 / I-12 / I-18 / I-19 / I-23 / F16 / V13 / V16 | 0-7 |
| F2 / F3 / F7 / F8 / F9 / F10 / F11 / F12 / F13 / F14 / F15 / F17 / F18 / V1 / V15 / V18 | 0-8 |
| I-22（白卡）/ I-20（Dashboard 骨架重写） | 1-1 / 1-2 |

> V 编号来自 `screenshots/bento-audit/reports/audit-visual.md`（已归档）；P2 类 V 编号（V2/V9/V12/V13/V16 等）已并入 §1.4 或对应 PR 验收，未逐条列入本表。

## 附录 C：v1 → v2 修订记录（响应交叉评审）

| 评审项 | 修订 |
| --- | --- |
| R1 事实错误 | 删除「搜索无防抖」；改为结果上限/分页/高亮/残留；修正「今日到期在复习页 header」为统计卡 |
| R2 数据漂移 | 全文示例数字标注为快照示意；验收不写死数值 |
| R3 瓦片数矛盾 | 统一 7 瓦片；「知识体系」并入「学习进度」 |
| R4 移动 span 矛盾 | 明确 `stat` 才允许 1+1；primary 类内容用 `stat` 尺寸表达；矩阵与草图同步 |
| R5 span 矩阵缺失 | 新增 §3.7 逐页移动/md span 矩阵 + 奇数瓦片规则 |
| R6 20 章瓦片不可行 | 改为「薄弱章节 Top 5」行列表（每行 ≥44px），移除 20 格可点设计 |
| R7 跨章 helpers 无效 | 新增 §5.3：预取相邻章 points + helpers 纯函数 + 单测 |
| R8 Phase 0 漏 P2 | Phase 0 扩展为 8 个 PR，补 I-12/13/14/15/16/20 与 F9–F18 |
| R9 白卡宽度副作用 | 新增 §3.9 按页 max-width 表（阅读器 max-w-3xl 等） |
| R10 文档变更清单 | §9 补齐 AnimatedNumber 契约、§0.1 壳层描述、§4.3 断点、已实施偏差清单 |
| R11 证据不可持续 | 报告复制入 `screenshots/bento-audit/reports/`；附录不再引用 `/tmp`；截图只存代表作 |
| Y1 12 栏非必需 | 改用 2/6 栏；12 栏列为 D3-B 延后决策 |
| Y2 一期收窄 | D1 推荐 A（仅 Dashboard），Phase 2 逐项评审 |
| Y4/Y5 阴影/同色 | 默认无阴影、interactive hover 才有；移除 muted tone |
| Y6 API/预算 | 拆 `BentoCard` / `BentoLinkCard`；补每页文件预算 |
| Y9 知识概览条 | 缩减为 2 瓦片（继续学习 + 总进度） |
| Y11 复习指标语义 | 移除 total_items，改为今日到期/已复习/队列位置 |
| G1 行号 | 修正 I-02、theme-store、review-page、header 行号 |

## 附录 D：v2.1 修订记录（响应 v2 复核 + 浏览器实测）

| 复核项 | 修订 |
| --- | --- |
| N1 残留「选 C」 | 全部改为「待二期决策 / 二期决策纳入时」 |
| N2 Bento API 不一致 | `BentoCard` 增加 `tone`；`minH` 闭合为 `stat/third/half/hero/wide`（96/128/160/192/240）且默认跟随 size；示例改为 `render={<Link/>}` |
| N3 M §1.7 冲突 | §9.5 改为「bento 页面引入移动 2 栏 + md+ 6 栏，需在 M §1.7 补 bento 例外」 |
| N4 Phase 0 依赖 | 新增依赖表（0-3→0-4/0-8；0-1→0-8；0-2/0-6/0-7→1-1）；「本章真题传 chapter」移入 0-8（含 `/practice` 路由 search + PracticeStart scope） |
| N5 1024 跨度算错 | §3.2 的 span3/span4 改为 352 / 475 |
| N6 收藏页签阶段 | 统一为 Phase 2-5；D6=B 时隐藏收藏瓦片 |
| N7 证据行号 | 修正 F8（theme-store 12-23）、F9（quiz 226-236）、F10（wrong 52-54,95,111）、F11（session 6-14,29-32 / quiz 71-73） |
| N8 口径 | §5.1 补二期各页新增查询；薄弱章节补 tie-break（mastered↑ → chapter_no↑）；`total_items` 明确不作为 UI 主指标 |
| R4 剩余冲突 | 仪表盘「错题本」改为 `third`（移动整行）；§3.7 明确「奇数末位 span2 优先于 size 默认值」；错题概览收藏瓦片标注例外规则 |
| R8 剩余漏项 | I-20 知识骨架并入 0-4；I-9 并入 0-6；附录 B 补齐 I-9/I-20/I-22/I-23/I-24/I-25/I-26 |
| R10 剩余缺口 | 同 N3 |
| 浏览器实测并入 | 新增 V1/V3–V8/V10–V16/V18 到 §1.3/§1.4/附录 B；滚动锁结论按实测修正为 PASS（建议仍收敛 dialog）；新增「移动 hero 文案不折行」验收 |
