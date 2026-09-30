/**
 * Small status primitives shared across panels. Color is used only to express
 * state, never decoration.
 */
export function StatusDot({
  tone = "idle",
  pulse = false,
  className = "",
}: {
  tone?: "idle" | "accent" | "ok" | "warn" | "err" | "info";
  pulse?: boolean;
  className?: string;
}) {
  const bg =
    tone === "accent"
      ? "bg-[var(--color-iris-hi)]"
      : tone === "ok"
        ? "bg-[var(--color-ok)]"
        : tone === "warn"
          ? "bg-[var(--color-warn)]"
          : tone === "err"
            ? "bg-[var(--color-err)]"
            : tone === "info"
              ? "bg-[var(--color-info)]"
              : "bg-[var(--color-faint)]";
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${bg} ${
        pulse ? "animate-pulse-soft" : ""
      } ${className}`}
    />
  );
}
