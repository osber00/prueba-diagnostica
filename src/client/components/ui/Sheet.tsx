import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Bottom sheet para releer el texto.
 *
 * Se desliza desde abajo, cubre ~80 % de la pantalla y permite scroll interno.
 * El estudiante puede cerrarlo con Escape, el botón de cierre o tocando el
 * backdrop (fondo oscurecido).
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      // Bloquea el scroll del body mientras el sheet está abierto.
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/40 animate-pop-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full max-h-[80dvh] bg-white rounded-t-3xl shadow-2xl",
          "flex flex-col animate-slide-up safe-bottom",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        {/* Barra de arrastre visual (no funcional, pero indica que es dismissible) */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-pill bg-ink-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink-100">
          <h2 id="sheet-title" className="text-lg font-extrabold text-ink-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full hover:bg-ink-100 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
