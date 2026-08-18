import type { AnalyticsAttempt, Phase } from "@shared/types";
import { TOTAL_ITEMS } from "@shared/types";

/**
 * Escapa un valor para una celda CSV (RFC 4180: comillas, comas y saltos de
 * línea) y neutraliza la inyección de fórmulas de hoja de cálculo.
 *
 * `nombre` proviene de texto libre que el gestor escribe al generar los
 * códigos (`GenerateForm` en `CodesPage.tsx`). Si empezara por `=`, `+`, `-`
 * o `@`, Excel/Sheets lo interpretaría como una fórmula al abrir el CSV
 * exportado, permitiendo ejecutar código o filtrar datos (CSV/DDE
 * injection). Se antepone un apóstrofo para forzarlo a texto plano, igual
 * que hace Google Sheets al importar.
 */
function csvEscape(value: string | number): string {
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toRow(values: (string | number)[]): string {
  return values.map(csvEscape).join(",");
}

/**
 * CSV ancho: una fila por estudiante, una columna por ítem (1 = correcto,
 * 0 = incorrecto, vacío = no respondido). Es el formato típico para análisis
 * de confiabilidad (KR-20, alfa de Cronbach) en SPSS.
 */
export function attemptsToWideCsv(attempts: AnalyticsAttempt[], phase: Phase): string {
  const itemColumns = Array.from({ length: TOTAL_ITEMS }, (_, i) => `item_${i + 1}`);
  const header = [
    "codigo",
    "nombre",
    "fase",
    "puntaje_total",
    "puntaje_causal",
    "puntaje_predictiva",
    "tiempo_ms",
    "iniciado_en",
    "completado_en",
    ...itemColumns,
  ];

  const rows = attempts.map((a) => {
    const byNumber = new Map(a.answers.map((ans) => [ans.questionNumber, ans]));
    const itemValues: (string | number)[] = Array.from({ length: TOTAL_ITEMS }, (_, i) => {
      const ans = byNumber.get(i + 1);
      return ans ? (ans.isCorrect ? 1 : 0) : "";
    });
    return toRow([
      a.code,
      a.label ?? "",
      phase,
      a.scoreTotal,
      a.scoreCausal,
      a.scorePredictive,
      a.elapsedMs,
      new Date(a.startedAt).toISOString(),
      new Date(a.completedAt).toISOString(),
      ...itemValues,
    ]);
  });

  return [toRow(header), ...rows].join("\n");
}

/**
 * CSV largo: una fila por respuesta (estudiante × ítem). Es el formato
 * típico para modelos en R (lme4, mirt) o para análisis de distractores
 * dinámico, ya que conserva la opción elegida y la posición mostrada.
 */
export function attemptsToLongCsv(attempts: AnalyticsAttempt[], phase: Phase): string {
  const header = [
    "codigo",
    "nombre",
    "fase",
    "item",
    "tipo_inferencia",
    "opcion_elegida",
    "correcto",
    "posicion_mostrada",
    "tiempo_item_ms",
    "revisiones",
  ];

  const rows: string[] = [];
  for (const a of attempts) {
    for (const ans of [...a.answers].sort((x, y) => x.questionNumber - y.questionNumber)) {
      rows.push(
        toRow([
          a.code,
          a.label ?? "",
          phase,
          ans.questionNumber,
          ans.inferenceType,
          ans.selectedOption,
          ans.isCorrect ? 1 : 0,
          ans.displayedPosition,
          ans.timeSpentMs,
          ans.revisionCount,
        ]),
      );
    }
  }

  return [toRow(header), ...rows].join("\n");
}

/** Dispara la descarga de un archivo de texto generado en el cliente. */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
