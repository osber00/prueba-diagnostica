import type { PublicQuestion, PublicText } from "@shared/types";

export interface TextGroup {
  text: PublicText;
  /** Preguntas del texto, en el orden del instrumento. */
  questions: PublicQuestion[];
}

export type Step =
  | { type: "instructions" }
  | { type: "reading"; group: TextGroup }
  | { type: "question"; group: TextGroup; question: PublicQuestion }
  | { type: "review" };

/** Agrupa las preguntas bajo su texto, ambos en el orden del instrumento. */
export function groupByText(
  texts: readonly PublicText[],
  questions: readonly PublicQuestion[],
): TextGroup[] {
  const sortedTexts = [...texts].sort((a, b) => a.orderIndex - b.orderIndex);

  return sortedTexts.map((text) => ({
    text,
    questions: questions
      .filter((q) => q.textId === text.id)
      .sort((a, b) => a.number - b.number),
  }));
}

/**
 * Construye la secuencia completa de pantallas: instrucciones, luego para
 * cada texto su lectura seguida de sus preguntas, y al final la revisión.
 */
export function buildSteps(groups: readonly TextGroup[]): Step[] {
  const steps: Step[] = [{ type: "instructions" }];

  for (const group of groups) {
    steps.push({ type: "reading", group });
    for (const question of group.questions) {
      steps.push({ type: "question", group, question });
    }
  }

  steps.push({ type: "review" });
  return steps;
}

/**
 * Preguntas calificables, en el orden del instrumento (excluye el ítem de
 * calentamiento, identificado por `number === 0`).
 */
export function scoredQuestions(groups: readonly TextGroup[]): PublicQuestion[] {
  return groups.flatMap((g) => g.questions).filter((q) => q.number > 0);
}

/**
 * Índice de reanudación dentro de `steps`.
 *
 * - Sin ninguna respuesta guardada: el inicio (instrucciones).
 * - Con respuestas pendientes: la pantalla de LECTURA del primer texto que
 *   tenga alguna pregunta sin responder (no la pregunta directamente, para
 *   que el estudiante siempre vea de nuevo el texto antes de continuar).
 * - Con las 16 preguntas respondidas: la revisión final.
 */
export function findResumeIndex(
  steps: readonly Step[],
  answeredIds: ReadonlySet<number>,
): number {
  if (answeredIds.size === 0) return 0;

  const firstUnanswered = steps.find(
    (s): s is Extract<Step, { type: "question" }> =>
      s.type === "question" && !answeredIds.has(s.question.id),
  );

  if (!firstUnanswered) {
    const reviewIndex = steps.findIndex((s) => s.type === "review");
    return reviewIndex >= 0 ? reviewIndex : steps.length - 1;
  }

  const targetTextId = firstUnanswered.group.text.id;
  const readingIndex = steps.findIndex(
    (s) => s.type === "reading" && s.group.text.id === targetTextId,
  );

  return readingIndex >= 0 ? readingIndex : 0;
}
