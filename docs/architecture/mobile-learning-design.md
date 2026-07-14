# 知识体系页面 — 移动端学习体验设计方案

> 范围: `web/src/features/knowledge/chapter-tree.tsx` + `web/src/routes/_authenticated/knowledge/index.tsx` + `web/src/routes/_authenticated/route.tsx` + `web/src/components/layout/sidebar.tsx` + `web/src/components/markdown.tsx` + `web/src/components/ui/*` + `web/src/stores/*` + `server/internal/db/db.go` + `server/internal/knowledge/*`。
>
> 本文档只输出设计方案,不修改任何文件。

---

## 0. 现状与目标(快速回顾)

### 0.1 调研已确认的事实

- 知识体系页只有一个 `<ChapterTree>`,放在 `Card > CardHeader("章节目录") + CardContent` 里,根容器 `space-y-6`,外层 `<main>` `p-4 md:p-6`。
- 章节展开是单开手风琴(`useState<number | null>(null)`),展开/折叠由 `+/-` 文本触发,触摸区只有字符大小。
- 知识点列表是 `pl-11` 硬缩进,然后给每个知识点再套一层 `<Card><CardContent>`(Card 嵌 Card,产生双重边框/双重 `p-6`/`p-3`)。
- 内容靠 `<Markdown content={pt.content} skipFirstHeading />` 渲染,Markdown 组件对 Mermaid/代码块/表格已做 `overflow-x-auto` 处理,但没有针对窄屏的字号/列宽优化。
- 路由层 `_authenticated/route.tsx` 用 `flex h-screen`,`<main>` 唯一约束是 `p-4 md:p-6`;Tailwind v4 默认断点 `sm 640 / md 768 / lg 1024 / xl 1280`。
- 后端 `knowledge` 包目前只有 `chapters` / `chapter/:id` / `chapter/:id/points` / `search` 四个端点(全部走 `middleware.JWTAuth`)。`db.go` 有 `users / chapters / knowledge_points / questions / practice_records / wrong_questions / favorites` 七张表,没有学习记录相关表;`knowledge_points` 没有 `view_count / last_viewed_at` 字段。
- 前端 `stores/` 只有 `auth-store` 和 `theme-store`,没有学习记录 store。Dashboard 的 `学习进度` 卡片硬编码 `0%`。
- 侧边栏在移动端是 `w-60` 的抽屉(`fixed inset-y-0 left-0 ... md:static`),靠 `Header` 的汉堡按钮(`md:hidden`)触发。`w-60` = 240px,在 375px 屏上占 64% 视口,正文区被挤到 135px,严重挤压。
- 设计令牌已就绪:浅/深色主题,oklch 配色,8 档圆角、6 档语义色(`primary/success/warning/destructive/info`)、`font-sans: 'Inter','Noto Sans SC', system-ui`。`@theme` 里没有自定义断点,默认就是 sm/md/lg/xl。

### 0.2 目标(四个维度)

1. **响应式布局**:移动端(<768px)成为默认主场景,桌面端保留现有的"章节列表 + 内嵌展开"双栏体验。
2. **章节导航/锚点跳转**:URL 可深链到 `?chapter=3&point=12`;移动端提供"上/下一章""抽屉式目录"等触控优先的跳转。
3. **学习记录系统**:DB + API + 前端 store + 视觉标记四位一体;Dashboard 进度卡接入真实数据;"继续学习"按钮可一键回到上次未完知识点。
4. **交互流程**:从打开页面到读完一个知识点、再回到 Dashboard,所有路径都有明确页面态和触控目标(≥44×44px)。

### 0.3 设计原则(贯穿四节)

- **断点单源**:Tailwind v4 默认断点 `sm 640 / md 768 / lg 1024 / xl 1280`;本文只在 `md` 一处分流(移动/桌面),其它断点仅用于字号、列数微调。
- **触控目标**:所有可点击元素 ≥ 44×44px(Apple HIG / Material 同步推荐)。
- **令牌优先**:间距用 `--spacing-*`、圆角用 `--radius-*`、颜色用语义 token(`bg-card` / `text-muted-foreground` / `border-border` 等),不写任意 px 或 hex。
- **代码增量**:`chapter-tree.tsx` 由"控制展开"重构为"数据呈现";新增 `KnowledgePointReader`(单知识点阅读) + `ChapterOutlineDrawer`(目录抽屉)。`<Card>` 不再嵌套使用:知识点用 `<article>` + 边框/背景,章节行用 `<button>` 行。
- **不动 `<Markdown>` 内部实现**:Markdown 组件的 `components` 表已经够用;只通过外层包裹 + 容器查询/媒体查询做窄屏适配。

---

## 1. 移动端响应式布局重构

### 1.1 总体布局:移动/桌面两种范式,不在中间态做折中

| 维度 | 移动端 `<768px` | 桌面端 `≥768px` |
| --- | --- | --- |
| 入口 | `知识体系` 整页 = "目录" + "阅读"两个互斥视图 | 单页 = 左侧固定目录(可折叠) + 右侧阅读 |
| 导航骨架 | Header(`h-12` 紧) + 章节标题条 + 抽屉式目录 | 现有 `Sidebar w-60` 永久在左侧 + Header(`h-16`) + `<main>` |
| 内容容器 | 整屏 `p-3`(12px);正文字号 `text-base`(16px) | `<main> p-6`;正文字号 `text-sm`(14px) |
| 列表形态 | 章节卡片 **无展开/折叠** — 点击即跳转"阅读视图" | 章节卡片可点开折叠区,内联展开知识点 |
| 知识点呈现 | 整屏阅读,顶部粘性章节标题条,底部粘性"上一/下一" | 章节展开时内联卡片,阅读时也支持弹出"专注模式" |
| 目录入口 | 顶栏"目录"按钮 → 右抽屉(从右滑入) | 不需要;侧边栏已经常驻 |
| 章节跳转 | 章内知识点"上一/下一"(可跨章节);底部 Sheet"目录" | 折叠区直接点知识点;阅读时右侧抽屉可点章标题 |
| 进度条 | 章标题下 inline 进度条 + 数字 `7/12` | 章标题下进度条 + 数字 |
| 副作用 | Header 主题/登出按钮保持(`md:hidden` 仍然有效) | 现状不变 |

> **关键决策**:不再追求"一套布局适配两端"。移动端就是单列"目录 → 阅读"切换式;桌面端是"双栏同时可见"。

### 1.2 移动端两个视图的具体形态

**视图 A — 目录(`/knowledge` 或 `/knowledge?chapter=3&point=12` 但未进入阅读)**

```
┌─────────────────────────────────┐
│ 知识体系    [搜索🔍]  [目录☰]  │ ← Header(高 48)
├─────────────────────────────────┤
│ ▾ 1 绪论            7/8 已学   │ ← 章卡(h≈56, pl-3 数字徽)
│   摘要文字……                   │
│ ▸ 2 嵌入式系统        0/12     │
│ ▸ 3 计算机组成        5/8      │
│ ...                            │
└─────────────────────────────────┘
  浮动 FAB: "继续学习 ▶"          ← 仅在有 last_point 时显示
```

- 章节行:整行 `<button>`,高 56–64px,左侧 `h-10 w-10` 圆形数字徽(用 `--color-primary` bg + `--color-primary-foreground` fg),中间标题 + 摘要(`text-xs text-muted-foreground line-clamp-1`),右侧"已学/总数"小字。已全部学完的章节加 `border-success`。
- 章卡是"路由到阅读视图"的入口,不是"展开/折叠";`+/-` 字符和单开手风琴彻底删除。
- 行间分隔用 1px 边框,不用 `space-y-*`,避免 Card 套 Card。

**视图 B — 阅读(`/knowledge?chapter=3&point=12`)**

```
┌─────────────────────────────────┐
│ [‹]  3. 计算机组成  [目录☰]    │ ← 粘性 top bar(高 48, blur bg)
├─────────────────────────────────┤
│ 第 3 章                         │ ← sticky chapter header(高 36)
│ 3.2 总线系统           7/8 已学 │ ← sticky chapter sub(高 32)
├─────────────────────────────────┤
│ ## 总线系统                     │ ← h2(自 Markdown)
│ 正文段落…                       │
│ 表格(overflow-x-auto)         │
│ ```mermaid                     │
│ ```                            │
├─────────────────────────────────┤
│ 上一知识点: 3.1 CPU  ◀         │ ← sticky bottom bar(高 56,3 按钮)
│        [✓ 标记已学]             │
│ 下一知识点: 3.3 中断  ▶        │
└─────────────────────────────────┘
```

- 顶部"返回"回到视图 A(URL 去掉 `?point=`,保留 `?chapter=`)。
- 章节标题条 sticky 在 Header 之下(`top-12`),随滚动保持可见 — 解决"读了半天忘了第几章"。
- 底部 sticky 工具栏:
  - 左:"上一知识点"(跨章可,到头禁用)。
  - 中:"✓ 标记已学 / 已学 ✓"(切换态;未学 = `bg-primary`,已学 = `bg-success text-success-foreground`)。
  - 右:"下一知识点"(到尾部 = 切到下一章第一点;最后一章最后一点 = 变成"本章结束,回到目录")。
- 三个按钮等宽,各 `min-h-[44px]`,主按钮用 `--color-primary`,次按钮用 `--color-secondary`。

### 1.3 桌面端布局(保持现有范式,只微调)

```
┌──────────┬────────────────────────────────┐
│          │ Header                         │
│ Sidebar  ├────────────────────────────────┤
│ w-60     │ 知识体系     [搜索🔍]          │
│ (现有)   │ ┌──────────────────────────┐  │
│          │ │ ▾ 1 绪论  7/8           │  │
│          │ │   [内嵌展开知识点列表]    │  │
│          │ │ ▸ 2 嵌入式  0/12         │  │
│          │ │ ...                       │  │
│          │ └──────────────────────────┘  │
└──────────┴────────────────────────────────┘
```

- 保留 `Card > CardHeader + CardContent(ChapterTree)`,因为桌面端有"双栏可见"的需求,Card 的边框/阴影能区隔目录区与外层。
- 单开手风琴保留(桌面端单开是合理的);但补上"全部展开 / 全部折叠"两个二级按钮在 CardHeader 右侧。
- 桌面端阅读不需要单独的"阅读视图"路由,默认内联展开;提供"专注模式"按钮(右侧抽屉,内嵌当前展开的知识点)以便老师讲课时看大屏。
- 桌面端"上一/下一"放到 `Card` 底部 footer(阅读模式下),不是 sticky 底部。

### 1.4 章节列表在移动端的"呈现策略"决策

- **采用"列表+整页跳阅读"**,不采用:分页(20 章/页无意义,触屏滚 5 秒就到头)、"全部展开"(20 个章节卡片 100+ 知识点,DOM 爆炸)。
- 列表项是"导航 + 进度聚合"双重角色:既是入口,也直观展示"这章学到哪了"。
- 列表渲染策略:`@tanstack/react-query` 一次拉全量 20 章;`staleTime: 5min`(章节元数据几乎不变);知识点明细 **按需** 拉(进入阅读视图时)。

### 1.5 知识点卡片在移动端的形态(章节展开时,仅桌面端生效)

> 移动端不在列表里展开知识点,自然就没有 Card 嵌套问题;此处方案为**桌面端**保留的知识点卡。

```
┌──────────────────────────────────┐
│ 1  3.1 CPU 结构与指令集    [✓已学]│
├──────────────────────────────────┤
│ <Markdown>                       │
│ ## 子标题                        │
│ 正文…                            │
│ ```mermaid → 图表```             │
│ 表格(overflow-x-auto)           │
└──────────────────────────────────┘
```

- 容器从 `<Card>` 改为 `<article>`(语义化,不是组件);视觉等价 — `rounded-md border border-border bg-card p-4`(无 shadow,避免"双卡"错觉)。
- 移除内层的 `CardContent`:`p-3` 直接挂到 `<article>` 上。Badge 序号 1/2/3 保留。
- 右上角"✓ 已学"小徽标,点击切换学习状态(章节 1.6)。已完成 = `bg-success text-success-foreground`,未完成 = `bg-secondary text-secondary-foreground`。

### 1.6 Markdown 窄屏适配策略

- **不动 `<Markdown>` 内部 `components` 表**;只在外层包一个 `<div className="knowledge-prose">` 容器,在 `index.css` 写容器级响应式规则。
- 关键规则(新增到 `index.css`):
  - `code`(行内):保留现有 `bg-muted px-1.5 py-0.5`,不动。
  - `pre`(代码块):现有 `overflow-x-auto` 已够,加 `text-[13px]` 移动端更紧凑;桌面 `text-sm`。
  - `table`:现有 `overflow-x-auto` 保留;移动端外层容器加 `text-xs`(避免列多时换行把表挤爆)。
  - `h2`:`text-lg`(当前值),移动端没问题;不动。
  - `ul` / `ol`:从 `pl-6` 改为 `pl-5`(节省 4px)。
  - `blockquote`:`px-4` 改为移动端 `px-3`。
  - Mermaid 容器:用 CSS `@container` 或外层媒体查询:`@media (max-width: 767px) { .knowledge-prose svg { max-width: 100%; height: auto !important; } }`,**Mermaid 输出的 SVG 自带 `max-width: 100%` 不会自动生效** — 强制 override 一次即可。
  - 公式 / 行内代码:无新增需求。
- 移动端阅读视图把 Markdown 的 `text-sm`(14px) 升为 `text-base`(16px),`leading-relaxed`(1.625),保证弱光下阅读舒适;桌面端保留 `text-sm`。

### 1.7 断点切换设计

| 断点 | 应用 |
| --- | --- |
| `< 768px` (默认,无前缀) | 移动端:单列,卡片纵向堆叠,Header `h-12`,`<main> p-3` |
| `md: ≥768px` | 桌面端:侧边栏常驻,`<main> p-6`,Header `h-16` |
| `lg: ≥1024px` | 仅字号/列数微调,如 Dashboard 卡片 `lg:grid-cols-4`;不影响知识体系页 |
| `xl: ≥1280px` | 不使用,避免增加心智负担 |

> 不在中间宽度(640–767)做特殊处理。640–767px 沿用"接近移动端"但有 `sm:` 圆角略增的过渡,组件本身自适应。
>
> 断点用 `md:` 前缀在 `chapter-tree.tsx` 顶层一次性分流:`<MobileOutline />` vs `<DesktopOutline />`,避免在每个子元素重复写 `md:hidden / hidden md:block` 造成心智混乱。

### 1.8 消除 pl-11 硬缩进 / Card 嵌套 Card

- 桌面端 `ChapterPoints` 列表:
  - 现状:`<div className="space-y-2 py-2 pl-11">` 包 `<Card><CardContent className="p-3">…</CardContent></Card>`。
  - 改为:`<ol className="ml-12 space-y-3 border-l border-border pl-4">` 配 `<article>` 节点。
  - `ml-12` 替代 `pl-11`:`pl-11` 是 44px(数字徽 `h-8 w-8` 的右边距对齐),`ml-12` 是 48px,统一到 4 倍数。
  - 用左边框(`border-l border-border`)做层级指示线;每条 `article` 加 `relative` + `before:` 一个小圆点 dot,像 VSCode 树。
- 移动端:不渲染此列表(直接跳阅读),代码里直接用 `md:hidden` 包裹 + `hidden md:block` 桌面端显示 — 或更干净:在 `chapter-tree.tsx` 顶层用 `useMediaQuery` / `matchMedia` 一次性决定渲染哪个组件。

---

## 2. 章节导航 / 锚点跳转

### 2.1 URL 设计(支持深链)

- 当前路径:`/knowledge`(无 query)。
- 新增查询参数:
  - `?chapter={id}`:章节 id(数字,可选)。如 `/knowledge?chapter=3` = 跳到第 3 章目录视图(移动端:跳阅读,锁定章;桌面端:自动展开第 3 章,折叠其他)。
  - `?point={id}`:知识点 id(数字,可选)。如 `/knowledge?chapter=3&point=12` = 移动端跳阅读视图直接打开知识点 12;桌面端展开第 3 章并高亮知识点 12。
  - `?q={keyword}`:搜索关键词(可选)。打开时填入搜索框并触发结果。
  - 互斥规则:`point` 必须有 `chapter`;`point` 缺 `chapter` 时后端 400 或前端回退到章目录。
- 实现位置:`useSearch()` from `@tanstack/react-router`(已是 v1 API)。`/knowledge/index.tsx` 用 `validateSearch` 定义 schema(zod 校验)。
- 深链可达性:用户从其它页面(如 Dashboard 的"继续学习")点过来,URL 即时反映;刷新页面也保留位置 — 解决"读到一半刷新就丢"的痛点。

### 2.2 移动端导航形态

| 入口 | 形态 | 触发 |
| --- | --- | --- |
| 顶栏"目录"按钮 | **右抽屉**(从右滑入,宽 86vw ≤ 320px) | 任意视图,常驻按钮 |
| 顶栏"搜索"按钮 | **搜索 Sheet**(底部上滑,占屏幕下方 60%) | 任意视图 |
| 章标题"上一/下一" | 底部 sticky 工具栏 | 阅读视图 |
| 知识点"目录"小图标(右上角) | 同上 | 阅读视图内 |
| 长按章卡 0.5s | 弹"标记已学 / 重置" | 列表视图(辅助) |

- **顶部下拉不采用**:多级目录需要"章 → 章内子目录"两级,下拉只能平铺,层级感丢失。
- **侧边滑出** (类似微信文章目录):与"右抽屉"等价,选其一即可。**右抽屉**与现有左侧导航抽屉方向相反(左 = 主导航;右 = 知识体系内部),空间利用合理。
- **底部 Tab**(知识体系 / 练习 / 错题 / 我的):是产品级导航,与"知识体系内部"职责冲突;不放在本节范围,留待后续产品规划。

### 2.3 展开/折叠交互在移动端的处理

- **完全删除单开/多开手风琴的"展开"语义**;改为"点击章节 = 跳阅读视图"。理由:移动端单列页面,展开 = 上下滚,体感差;跳整页 = 状态可逆(浏览器返回),URL 友好。
- 桌面端保留手风琴(多开或单开均可;本方案推荐多开,因为侧边栏已经把 5 大模块分清楚了,知识体系页内部也应该让用户同时扫几章)。
- 移动端如保留"展开"作为快捷预览(不跳页),需要谨慎:`onClick` 改 `onAuxClick`(桌面右键) / `onLongPress`(移动长按)— 默认 `onClick` 仍跳阅读,长按是高级快捷方式。**不优先实现**,先做好"点跳阅读"再考虑"长按预览"。

### 2.4 搜索功能集成

- 后端已有 `GET /knowledge/search?q=...` 端点(`handler.go:77`),返回 `KnowledgePoint` 列表(LIKE 模糊匹配 title + content)。
- 前端集成方式:
  - **Header 右侧"🔍"按钮** → 打开搜索 Sheet(底部上滑,占下方 60%):包含 `<Input inputSize="lg">` + 防抖 250ms + `useQuery(['search', q])`。
  - 搜索结果列表:`<button>` 卡片,显示"章号 - 知识点名"+ 高亮命中片段。
  - 点击结果:`navigate({ to: '/knowledge', search: { chapter: r.chapter_id, point: r.id } })`。
  - 空结果:`<EmptyState>` 文案"没找到相关知识点,试试别的关键词"。
  - 搜索状态可独立于阅读视图(不破坏阅读进度),关闭后 Sheet 滑下,原页面保持。
- 桌面端:搜索保留在 `CardHeader` 右侧 input(`w-64`),回车即触发。
- 性能:防抖 250ms;`staleTime: 30s`(搜索结果短期可缓存);空 query 不发请求。

### 2.5 章节间的快速跳转

- **章内"上一/下一"按钮**:从当前知识点的 `sort_order` 计算同章上下;跨章时 `chapter - 1` 章的最后一点 / `chapter + 1` 章的第一点。`disabled` 状态用 `--color-muted` 灰,可达 44px 高度。
- **章内目录**(同章内跳点):阅读视图顶部 sticky 第二行(`text-xs text-muted-foreground`)显示章进度 `7/8`,点击 → 弹"本章知识点"底部 Sheet,纵向 8 个按钮。
- **跨章目录**:阅读视图顶部第一行的"章号 + 章名"点击 → 弹"全部章 + 全部知识点"底部 Sheet(树形分组)。Sheet 高 80vh,可滚动。
- **键盘 / 焦点态**:桌面端用 `Tab` 在 Sheet 内循环 + `Esc` 关闭;移动端依靠原生 Sheet 行为。

---

## 3. 学习记录系统

### 3.1 后端数据库 Schema 设计

> 全部追加到 `server/internal/db/db.go` 的 `schemaSQL` 字符串内,与现有表共存;遵循现有命名习惯(snake_case + `idx_` 前缀索引)。

#### 3.1.1 `learning_records`(知识点级别的"已学"标记)

```sql
CREATE TABLE IF NOT EXISTS learning_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    point_id INTEGER NOT NULL,           -- knowledge_points.id
    chapter_id INTEGER NOT NULL,         -- 冗余,方便按章聚合;删章时 CASCADE
    first_viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER NOT NULL DEFAULT 1,
    mastered INTEGER NOT NULL DEFAULT 0, -- 1 = 用户主动标记"已掌握";0 = 仅访问
    mastered_at DATETIME,
    UNIQUE (user_id, point_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lr_user ON learning_records(user_id);
CREATE INDEX IF NOT EXISTS idx_lr_user_chapter ON learning_records(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_lr_user_mastered ON learning_records(user_id, mastered);
```

- 设计要点:
  - `UNIQUE(user_id, point_id)`:同一用户对同一知识点只有一行;切换"已掌握"状态时 UPDATE。
  - `mastered` 字段独立于"访问过":用户首次打开知识点 → INSERT(默认 mastered=0,view_count=1);用户点"标记已学" → UPDATE mastered=1,mastered_at=now()。"我看过但没掌握"和"我已掌握"语义不同,Dashboard 进度只算 mastered=1 的覆盖率。
  - `view_count` 累计重复打开次数,用于"最近学习"排序(可选,后续推荐用)。
  - `chapter_id` 冗余但显著加速章级聚合(`SELECT chapter_id, COUNT(*) FROM learning_records WHERE user_id=? AND mastered=1 GROUP BY chapter_id`),避免每次 JOIN。

#### 3.1.2 `study_sessions`(学习会话,可选,V2)

```sql
CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    point_id INTEGER NOT NULL,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    duration_seconds INTEGER,             -- 用户停留秒数(可前端汇报)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ss_user ON study_sessions(user_id);
```

- **可选**,本方案先打桩不实现 UI;若 PRD 要求"今日学习时长"再做。前端可发 `POST /api/v1/learning/sessions` 上报,后端定时清理超过 30 天的 session。

#### 3.1.3 `last_progress`(继续学习入口,V1 必做)

```sql
CREATE TABLE IF NOT EXISTS last_progress (
    user_id INTEGER PRIMARY KEY,
    chapter_id INTEGER NOT NULL,
    point_id INTEGER NOT NULL,           -- 最近一次"正在读"的知识点
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    FOREIGN KEY (point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE
);
```

- 一对一,存"用户最后停留在哪"。Dashboard "继续学习" 按钮读这张表;URL `?chapter=&point=` 跳转。
- 不需要 `idx_*`:主键就是 user_id,O(1) 查。

#### 3.1.4 现有表 ALTER 建议(可选,非阻塞)

- `knowledge_points` 加 `view_count INTEGER NOT NULL DEFAULT 0`(全站总访问次数,运营用) + `last_viewed_at DATETIME`(最近被读)。本方案不强制 — 现有 `learning_records` 已经有 `view_count`(用户级),不影响功能。

### 3.2 后端 API 设计

> 全部加到 `server/internal/learning/handler.go` 新包,路由 `r.Group("/learning")` 走 `middleware.JWTAuth()`,与 `practice` 同构。
> 模型设计放在 `server/internal/learning/model.go`,数据访问在 `repository.go`,与现有 `knowledge` 包风格一致。
> 注:本方案不拆包,统一在 `internal/learning/`,避免与 `internal/knowledge/` 形成"知识元数据 vs 用户学习状态"两个边界清晰的模块。

#### 3.2.1 路由列表

| Method | Path | 说明 |
| --- | --- | --- |
| POST | `/api/v1/learning/points/:point_id/view` | 上报"打开了一次知识点"(用于更新 `view_count` + `last_viewed_at` + 写 `last_progress`)。幂等:同 user+point 60s 内重复调用只更新 `last_viewed_at`,不增 `view_count`(防抖在服务端用 `strftime('%s','now') - strftime('%s', last_viewed_at)`)。 |
| POST | `/api/v1/learning/points/:point_id/master` | 切换"已掌握"。body: `{ mastered: true \| false }`。true → UPDATE mastered=1,mastered_at=now;false → UPDATE mastered=0,mastered_at=NULL。 |
| GET | `/api/v1/learning/progress` | 当前用户的全量学习进度(用于 Dashboard 卡片 + 知识体系页章进度条)。返回: `{ total_points, mastered_points, coverage, per_chapter: [{ chapter_id, total, mastered }], last_progress: { chapter_id, point_id, title } \| null }`。 |
| GET | `/api/v1/learning/points/:point_id` | 单知识点的学习状态(已掌握?访问次数?首次访问时间?),供阅读视图顶部"已学"按钮渲染。返回 `LearningPointStatus`。 |

#### 3.2.2 关键查询 SQL 草案

- 进度聚合(单查询完成 Dashboard 全量数据):
  ```sql
  SELECT
    (SELECT COUNT(*) FROM knowledge_points) AS total_points,
    (SELECT COUNT(*) FROM learning_records WHERE user_id = ? AND mastered = 1) AS mastered_points,
    (SELECT chapter_id, COUNT(*) AS total
       FROM knowledge_points GROUP BY chapter_id) -- 通过 Go 端代码组合
  ```
  实际推荐 Go 端用 2 次查询 + map 合并:先取 `total_points` 和 `per_chapter.total`,再 `SELECT chapter_id, COUNT(*) AS mastered FROM learning_records WHERE user_id=? AND mastered=1 GROUP BY chapter_id`。避免一次返回 20+ 行 JOIN 的复杂 SQL。
- 章级进度(给 `ChapterTree` 用):
  ```sql
  SELECT chapter_id, COUNT(*) AS mastered_count
  FROM learning_records
  WHERE user_id = ? AND mastered = 1 AND chapter_id IN (?, ?, ...)  -- 当前可见章
  GROUP BY chapter_id;
  ```
- 一次 `ListChapters` + 一次 `BatchGetChapterProgress(chapterIds)` 即可让章卡显示 `7/8`。

#### 3.2.3 错误码

- 401:token 无效(已有,沿用)
- 404:point_id 不存在
- 400:`mastered` 字段缺/非法
- 200 但 `last_progress: null`:用户从未读过任何知识点(Dashboard 显示"开始学习"CTA 而非"继续学习")

#### 3.2.4 与现有端点的协同

- 现有 `GET /knowledge/chapters/:id/points` **不**返回学习状态;阅读视图进入时**额外**调 `GET /learning/points/:id` 获取 mastery 状态(20 章 × 平均 5 个知识点 = 100 次调用,不该在章列表预加载)。
- 现有 `GET /knowledge/chapters` **不**返回章进度;在客户端 `useQuery` 并行调用 `GET /learning/progress` 拿到 `per_chapter[]`,再与章列表 zip 合并。
- 现有 `/knowledge/search` 不返回 mastery,搜索结果页每条直接展示命中,点击进入阅读时再获取。

### 3.3 前端 Store 设计

#### 3.3.1 新增 `web/src/stores/learning-store.ts`(会话内缓存)

```ts
// 草图,不是最终代码
interface LearningState {
  // Map:point_id -> mastery 状态,会话内 O(1) 读取
  status: Map<number, { mastered: boolean; viewCount: number; lastViewedAt: string }>;
  // 章级聚合,会话内缓存
  perChapter: Map<number, { total: number; mastered: number }>;
  // 继续学习入口
  lastProgress: { chapterId: number; pointId: number; title: string } | null;
  // 整体进度
  overall: { totalPoints: number; masteredPoints: number; coverage: number } | null;

  // 同步方法(由 queryClient 的 onSuccess 调)
  setOverall: (data: ProgressResponse) => void;
  setPointStatus: (pointId: number, status: PointStatusResponse) => void;
  setLastProgress: (lp: LastProgress | null) => void;

  // 乐观更新方法
  optimisticToggleMastered: (pointId: number, chapterId: number) => void;
  optimisticRecordView: (pointId: number, chapterId: number) => void;
}
```

- **不持久化到 localStorage**:学习状态是后端权威源,前端持久化会导致"多设备/多浏览器不一致";只缓存会话内。
- 包含乐观更新:用户点"标记已学" → store 立即更新 → 触发后端调用 → 失败回滚。
- 不持有 token / 路由状态 — 与 `auth-store` / `theme-store` 保持同构。

#### 3.3.2 TanStack Query 数据层(用现有 `@tanstack/react-query`)

- `useOverallProgress()`:`queryKey: ['learning', 'progress']`,挂在 `KnowledgePage` 顶层 + `DashboardPage` 顶层(用同一 cache,避免重复请求)。
- `useChapterProgress(chapterIds: number[])`:`queryKey: ['learning', 'progress', 'chapters', chapterIds]`,只有当 chapterIds 不空才启用;在章列表组件里调用。
- `usePointStatus(pointId: number | null)`:`enabled: !!pointId`,阅读视图调用。
- `useRecordView()`:`useMutation`;onSuccess → `queryClient.setQueryData(['learning', 'point', pointId], ...)` + `invalidateQueries(['learning', 'progress'])`。
- `useToggleMastered()`:`useMutation`;onSuccess 同上。
- 不引入新依赖,延续现有模式。

#### 3.3.3 与 Dashboard 的连接

- `DashboardPage` 的 `学习进度` 卡片:
  - 现有:`<div className="text-2xl font-bold">0%</div><p>知识点覆盖</p>`(硬编码)。
  - 新:`useOverallProgress()` → `<div>{coverage}%</div><p>{masteredPoints}/{totalPoints} 知识点已掌握</p>`,带点击行为 → `navigate({ to: '/knowledge' })`。
  - **"继续学习"按钮**(在 Dashboard 卡片内或考试信息卡片上方):从 `lastProgress` 读 → 渲染 `<Button onClick={() => navigate({ to: '/knowledge', search: { chapter, point } })}>继续学习: {title} ▶</Button>`;`lastProgress` 为 null 时换成"开始学习" → 跳 `/knowledge`。
  - **"今日已学"**:可选,从 `learning_records` WHERE `last_viewed_at >= today` 聚合(后端 `GET /learning/today`,或前端用 `learning_records` 数据计算)。本方案 V1 不强求。

### 3.4 "已学 / 未学" 的视觉标记

| 位置 | 视觉 |
| --- | --- |
| 移动端章卡(列表) | 右上角"7/8 已学",已学完 → 章卡加 `border-success`,`mastered === total` 时整张卡背景 `bg-success/5` |
| 桌面端章卡(列表) | 同上,但进度条 + 数字并排,`h-1.5` 进度条在章节标题下 |
| 知识点卡(桌面端展开) | 标题右侧小徽标 `✓ 已学`(`bg-success text-success-foreground rounded-full px-2`)。未学无徽标 |
| 阅读视图底部"标记已学"按钮 | 未学 = `bg-primary text-primary-foreground`;已学 = `bg-success text-success-foreground`,按钮文案"已学 ✓" |
| 阅读视图顶部 sticky 章副标题 | `7/8 已学`(`text-xs text-muted-foreground`);章学完时变 `success` 文字 "本章已学完 🎉" — 不滥用 emoji,只在这一个 milestone 出现 |
| Dashboard 进度卡 | 大数字 + 进度条;`coverage === 100%` 时数字变 `text-success` + 显示"全部掌握" |

**禁用 emoji 滥用**:只有"全部学完"一处用 🎉。其它完成态用纯色变化传达。

### 3.5 学习进度展示层级

- **章级进度条**(章卡 / 章标题副标题):粗粒度,20 张卡各一条,满足"扫一眼看整体"。
- **知识点级勾选**(桌面端展开 + 阅读视图底部按钮):细粒度,满足"逐个标记"。
- **Dashboard 整体覆盖率**(单数字 + 进度条):满足"总览"。
- 三者数据来自同一张 `learning_records` 表,只是不同聚合;不存"用户看到了第几页"这种 UI 状态到数据库。

### 3.6 "继续学习"功能设计

- 数据:`last_progress` 表(单行) → 读 `chapter_id / point_id / updated_at`。
- 前端:
  - `useLastProgress()` hook(`queryKey: ['learning', 'last-progress']`)。
  - Dashboard 渲染:`<Button onClick={() => navigate({ to: '/knowledge', search: { chapter, point } })}>继续学习:{title} ▶</Button>`;`title` 来自 join `knowledge_points.title`。
  - 移动端知识体系页右下角 **FAB**(Floating Action Button):仅 `lastProgress` 非空且当前未在阅读视图时显示,`bottom-4 right-4`,`bg-primary text-primary-foreground shadow-lg rounded-full px-4 h-12`,点击同上。
  - 触达逻辑:每次用户成功 `POST /learning/points/:id/view` → 后端 UPSERT `last_progress`。
  - 不在阅读视图内显示 FAB(避免冗余,底部 sticky 工具栏已经有"上一/下一"功能)。

### 3.7 Dashboard 卡片接入

| 卡片 | 现状 | 新 |
| --- | --- | --- |
| 知识体系 | `<div>20</div><p>章节</p>`(硬编码) | 同上,数字可硬编码(章节数固定 20),但**进度副标题**改为 `{masteredPoints}/{totalPoints} 知识点已掌握` |
| 题库 | `<div>0</div><p>题目</p>`(硬编码) | 改用 `useQuery(['practice', 'stats'])` 已有 `total_questions` 字段(只读,不影响练习逻辑) |
| 学习进度 | `<div>0%</div><p>知识点覆盖</p>`(硬编码) | **重点改造**:`useOverallProgress` 注入真实 `coverage` + `masteredPoints` |
| 正确率 | `<div>--</div><p>练习正确率</p>`(硬编码) | 用 `usePracticeStats` 已有 `accuracy`(空数据显示"--",避免 0% 误导) |
| 考试信息卡 | 静态行 | **新增"继续学习"按钮**置于 CardHeader,与硬编码"开始学习"链接并排;`lastProgress` 为 null 时只显示"开始学习" |
| **新增** | — | "最近学习"卡(可选,V2):列出最近 5 条 `learning_records` 的知识点,点击跳转;V1 不做 |

### 3.8 章节列表聚合的批量优化

- 移动端目录视图一次拉 20 章,需要 20 × mastery 查询;改用**单次批量**:`GET /learning/progress` 返回 `per_chapter[]` 一次喂给所有章卡。
- 桌面端章节展开时,展开中的章节用 `usePointStatus(pointId)` 按需取;不展开的章不取,省流量。
- 阅读视图用 `usePointStatus(currentPointId)`,只在 `pointId` 切换时刷新;`view` 上报是 fire-and-forget mutation,不阻塞 UI。

---

## 4. 交互原型描述(纯文字)

> 时序记号:T0 进入页面,T1 章节列表加载完,T2 用户点击章卡,…以此类推。**只描述视觉与交互**,不画图。

### 4.1 流程 A — 从打开知识体系页到读完一个知识点(移动端,主流程)

- **T0**:用户从底部导航(Dashboard 的"知识体系"卡 / Tab)点过来。URL:`/knowledge`(无 query)。
- **T0+50ms**:页面进入。Header 立即可见:`<` 返回 / "知识体系" / 🔍 搜索 / ☰ 目录(右侧抽屉入口)。`p-3` 内边距。Header 下方是页面标题区,无额外标题(章节目录已由 Header 表达)。骨架:20 个章卡用 `Skeleton` 占位(灰色长条 `h-14`)。
- **T1**:`useChapters` 加载完成 + `useOverallProgress` 加载完成。20 张章卡按 `chapter_no` 升序渲染。
  - 每张章卡:`<button>` 整行,高 64px,左侧 `h-10 w-10` 圆形数字徽(1–20),中间标题(`text-base font-medium`) + 摘要(`text-xs text-muted-foreground line-clamp-1`),右侧 `text-xs text-muted-foreground` 显示"7/8 已学"(只读)。行间无间距,只 1px `border-b border-border` 分隔。
  - 进度条:不在章卡上(避免 64px 高度塞爆),只显示数字。
  - 已学完章卡:`border-l-4 border-l-success`(左侧 4px 绿条),背景 `bg-success/5`。
- **T2**:用户点击"3. 计算机组成"章卡。`navigate({ to: '/knowledge', search: { chapter: 3 } })`。`chapter-tree.tsx` 路由层切到阅读视图。
- **T2+100ms**:URL 变为 `/knowledge?chapter=3`。
  - 顶部 sticky bar 出现(高 48px,`bg-card/80 backdrop-blur`,`border-b`):左 `<` 返回(回 T1 状态);中间"3. 计算机组成"(`text-sm font-medium`);右 🔍 + ☰(与 Header 同源按钮)。
  - 紧接顶部 sticky 第二行(高 36px,`bg-background border-b`):左侧"第 3 章"(`text-xs text-muted-foreground`);右侧"5/8 已学"(`text-xs`,完成时变 `text-success`)。
  - 主区:整屏阅读。第一个知识点的 Markdown 内容垂直铺开;字号 `text-base`(16px),`leading-relaxed`。章节内 H2/H3 按 `markdown.tsx` 默认样式。
  - 底部 sticky bar 出现(高 56px,`bg-card border-t`):三等分按钮。"◀ 上一知识点"(3.1 CPU 结构) / "✓ 标记已学"(蓝色 primary) / "下一知识点 ▶"(3.3 中断)。`last_progress` 写入后台:`POST /learning/points/12/view`。
  - 阅读视图打开时 `usePointStatus(12)` 拿到 `mastered=false`,底部按钮显示"✓ 标记已学"。
- **T3**:用户滚动到底,看完正文,看到表格 / Mermaid 图表(均 `overflow-x-auto`,Mermaid 强制 `max-width: 100%`)。
- **T4**:用户点"✓ 标记已学"。
  - 前端立即乐观更新:store 把 point_id=12 的 `mastered` 设为 true,按钮立刻变绿("已学 ✓")。
  - 触发 `POST /learning/points/12/master { mastered: true }`。
  - onSuccess:`invalidateQueries(['learning', 'progress'])`,章卡上的"5/8 已学" 异步刷新为"6/8 已学"。
  - onError:回滚 store,按钮恢复"✓ 标记已学",弹 toast(用 `<EmptyState>` 同色调)。
- **T5**:用户点"下一知识点 ▶"。`navigate({ to: '/knowledge', search: { chapter: 3, point: 13 } })`。主区滚动到顶,内容替换为 3.3 中断。底部按钮的"上一"变为"3.2 总线系统"(已掌握,显示绿色),"下一"变为"3.4 存储器"(未掌握)。
- **T6**:用户连读完 3.4–3.8,在 3.8 点"下一"时,跨章:3.8 之后无,改为跳到第 4 章第 1 点(`chapter=4, point=??`),按钮文案"下一知识点:4.1 …";到第 20 章最后一点时,按钮变为"本章结束,回到目录 ▶",点击回到 T1 状态(URL 去掉 query)。
- **T7**:用户按 `<` 返回(或浏览器返回)。URL 回 `/knowledge`,章卡列表保持上次的滚动位置(`scrollRestoration: 'auto'`,由 TanStack Router 默认行为保证)。

### 4.2 流程 B — 章节跳转(移动端,从阅读视图跨章跳)

- **T0**:用户在阅读视图 `/knowledge?chapter=3&point=12`,在底部 sticky 第二行(`第 3 章 5/8`)点击"第 3 章"文字。
- **T0+100ms**:底部 Sheet 滑上,高 80vh。
  - Sheet 顶部把手 + 标题"章节目录"。
  - 主体:树形列表,20 个章,每章下列出 5–12 个知识点(已折叠)。每项:`<button>` 高 48px,左侧 4px 颜色条(未学 = 透明;已学 = `bg-success`;当前正在读 = `bg-primary`)。
  - 当前章默认展开,其它章折叠(`▼/▶` 图标)。
- **T1**:用户点击"7. 信息系统架构设计"标题,Sheet 内该章展开,看到 8 个知识点。
- **T2**:用户点击"7.3 SOA 架构"。Sheet 滑下,`navigate({ to: '/knowledge', search: { chapter: 7, point: 35 } })`,阅读视图内容切到 7.3。
- **T3**:如果用户点击章号 1 的标题(整章)而非知识点,Sheet 跳到第 1 章第 1 点 `chapter=1&point=1`,URL 同步。
- **T4**:Sheet 内"返回"按钮(顶部右上 ✕)或下滑手势关闭 Sheet,回到原阅读视图(URL 不变)。

### 4.3 流程 C — 章节跳转(桌面端,折叠区跳转)

- **T0**:用户在 `/knowledge` 桌面端页面,左侧 240px 侧边栏常驻,右侧整张 `Card > CardHeader("章节目录") + CardContent(ChapterTree)`。
- **T1**:页面加载,20 张章卡渲染。每张章卡同移动端形态(高 64px),可折叠。
- **T2**:用户点"3. 计算机组成"展开。章卡内嵌 8 个 `<article>` 节点(无 Card 嵌套):左侧 4px 进度线 + 序号 Badge + 标题 + Markdown 内容(字号 `text-sm`)。
- **T3**:用户展开第 7 章(多开)。`expandedIds` 改为 `Set([3, 7])`,两张章卡同时展开。
- **T4**:用户在第 3 章任意知识点右侧看到"✓ 已学"小徽标(已掌握)或空(未掌握)。点击徽标 → 同 4.1.T4 流程,但无"上一/下一"工具栏(桌面端)。
- **T5**:用户点 CardHeader 右侧"全部展开"按钮 → `expandedIds = Set([1..20])`,所有章卡展开。"全部折叠"按钮清空 `expandedIds`。
- **T6**:用户点击 CardHeader 右侧"搜索 🔍"按钮(桌面端,Header 也有,但 CardHeader 的更明显):弹出搜索 Sheet(桌面端 = 中央 Dialog 而非底部),`max-w-2xl`,内含 `<Input inputSize="lg">` + 结果列表。结果项点击 → 跳到对应 `?chapter=&point=` 并自动滚动到该知识点(`scrollIntoView({ block: 'start', behavior: 'smooth' })`),目标 `<article>` 加 2s 黄色高亮(`bg-warning/20` 动画)。

### 4.4 流程 D — 学习记录标记(桌面端)

- **T0**:用户在阅读第 12 个知识点,底部 footer(桌面端,非 sticky 而是 `CardFooter`)显示"上一知识点 / ✓ 标记已学 / 下一知识点"三按钮。
- **T1**:用户点"✓ 标记已学" → 同样乐观更新 + 后端调用 + 进度刷新。
- **T2**:用户在 `<article>` 标题右侧看到一个圆形 `✓` 小图标(`h-6 w-6 rounded-full bg-success`)。点击取消掌握 → UPDATE mastered=0,图标变灰,底部按钮恢复"✓ 标记已学"。

### 4.5 流程 E — 搜索流程(移动端 + 桌面端通用)

- **T0**:用户点顶栏 🔍。
  - 移动端:底部 Sheet 滑上,占下方 60%,顶部 `<Input inputSize="lg" autoFocus placeholder="搜索知识点…">`。
  - 桌面端:中央 Dialog,`<Input inputSize="lg" autoFocus>`。
- **T1**:用户输入"分布式",防抖 250ms 后 `useQuery(['search', '分布式'])` 触发。
  - 加载时:结果区显示 3 个 Skeleton 行。
  - 结果:每个 `<button>` 卡片,显示"3.1 分布式架构" + 高亮命中片段(`<mark>` 包关键词,`bg-warning/40`)。
- **T2**:用户点"3.1 分布式架构" → `navigate({ to: '/knowledge', search: { chapter: 3, point: 7, q: '分布式' } })`。
  - 移动端:Sheet 关闭,阅读视图打开 3.1,Markdown 滚动到首个匹配段(`<mark>` 元素 `scrollIntoView`)。
  - 桌面端:Dialog 关闭,知识体系页 `?chapter=3&point=7` 展开第 3 章 + 滚动 + 黄色高亮。
- **T3**:搜索后章卡"3. 计算机组成"的"5/8 已学"无变化(搜索不影响学习状态)。

### 4.6 流程 F — Dashboard 接入真实数据 + 继续学习

- **T0**:用户登录后进 Dashboard `/`,看到 4 张统计卡 + 考试信息卡。
- **T1**:`useOverallProgress` + `usePracticeStats` + `useLastProgress` 并行请求。
- **T2**:
  - 知识体系卡:显示"20 章节"硬编码,副标题"67/108 知识点已掌握"(假设 67 个已掌握,数字从真实数据来)。
  - 题库卡:显示题库总题数(`practice_stats.total_questions`,硬编码 0 → 真实 N);副标题"N 道真题"。
  - 学习进度卡:大数字"62%"(coverage × 100,向下取整),下方进度条 `h-2 bg-muted` 配 `bg-primary` 填充;副标题"67/108 知识点已掌握"。点击卡 → `navigate({ to: '/knowledge' })`。
  - 正确率卡:有练习数据时显示 X%(`practice_stats.accuracy`),无数据时显示"--"(`stats.total_questions === 0 ? '--' : ...`)。
  - 考试信息卡 Header:右侧追加"继续学习:3.2 总线系统 ▶"按钮(`lastProgress` 非空时);为空时只显示原有"开始学习"按钮。
- **T3**:用户点"继续学习" → `navigate({ to: '/knowledge', search: { chapter: 3, point: 12 } })`,直接进阅读视图 3.2。
- **T4**:`POST /learning/points/12/view` 触发,`last_progress` 表 UPSERT(同一 user+point 已存在 → UPDATE updated_at;不存在 → INSERT)。Dashboard 在下次进入时刷新。

### 4.7 流程 G — 移动端目录抽屉(章节导航的二级入口)

- **T0**:用户在任意视图,点顶栏 ☰。
- **T0+200ms**:右抽屉从右滑入,宽 86vw(但 `max-w-[320px]`),背景蒙层 `bg-foreground/40 backdrop-blur-sm` 渐入。抽屉内:
  - 顶部把手 + 标题"知识体系",右上 ✕ 关闭。
  - 紧接 搜索 input(紧凑模式,`h-9`)。
  - 主体:20 个章 + 章内知识点(树形,可单层折叠,默认全部展开)。每项高度 44px,左侧 4px 颜色条(已学绿 / 当前蓝 / 未学透明)。当前章/知识点高亮(`bg-primary/10`)。
- **T1**:用户点抽屉外蒙层 → 关闭;用户点抽屉内章标题 → 跳到 `?chapter=&point=章第1点` 并关闭抽屉;用户点抽屉内知识点 → 跳到 `?chapter=&point=` 并关闭抽屉。
- **T2**:抽屉滑出用 `transform translate-x-full → 0`,200ms `ease-out`;不阻塞主页面 scroll。

### 4.8 流程 H — 空状态、加载、错误(用户体验兜底)

- **空章节**:`GET /knowledge/chapters` 返回 `[]` → `<EmptyState icon={...} title="还没有章节" description="运行 seed 脚本导入数据" />`(全屏居中)。
- **空已学**:`useOverallProgress.coverage === 0` → 知识体系页章卡全显示"0/N 未学",无成功状态;Dashboard 学习进度卡副标题改为"开始学习你的第一个知识点" + "开始学习" CTA。
- **加载中**:`isLoading` 时,章卡 20 个 Skeleton 行(灰色长条 `h-14 rounded-md`);阅读视图 1 个大块 Skeleton `h-96`。
- **网络错误**:`error` 时,章卡位置显示 `<EmptyState title="加载失败" description="后端没响应,检查服务" />`;不阻断 UI 其他部分。
- **未登录**:`useAuthStore` 失效 → 走 `_authenticated/route.tsx` 的 `beforeLoad` 跳 `/login`,与现状一致。

---

## 5. 文件/模块落地清单(供后续实现参考,非本任务交付)

> **本节仅做指针,不在本次实现范围内。** 后续按以下顺序实现,每个文件改动时配套更新测试。

| 层 | 文件 | 动作 |
| --- | --- | --- |
| 后端 schema | `server/internal/db/db.go` | 追加 3 张表 DDL + 索引 |
| 后端模型 | `server/internal/learning/{model.go,repository.go,handler.go,service.go}` | 新建包;复制 `practice` 风格 |
| 后端路由 | `server/internal/router/router.go` | 注入 `learningGroup` 同 `practiceGroup` |
| 前端 store | `web/src/stores/learning-store.ts` | 新建,会话内缓存 |
| 前端 hooks | `web/src/features/learning/queries.ts` | `useOverallProgress` / `usePointStatus` / `useRecordView` / `useToggleMastered` / `useLastProgress` |
| 前端组件 | `web/src/features/knowledge/mobile-outline.tsx` | 新建(目录视图,移动端) |
| 前端组件 | `web/src/features/knowledge/desktop-outline.tsx` | 新建(展开式,桌面端) |
| 前端组件 | `web/src/features/knowledge/point-reader.tsx` | 新建(阅读视图,共享) |
| 前端组件 | `web/src/features/knowledge/chapter-drawer.tsx` | 新建(右抽屉,移动端) |
| 前端组件 | `web/src/features/knowledge/search-sheet.tsx` | 新建(搜索 Sheet) |
| 前端组件 | `web/src/features/knowledge/continue-button.tsx` | 新建(FAB / Dashboard 按钮) |
| 路由改造 | `web/src/routes/_authenticated/knowledge/index.tsx` | 拆为分平台组件,`validateSearch` 定义 schema |
| 路由改造 | `web/src/routes/_authenticated/route.tsx` | 仅 `<main>` `p-3 md:p-6`,无其它改动 |
| Dashboard | `web/src/routes/_authenticated/index.tsx` | 注入真实数据 + 继续学习按钮 |
| 样式 | `web/src/styles/index.css` | 追加 `.knowledge-prose` 容器级窄屏规则 |

---

## 6. 设计决策的取舍记录

- **不拆"知识"包 vs "学习"包**:讨论过 `internal/knowledge` vs `internal/learning`。`knowledge` 存元数据(章节、知识点),`learning` 存用户状态(记录、会话、最近进度)。两者职责清晰,故选拆包。
- **不引入 IndexedDB**:学习状态全部走服务端,前端只做会话内缓存。多设备同步是优先级更高的需求,比离线缓存更迫切。
- **不引入 Service Worker / PWA**:本方案 V1 不做,留待后续 PRD。
- **不引入"学习时长"统计**:`study_sessions` 表留 schema 不实现 UI,避免 V1 范围膨胀。
- **不引入章节"子目录"**:当前 `chapters` 表有 `parent_id` 字段但未使用;20 章已是平铺,不需要两层目录。后续如果支持"专题聚合"再迭代。
- **Card 嵌套 Card 解决 = 不嵌套**:不在 Card 里嵌 Card,直接用 `<article>` + Tailwind 类。比"修复 Card 嵌套样式"更彻底,也修复了语义化问题。
- **单开/多开手风琴取舍**:桌面端多开(便于老师对照),移动端直接跳阅读(触控优先)。
- **不用 emoji 当核心 UI 元素**:只有"全部学完"一处用 🎉,其它完成态用色彩传达。AI slop 反模式。
- **FAB 不用 emoji 字符**:用"▶"或 inline SVG,保持视觉统一。

---

## 7. 验收 / 度量

- **技术验收**(后续实现阶段):
  - `vp lint --type-aware` + `bunx tsc --noEmit`(前后端)无错。
  - `go vet ./...` 无错。
  - 现有 e2e 用例(若有)不回归。
- **产品验收**(可通过埋点 / 灰度):
  - 移动端章节跳转平均操作步数从"展开 → 折叠 → 点击下一章" 3 步 → "点击下一章" 1 步。
  - Dashboard "继续学习"按钮点击率 ≥ 30%(用户停留率提升)。
  - 知识点"标记已学"日活操作次数(衡量"显式学习状态"是否被用起来)。
- **设计验收**:
  - 375px 屏宽(常见 iPhone SE)无横向滚动(主内容 + 表格 `overflow-x-auto` 内部例外)。
  - 所有可点击元素 ≥ 44×44px(浏览器 devtools 量)。
  - 浅/深色主题切换无对比度问题(主要文本 `text-foreground` 浅/深色均达 WCAG AA)。

---

## 8. 不在本方案范围

- **离线阅读 / PWA**:本方案 V1 不做。
- **学习时长统计**:`study_sessions` 表已留 schema,UI V2 再做。
- **推荐系统**(基于 `view_count` / `mastered` 的"下一步学什么"):V2 范畴。
- **i18n 文案**:现有 `useTranslation` 已就位,新文案沿用 `zh-CN` 资源键(本方案不创建翻译文件)。
- **章节子目录(父子章节树)**:数据库字段已有,UI V1 不展开。
- **Mark down 组件的内部重构**:本方案不动 `markdown.tsx` 的 `components` 表,只加外层容器级样式。
- **测试代码**:`vitest` / `go test` 配套测试在实现阶段补,不在本方案中。
- **PDF / 打印样式**:不在 V1 范围。

---

> **结束**。本文档只描述设计方案,不写代码、不改文件。后续按第 5 节清单分阶段实现。
