import type {
  AccessCodeStatus,
  AttemptStatus,
  InferenceType,
  OptionLetter,
  Phase,
  PublicText,
} from "@shared/types";

/* ===========================================================================
   Filas de D1, con los nombres tal como están en el esquema SQL.
   =========================================================================== */

export interface TextRow {
  id: number;
  order_index: number;
  title: string;
  body: string;
  genre: "narrativo" | "expositivo";
  illustration_key: string;
}

export interface QuestionRow {
  id: number;
  text_id: number;
  number: number;
  inference_type: InferenceType;
  stem: string;
  correct_option: OptionLetter;
  is_scored: 0 | 1;
  rationale: string | null;
}

export interface OptionRow {
  id: number;
  question_id: number;
  letter: OptionLetter;
  content: string;
}

export interface AccessCodeRow {
  id: number;
  code: string;
  label: string | null;
  phase: Phase;
  status: AccessCodeStatus;
  batch_id: string | null;
  created_at: number;
  expires_at: number | null;
  notes: string | null;
}

export interface AttemptRow {
  id: number;
  access_code_id: number;
  status: AttemptStatus;
  option_seed: number;
  started_at: number;
  last_seen_at: number;
  completed_at: number | null;
  elapsed_ms: number;
  score_total: number | null;
  score_causal: number | null;
  score_predictive: number | null;
  user_agent: string | null;
}

export interface AnswerRow {
  id: number;
  attempt_id: number;
  question_id: number;
  selected_option: OptionLetter;
  displayed_position: number;
  is_correct: 0 | 1;
  answered_at: number;
  time_spent_ms: number;
  revision_count: number;
}

/* ===========================================================================
   Modelo interno del instrumento.
   `correctOption` solo circula dentro del Worker: nunca se serializa al cliente.
   =========================================================================== */

export interface QuestionWithOptions {
  id: number;
  textId: number;
  number: number;
  inferenceType: InferenceType;
  stem: string;
  isScored: boolean;
  /** Clave. Uso exclusivo del servidor. */
  correctOption: OptionLetter;
  options: { letter: OptionLetter; content: string }[];
}

/* ===========================================================================
   Consultas del instrumento
   =========================================================================== */

/** Textos de lectura, en orden. Incluye el de calentamiento (order_index = 0). */
export async function getTexts(db: D1Database): Promise<PublicText[]> {
  const { results } = await db
    .prepare(
      `SELECT id, order_index, title, body, genre, illustration_key
         FROM texts
        ORDER BY order_index`,
    )
    .all<TextRow>();

  return results.map(toPublicText);
}

export function toPublicText(row: TextRow): PublicText {
  return {
    id: row.id,
    orderIndex: row.order_index,
    title: row.title,
    body: row.body,
    genre: row.genre,
    illustrationKey: row.illustration_key,
  };
}

/**
 * Instrumento completo con sus opciones en orden canónico.
 *
 * Se resuelve en dos consultas y un agrupamiento en memoria en lugar de un
 * JOIN con 68 filas: es más barato en lecturas de D1 y evita duplicar el
 * enunciado por cada opción.
 */
export async function getQuestionsWithOptions(
  db: D1Database,
): Promise<QuestionWithOptions[]> {
  const batch = await db.batch([
    db.prepare(
      `SELECT id, text_id, number, inference_type, stem, correct_option, is_scored, rationale
         FROM questions
        ORDER BY number`,
    ),
    db.prepare(
      `SELECT id, question_id, letter, content
         FROM options
        ORDER BY question_id, letter`,
    ),
  ]);

  const questionRows = (batch[0]?.results ?? []) as unknown as QuestionRow[];
  const optionRows = (batch[1]?.results ?? []) as unknown as OptionRow[];

  const optionsByQuestion = new Map<number, OptionRow[]>();
  for (const option of optionRows) {
    const bucket = optionsByQuestion.get(option.question_id);
    if (bucket) bucket.push(option);
    else optionsByQuestion.set(option.question_id, [option]);
  }

  return questionRows.map((q) => ({
    id: q.id,
    textId: q.text_id,
    number: q.number,
    inferenceType: q.inference_type,
    stem: q.stem,
    isScored: q.is_scored === 1,
    correctOption: q.correct_option,
    options: (optionsByQuestion.get(q.id) ?? []).map((o) => ({
      letter: o.letter,
      content: o.content,
    })),
  }));
}

/**
 * Clave de respuestas indexada por id de ítem.
 * Se usa para calificar en el servidor sin exponer nada al cliente.
 */
export async function getAnswerKey(
  db: D1Database,
): Promise<Map<number, { correct: OptionLetter; type: InferenceType; scored: boolean }>> {
  const { results } = await db
    .prepare(
      `SELECT id, correct_option, inference_type, is_scored FROM questions`,
    )
    .all<Pick<QuestionRow, "id" | "correct_option" | "inference_type" | "is_scored">>();

  return new Map(
    results.map((row) => [
      row.id,
      {
        correct: row.correct_option,
        type: row.inference_type,
        scored: row.is_scored === 1,
      },
    ]),
  );
}

/** Conteo de ítems calificables. Usado por la sonda de salud. */
export async function countScoredQuestions(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS total FROM questions WHERE is_scored = 1")
    .first<{ total: number }>();

  return row?.total ?? 0;
}

/* ===========================================================================
   Utilidades
   =========================================================================== */

/** Marca de tiempo en milisegundos. Todas las fechas de D1 usan esta unidad. */
export function now(): number {
  return Date.now();
}
