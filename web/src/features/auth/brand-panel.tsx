/**
 * Login page brand panel — geometric decoration that nods at software
 * architecture (nodes + edges) without external imagery.
 */
export function BrandPanel() {
  return (
    <div className="relative hidden h-full w-full overflow-hidden md:flex md:flex-col md:justify-between bg-gradient-to-br from-primary/95 via-primary to-primary/80 p-12 text-primary-foreground">
      {/* Decorative grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Architecture node decoration */}
      <svg
        aria-hidden
        viewBox="0 0 600 480"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Edges */}
        <g stroke="url(#edge)" strokeWidth="1.5" fill="none">
          <path d="M120 120 L300 200" />
          <path d="M120 120 L300 320" />
          <path d="M300 200 L480 120" />
          <path d="M300 200 L480 280" />
          <path d="M300 320 L480 280" />
          <path d="M300 320 L480 400" />
        </g>
        {/* Nodes */}
        <g>
          <circle cx="120" cy="120" r="6" fill="currentColor" opacity="0.6" />
          <circle cx="300" cy="200" r="9" fill="currentColor" opacity="0.9" />
          <circle cx="300" cy="320" r="6" fill="currentColor" opacity="0.6" />
          <circle cx="480" cy="120" r="6" fill="currentColor" opacity="0.6" />
          <circle cx="480" cy="280" r="9" fill="currentColor" opacity="0.9" />
          <circle cx="480" cy="400" r="6" fill="currentColor" opacity="0.6" />
        </g>
      </svg>

      {/* Logo + title */}
      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur-sm">
            <span className="text-xl font-bold">架</span>
          </div>
          <span className="text-lg font-semibold tracking-wide">系统架构师备考平台</span>
        </div>
      </div>

      {/* Tagline + bullets */}
      <div className="relative z-10 space-y-6">
        <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
          知识体系 + 刷题 + 复习
          <br />
          一体化备考
        </h1>
        <ul className="space-y-2 text-sm text-primary-foreground/85">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
            教材 20 章 316 知识点，FSRS 间隔重复调度
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
            1548 真题（2009-2026），单选/多选/判分
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
            邮箱验证码登录，无密码
          </li>
        </ul>
      </div>

      {/* Footer hint */}
      <div className="relative z-10 text-xs text-primary-foreground/60">
        每天 5 分钟，告别遗忘曲线
      </div>
    </div>
  );
}
