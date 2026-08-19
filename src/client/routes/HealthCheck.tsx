import { useEffect, useState } from "react";
import type { HealthResponse } from "@shared/types";
import { GuiaLectura } from "@/components/illustrations";

type State =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error"; message: string };

/**
 * Pantalla temporal de la Fase 0.
 * Confirma que la SPA y el Worker se comunican antes de construir el flujo real.
 */
export function HealthCheck() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then((data) => setState({ kind: "ok", data }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Error desconocido",
        });
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5">
      <div className="w-full space-y-6 text-center">
        <GuiaLectura mood="greeting" className="mx-auto size-24" />


        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold text-ink-900">
            Prueba de comprensión lectora
          </h1>
          <p className="text-sm text-ink-500">
            Institución Educativa Macaján · Grado noveno
          </p>
        </div>

        <div className="rounded-card border-2 border-ink-200 bg-ink-50 p-5 text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-300">
            Estado del sistema
          </p>

          {state.kind === "loading" && (
            <p className="text-sm text-ink-500">Verificando conexión…</p>
          )}

          {state.kind === "ok" && (
            <dl className="space-y-2 text-sm">
              <Row label="Worker" value="conectado" tone="ok" />
              <Row
                label="Base de datos"
                value={state.data.database}
                tone={state.data.database === "conectada" ? "ok" : "warn"}
              />
              <Row label="Instrumento" value={`${state.data.items} ítems`} tone="neutral" />
            </dl>
          )}

          {state.kind === "error" && (
            <p className="text-sm font-semibold text-alerta-600">
              Sin conexión con el servidor: {state.message}
            </p>
          )}
        </div>

        <p className="text-xs text-ink-300">
          Fase 0 · andamiaje verificado
        </p>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "ok"
      ? "text-terracota-600"
      : tone === "warn"
        ? "text-cosecha-700"
        : "text-ink-500";

  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className={`font-bold ${toneClass}`}>{value}</dd>
    </div>
  );
}
