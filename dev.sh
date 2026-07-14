#!/usr/bin/env bash
set -euo pipefail

# ─── dev.sh ───────────────────────────────────────────────────
# 一条命令启动本地开发环境：seed DB + 后端 + 前端
# 用法: ./dev.sh
# 退出: Ctrl+C 自动清理所有子进程
# ───────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
WEB_DIR="$ROOT_DIR/web"
DB_PATH="${DB_PATH:-/tmp/architect-prep-dev.db}"
PORT="${PORT:-8080}"
JWT_SECRET="dev-secret-change-in-production"

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
  log "已停止"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── 1. 检查依赖 ──────────────────────────────────────────────
command -v go >/dev/null 2>&1   || { echo "❌ 需要 Go"; exit 1; }
command -v bun >/dev/null 2>&1  || { echo "❌ 需要 Bun"; exit 1; }
command -v vp >/dev/null 2>&1   || { echo "❌ 需要 vp (vite-plus)"; exit 1; }

# ── 2. 初始化数据库（首次或 --reset 时） ─────────────────────
if [ ! -f "$DB_PATH" ] || [ "${1:-}" = "--reset" ]; then
  if [ "${1:-}" = "--reset" ]; then
    warn "重置数据库: $DB_PATH"
    rm -f "$DB_PATH"
  else
    info "首次启动，初始化数据库..."
  fi
  (cd "$SERVER_DIR" && go run ./cmd/seed -db "$DB_PATH")
  log "数据库就绪: $DB_PATH"
else
  info "数据库已存在: $DB_PATH (用 --reset 重置)"
fi

# ── 3. 构建后端二进制 ────────────────────────────────────────
info "构建后端..."
(cd "$SERVER_DIR" && go build -o ./tmp/architect-prep-dev ./cmd/architect-prep)
log "后端构建完成"

# ── 4. 启动后端 ──────────────────────────────────────────────
info "启动后端 → http://localhost:$PORT"
DB_PATH="$DB_PATH" \
JWT_SECRET="$JWT_SECRET" \
PORT="$PORT" \
ENV_FILE="$SERVER_DIR/.env" \
"$SERVER_DIR/tmp/architect-prep-dev" &
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

# ── 5. 启动前端 ──────────────────────────────────────────────
info "启动前端 → http://localhost:5173"
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
echo -e "${GREEN}  按 Ctrl+C 停止全部服务${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# 等待子进程
wait
