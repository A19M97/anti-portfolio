export function AntiPortfolioIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
    >
      <rect width="100" height="100" rx="20" fill="currentColor" opacity="0.1" />
      <g transform="translate(50, 50)">
        {/* Main X shape representing mistakes/lessons */}
        <path
          d="M -20 -20 L 20 20 M 20 -20 L -20 20"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Small circles at the ends representing growth points */}
        <circle cx="-20" cy="-20" r="4" fill="#fbbf24" />
        <circle cx="20" cy="-20" r="4" fill="#fbbf24" />
        <circle cx="-20" cy="20" r="4" fill="#fbbf24" />
        <circle cx="20" cy="20" r="4" fill="#fbbf24" />
      </g>
    </svg>
  );
}
