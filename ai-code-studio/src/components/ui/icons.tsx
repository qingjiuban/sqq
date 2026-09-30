import type { SVGProps } from "react";

/**
 * One icon language for the whole app: 16px viewBox, 1.5px rounded strokes,
 * currentColor. No emoji, no unicode glyphs, no mixed styles.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconFiles(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.25 4.5A1.25 1.25 0 0 1 3.5 3.25h2.2l1.3 1.6h5.5A1.25 1.25 0 0 1 13.75 6.1v5.15A1.25 1.25 0 0 1 12.5 12.5h-9a1.25 1.25 0 0 1-1.25-1.25V4.5Z" />
    </Icon>
  );
}

export function IconCode(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 4.5 2.75 8 6 11.5" />
      <path d="M10 4.5 13.25 8 10 11.5" />
    </Icon>
  );
}

export function IconAgent(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.25 8c0 2.62-2.35 4.75-5.25 4.75-.68 0-1.33-.12-1.93-.33L3.25 13.5l1.02-2.4A4.5 4.5 0 0 1 2.75 8c0-2.62 2.35-4.75 5.25-4.75S13.25 5.38 13.25 8Z" />
    </Icon>
  );
}

export function IconPreview(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.25" y="3.25" width="11.5" height="9.5" rx="1.25" />
      <path d="M2.25 6h11.5" />
      <circle cx="4.25" cy="4.6" r="0.5" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconTerminal(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.25" y="3.25" width="11.5" height="9.5" rx="1.25" />
      <path d="M5 6.75 7 8.5 5 10.25" />
      <path d="M8.75 10.5h2.5" />
    </Icon>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="1.85" />
      <path d="M8 1.9v1.6M8 12.5v1.6M14.1 8h-1.6M3.5 8H1.9M12.3 3.7l-1.13 1.13M4.83 11.17 3.7 12.3M12.3 12.3l-1.13-1.13M4.83 4.83 3.7 3.7" />
    </Icon>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3.25v9.5M3.25 8h9.5" />
    </Icon>
  );
}

export function IconFolderPlus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.25 4.5A1.25 1.25 0 0 1 3.5 3.25h2.2l1.3 1.6h5.5A1.25 1.25 0 0 1 13.75 6.1v5.15A1.25 1.25 0 0 1 12.5 12.5h-9a1.25 1.25 0 0 1-1.25-1.25V4.5Z" />
      <path d="M8 7.4v3.2M6.4 9h3.2" />
    </Icon>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 8a5 5 0 1 1-1.5-3.6" />
      <path d="M13 2.75V5.4h-2.65" />
    </Icon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.25 4.25l7.5 7.5M11.75 4.25l-7.5 7.5" />
    </Icon>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.5 10.5 8 6 12.5" />
    </Icon>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3.5 5.5 8 10 12.5" />
    </Icon>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 6 8 10.5 12.5 6" />
    </Icon>
  );
}

export function IconSend(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 13V3.5" />
      <path d="M4.25 7 8 3.25 11.75 7" />
    </Icon>
  );
}

export function IconStop(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="4.5" width="7" height="7" rx="1.4" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.25 8.5 6.5 11.75 12.75 4.75" />
    </Icon>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2.75 14.25 13.5H1.75L8 2.75Z" />
      <path d="M8 6.75v3" />
      <circle cx="8" cy="11.6" r="0.6" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 7.4v3.3" />
      <circle cx="8" cy="5.3" r="0.6" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="7.25" cy="7.25" r="4.25" />
      <path d="M10.4 10.4 13.5 13.5" />
    </Icon>
  );
}

export function IconExternal(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 3.25h3.25V6.5" />
      <path d="M12.75 3.25 7.5 8.5" />
      <path d="M12 9.75v2.5a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75H6.5" />
    </Icon>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.25 3.9v8.2L12.4 8 5.25 3.9Z" />
    </Icon>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.25 4.5h9.5" />
      <path d="M6.5 4.5V3.4a.9.9 0 0 1 .9-.9h1.2a.9.9 0 0 1 .9.9v1.1" />
      <path d="M4.5 4.5l.55 7.7a1 1 0 0 0 1 .95h3.9a1 1 0 0 0 1-.95l.55-7.7" />
    </Icon>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.6 2.9 13.1 5.4 5.9 12.6l-3.1.6.6-3.1 7.2-7.2Z" />
    </Icon>
  );
}

export function IconPlug(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 2.75v3M10 2.75v3" />
      <path d="M4.5 5.75h7v1.5a3.5 3.5 0 0 1-7 0v-1.5Z" />
      <path d="M8 10.75v2.5" />
    </Icon>
  );
}

export function IconSpark(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2.5 9.3 6.2 13 7.5 9.3 8.8 8 12.5 6.7 8.8 3 7.5l3.7-1.3L8 2.5Z" />
    </Icon>
  );
}

export function IconCube(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 1.9 13.6 5v6L8 14.1 2.4 11V5L8 1.9Z" />
      <path d="M2.6 5.1 8 8.1l5.4-3" />
      <path d="M8 8.1v5.9" />
    </Icon>
  );
}

export function IconEye(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M1.75 8S4.25 3.75 8 3.75 14.25 8 14.25 8 11.75 12.25 8 12.25 1.75 8 1.75 8Z" />
      <circle cx="8" cy="8" r="1.9" />
    </Icon>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.3 3.95A6.9 6.9 0 0 1 8 3.75c3.75 0 6.25 4.25 6.25 4.25a12 12 0 0 1-2.1 2.6" />
      <path d="M9.9 9.9a2 2 0 0 1-2.8-2.8" />
      <path d="M4.6 4.9A11.7 11.7 0 0 0 1.75 8S4.25 12.25 8 12.25c1 0 1.9-.28 2.7-.72" />
      <path d="M2.5 2.5l11 11" />
    </Icon>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5.75" y="5.75" width="7.5" height="7.5" rx="1.4" />
      <path d="M4.5 10.25H3.9a1.4 1.4 0 0 1-1.4-1.4V3.9a1.4 1.4 0 0 1 1.4-1.4h4.95a1.4 1.4 0 0 1 1.4 1.4v.6" />
    </Icon>
  );
}

/**
 * Brand mark: a geometric "prompt" glyph — a chevron and a cursor inside a
 * rounded square. Monochrome-first, reads cleanly from 16px to 56px.
 */
export function BrandMark({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        fill="var(--color-accent)"
      />
      <path
        d="M11 11.5 15.5 16 11 20.5"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 20.5h4.5"
        stroke="rgba(255,255,255,0.72)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
