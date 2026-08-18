import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { AdminCodeRow, Phase } from "@shared/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  ApiRequestError,
  generateCodes,
  listCodes,
  resetCode,
  revokeCode,
} from "@/lib/adminApi";

interface Batch {
  id: string;
  codes: AdminCodeRow[];
  phase: Phase;
  createdAt: number;
}

export function CodesPage() {
  const [codes, setCodes] = useState<AdminCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<"all" | Phase>("all");
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [printBatch, setPrintBatch] = useState<Batch | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { codes: rows } = await listCodes();
      setCodes(rows);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiRequestError ? err.message : "No se pudo cargar la lista de códigos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const batches = useMemo<Batch[]>(() => {
    const map = new Map<string, AdminCodeRow[]>();
    for (const row of codes) {
      const key = row.batch_id ?? "sin-lote";
      const bucket = map.get(key);
      if (bucket) bucket.push(row);
      else map.set(key, [row]);
    }
    return [...map.entries()]
      .map(([id, rows]) => ({
        id,
        codes: rows,
        phase: rows[0]?.phase ?? "pretest",
        createdAt: Math.max(...rows.map((r) => r.created_at)),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [codes]);

  const filteredCodes = useMemo(
    () => (phaseFilter === "all" ? codes : codes.filter((c) => c.phase === phaseFilter)),
    [codes, phaseFilter],
  );
  const filteredBatches = useMemo(
    () => (phaseFilter === "all" ? batches : batches.filter((b) => b.phase === phaseFilter)),
    [batches, phaseFilter],
  );
  const clearPrintBatch = useCallback(() => setPrintBatch(null), []);

  async function handleAction(id: number, action: "revoke" | "reset", label: string) {
    const message =
      action === "revoke"
        ? `¿Anular el código "${label}"? El estudiante ya no podrá usarlo.`
        : `¿Reiniciar el intento de "${label}"? Se borrarán sus respuestas y podrá volver a empezar.`;

    if (!window.confirm(message)) return;

    setBusyId(id);
    try {
      if (action === "revoke") await revokeCode(id);
      else await resetCode(id);
      await refresh();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError ? err.message : "No se pudo completar la acción.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="space-y-8 print:hidden">
        <GenerateForm
          onGenerated={(batchId) => {
            setLastBatchId(batchId);
            void refresh();
          }}
        />

        {lastBatchId && (
          <BatchBanner
            batch={batches.find((b) => b.id === lastBatchId) ?? null}
            onPrint={setPrintBatch}
            onDismiss={() => setLastBatchId(null)}
          />
        )}

        <section className="space-y-3 rounded-card border-2 border-ink-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-ink-900">Lotes generados</h2>
            <PhaseFilter
              label="Filtrar lotes por fase"
              value={phaseFilter}
              onChange={setPhaseFilter}
            />
          </div>

          {filteredBatches.length === 0 ? (
            <p className="text-sm text-ink-700">
              {batches.length === 0
                ? "Todavía no se han generado códigos."
                : "No hay lotes que coincidan con el filtro."}
            </p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {filteredBatches.map((batch) => (
                <li key={batch.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <span className="font-bold text-ink-900">{batch.codes.length} códigos</span>{" "}
                    <PhaseBadge phase={batch.phase} />{" "}
                    <span className="text-ink-700">
                      · {new Date(batch.createdAt).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrintBatch(batch)}
                    className="rounded-lg border-2 border-ink-200 px-3 py-1 text-xs font-bold text-ink-700 hover:bg-ink-100"
                  >
                    🖨️ Imprimir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-card border-2 border-ink-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-ink-900">Todos los códigos</h2>
            <PhaseFilter
              label="Filtrar códigos por fase"
              value={phaseFilter}
              onChange={setPhaseFilter}
            />
          </div>

          {loading && <p className="text-sm text-ink-700">Cargando…</p>}
          {loadError && (
            <p role="alert" className="rounded-xl bg-alerta-50 px-4 py-3 text-sm font-semibold text-alerta-700">
              {loadError}
            </p>
          )}

          {!loading && !loadError && (
            <CodesTable codes={filteredCodes} busyId={busyId} onAction={handleAction} />
          )}
        </section>
      </div>

      {printBatch && <PrintSheet batch={printBatch} onPrinted={clearPrintBatch} />}
    </>
  );
}

/* ---------------------------------------------------------------------------
   Formulario de generación
--------------------------------------------------------------------------- */

function GenerateForm({ onGenerated }: { onGenerated: (batchId: string) => void }) {
  const [quantity, setQuantity] = useState("37");
  const [phase, setPhase] = useState<Phase>("pretest");
  const [namesText, setNamesText] = useState("");
  const [notes, setNotes] = useState("");
  const [validForDays, setValidForDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const names = namesText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const usingNames = names.length > 0;
  const effectiveQuantity = usingNames ? names.length : Number(quantity) || 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (effectiveQuantity < 1 || effectiveQuantity > 100) {
      setError("La cantidad debe estar entre 1 y 100.");
      return;
    }

    setLoading(true);
    try {
      const res = await generateCodes({
        quantity: effectiveQuantity,
        phase,
        labels: usingNames ? names : undefined,
        notes: notes.trim() || undefined,
        validForDays: validForDays.trim() ? Number(validForDays) : undefined,
      });
      onGenerated(res.batchId);
      setNamesText("");
      setNotes("");
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "No se pudo generar. Revisa tu conexión.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-card border-2 border-ink-200 bg-white p-5">
      <h2 className="text-base font-extrabold text-ink-900">Generar códigos</h2>

      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="code-phase" className="block text-sm font-bold text-ink-700">
            Fase
          </label>
          <select
            id="code-phase"
            value={phase}
            onChange={(e) => setPhase(e.target.value as Phase)}
            className="w-full rounded-xl border-2 border-ink-200 px-3 py-2 text-sm font-semibold text-ink-900 focus:border-rio-500 focus:outline-none"
          >
            <option value="pretest">Pretest</option>
            <option value="postest">Postest</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="code-quantity" className="block text-sm font-bold text-ink-700">
            Cantidad {usingNames && <span className="font-normal text-ink-700">(según los nombres)</span>}
          </label>
          <input
            id="code-quantity"
            type="number"
            min={1}
            max={100}
            value={usingNames ? effectiveQuantity : quantity}
            disabled={usingNames}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-xl border-2 border-ink-200 px-3 py-2 text-sm font-semibold text-ink-900 focus:border-rio-500 focus:outline-none disabled:bg-ink-100 disabled:text-ink-500"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="code-names" className="block text-sm font-bold text-ink-700">
            Nombres (opcional, uno por línea)
          </label>
          <textarea
            id="code-names"
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            rows={4}
            placeholder={"Ana Gómez\nLuis Pérez\nMaría Díaz…"}
            className="w-full rounded-xl border-2 border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-rio-500 focus:outline-none"
          />
          <p className="text-xs text-ink-700">
            Si dejas esto vacío, se generan códigos anónimos que puedes asignar en papel.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="code-validity" className="block text-sm font-bold text-ink-700">
            Vigencia en días (opcional)
          </label>
          <input
            id="code-validity"
            type="number"
            min={1}
            max={365}
            value={validForDays}
            onChange={(e) => setValidForDays(e.target.value)}
            placeholder="Sin vencimiento"
            className="w-full rounded-xl border-2 border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-rio-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="code-notes" className="block text-sm font-bold text-ink-700">
            Notas (opcional)
          </label>
          <input
            id="code-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Aplicación piloto noveno 1"
            className="w-full rounded-xl border-2 border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-rio-500 focus:outline-none"
          />
        </div>

        {error && (
          <p role="alert" className="sm:col-span-2 rounded-xl bg-alerta-50 px-4 py-3 text-sm font-semibold text-alerta-700">
            {error}
          </p>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading} fullWidth={false} size="md">
            {loading ? "Generando…" : `Generar ${effectiveQuantity || ""} código${effectiveQuantity === 1 ? "" : "s"}`}
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Aviso tras generar un lote
--------------------------------------------------------------------------- */

function BatchBanner({
  batch,
  onPrint,
  onDismiss,
}: {
  batch: Batch | null;
  onPrint: (batch: Batch) => void;
  onDismiss: () => void;
}) {
  if (!batch) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border-2 border-follaje-500 bg-follaje-300/20 p-4">
      <p className="text-sm font-semibold text-follaje-700">
        Se generaron {batch.codes.length} códigos correctamente.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPrint(batch)}
          className="rounded-lg bg-follaje-600 px-3 py-1.5 text-xs font-bold text-white hover:brightness-105"
        >
          🖨️ Imprimir esta hoja
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-3 py-1.5 text-xs font-bold text-follaje-700 hover:bg-follaje-300/30"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Filtro de fase
--------------------------------------------------------------------------- */

function PhaseFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "all" | Phase;
  onChange: (v: "all" | Phase) => void;
}) {
  const options: { value: "all" | Phase; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "pretest", label: "Pretest" },
    { value: "postest", label: "Postest" },
  ];

  return (
    <div role="group" aria-label={label} className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
            value === opt.value
              ? "bg-ink-900 text-white"
              : "bg-ink-100 text-ink-700 hover:bg-ink-200",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PhaseBadge({ phase }: { phase: Phase }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-bold",
        phase === "pretest" ? "bg-rio-100 text-rio-700" : "bg-ciruela-100 text-ciruela-700",
      )}
    >
      {phase === "pretest" ? "Pretest" : "Postest"}
    </span>
  );
}

/* ---------------------------------------------------------------------------
   Tabla de códigos
--------------------------------------------------------------------------- */

function statusInfo(row: AdminCodeRow): { label: string; className: string } {
  if (row.status === "revoked") return { label: "Anulado", className: "bg-ink-200 text-ink-700" };
  if (row.attempt_status === "completed") {
    return { label: "Completado", className: "bg-follaje-300/40 text-follaje-700" };
  }
  if (row.attempt_status === "in_progress") {
    return { label: "En curso", className: "bg-rio-100 text-rio-700" };
  }
  return { label: "Sin usar", className: "bg-ink-100 text-ink-700" };
}

function CodesTable({
  codes,
  busyId,
  onAction,
}: {
  codes: AdminCodeRow[];
  busyId: number | null;
  onAction: (id: number, action: "revoke" | "reset", label: string) => void;
}) {
  if (codes.length === 0) {
    return <p className="text-sm text-ink-700">No hay códigos que coincidan con el filtro.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b-2 border-ink-100 text-xs uppercase text-ink-700">
            <th className="py-2 pr-3">Código</th>
            <th className="py-2 pr-3">Nombre</th>
            <th className="py-2 pr-3">Fase</th>
            <th className="py-2 pr-3">Estado</th>
            <th className="py-2 pr-3">Progreso</th>
            <th className="py-2 pr-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((row) => {
            const status = statusInfo(row);
            const label = row.label ?? row.code;
            const busy = busyId === row.id;

            return (
              <tr key={row.id} className="border-b border-ink-100">
                <td className="py-2.5 pr-3 font-mono font-bold tracking-wide text-ink-900">
                  {row.code}
                </td>
                <td className="py-2.5 pr-3 text-ink-700">{row.label ?? "—"}</td>
                <td className="py-2.5 pr-3">
                  <PhaseBadge phase={row.phase} />
                </td>
                <td className="py-2.5 pr-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", status.className)}>
                    {status.label}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-ink-700 tabular-nums">
                  {row.answered !== null ? `${row.answered}/16` : "—"}
                  {row.score_total !== null && (
                    <span className="ml-1 text-ink-700">· {row.score_total} pts</span>
                  )}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex gap-2">
                    {row.status !== "revoked" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onAction(row.id, "revoke", label)}
                        className="rounded-lg border-2 border-alerta-500 px-2 py-1 text-xs font-bold text-alerta-600 hover:bg-alerta-50 disabled:opacity-50"
                      >
                        Anular
                      </button>
                    )}
                    {row.attempt_id !== null && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onAction(row.id, "reset", label)}
                        className="rounded-lg border-2 border-cosecha-500 px-2 py-1 text-xs font-bold text-cosecha-700 hover:bg-cosecha-50 disabled:opacity-50"
                      >
                        Reiniciar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Hoja imprimible
--------------------------------------------------------------------------- */

function PrintSheet({ batch, onPrinted }: { batch: Batch; onPrinted: () => void }) {
  useEffect(() => {
    // Se espera al siguiente cuadro para asegurar que el navegador ya pintó
    // la hoja oculta antes de abrir el diálogo de impresión.
    const id = requestAnimationFrame(() => {
      window.print();
      onPrinted();
    });
    return () => cancelAnimationFrame(id);
  }, [batch.id, onPrinted]);

  return (
    <div className="hidden print:block">
      <h1 className="mb-4 text-lg font-bold">
        Códigos de acceso — {batch.phase === "pretest" ? "Pretest" : "Postest"} · I.E. Macaján
      </h1>
      <div className="grid grid-cols-2 gap-4">
        {batch.codes.map((c) => (
          <div key={c.id} className="break-inside-avoid rounded-lg border-2 border-black p-4">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              Prueba de comprensión lectora · {c.phase === "pretest" ? "Pretest" : "Postest"}
            </p>
            <p className="mt-1 text-sm">
              Nombre: {c.label ?? "_______________________"}
            </p>
            <p className="mt-2 text-2xl font-mono font-bold tracking-widest">{c.code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
