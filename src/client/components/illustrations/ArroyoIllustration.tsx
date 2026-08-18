interface IllustrationProps {
  className?: string;
}

/**
 * Texto 4 — Después de la lluvia.
 * Vegetación en verde follaje (bosque), bolsa plástica en tono río,
 * residuos en alerta/río para diferenciarlos del entorno natural.
 */
export function ArroyoIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Ilustración del arroyo después de la lluvia"
    >
      {/* Cielo */}
      <rect width="200" height="60" fill="#e9f6f6" />

      {/* Pendiente sin vegetación (izquierda) con canales de erosión */}
      <path d="M0 60 L70 60 L50 130 L0 130 Z" fill="#8c6f4f" />
      <path d="M20 65 Q15 90 10 125" stroke="#6b5638" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M40 65 Q35 95 28 125" stroke="#6b5638" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M55 65 Q50 95 42 125" stroke="#6b5638" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Vegetación en el resto del terreno */}
      <rect x="70" y="60" width="130" height="70" fill="#4f8c4a" />

      {/* Árbol con raíces */}
      <g transform="translate(140 60)">
        <rect x="-4" y="20" width="8" height="30" fill="#8c4520" />
        <path d="M-4 48 L-16 60 M4 48 L16 60 M0 50 L0 62" stroke="#8c4520" strokeWidth="4" strokeLinecap="round" />
        <circle cx="0" cy="14" r="20" fill="#3a6b38" />
        {/* Bolsa plástica atrapada entre raíces */}
        <path d="M-10 56 Q-6 50 0 56 Q4 60 -2 62 Q-8 60 -10 56 Z" fill="#e9f6f6" stroke="#1f8f87" strokeWidth="1.5" />
      </g>

      {/* Arroyo con agua marrón */}
      <path
        d="M0 130 Q50 120 100 132 Q150 144 200 130 L200 160 L0 160 Z"
        fill="#8c6239"
      />
      <path
        d="M0 135 Q50 128 100 138 Q150 148 200 136"
        stroke="#6b4a2a"
        strokeWidth="3"
        fill="none"
        opacity="0.5"
      />

      {/* Residuos cerca de la carretera */}
      <g transform="translate(175 118)">
        <rect x="0" y="0" width="10" height="8" rx="2" fill="#c2564a" opacity="0.85" />
        <circle cx="14" cy="4" r="4" fill="#1f8f87" opacity="0.85" />
      </g>
    </svg>
  );
}
