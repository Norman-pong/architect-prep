# Architect Prep

系统架构师备考平台 — 知识浏览 + 刷题 + 错题本 + 遗忘曲线复习一体化。

## 功能

- **知识体系**：教材 20 章 316 知识点，含考试重点分布与真题链接
- **刷题**：1548 题（2009-2026），支持单选/多选/判分
- **错题本**：按 FSRS 间隔重复调度（不再是答对即删）
- **今日复习**：FSRS6 调度推送 + 卡片翻面 + 4 级评分（Again/Hard/Good/Easy）
- **学习统计**：章节进度、复习卡片、错题量
- **无密码登录**：邮箱验证码 + JWT

## 技术栈

| 层 | 技术 | 版本 |
| --- | --- | --- |
| 后端 | Go + Gin + SQLite (modernc 纯 Go) | Go 1.26 |
| 前端 | React + TypeScript + Vite+ | React 19 / TS 7.0 |
| 路由 | TanStack Router | 1.170 |
| 数据 | TanStack Query | 5.101 |
| UI 原语 | @base-ui/react | 1.6 |
| 样式 | Tailwind CSS | 4.3 |
| 状态 | Zustand | 5.0 |
| FSRS | imxw/go-fsrs | — |
| 部署 | Docker Compose + GHCR（单镜像） | — |

## 仓库结构

```
.
├── server/                  # Go 后端（Gin + SQLite）
│   ├── cmd/                 # 主入口
│   ├── internal/            # 业务模块（auth/knowledge/practice/review/...）
│   ├── scripts/             # 代码生成脚本（如 gencards.go）
│   └── data/                # 题库数据（bank.json 唯一真源）
├── web/                     # React 前端（vite-plus）
│   ├── src/
│   │   ├── routes/          # TanStack Router 文件路由
│   │   ├── features/        # 业务功能模块（knowledge/practice/review/...）
│   │   ├── components/      # 共享组件
│   │   └── lib/             # 工具与 API client
│   └── vite.config.ts       # vp 配置
├── docs/                    # 文档（见 docs/index.md）
│   ├── spec/                # 结构化需求输入
│   ├── prd/                 # 产品需求文档（含 archive/）
│   ├── phase/               # 阶段实施文档
│   ├── architecture/        # 架构设计
│   └── reference/           # 参考资料
├── dev.sh                   # 一键启动本地开发环境
├── Dockerfile               # 多阶段构建（Bun 前端 + Go 后端 + seed）
├── docker-compose.yml       # 一键部署（拉 GHCR 镜像 + mailpit）
├── docker-compose.build.yml # 从源码构建备选
├── .env.example             # 环境变量模板（SMTP / JWT）
├── .github/workflows/       # CI（自动构建并推送镜像到 GHCR）
└── docs/index.md            # 文档总索引
```

## 快速开始

### 本地开发（推荐）

```bash
./dev.sh
```

启动后会：

- seed 空库（如已 seed 则跳过）
- 启动后端：http://localhost:8080
- 启动前端：http://localhost:5173

按 `Ctrl+C` 自动清理所有子进程。

首次启动会自动：

1. 初始化 SQLite 数据库
2. 导入 316 知识点 + 1548 题
3. 生成 456 张知识卡片（20 章覆盖）
4. 为每个 user 创建 review_items 记录

### 重置数据库

```bash
./dev.sh --reset
```

### Docker 部署（一键）

```bash
docker compose up -d
```

就这么简单。默认配置自带：

- **应用**：http://localhost:8080（后端 API + 前端 SPA）
- **验证码邮箱**：http://localhost:8025（mailpit 邮件捕获器，输入邮箱注册后在这里查看验证码）

- 镜像从 GHCR 拉取，无需本地安装 Go / Bun / vp。

> CI 首次发布时会自动把 GHCR 包设置为 public，并通过匿名 `docker pull` smoke test 验证可拉取。如果该步骤失败，到 https://github.com/Norman-pong/architect-prep/packages/container/architect-prep/settings 手动改为 public。

#### 生产环境配置

```bash
cp .env.example .env
# 编辑 .env，填入真实 JWT_SECRET 和 SMTP 凭据
docker compose up -d
```

#### 从源码构建

```bash
docker compose -f docker-compose.build.yml up -d --build
```

#### 国内加速

GHCR 镜像拉取慢时，配置 Docker 镜像加速：

```json
// ~/.orbstack/config/docker.json (OrbStack)
// 或 /etc/docker/daemon.json (Docker Desktop)
{
  "registry-mirrors": ["https://docker.1ms.run"]
}
```

## 工具链

- 后端：`go build` / `go test` / `go vet` / `golangci-lint`（如已安装）
- 前端：`vp dev` / `vp build` / `vp check` / `vp lint --type-aware -f agent`

**注意**：`vp check` 必须从 `web/` 子目录运行，不能从仓库根运行（详见 `~/.omp/agent/managed-skills/vp-check-monorepo-cwd/SKILL.md`）。

## 文档

- [文档总索引](docs/index.md)
- [架构总览](docs/architecture/overview.md)
- [当前活跃 PRD](docs/prd/2026-07-14-fsrs-review-system.md)
- [Phase 3 实施记录](docs/phase/2026-07-14-fsrs-review-system.md)
- [文档贡献指南](docs/CONTRIBUTING.md)

## 提交规范

使用 `lore commit`，不要 `git commit`。lore commit 会：

1. 校验 JSON trailer（Lore-id、Tested、Scope-risk 等）
2. 当改动触及 `docs/` 时提示同步 phase doc / index.md
3. 建立 lore 索引供后续 `lore log` / `lore search` 查询

```bash
lore commit \
  --intent "简短描述（≤72 字符）" \
  --body "详细说明" \
  --tested "已验证内容" \
  --scope-risk narrow|moderate|wide \
  --reversibility clean|migration-needed|irreversible
```

## 端到端验证

- 后端：`go build ./...` / `go vet ./...` 0 errors
- 前端：`cd web && bunx tsc --noEmit` / `vp check` / `vp lint --type-aware -f agent` 0 errors / 0 warnings
- 浏览器：F1-F10（注册登录、知识浏览、刷题、错题本、今日复习、统计、设置、登出）全流程通过