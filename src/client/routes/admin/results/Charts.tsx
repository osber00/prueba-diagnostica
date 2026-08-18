import { useMemo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { AnalyticsResponse, ItemStat, PairedResult, PerformanceBandKey } from "@shared/types";
import { OPTION_LETTERS, TOTAL_ITEMS } from "@shared/types";

/**
 * Paleta de la identidad Macaján, tal como está definida en `app.css`.
 * Recharts pinta con SVG `fill`, que sí acepta `var(--token)`.
 */
const COLORS = {
  terracota: "var(--color-terracota-500)",
  rio: "var(--color-rio-500)",
  cosecha: "var(--color-cosecha-500)",
  ciruela: "var(--color-ciruela-500)",
  follaje: "var(--color-follaje-500)",
  alerta: "var(--color-alerta-500)",
  ink: "var(--color-ink-300)",
};

const DISTRACTOR_COLORS: Record<(typeof OPTION_LETTERS)[number], string> = {
  A: COLORS.rio,
  B: COLORS.terracota,
  C: COLORS.cosecha,
  D: COLORS.ciruela,
};

const BAND_COLORS: Record<PerformanceBandKey, string> = {
  bajo: COLORS.alerta,
  basico: COLORS.cosecha,
  satisfactorio: COLORS.rio,
  avanzado: COLORS.follaje,
};

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-card border-2 border-ink-200 bg-white p-5">
      <h3 className="text-sm font-extrabold text-ink-900">{title}</h3>
      {/*
        Recharts dibuja SVG puro sin semántica accesible propia. Los mismos
        datos ya están disponibles en la tabla de resultados y en la tabla
        de psicometría (ambas navegables por teclado y lector de pantalla),
        así que aquí basta con anunciar el gráfico como una imagen con
        nombre, en lugar de duplicar los valores en texto.
      */}
      <div role="img" aria-label={title}>
        {children}
      </div>
    </div>
  );
}

/** Histograma de puntajes 0-16, agrupado en franjas de 2 puntos para que se lea en pantallas móviles. */
function buildHistogram(scores: number[]): { bucket: string; count: number }[] {
  const buckets: { label: string; min: number; max: number }[] = [];
  for (let min = 0; min <= TOTAL_ITEMS; min += 2) {
    const max = Math.min(min + 1, TOTAL_ITEMS);
    buckets.push({ label: min === max ? `${min}` : `${min}-${max}`, min, max });
  }
  return buckets.map((b) => ({
    bucket: b.label,
    count: scores.filter((s) => s >= b.min && s <= b.max).length,
  }));
}

export default function Charts({
  analytics,
  pairs,
}: {
  analytics: AnalyticsResponse;
  pairs: PairedResult[];
}) {
  const dimensionData = useMemo(() => {
    const n = analytics.attempts.length || 1;
    const causal = analytics.attempts.reduce((s, a) => s + a.scoreCausal, 0) / n;
    const predictive = analytics.attempts.reduce((s, a) => s + a.scorePredictive, 0) / n;
    return [
      { dimension: "Causal", promedio: Number(causal.toFixed(2)) },
      { dimension: "Predictiva", promedio: Number(predictive.toFixed(2)) },
    ];
  }, [analytics.attempts]);

  const difficultyData = useMemo(
    () =>
      [...analytics.items]
        .sort((a, b) => a.number - b.number)
        .map((item: ItemStat) => ({
          item: `Ítem ${item.number}`,
          dificultad: Number((item.difficulty * 100).toFixed(0)),
        })),
    [analytics.items],
  );

  const distractorData = useMemo(
    () =>
      [...analytics.items]
        .sort((a, b) => a.number - b.number)
        .map((item) => ({ item: `${item.number}`, ...item.distractors })),
    [analytics.items],
  );

  const histogramData = useMemo(
    () => buildHistogram(analytics.attempts.map((a) => a.scoreTotal)),
    [analytics.attempts],
  );

  const bandData = useMemo(
    () => analytics.bands.filter((b) => b.count > 0).map((b) => ({ ...b, fill: BAND_COLORS[b.key] })),
    [analytics.bands],
  );

  const scatterData = useMemo(
    () =>
      analytics.attempts.map((a) => ({
        minutos: Number((a.elapsedMs / 60_000).toFixed(1)),
        puntaje: a.scoreTotal,
        nombre: a.label ?? a.code,
      })),
    [analytics.attempts],
  );

  const pairedData = useMemo(() => {
    if (pairs.length === 0) return [];
    const n = pairs.length;
    const avg = (pick: (p: PairedResult) => number) => pairs.reduce((s, p) => s + pick(p), 0) / n;
    return [
      {
        dimension: "Total",
        pretest: Number(avg((p) => p.pretest.scoreTotal).toFixed(2)),
        postest: Number(avg((p) => p.postest.scoreTotal).toFixed(2)),
      },
      {
        dimension: "Causal",
        pretest: Number(avg((p) => p.pretest.scoreCausal).toFixed(2)),
        postest: Number(avg((p) => p.postest.scoreCausal).toFixed(2)),
      },
      {
        dimension: "Predictiva",
        pretest: Number(avg((p) => p.pretest.scorePredictive).toFixed(2)),
        postest: Number(avg((p) => p.postest.scorePredictive).toFixed(2)),
      },
    ];
  }, [pairs]);

  if (analytics.attempts.length === 0) {
    return (
      <div className="rounded-card border-2 border-dashed border-ink-200 p-8 text-center text-sm text-ink-700">
        Todavía no hay intentos completados en esta fase para graficar.
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Comparación causal vs. predictiva (promedio sobre 8)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dimensionData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink} />
            <XAxis dataKey="dimension" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 8]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="promedio" fill={COLORS.rio} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Dificultad por ítem (% de aciertos)">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={difficultyData} layout="vertical" margin={{ left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="item" width={64} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="dificultad" fill={COLORS.terracota} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Histograma de puntajes (0-16)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink} />
            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" name="Estudiantes" fill={COLORS.cosecha} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Análisis de distractores por ítem">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={distractorData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink} />
            <XAxis dataKey="item" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {OPTION_LETTERS.map((letter) => (
              <Bar
                key={letter}
                dataKey={letter}
                stackId="opciones"
                fill={DISTRACTOR_COLORS[letter]}
                name={`Opción ${letter}`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Niveles de desempeño">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={bandData}
              dataKey="count"
              nameKey="label"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
            >
              {bandData.map((band) => (
                <Cell key={band.key} fill={band.fill} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tiempo empleado vs. puntaje">
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink} />
            <XAxis
              type="number"
              dataKey="minutos"
              name="Minutos"
              unit=" min"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="puntaje"
              name="Puntaje"
              domain={[0, TOTAL_ITEMS]}
              tick={{ fontSize: 12 }}
            />
            <ZAxis range={[80, 80]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={scatterData} fill={COLORS.ciruela} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {pairedData.length > 0 && (
        <ChartCard title={`Comparación pareada pretest-postest (n = ${pairs.length})`}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pairedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.ink} />
              <XAxis dataKey="dimension" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="pretest" name="Pretest" fill={COLORS.rio} radius={[6, 6, 0, 0]} />
              <Bar dataKey="postest" name="Postest" fill={COLORS.follaje} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
