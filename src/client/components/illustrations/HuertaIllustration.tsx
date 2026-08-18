interface IllustrationProps {
  className?: string;
}

/**
 * Texto 1 — La huerta escolar.
 * Sol y regadera en tonos propios (cosecha dorado, río turquesa); el verde
 * de las plantas es un verde bosque (follaje), no el verde-lima genérico.
 */
export function HuertaIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Ilustración de la huerta escolar"
    >
      {/* Cielo */}
      <rect width="200" height="95" fill="#e9f6f6" />
      {/* Sol */}
      <circle cx="165" cy="30" r="18" fill="#dd9c10" />
      <g stroke="#dd9c10" strokeWidth="3" strokeLinecap="round">
        <line x1="165" y1="4" x2="165" y2="-2" />
        <line x1="189" y1="12" x2="194" y2="8" />
        <line x1="197" y1="30" x2="203" y2="30" />
      </g>

      {/* Suelo dividido: húmedo (izq) y seco (der) */}
      <rect y="95" width="115" height="65" fill="#8c6f4f" />
      <rect x="115" y="95" width="85" height="65" fill="#c9a877" />

      {/* Plantas firmes (zona húmeda, izquierda) */}
      <g>
        <rect x="30" y="75" width="4" height="25" fill="#3a6b38" />
        <circle cx="32" cy="72" r="12" fill="#4f8c4a" />
        <circle cx="20" cy="80" r="4" fill="#c2564a" />
        <circle cx="42" cy="82" r="4" fill="#c2564a" />
        <circle cx="32" cy="65" r="4" fill="#c2564a" />
      </g>
      <g>
        <rect x="65" y="80" width="4" height="20" fill="#3a6b38" />
        <circle cx="67" cy="76" r="10" fill="#4f8c4a" />
        <circle cx="60" cy="82" r="3.5" fill="#c2564a" />
        <circle cx="74" cy="80" r="3.5" fill="#c2564a" />
      </g>

      {/* Hojas secas cubriendo la base (mantillo) */}
      <ellipse cx="32" cy="99" rx="20" ry="5" fill="#c9a877" opacity="0.6" />
      <ellipse cx="67" cy="99" rx="16" ry="4" fill="#c9a877" opacity="0.6" />

      {/* Plantas débiles (zona seca, derecha) — más pequeñas y caídas */}
      <g>
        <rect x="140" y="88" width="3" height="15" fill="#8a9660" />
        <ellipse cx="141" cy="86" rx="8" ry="6" fill="#a9b481" transform="rotate(20 141 86)" />
      </g>
      <g>
        <rect x="170" y="90" width="3" height="13" fill="#8a9660" />
        <ellipse cx="171" cy="89" rx="7" ry="5" fill="#a9b481" transform="rotate(-15 171 89)" />
      </g>

      {/* Regadera */}
      <g transform="translate(90 118)">
        <rect x="0" y="8" width="22" height="14" rx="3" fill="#1f8f87" />
        <rect x="20" y="4" width="14" height="6" rx="3" fill="#1f8f87" />
        <circle cx="34" cy="4" r="3" fill="#1f8f87" />
        <path d="M0 10 Q -8 8 -10 14" stroke="#17716a" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
