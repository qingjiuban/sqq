import type { ReactNode } from "react";

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

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-5 w-5 place-items-center">{children}</span>
  );
}

export const TAB_ICONS = {
  files: (
    <Icon>
      <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 4.2A1.2 1.2 0 0 1 3.2 3h2.4l1.2 1.5h6A1.2 1.2 0 0 1 14 5.7v5.1a1.2 1.2 0 0 1-1.2 1.2H3.2A1.2 1.2 0 0 1 2 10.8V4.2Z"
          stroke="currentColor"
          strokeWidth="1.3"
        />
      </svg>
    </Icon>
  ),
  code: (
    <Icon>
      <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
        <path
          d="M6 4 2.5 8 6 12M10 4l3.5 4L10 12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  ),
  chat: (
    <Icon>
      <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
        <path
          d="M13.5 8c0 2.8-2.5 5-5.5 5-.7 0-1.4-.1-2-.3L2.5 13.5l1-2.6A4.7 4.7 0 0 1 2.5 8c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  ),
  preview: (
    <Icon>
      <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
        <rect
          x="2"
          y="3"
          width="12"
          height="10"
          rx="1.4"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path d="M2 6h12" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </Icon>
  ),
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
      <nav className="flex h-[58px] shrink-0 items-stretch border-t border-[var(--color-line-soft)] bg-[var(--color-panel)] pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active ? "text-[var(--color-iris-hi)]" : "text-[var(--color-mute)]"
              }`}
              onClick={() => onChange(item.value)}
            >
              <span
                className={`absolute top-0 h-[2px] w-9 rounded-full transition-colors ${
                  active ? "bg-[var(--color-iris-hi)]" : "bg-transparent"
                }`}
              />
              <span className="relative">
                {item.icon}
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[var(--color-iris)] px-1 text-[9px] text-white">
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
