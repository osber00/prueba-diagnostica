import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveAttemptRow } from "@shared/types";
import { ApiRequestError, fetchLive } from "@/lib/adminApi";
import { cn } from "@/lib/cn";

const POLL_INTERVAL_MS = 10_000;

function timeAgo(fromMs: number, nowMs: number): string {
  const seconds = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `hace ${hours} h`;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function MonitorPage() {
  const [attempts, setAttempts] = useState<LiveAttemptRow[]>([]);
  const [serverTime, setServerTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshSequence = useRef(0);

  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    try {
      const data = await fetchLive();
      if (sequence !== refreshSequence.current) return;
      setAttempts(data.attempts);
      setServerTime(data.serverTime);
      setError(null);
    } catch (err) {
      if (sequence !== refreshSequence.current) return;
      setError(
        err instanceof ApiRequestError ? err.message : "No se pudo actualizar el monitor.",
      );
    } finally {
      if (sequence === refreshSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-ink-900">Monitor en vivo</h1>
          <p className="text-sm text-ink-700">
            Se actualiza automáticamente cada 10 segundos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl border-2 border-ink-200 px-3 py-1.5 text-sm font-bold text-ink-700 hover:bg-ink-100"
        >
          Actualizar ahora
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-alerta-50 px-4 py-3 text-sm font-semibold text-alerta-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-700">Cargando…</p>
      ) : attempts.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-ink-200 p-8 text-center">
          <p className="text-sm text-ink-700">
            Nadie está respondiendo la prueba en este momento.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border-2 border-ink-200 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink-100 text-xs uppercase text-ink-700">
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Fase</th>
                <th className="px-4 py-3">Progreso</th>
                <th className="px-4 py-3">Tiempo en la prueba</th>
                <th className="px-4 py-3">Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                const stale = serverTime - a.last_seen_at > 5 * 60_000;
                return (
                  <tr key={a.attempt_id} className="border-b border-ink-100">
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink-900">{a.label ?? a.code}</p>
                      <p className="font-mono text-xs text-ink-700">{a.code}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {a.phase === "pretest" ? "Pretest" : "Postest"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-pill bg-ink-100">
                          <div
                            className="h-full rounded-pill bg-terracota-500"
                            style={{ width: `${(a.answered / 16) * 100}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-ink-700">{a.answered}/16</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink-700">
                      {formatDuration(serverTime - a.started_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "font-semibold",
                          stale ? "text-alerta-600" : "text-follaje-600",
                        )}
                      >
                        {timeAgo(a.last_seen_at, serverTime)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
