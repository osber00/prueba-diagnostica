import { useEffect, useState } from "react";

/**
 * Cronómetro visual del intento.
 *
 * Es puramente informativo: no se sincroniza con el servidor ni impone un
 * corte de tiempo. El tiempo real que cuenta para el análisis se calcula en
 * cada autoguardado a partir de `startedAt`, que sí viaja al servidor.
 */
export function useElapsedTimer(startedAt: number): { label: string; elapsedMs: number } {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = Math.max(0, now - startedAt);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return { label: `${minutes}:${seconds.toString().padStart(2, "0")}`, elapsedMs };
}
