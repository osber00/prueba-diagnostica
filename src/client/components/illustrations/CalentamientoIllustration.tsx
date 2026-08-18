interface CalentamientoIllustrationProps {
  className?: string;
}

/**
 * Ilustración para el ítem de calentamiento: Camilo con una sombrilla.
 * Paleta propia de Macaján: sombrilla terracota, ropa río, suelo follaje.
 */
export function CalentamientoIllustration({ className }: CalentamientoIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Ilustración de Camilo con sombrilla"
    >
      {/* Cielo nublado */}
      <rect width="200" height="100" fill="#e3dcd2" />
      <ellipse cx="40" cy="30" rx="20" ry="12" fill="#c8beb2" />
      <ellipse cx="55" cy="28" rx="18" ry="10" fill="#c8beb2" />
      <ellipse cx="140" cy="35" rx="22" ry="14" fill="#c8beb2" />
      <ellipse cx="160" cy="32" rx="20" ry="12" fill="#c8beb2" />

      {/* Suelo */}
      <rect y="100" width="200" height="60" fill="#9bc297" />

      {/* Personaje (Camilo) */}
      <circle cx="100" cy="115" r="8" fill="#e8b98c" />
      <rect x="95" y="123" width="10" height="20" rx="2" fill="#1f8f87" />
      <rect x="92" y="143" width="4" height="12" fill="#3a332e" />
      <rect x="104" y="143" width="4" height="12" fill="#3a332e" />

      {/* Sombrilla terracota */}
      <line x1="115" y1="120" x2="115" y2="90" stroke="#8c4520" strokeWidth="2" />
      <path d="M 95 90 Q 115 80 135 90" fill="#d9713c" stroke="#b3592c" strokeWidth="2" />
      <line x1="105" y1="87" x2="105" y2="82" stroke="#b3592c" strokeWidth="1.5" />
      <line x1="115" y1="85" x2="115" y2="80" stroke="#b3592c" strokeWidth="1.5" />
      <line x1="125" y1="87" x2="125" y2="82" stroke="#b3592c" strokeWidth="1.5" />
    </svg>
  );
}
