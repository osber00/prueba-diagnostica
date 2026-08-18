import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** Número total de segmentos. */
  total: number;
  /** Índice del segmento actual (0-indexed). */
  current: number;
  /** Segmentos ya completados (array de índices). */
  completed?: number[];
}

/**
 * Barra de progreso segmentada.
 *
 * Cada segmento representa un ítem. El diseño es horizontal en móvil y se
 * mantiene compacto: toda la barra cabe en una línea sin scroll.
 */
export function ProgressBar({ total, current, completed = [] }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-label="Progreso">
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = completed.includes(i);
        const isCurrent = i === current;

        return (
          <div
            key={i}
            className={cn(
              "h-3 flex-1 rounded-pill transition-all duration-200",
              isCompleted && "bg-terracota-500",
              isCurrent && !isCompleted && "bg-rio-500",
              !isCurrent && !isCompleted && "bg-ink-200",
            )}
          />
        );
      })}
    </div>
  );
}
