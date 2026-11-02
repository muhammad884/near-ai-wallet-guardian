export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 2 L28 6.5 V15 C28 22.5 22.8 27.8 16 30 C9.2 27.8 4 22.5 4 15 V6.5 Z"
        style={{ fill: 'var(--accent)' }}
      />
      <circle cx="16" cy="13" r="3.2" style={{ fill: 'var(--bg)' }} />
      <path d="M14.6 15.5 H17.4 L18.2 21.5 H13.8 Z" style={{ fill: 'var(--bg)' }} />
    </svg>
  )
}
