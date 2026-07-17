// Kleines Sonnen-Emblem statt Emoji — passt zur "Amalfi"-Farbpalette
// (mediterrane Küste) und zum Kachel-Hintergrundmuster.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <line x1="17" y1="12" x2="22" y2="12" />
      <line x1="15.5" y1="15.5" x2="19.1" y2="19.1" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="8.5" y1="15.5" x2="4.9" y2="19.1" />
      <line x1="7" y1="12" x2="2" y2="12" />
      <line x1="8.5" y1="8.5" x2="4.9" y2="4.9" />
      <line x1="12" y1="7" x2="12" y2="2" />
      <line x1="15.5" y1="8.5" x2="19.1" y2="4.9" />
    </svg>
  );
}
