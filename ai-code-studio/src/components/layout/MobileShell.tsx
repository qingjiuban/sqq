import type { ReactNode } from "react";
import { IconAgent, IconCode, IconFiles, IconPreview } from "../ui/icons";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface Props<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  children: ReactNode;
}

export const TAB_ICONS = {
  files: <IconFiles size={19} />,
  code: <IconCode size={19} />,
  chat: <IconAgent size={19} />,
  preview: <IconPreview size={19} />,
};

/**
 * Full-height single-pane layout with a bottom navigation bar, used on narrow
 * (mobile) viewports. Content scrolls inside the pane so the nav stays fixed.
 */
export default function MobileShell<T extends string>({
  items,
  value,
  onChange,
  children,
}: Props<T>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      <nav className="flex h-[58px] shrink-0 items-stretch border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors ${
                active ? "text-[var(--color-accent-hover)]" : "text-[var(--color-text-muted)]"
              }`}
              onClick={() => onChange(item.value)}
            >
              <span
                className={`absolute top-0 h-[2px] w-8 rounded-full transition-colors ${
                  active ? "bg-[var(--color-accent-hover)]" : "bg-transparent"
                }`}
              />
              <span className="relative">
                {item.icon}
                {item.badge ? (
                  <span className="absolute -right-2.5 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[var(--color-accent)] px-1 text-[9px] text-white">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
