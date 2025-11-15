// lib/button-presets.ts
// Tailwind v4 + CSS Variables 기반 일관 버튼 프리셋 (color-mix 문법 수정)

const base =
  "inline-flex items-center justify-center font-medium select-none rounded-[var(--radius-md)] outline-none " +
  "transition-[background-color,transform,box-shadow] duration-150 active:scale-95 " +
  "focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const sizes = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-base gap-2",
  lg: "h-12 px-6 text-lg gap-2.5",
  icon: "h-11 w-11",
} as const;

const variants = {
  primary:
    `${base} text-white bg-[var(--brand)] ` +
    "hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)]",
  secondary:
    `${base} text-[var(--text-primary)] bg-[var(--bg-subtle)] ` +
    "hover:bg-[var(--border)]",
  outline:
    `${base} text-[var(--brand)] border border-[var(--brand)] ` +
    "hover:bg-[color-mix(in oklab,var(--brand) 12%,transparent)]",
  ghost:
    `${base} text-[var(--text-primary)] ` +
    "hover:bg-[color-mix(in oklab,var(--text-primary) 8%,transparent)]",
  danger:
    `${base} text-white bg-[var(--danger)] ` +
    "hover:bg-[color-mix(in oklab,var(--danger) 85%,black)]",
} as const;

export function getButtonClasses<
  V extends keyof typeof variants,
  S extends keyof typeof sizes
>(variant: V = 'primary' as V, size: S = 'md' as S, extra?: string) {
  return `${variants[variant]} ${sizes[size]} ${extra ?? ''}`;
}

// Re-export for compatibility
export const buttonBase = base;
export const buttonSizes = sizes;
export const buttonVariants = variants;