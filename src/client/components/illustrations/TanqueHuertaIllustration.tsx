interface IllustrationProps {
  className?: string;
}

export function TanqueHuertaIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} role="img" aria-label="Tanque de agua junto a ocho eras de cultivo">
      <rect width="200" height="98" fill="#e9f6f6" />
      <circle cx="169" cy="25" r="17" fill="#dd9c10" />
      <rect y="98" width="200" height="62" fill="#9b7955" />
      <g transform="translate(18 38)">
        <ellipse cx="38" cy="7" rx="30" ry="7" fill="#3fada6" />
        <rect x="8" y="7" width="60" height="69" fill="#1f8f87" />
        <ellipse cx="38" cy="76" rx="30" ry="7" fill="#17716a" />
        <ellipse cx="38" cy="8" rx="25" ry="4" fill="#c3e9e7" />
        <rect x="66" y="61" width="17" height="5" rx="2" fill="#3a332e" />
        <path d="M83 64 C103 64 98 87 119 87" stroke="#17716a" strokeWidth="4" strokeLinecap="round" />
        <path d="M119 87 l-5 9 M119 87 l5 9" stroke="#17716a" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g fill="#4f8c4a">
        {[103, 125, 147, 169].map((x) => <circle key={`a${x}`} cx={x} cy="111" r="7" />)}
        {[103, 125, 147, 169].map((x) => <circle key={`b${x}`} cx={x} cy="139" r="7" />)}
      </g>
      <g stroke="#3a6b38" strokeWidth="2">
        {[103, 125, 147, 169].map((x) => <line key={`c${x}`} x1={x} y1="111" x2={x} y2="120" />)}
        {[103, 125, 147, 169].map((x) => <line key={`d${x}`} x1={x} y1="139" x2={x} y2="149" />)}
      </g>
    </svg>
  );
}
