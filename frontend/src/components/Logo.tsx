export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <circle cx="17" cy="17" r="14.5" stroke="var(--accent)" strokeWidth="2" />
      <circle cx="12.5" cy="14" r="2.4" fill="var(--accent)" />
      <circle cx="21" cy="12.5" r="1.6" fill="var(--amber)" />
      <circle cx="19.5" cy="21" r="2" fill="var(--accent)" />
    </svg>
  );
}
