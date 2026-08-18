import type { InferenceType, OptionLetter } from "@shared/types";

/**
 * Calificación. Ocurre exclusivamente en el servidor: el cliente nunca recibe
 * la clave ni el resultado de un ítem individual.
 */

export interface ScoreBreakdown {
  total: number;
  causal: number;
  predictive: number;
  answered: number;
}

export interface KeyEntry {
  correct: OptionLetter;
  type: InferenceType;
  scored: boolean;
}

/** Evalúa una respuesta contra la clave. Los ítems no calificables cuentan como incorrectos a efectos de puntaje pero se registran igual. */
export function isAnswerCorrect(
  key: Map<number, KeyEntry>,
  questionId: number,
  selected: OptionLetter,
): boolean {
  return key.get(questionId)?.correct === selected;
}

/** Calcula el puntaje total y por dimensión a partir de las respuestas guardadas. */
export function computeScore(
  key: Map<number, KeyEntry>,
  answers: readonly { question_id: number; selected_option: OptionLetter }[],
): ScoreBreakdown {
  let total = 0;
  let causal = 0;
  let predictive = 0;
  let answered = 0;

  for (const answer of answers) {
    const entry = key.get(answer.question_id);
    // El ítem de calentamiento se responde pero no suma.
    if (!entry?.scored) continue;

    answered++;
    if (entry.correct !== answer.selected_option) continue;

    total++;
    if (entry.type === "causal") causal++;
    else predictive++;
  }

  return { total, causal, predictive, answered };
}
