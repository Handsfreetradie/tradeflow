export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="22" fill="hsl(222 47% 9%)" />
      <path d="M24 30 H68 L78 36 L68 42 H24 Z" fill="white" />
      <defs>
        <linearGradient id="tf-ribbon" x1="30" y1="38" x2="46" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(221 83% 63%)" />
          <stop offset="1" stopColor="hsl(221 83% 40%)" />
        </linearGradient>
      </defs>
      <path d="M31 38 H47 V60 L36 76 H31 V64 L42 48 H31 Z" fill="url(#tf-ribbon)" />
    </svg>
  )
}

/** Logo mark + "TradeFlow" wordmark, for headers/login screens. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <div className={className}>
      <LogoMark className={markClassName ?? 'size-9'} />
    </div>
  )
}
