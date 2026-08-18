import { useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Tucan } from "@/components/illustrations";
import { Button } from "@/components/ui/Button";
import { redeemCode, ApiRequestError } from "@/lib/api";

interface WelcomeScreenProps {
  onRedeemed: () => void;
}

/**
 * Da formato al código mientras el estudiante escribe: mayúsculas y guiones
 * en las posiciones correctas, sin obligarlo a teclearlos. Acepta que borre
 * o pegue el código completo desde un mensaje de texto.
 */
function formatAsTyped(value: string): string {
  const clean = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^MAC/, "");

  const groups = [clean.slice(0, 4), clean.slice(4, 8)].filter(Boolean);
  return ["MAC", ...groups].join("-");
}

export function WelcomeScreen({ onRedeemed }: WelcomeScreenProps) {
  const [code, setCode] = useState("MAC-");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isComplete = code.replace(/[^A-Z0-9]/g, "").length >= 11; // MAC + 8

  /**
   * El formato inserta guiones automáticamente, así que la longitud del
   * valor cambia con cada tecla. Si se deja que el navegador conserve la
   * posición relativa del cursor tras el re-render, el guión insertado
   * empuja el cursor hacia atrás y el siguiente carácter que el estudiante
   * escriba termina en medio del código en lugar de al final.
   *
   * Se corrige en un `useLayoutEffect` (no en `requestAnimationFrame`):
   * el efecto de layout corre de forma síncrona justo después de que React
   * actualiza el DOM y antes de que el navegador pinte, así que el cursor
   * queda en su lugar antes de que exista la posibilidad de una tecla
   * siguiente. `requestAnimationFrame` espera al próximo cuadro, lo cual en
   * un teclado rápido —o en tecleo simulado— llega tarde: el siguiente
   * carácter se inserta con el cursor todavía desactualizado y el código
   * termina revuelto.
   */
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setCode(formatAsTyped(e.target.value));
  }

  useLayoutEffect(() => {
    inputRef.current?.setSelectionRange(code.length, code.length);
  }, [code]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await redeemCode(code);
      onRedeemed();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "No se pudo conectar. Revisa tu conexión e intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-8">
      <div className="space-y-6 text-center">
        <Tucan mood="greeting" className="mx-auto size-28" />

        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold text-ink-900">
            Prueba de comprensión lectora
          </h1>
          <p className="text-sm text-ink-500">
            Institución Educativa Macaján · Grado noveno
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-2">
            <label htmlFor="code" className="block text-sm font-bold text-ink-700">
              Escribe el código que te dio tu profesor
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="code"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={code}
                onChange={handleChange}
                placeholder="MAC-4F7K-2P9Q"
                className="w-full rounded-2xl border-3 border-ink-200 bg-white px-4 py-4 pr-12 text-center text-xl font-bold tracking-widest text-ink-900 placeholder:text-ink-300 focus:border-rio-500 focus:outline-none"
              />
              {code !== "MAC-" && (
                <button
                  type="button"
                  onClick={() => {
                    setCode("MAC-");
                    setError(null);
                    inputRef.current?.focus();
                  }}
                  aria-label="Borrar el código y escribir de nuevo"
                  className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-300 hover:bg-ink-100 hover:text-ink-500"
                >
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-alerta-50 px-4 py-3 text-sm font-semibold text-alerta-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={!isComplete || loading}>
            {loading ? "Verificando…" : "Comenzar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
