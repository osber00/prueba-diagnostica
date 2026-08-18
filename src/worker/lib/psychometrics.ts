import type { InferenceType, ItemStat, OptionLetter } from "@shared/types";

export interface AnswerForStats {
  questionNumber: number;
  inferenceType: InferenceType;
  textId: number;
  correctOption: OptionLetter;
  selectedOption: OptionLetter;
  isCorrect: boolean;
}

export interface AttemptForStats {
  attemptId: number;
  scoreTotal: number;
  answers: AnswerForStats[];
}

/** Tamaño mínimo de muestra para formar grupos extremos con algún sentido. */
const MIN_N_FOR_DISCRIMINATION = 8;

/**
 * Calcula dificultad, discriminación y distribución de distractores por ítem.
 *
 * La discriminación usa el método clásico de grupos extremos (27% superior
 * contra 27% inferior por puntaje total): es el procedimiento recomendado
 * cuando la muestra es pequeña y no se justifica una correlación
 * punto-biserial completa.
 */
export function computeItemStats(attempts: AttemptForStats[]): ItemStat[] {
  const byQuestion = new Map<
    number,
    {
      inferenceType: InferenceType;
      textId: number;
      correctOption: OptionLetter;
      answers: { attemptId: number; selected: OptionLetter; correct: boolean }[];
    }
  >();

  for (const attempt of attempts) {
    for (const a of attempt.answers) {
      let bucket = byQuestion.get(a.questionNumber);
      if (!bucket) {
        bucket = {
          inferenceType: a.inferenceType,
          textId: a.textId,
          correctOption: a.correctOption,
          answers: [],
        };
        byQuestion.set(a.questionNumber, bucket);
      }
      bucket.answers.push({
        attemptId: attempt.attemptId,
        selected: a.selectedOption,
        correct: a.isCorrect,
      });
    }
  }

  // Grupos extremos por puntaje total, calculados una sola vez para todos los ítems.
  const sorted = [...attempts].sort((a, b) => b.scoreTotal - a.scoreTotal);
  const groupSize = Math.max(1, Math.round(sorted.length * 0.27));
  const enoughForGroups =
    attempts.length >= MIN_N_FOR_DISCRIMINATION && sorted.length >= 2 * groupSize;
  const topIds = new Set(sorted.slice(0, groupSize).map((a) => a.attemptId));
  const bottomIds = new Set(sorted.slice(-groupSize).map((a) => a.attemptId));

  const items: ItemStat[] = [];
  for (const [number, bucket] of [...byQuestion.entries()].sort((a, b) => a[0] - b[0])) {
    const total = bucket.answers.length;
    const correctCount = bucket.answers.filter((a) => a.correct).length;
    const distractors: Record<OptionLetter, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const a of bucket.answers) distractors[a.selected]++;

    let discrimination: number | null = null;
    if (enoughForGroups) {
      const topAnswers = bucket.answers.filter((a) => topIds.has(a.attemptId));
      const bottomAnswers = bucket.answers.filter((a) => bottomIds.has(a.attemptId));
      if (topAnswers.length > 0 && bottomAnswers.length > 0) {
        const pTop = topAnswers.filter((a) => a.correct).length / topAnswers.length;
        const pBottom = bottomAnswers.filter((a) => a.correct).length / bottomAnswers.length;
        discrimination = pTop - pBottom;
      }
    }

    items.push({
      number,
      inferenceType: bucket.inferenceType,
      textId: bucket.textId,
      correctOption: bucket.correctOption,
      difficulty: total > 0 ? correctCount / total : 0,
      discrimination,
      distractors,
      totalResponses: total,
    });
  }

  return items;
}

/**
 * KR-20: coeficiente de consistencia interna para ítems dicotómicos
 * (Kuder-Richardson fórmula 20).
 *
 *   KR-20 = (k / (k-1)) * (1 - Σ(p·q) / σ²)
 *
 * `null` cuando la muestra es demasiado pequeña (n < 2) o la varianza total
 * es cero (todos los estudiantes obtuvieron el mismo puntaje), porque la
 * fórmula divide entre esa varianza.
 */
export function computeKR20(items: ItemStat[], totalScores: number[]): number | null {
  const k = items.length;
  const n = totalScores.length;
  if (k < 2 || n < 2) return null;

  const mean = totalScores.reduce((sum, s) => sum + s, 0) / n;
  const variance = totalScores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / n;
  if (variance === 0) return null;

  const sumPQ = items.reduce((sum, item) => sum + item.difficulty * (1 - item.difficulty), 0);

  return (k / (k - 1)) * (1 - sumPQ / variance);
}
