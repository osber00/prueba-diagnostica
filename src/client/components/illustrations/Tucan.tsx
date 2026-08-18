interface TucanProps {
  /** Estado emocional de la mascota. */
  mood?: "greeting" | "cheering" | "celebrating";
  className?: string;
}

/**
 * Mascota: un tucán, ave común en el territorio rural colombiano.
 *
 * Se eligió deliberadamente en lugar de un búho: la mascota debe sentirse
 * propia de Macaján, no recordar a la de otra aplicación de aprendizaje muy
 * conocida. El pico multicolor usa la paleta propia (terracota, cosecha, río)
 * en vez de verde-lima y azul cielo.
 */
export function Tucan({ mood = "greeting", className }: TucanProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Mascota tucán"
    >
      {/* Cola */}
      <path d="M60 95 Q52 112 48 118 Q62 114 68 98 Z" fill="#2f2b27" />

      {/* Cuerpo */}
      <ellipse cx="58" cy="72" rx="26" ry="32" fill="#2f2b27" />
      {/* Pecho crema */}
      <ellipse cx="58" cy="80" rx="15" ry="18" fill="#fdf5e0" />
      {/* Franja de color bajo la cola */}
      <ellipse cx="58" cy="100" rx="10" ry="6" fill="#dd9c10" />

      {/* Cabeza */}
      <circle cx="58" cy="42" r="22" fill="#2f2b27" />

      {/* Contorno de ojo (piel azulada típica del tucán) */}
      <circle cx="66" cy="38" r="11" fill="#1f8f87" />
      <circle cx="66" cy="38" r="7" fill="white" />
      <circle cx="68" cy="39" r="3.5" fill="#2f2b27" />

      {/* Pico multicolor, curvado, mucho más grande que el cuerpo */}
      <path
        d="M75 38
           C 100 30, 112 40, 108 48
           C 104 55, 90 56, 78 52
           Z"
        fill="#d9713c"
      />
      <path
        d="M78 52 C 90 56, 104 55, 108 48 C 106 51, 96 53, 82 50 Z"
        fill="#8c4520"
      />
      <path
        d="M80 34 C 95 30, 106 34, 108 40 C 100 36, 88 36, 78 40 Z"
        fill="#dd9c10"
      />
      <circle cx="106" cy="44" r="2" fill="#2f2b27" />

      {/* Alas según mood */}
      {mood === "greeting" && (
        <>
          <ellipse
            cx="32"
            cy="68"
            rx="10"
            ry="18"
            fill="#1f8f87"
            transform="rotate(-25 32 68)"
          />
          <ellipse cx="84" cy="78" rx="10" ry="18" fill="#1f8f87" />
        </>
      )}

      {mood === "cheering" && (
        <>
          <ellipse
            cx="30"
            cy="58"
            rx="10"
            ry="18"
            fill="#1f8f87"
            transform="rotate(-45 30 58)"
          />
          <ellipse
            cx="86"
            cy="58"
            rx="10"
            ry="18"
            fill="#1f8f87"
            transform="rotate(45 86 58)"
          />
        </>
      )}

      {mood === "celebrating" && (
        <>
          <ellipse
            cx="30"
            cy="58"
            rx="10"
            ry="18"
            fill="#1f8f87"
            transform="rotate(-45 30 58)"
          />
          <ellipse
            cx="86"
            cy="58"
            rx="10"
            ry="18"
            fill="#1f8f87"
            transform="rotate(45 86 58)"
          />
          {/* Destellos festivos con la paleta propia */}
          <path
            d="M22 28 L24 34 L30 34 L25 38 L27 44 L22 40 L17 44 L19 38 L14 34 L20 34 Z"
            fill="#dd9c10"
          />
          <path
            d="M96 24 L98 30 L104 30 L99 34 L101 40 L96 36 L91 40 L93 34 L88 30 L94 30 Z"
            fill="#d9713c"
          />
          <path
            d="M58 10 L60 16 L66 16 L61 20 L63 26 L58 22 L53 26 L55 20 L50 16 L56 16 Z"
            fill="#7d4e93"
          />
        </>
      )}

      {/* Patas */}
      <rect x="48" y="100" width="6" height="12" rx="3" fill="#dd9c10" />
      <rect x="62" y="100" width="6" height="12" rx="3" fill="#dd9c10" />
    </svg>
  );
}
