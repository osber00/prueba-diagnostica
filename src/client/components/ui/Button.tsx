import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "info" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-cielo-400 text-[#173a4a] shadow-[0_4px_0_0_var(--color-cielo-600)] hover:bg-cielo-500 active:bg-cielo-500",
  info: "bg-rio-600 text-white shadow-[0_4px_0_0_var(--color-rio-700)] hover:bg-rio-700 active:bg-rio-700",
  secondary:
    "bg-white text-ink-900 border-2 border-ink-200 shadow-[0_4px_0_0_var(--color-ink-300)] hover:bg-cielo-100",
  danger:
    "bg-alerta-600 text-white shadow-[0_4px_0_0_var(--color-alerta-700)] hover:bg-alerta-700 active:bg-alerta-700",
  ghost: "bg-transparent text-ink-700 hover:bg-ink-100",
};

const SIZES: Record<Size, string> = {
  // 48 px y 56 px: por encima del mínimo táctil recomendado de 44 px.
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-14 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "lg",
  fullWidth = true,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const hasShadow = variant !== "ghost";

  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold uppercase tracking-wide",
        "transition-[transform,background-color,filter] duration-100",
        // El hundido solo aplica cuando el botón está activo: si está
        // deshabilitado no debe dar la sensación de que respondió.
        hasShadow && !disabled
          ? "active:translate-y-1 active:shadow-none"
          : undefined,
        disabled && "cursor-not-allowed opacity-50 shadow-none",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {children}
    </button>
  );
}
