interface IllustrationProps {
  className?: string;
}

export function DosCaminosIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} role="img" aria-label="Dos caminos hacia la escuela, uno con agua y grava">
      <rect width="200" height="82" fill="#c3e9e7" />
      <path d="M0 73 L48 35 L86 73 L129 23 L200 74 V96 H0 Z" fill="#4f8c4a" />
      <rect x="145" y="43" width="31" height="28" fill="#fdf5e0" />
      <path d="M141 44 l20 -14 19 14" fill="#c2564a" />
      <rect x="157" y="55" width="8" height="16" fill="#8c4520" />
      <path d="M95 160 C88 129 85 106 45 83" stroke="#8c6f4f" strokeWidth="30" />
      <path d="M105 160 C123 126 144 106 162 75" stroke="#c9a877" strokeWidth="25" />
      <path d="M80 126 C65 120 51 124 44 133 C55 143 75 145 89 137" fill="#3fada6" opacity="0.85" />
      <g fill="#857a70">
        <ellipse cx="82" cy="104" rx="5" ry="3" />
        <ellipse cx="91" cy="111" rx="6" ry="3" />
        <ellipse cx="100" cy="118" rx="5" ry="3" />
        <ellipse cx="108" cy="126" rx="7" ry="4" />
      </g>
      <g transform="translate(113 82)">
        <rect width="34" height="18" rx="4" fill="#dd9c10" />
        <rect x="5" y="4" width="9" height="7" fill="#fdf5e0" />
        <rect x="18" y="4" width="9" height="7" fill="#fdf5e0" />
        <circle cx="8" cy="19" r="4" fill="#3a332e" />
        <circle cx="27" cy="19" r="4" fill="#3a332e" />
      </g>
    </svg>
  );
}
