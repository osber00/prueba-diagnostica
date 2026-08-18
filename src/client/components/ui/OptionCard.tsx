import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface OptionCardProps {
  selected?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

/**
 * Tarjeta de opción de respuesta.
 *
 * Características clave:
 * - Altura mínima 64 px (área táctil > 44 px recomendado).
 * - Borde grueso (3 px) que se engrosa al seleccionar.
 * - Sin letras A-D visibles: el orden se baraja y las letras no coincidirían
 *   con la clave. La selección es puramente visual.
 * - Estados: normal, seleccionada, correcta (solo feedback de calentamiento),
 *   incorrecta (solo feedback de calentamiento).
 */
export function OptionCard({
  selected = false,
  correct = false,
  incorrect = false,
  disabled = false,
  onClick,
  children,
}: OptionCardProps) {
  const isInteractive = !disabled && onClick !== undefined;

  return (
    <button
      type="button"
      disabled={disabled || !isInteractive}
      onClick={onClick}
      className={cn(
        "group relative w-full min-h-16 px-5 py-4 rounded-2xl text-left",
        "border-3 transition-all duration-150",
        // Estados mutuamente excluyentes
        correct &&
          "border-follaje-500 bg-follaje-300/20 text-follaje-700 shadow-[0_2px_0_0_var(--color-follaje-600)]",
        incorrect &&
          "border-alerta-500 bg-alerta-50 text-alerta-700 shadow-[0_2px_0_0_var(--color-alerta-600)]",
        selected &&
          !correct &&
          !incorrect &&
          "border-rio-500 bg-rio-50 shadow-[0_2px_0_0_var(--color-rio-600)]",
        !selected &&
          !correct &&
          !incorrect &&
          "border-ink-200 bg-white hover:bg-ink-50",
        isInteractive && !disabled && "cursor-pointer active:scale-[0.98]",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <p className="text-base leading-relaxed text-balance-pretty">{children}</p>
    </button>
  );
}
