import type { ItemStat } from "@shared/types";
import { OPTION_LETTERS } from "@shared/types";
import { cn } from "@/lib/cn";

/**
 * Umbrales convencionales para interpretar KR-20 (George y Mallery, 2003):
 * son una guía, no un corte estricto, sobre todo con la n reducida de este
 * estudio.
 */
function kr20Label(value: number): { label: string; className: string } {
  if (value >= 0.9) return { label: "Excelente", className: "bg-follaje-300/40 text-follaje-700" };
  if (value >= 0.8) return { label: "Buena", className: "bg-rio-100 text-rio-700" };
  if (value >= 0.7) return { label: "Aceptable", className: "bg-cosecha-100 text-cosecha-700" };
  return { label: "Cuestionable", className: "bg-alerta-100 text-alerta-700" };
}

/** Discriminación por debajo de este umbral se marca como débil (Ebel, 1979). */
const WEAK_DISCRIMINATION = 0.2;

function difficultyLabel(p: number): string | null {
  if (p >= 0.9) return "muy fácil";
  if (p <= 0.2) return "muy difícil";
  return null;
}

export function ItemStatsTable({
  items,
  n,
  fullyAnsweredN,
  kr20,
}: {
  items: ItemStat[];
  n: number;
  fullyAnsweredN: number;
  kr20: number | null;
}) {
  const kr = kr20 !== null ? kr20Label(kr20) : null;

  return (
    <section className="space-y-3 rounded-card border-2 border-ink-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-extrabold text-ink-900">Psicometría por ítem</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-ink-700">KR-20:</span>
          {kr20 !== null ? (
            <>
              <span className="font-mono font-bold text-ink-900">{kr20.toFixed(3)}</span>
              {kr && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", kr.className)}>
                  {kr.label}
                </span>
              )}
            </>
          ) : (
            <span className="text-ink-700">No calculable (muestra insuficiente)</span>
          )}
        </div>
      </div>

      <p
        role="note"
        className="rounded-xl bg-cosecha-50 px-4 py-3 text-sm text-cosecha-700"
      >
        Con n = {fullyAnsweredN} estudiante{fullyAnsweredN === 1 ? "" : "s"}, estos índices
        son ilustrativos: una muestra tan pequeña produce estimaciones inestables de
        dificultad, discriminación y confiabilidad. No deben interpretarse como
        propiedades psicométricas definitivas del instrumento.
      </p>

      {fullyAnsweredN < n && (
        <p role="alert" className="rounded-xl bg-alerta-50 px-4 py-3 text-sm text-alerta-700">
          {n - fullyAnsweredN} de los {n} intentos completados no respondieron los 16
          ítems y se excluyeron de este cálculo (solo se compara a quienes vieron el
          instrumento completo).
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-ink-700">No hay intentos completados en esta fase todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink-100 text-xs uppercase text-ink-700">
                <th className="py-2 pr-3">Ítem</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Clave</th>
                <th className="py-2 pr-3">Dificultad (p)</th>
                <th className="py-2 pr-3">Discriminación (D)</th>
                <th className="py-2 pr-3">Distractores (A / B / C / D)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const weak = item.discrimination !== null && item.discrimination < WEAK_DISCRIMINATION;
                const dLabel = difficultyLabel(item.difficulty);

                return (
                  <tr key={item.number} className="border-b border-ink-100">
                    <td className="py-2.5 pr-3 font-bold text-ink-900">{item.number}</td>
                    <td className="py-2.5 pr-3 text-ink-700">
                      {item.inferenceType === "causal" ? "Causal" : "Predictiva"}
                    </td>
                    <td className="py-2.5 pr-3 font-mono font-bold text-ink-900">
                      {item.correctOption}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-ink-700">
                      {(item.difficulty * 100).toFixed(0)}%
                      {dLabel && <span className="ml-1 text-xs text-alerta-600">({dLabel})</span>}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-ink-700">
                      {item.discrimination === null ? (
                        "—"
                      ) : (
                        <span className={weak ? "font-bold text-alerta-600" : undefined}>
                          {item.discrimination.toFixed(2)}
                          {weak && " (débil)"}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-wrap gap-1.5">
                        {OPTION_LETTERS.map((letter) => (
                          <span
                            key={letter}
                            className={cn(
                              "rounded-lg px-1.5 py-0.5 font-mono text-xs font-bold",
                              letter === item.correctOption
                                ? "bg-follaje-300/40 text-follaje-700 ring-1 ring-follaje-500"
                                : "bg-ink-100 text-ink-700",
                            )}
                            title={letter === item.correctOption ? "Opción correcta" : "Distractor"}
                          >
                            {letter}: {item.distractors[letter]}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
