interface IllustrationProps {
  className?: string;
}

export function MangosIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} role="img" aria-label="Tres cajas de mangos junto a bananos maduros y verdes">
      <rect width="200" height="110" fill="#fdf5e0" />
      <rect y="110" width="200" height="50" fill="#c9a877" />
      {[16, 76, 136].map((x, index) => (
        <g key={x} transform={`translate(${x} 77)`}>
          <path d="M0 5 H48 L42 45 H6 Z" fill={index === 0 ? "#8c4520" : "#8c6f4f"} />
          <path d="M4 11 H44 M8 25 H41" stroke="#f0d4ad" strokeWidth="2" opacity="0.65" />
          {[13, 25, 37].map((cx, fruitIndex) => (
            <ellipse key={cx} cx={cx} cy={fruitIndex % 2 === 0 ? 2 : 7} rx="8" ry="11" fill={index === 0 ? "#dd9c10" : "#8a9660"} transform={`rotate(${fruitIndex * 15 - 15} ${cx} ${fruitIndex % 2 === 0 ? 2 : 7})`} />
          ))}
          <text x="24" y="38" textAnchor="middle" fill="#fdf5e0" fontSize="13" fontWeight="800">{String.fromCharCode(65 + index)}</text>
        </g>
      ))}
      <g transform="translate(25 35)" stroke="#dd9c10" strokeWidth="7" strokeLinecap="round">
        <path d="M0 11 C11 -3 24 -3 34 11" />
        <path d="M7 16 C18 2 31 4 40 17" />
      </g>
      <g transform="translate(87 35)" stroke="#8a9660" strokeWidth="7" strokeLinecap="round">
        <path d="M0 11 C11 -3 24 -3 34 11" />
        <path d="M7 16 C18 2 31 4 40 17" />
      </g>
      <path d="M39 36 C42 28 47 25 53 24 M101 36 C104 28 109 25 115 24" stroke="#3a6b38" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
