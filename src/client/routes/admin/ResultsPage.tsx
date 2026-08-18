import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { AnalyticsAttempt, AnalyticsResponse, PairedResult, Phase } from "@shared/types";
import { TOTAL_ITEMS } from "@shared/types";
import { Tucan } from "@/components/illustrations";
import { cn } from "@/lib/cn";
import { ApiRequestError, fetchAnalytics, fetchPaired } from "@/lib/adminApi";
import { attemptsToLongCsv, attemptsToWideCsv, downloadTextFile } from "@/lib/csv";
import { ItemStatsTable } from "./results/ItemStatsTable";

const Charts = lazy(() => import("./results/Charts"));

type SortKey = "label" | "scoreTotal" | "scoreCausal" | "scorePredictive" | "elapsedMs" | "completedAt";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ResultsPage() {
  const [phase, setPhase] = useState<Phase>("pretest");
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [pairs, setPairs] = useState<PairedResult[]>([]);
  const [ambiguousLabels, setAmbiguousLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "completedAt",
    dir: "desc",
  });

  const refreshAnalytics = useCallback(async (targetPhase: Phase) => {
    setLoading(true);
    try {
      const a = await fetchAnalytics(targetPhase);
      setAnalytics(a);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "No se pudo cargar los resultados.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAnalytics(phase);
  }, [phase, refreshAnalytics]);

  // El apareo pretest-postest no depende de la fase seleccionada (compara
  // ambas a la vez), así que se carga una sola vez en lugar de repetirse en
  // cada cambio de pestaña.
  useEffect(() => {
    fetchPaired()
      .then((p) => {
        setPairs(p.pairs);
        setAmbiguousLabels(p.ambiguousLabels);
      })
      .catch(() => {
        // No bloquea la página: el apareo es un complemento de la tabla
        // principal. Si falla, simplemente no se muestra esa sección.
      });
  }, []);

  const sortedAttempts = useMemo(() => {
    if (!analytics) return [];
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...analytics.attempts].sort((a, b) => {
      switch (sort.key) {
        case "label":
          return dir * (a.label ?? a.code).localeCompare(b.label ?? b.code);
        case "scoreTotal":
          return dir * (a.scoreTotal - b.scoreTotal);
        case "scoreCausal":
          return dir * (a.scoreCausal - b.scoreCausal);
        case "scorePredictive":
          return dir * (a.scorePredictive - b.scorePredictive);
        case "elapsedMs":
          return dir * (a.elapsedMs - b.elapsedMs);
        case "completedAt":
        default:
          return dir * (a.completedAt - b.completedAt);
      }
    });
  }, [analytics, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function handleExport(kind: "wide" | "long" | "json") {
    if (!analytics || analytics.attempts.length === 0) return;
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === "wide") {
      downloadTextFile(
        `resultados-${phase}-ancho-${stamp}.csv`,
        attemptsToWideCsv(analytics.attempts, phase),
        "text/csv;charset=utf-8",
      );
    } else if (kind === "long") {
      downloadTextFile(
        `resultados-${phase}-largo-${stamp}.csv`,
        attemptsToLongCsv(analytics.attempts, phase),
        "text/csv;charset=utf-8",
      );
    } else {
      downloadTextFile(
        `resultados-${phase}-${stamp}.json`,
        JSON.stringify(analytics, null, 2),
        "application/json",
      );
    }
  }

  const summary = useMemo(() => {
    const n = analytics?.n ?? 0;
    if (!analytics || n === 0) return { n, meanScore: null, meanElapsedMs: null };
    return {
      n,
      meanScore: analytics.attempts.reduce((s, a) => s + a.scoreTotal, 0) / n,
      meanElapsedMs: analytics.attempts.reduce((s, a) => s + a.elapsedMs, 0) / n,
    };
  }, [analytics]);

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-card border-2 border-ink-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-ink-900">Resultados</h2>
          <div role="group" aria-label="Filtrar resultados por fase" className="flex gap-1.5">
            {(["pretest", "postest"] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={phase === p}
                onClick={() => setPhase(p)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                  phase === p ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-700 hover:bg-ink-200",
                )}
              >
                {p === "pretest" ? "Pretest" : "Postest"}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-sm text-ink-700">
            <Tucan mood="greeting" className="size-8 animate-float-soft" />
            Cargando resultados…
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-alerta-50 px-4 py-3 text-sm font-semibold text-alerta-700">
            {error}
          </p>
        )}

        {!loading && !error && analytics && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Estudiantes" value={String(summary.n)} />
            <SummaryCard
              label="Puntaje promedio"
              value={summary.meanScore !== null ? `${summary.meanScore.toFixed(1)} / ${TOTAL_ITEMS}` : "—"}
            />
            <SummaryCard
              label="Tiempo promedio"
              value={summary.meanElapsedMs !== null ? formatDuration(summary.meanElapsedMs) : "—"}
            />
            <SummaryCard label="Pares pretest-postest" value={String(pairs.length)} />
          </div>
        )}
      </section>

      {!loading && !error && analytics && (
        <>
          <section className="space-y-3 rounded-card border-2 border-ink-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-ink-900">Exportar datos</h2>
              <div className="flex flex-wrap gap-2">
                <ExportButton
                  label="CSV ancho"
                  disabled={analytics.attempts.length === 0}
                  onClick={() => handleExport("wide")}
                />
                <ExportButton
                  label="CSV largo (SPSS/R)"
                  disabled={analytics.attempts.length === 0}
                  onClick={() => handleExport("long")}
                />
                <ExportButton
                  label="JSON"
                  disabled={analytics.attempts.length === 0}
                  onClick={() => handleExport("json")}
                />
              </div>
            </div>
            <p className="text-xs text-ink-700">
              El CSV ancho tiene una fila por estudiante con una columna por ítem (1 = correcto);
              el CSV largo tiene una fila por respuesta, con la opción elegida y su posición en
              pantalla.
            </p>
          </section>

          <ResultsTable attempts={sortedAttempts} sort={sort} onSort={toggleSort} />

          <ItemStatsTable
            items={analytics.items}
            n={analytics.n}
            fullyAnsweredN={analytics.fullyAnsweredN}
            kr20={analytics.kr20}
          />

          {ambiguousLabels.length > 0 && (
            <p role="alert" className="rounded-xl bg-alerta-50 px-4 py-3 text-sm text-alerta-700">
              {ambiguousLabels.length} nombre{ambiguousLabels.length === 1 ? "" : "s"} repetido
              {ambiguousLabels.length === 1 ? "" : "s"} dentro de la misma fase (
              {ambiguousLabels.join(", ")}) no se pudieron aparear entre pretest y postest con
              certeza; revisa si corresponden a estudiantes distintos con el mismo nombre.
            </p>
          )}

          <Suspense fallback={<ChartsFallback />}>
            <Charts analytics={analytics} pairs={pairs} />
          </Suspense>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 px-3 py-2.5">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-700">{label}</p>
      <p className="text-lg font-extrabold tabular-nums text-ink-900">{value}</p>
    </div>
  );
}

function ExportButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border-2 border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      ⬇️ {label}
    </button>
  );
}

function ChartsFallback() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-card border-2 border-dashed border-ink-200 p-10 text-sm text-ink-700">
      <Tucan mood="greeting" className="size-8 animate-float-soft" />
      Cargando gráficos…
    </div>
  );
}

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: "label", label: "Estudiante" },
  { key: "scoreTotal", label: "Total" },
  { key: "scoreCausal", label: "Causal" },
  { key: "scorePredictive", label: "Predictiva" },
  { key: "elapsedMs", label: "Tiempo" },
  { key: "completedAt", label: "Completado" },
];

function ResultsTable({
  attempts,
  sort,
  onSort,
}: {
  attempts: AnalyticsAttempt[];
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
}) {
  return (
    <section className="space-y-3 rounded-card border-2 border-ink-200 bg-white p-5">
      <h2 className="text-base font-extrabold text-ink-900">Tabla de resultados</h2>

      {attempts.length === 0 ? (
        <p className="text-sm text-ink-700">No hay intentos completados en esta fase todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink-100 text-xs uppercase text-ink-700">
                <th className="py-2 pr-3">Código</th>
                {SORT_COLUMNS.map((col) => (
                  <th key={col.key} className="py-2 pr-3" aria-sort={sort.key === col.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="flex items-center gap-1 font-bold uppercase text-ink-700 hover:text-ink-900"
                    >
                      {col.label}
                      {sort.key === col.key && <span aria-hidden="true">{sort.dir === "asc" ? "▲" : "▼"}</span>}
                    </button>
                  </th>
                ))}
                <th className="py-2 pr-3">Respondidos</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.attemptId} className="border-b border-ink-100">
                  <td className="py-2.5 pr-3 font-mono font-bold tracking-wide text-ink-900">
                    {a.code}
                  </td>
                  <td className="py-2.5 pr-3 text-ink-700">{a.label ?? "—"}</td>
                  <td className="py-2.5 pr-3 tabular-nums text-ink-900">
                    {a.scoreTotal}/{TOTAL_ITEMS}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums text-ink-700">{a.scoreCausal}/8</td>
                  <td className="py-2.5 pr-3 tabular-nums text-ink-700">{a.scorePredictive}/8</td>
                  <td className="py-2.5 pr-3 tabular-nums text-ink-700">{formatDuration(a.elapsedMs)}</td>
                  <td className="py-2.5 pr-3 text-ink-700">
                    {new Date(a.completedAt).toLocaleString("es-CO")}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums text-ink-700">{a.answers.length}/{TOTAL_ITEMS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
