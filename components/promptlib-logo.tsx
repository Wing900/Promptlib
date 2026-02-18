interface PromptLibLogoProps {
  className?: string;
}

export function PromptLibLogo({ className }: PromptLibLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PromptLib Logo"
      role="img"
    >
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1.5" />
      <path d="M40 30V70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M40 30H55C63.2843 30 70 36.7157 70 45C70 53.2843 63.2843 60 55 60H40"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

