interface IllustrationProps {
  className?: string;
}

/**
 * Texto 3 — Una forma diferente de leer.
 * Fondo en tono ciruela suave, ropa en río y cosecha, burbuja de diálogo
 * ciruela (intercambio de pistas entre compañeros).
 */
export function LecturaIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Ilustración de estudiantes leyendo en parejas"
    >
      {/* Fondo */}
      <rect width="200" height="160" fill="#f4eef7" />

      {/* Mesa */}
      <rect x="30" y="115" width="140" height="10" rx="3" fill="#c9a877" />
      <rect x="40" y="125" width="8" height="25" fill="#a9875c" />
      <rect x="152" y="125" width="8" height="25" fill="#a9875c" />

      {/* Libro / texto sobre la mesa */}
      <g transform="translate(85 95)">
        <rect x="0" y="0" width="30" height="22" rx="2" fill="white" stroke="#e3dcd2" strokeWidth="1.5" />
        <line x1="5" y1="6" x2="25" y2="6" stroke="#c8beb2" strokeWidth="1.5" />
        <line x1="5" y1="11" x2="25" y2="11" stroke="#c8beb2" strokeWidth="1.5" />
        <line x1="5" y1="16" x2="18" y2="16" stroke="#c8beb2" strokeWidth="1.5" />
      </g>

      {/* Estudiante izquierdo */}
      <g transform="translate(55 60)">
        <circle cx="0" cy="10" r="14" fill="#e8b98c" />
        <path d="M -14 4 Q 0 -8 14 4 L 14 10 L -14 10 Z" fill="#3a332e" />
        <rect x="-16" y="24" width="32" height="34" rx="8" fill="#1f8f87" />
      </g>

      {/* Estudiante derecho */}
      <g transform="translate(140 60)">
        <circle cx="0" cy="10" r="14" fill="#b97c4e" />
        <path d="M -14 2 Q 0 -10 14 2 L 14 10 L -14 10 Z" fill="#2a1f14" />
        <rect x="-16" y="24" width="32" height="34" rx="8" fill="#dd9c10" />
      </g>

      {/* Burbuja de diálogo (intercambio de pistas) */}
      <g transform="translate(90 35)">
        <ellipse cx="0" cy="0" rx="26" ry="16" fill="white" stroke="#7d4e93" strokeWidth="2" />
        <path d="M -6 14 L -10 24 L 4 15 Z" fill="white" stroke="#7d4e93" strokeWidth="2" />
        <circle cx="-10" cy="0" r="3" fill="#7d4e93" />
        <circle cx="0" cy="0" r="3" fill="#7d4e93" />
        <circle cx="10" cy="0" r="3" fill="#7d4e93" />
      </g>
    </svg>
  );
}
