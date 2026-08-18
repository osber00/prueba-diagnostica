import { ProgressBar } from "@/components/ui/ProgressBar";

interface StudentTopBarProps {
  /**
   * Progreso sobre los 16 ítems calificables, o `null` durante el
   * calentamiento: no cuenta para el resultado, así que no tiene barra.
   */
  progress: { current: number; completed: number[] } | null;
  /** Etiqueta del cronómetro, ya formateada como m:ss. */
  timerLabel: string;
  onBack?: (() => void) | undefined;
}

/**
 * Encabezado visible durante lectura, preguntas y revisión: progreso
 * segmentado sobre los 16 ítems calificables + cronómetro visible sin corte.
 */
export function StudentTopBar({ progress, timerLabel, onBack }: StudentTopBarProps) {
  return (
    <div className="sticky top-0 z-10 space-y-2 bg-ink-50/95 px-4 pb-3 pt-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        ) : (
          <div className="size-9 shrink-0" />
        )}

        <div className="flex-1">
          {progress && (
            <ProgressBar total={16} current={progress.current} completed={progress.completed} />
          )}
        </div>

        <div
          className="flex shrink-0 items-center gap-1 rounded-pill bg-ink-100 px-3 py-1.5 text-sm font-bold text-ink-500 tabular-nums"
          aria-label={`Tiempo transcurrido: ${timerLabel}`}
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {timerLabel}
        </div>
      </div>
    </div>
  );
}
