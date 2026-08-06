#!/usr/bin/env bash
set -euo pipefail

# ─── dev.sh ───────────────────────────────────────────────────
# 一条命令启动本地开发环境：后端 + 前端
# 用法: ./dev.sh
# 退出: Ctrl+C 自动清理所有子进程
#
# SMTP 配置由根目录 .env 决定：
#   SMTP_HOST=mailpit  → 启动 Mailpit 容器，邮件本地捕获（http://localhost:8025）
#   SMTP_HOST=smtp.qq.com → 用真实 SMTP 发送邮件
# ───────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
WEB_DIR="$ROOT_DIR/web"
DB_PATH="${DB_PATH:-/tmp/architect-prep-dev.db}"
PORT="${PORT:-8080}"
JWT_SECRET="dev-secret-change-in-production"
ENV_FILE="$ROOT_DIR/.env"

# 颜色
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[dev]${NC} $1"; }
info() { echo -e "${CYAN}[dev]${NC} $1"; }
warn() { echo -e "${YELLOW}[dev]${NC} $1"; }

# Ctrl+C 清理：杀进程树而非 jobs
PIDS=()
cleanup() {
  echo ""
  warn "正在停止所有服务..."
  for pid in "${PIDS[@]}"; do
    pkill -P "$pid" 2>/dev/null || true   # 先杀子进程
    kill "$pid" 2>/dev/null || true        # 再杀父进程
  done
  wait 2>/dev/null
  # 停止 Mailpit 容器（--rm 会自动删除）
  if [ -n "${MAILPIT_WEB_URL:-}" ]; then
    docker stop mailpit-dev >/dev/null 2>&1 || true
  fi
  log "已停止"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── 1. 检查依赖 ──────────────────────────────────────────────
command -v go >/dev/null 2>&1   || { echo "❌ 需要 Go"; exit 1; }
command -v bun >/dev/null 2>&1  || { echo "❌ 需要 Bun"; exit 1; }
command -v vp >/dev/null 2>&1   || { echo "❌ 需要 vp (vite-plus)"; exit 1; }

# ── 2. 数据库（--reset 时删除，服务器启动时自动初始化） ──────
if [ "${1:-}" = "--reset" ]; then
  warn "重置数据库: $DB_PATH"
  rm -f "$DB_PATH"
elif [ -f "$DB_PATH" ]; then
  info "数据库已存在: $DB_PATH (用 --reset 重置)"
else
  info "数据库不存在，服务器启动时将自动初始化"
fi

# ── 3. 读取 .env 中的 SMTP_HOST，决定邮件发送方式 ────────────
#   mailpit / 127.0.0.1 / localhost → 启动 Mailpit，本地捕获
#   其他（如 smtp.qq.com）          → 用真实 SMTP，不启动 Mailpit
SMTP_HOST_CFG=""
if [ -f "$ENV_FILE" ]; then
  SMTP_HOST_CFG=$(grep -E '^SMTP_HOST=' "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '[:space:][:cntrl:]' || echo "")
fi

DEV_ECHO=""
MAILPIT_WEB_URL=""
USE_MAILPIT=false

case "$SMTP_HOST_CFG" in
  mailpit|127.0.0.1|localhost|::1|"")
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
      docker rm -f mailpit-dev >/dev/null 2>&1 || true
      info "启动 Mailpit..."
      if docker run -d --rm --name mailpit-dev \
        -p 1025:1025 -p 8025:8025 \
        -e MP_SMTP_AUTH_ACCEPT_ANY=1 \
        -e MP_SMTP_AUTH_ALLOW_INSECURE=1 \
        axllent/mailpit:latest >/dev/null 2>&1; then
        log "Mailpit 就绪 -> http://localhost:8025"
        MAILPIT_WEB_URL="http://localhost:8025"
        USE_MAILPIT=true
      else
        warn "Mailpit 启动失败，验证码由 /_dev_code 返回"
        DEV_ECHO="1"
      fi
    else
      warn "Docker 不可用，验证码由 /_dev_code 返回"
      DEV_ECHO="1"
    fi
    ;;
  *)
    info "使用 .env 真实 SMTP: $SMTP_HOST_CFG"
    ;;
esac

# ── 4. 构建后端二进制 ────────────────────────────────────────
info "构建后端..."
(cd "$SERVER_DIR" && go build -o ./tmp/architect-prep-dev ./cmd/architect-prep)
log "后端构建完成"

# ── 5. 启动后端 ──────────────────────────────────────────────
# Mailpit 模式：覆盖 SMTP 为本地 127.0.0.1（绕过 IPv6 超时）
# 真实 SMTP 模式：SMTP 配置由 .env 提供，不覆盖
info "启动后端 -> http://localhost:$PORT"
if [ "$USE_MAILPIT" = true ]; then
  DB_PATH="$DB_PATH" \
  JWT_SECRET="$JWT_SECRET" \
  PORT="$PORT" \
  ENV_FILE="$ENV_FILE" \
  DEV_ECHO_CODE="$DEV_ECHO" \
  SMTP_HOST=127.0.0.1 \
  SMTP_PORT=1025 \
  SMTP_USER=dev@local \
  SMTP_PASS=dev \
  SMTP_FROM=dev@local \
  "$SERVER_DIR/tmp/architect-prep-dev" &
else
  DB_PATH="$DB_PATH" \
  JWT_SECRET="$JWT_SECRET" \
  PORT="$PORT" \
  ENV_FILE="$ENV_FILE" \
  DEV_ECHO_CODE="$DEV_ECHO" \
  "$SERVER_DIR/tmp/architect-prep-dev" &
fi
BACKEND_PID=$!
PIDS+=("$BACKEND_PID")

# 等后端就绪
for i in $(seq 1 10); do
  if curl -sf "http://localhost:$PORT/health" >/dev/null 2>&1; then
    log "后端就绪 ✓"
    break
  fi
  sleep 0.5
done

# ── 6. 启动前端 ──────────────────────────────────────────────
info "启动前端 -> http://localhost:5173"
(cd "$WEB_DIR" && vp dev) &
FRONTEND_PID=$!
PIDS+=("$FRONTEND_PID")

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  开发环境已启动${NC}"
echo -e "${GREEN}  前端:  http://localhost:5173${NC}"
echo -e "${GREEN}  后端:  http://localhost:$PORT${NC}"
echo -e "${GREEN}  API:   http://localhost:$PORT/api/v1${NC}"
echo -e "${GREEN}  数据库: $DB_PATH${NC}"
if [ -n "$MAILPIT_WEB_URL" ]; then
  echo -e "${GREEN}  邮件:  $MAILPIT_WEB_URL${NC}"
elif [ -n "$SMTP_HOST_CFG" ] && [ "$SMTP_HOST_CFG" != "" ]; then
  echo -e "${GREEN}  SMTP:  $SMTP_HOST_CFG${NC}"
fi
echo -e "${GREEN}  按 Ctrl+C 停止全部服务${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# 等待子进程
wait
