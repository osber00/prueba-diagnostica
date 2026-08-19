interface IllustrationProps {
  className?: string;
}

export function GeneradorIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} role="img" aria-label="Generador conectado a luces, parlantes y congelador">
      <rect width="200" height="108" fill="#243e48" />
      <rect y="108" width="200" height="52" fill="#8c6f4f" />
      <path d="M20 24 H180" stroke="#fdf5e0" strokeWidth="2" />
      {[30, 65, 100, 135, 170].map((x) => <circle key={x} cx={x} cy="25" r="6" fill="#f2c452" />)}
      <g transform="translate(55 66)">
        <rect width="90" height="57" rx="8" fill="#d9713c" />
        <rect x="12" y="12" width="42" height="33" rx="4" fill="#3a332e" />
        <circle cx="33" cy="28" r="11" stroke="#857a70" strokeWidth="4" />
        <rect x="63" y="13" width="15" height="22" rx="2" fill="#fdf5e0" />
        <path d="M70 17 v7 M66 21 h8" stroke="#c2564a" strokeWidth="2" />
        <circle cx="15" cy="58" r="7" fill="#3a332e" />
        <circle cx="75" cy="58" r="7" fill="#3a332e" />
      </g>
      <g fill="#1f8f87">
        <rect x="12" y="73" width="29" height="43" rx="4" />
        <circle cx="26.5" cy="87" r="7" fill="#243e48" />
        <circle cx="26.5" cy="105" r="9" fill="#243e48" />
        <rect x="159" y="70" width="29" height="46" rx="4" />
        <circle cx="173.5" cy="86" r="7" fill="#243e48" />
        <circle cx="173.5" cy="104" r="9" fill="#243e48" />
      </g>
      <path d="M41 111 C49 111 47 101 55 101 M145 101 C153 101 151 111 159 111" stroke="#3a332e" strokeWidth="3" />
    </svg>
  );
}
