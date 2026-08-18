interface IllustrationProps {
  className?: string;
}

/**
 * Texto 2 — El recorrido hacia la escuela.
 * Bus en tono cosecha (no el amarillo-verdoso genérico), lluvia y charco en
 * río turquesa, sombrilla terracota.
 */
export function TransporteIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Ilustración del transporte escolar bajo la lluvia"
    >
      {/* Cielo nublado */}
      <rect width="200" height="95" fill="#c3e9e7" />
      <ellipse cx="50" cy="25" rx="28" ry="14" fill="#8fb8b5" />
      <ellipse cx="150" cy="20" rx="32" ry="16" fill="#8fb8b5" />

      {/* Lluvia */}
      <g stroke="#17716a" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <line x1="30" y1="45" x2="25" y2="60" />
        <line x1="60" y1="40" x2="55" y2="55" />
        <line x1="120" y1="45" x2="115" y2="60" />
        <line x1="160" y1="40" x2="155" y2="55" />
        <line x1="90" y1="50" x2="85" y2="65" />
      </g>

      {/* Camino con agua acumulada */}
      <rect y="95" width="200" height="65" fill="#8a8471" />
      <ellipse cx="60" cy="135" rx="45" ry="10" fill="#3fada6" opacity="0.7" />
      <ellipse cx="55" cy="132" rx="15" ry="3" fill="#c3e9e7" opacity="0.6" />

      {/* Bus escolar en tono cosecha */}
      <g transform="translate(115 90)">
        <rect x="0" y="10" width="60" height="28" rx="6" fill="#dd9c10" />
        <rect x="6" y="14" width="14" height="12" rx="2" fill="#fdf5e0" />
        <rect x="24" y="14" width="14" height="12" rx="2" fill="#fdf5e0" />
        <rect x="42" y="14" width="12" height="12" rx="2" fill="#fdf5e0" />
        <circle cx="14" cy="40" r="6" fill="#3a332e" />
        <circle cx="46" cy="40" r="6" fill="#3a332e" />
        <circle cx="14" cy="40" r="2.5" fill="#857a70" />
        <circle cx="46" cy="40" r="2.5" fill="#857a70" />
      </g>

      {/* Estudiante caminando con sombrilla terracota */}
      <g transform="translate(30 100)">
        <circle cx="0" cy="8" r="6" fill="#e8b98c" />
        <rect x="-4" y="14" width="8" height="14" rx="2" fill="#7d4e93" />
        <rect x="-5" y="28" width="3" height="10" fill="#3a332e" />
        <rect x="2" y="28" width="3" height="10" fill="#3a332e" />
        <line x1="8" y1="10" x2="8" y2="-10" stroke="#8c4520" strokeWidth="2" />
        <path d="M -6 -10 Q 8 -20 22 -10" fill="#d9713c" />
      </g>
    </svg>
  );
}
