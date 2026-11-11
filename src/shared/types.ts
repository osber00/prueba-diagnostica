/**
 * Tipos compartidos entre el Worker y la SPA.
 *
 * Regla de oro: aquí NUNCA se define la respuesta correcta de un ítem.
 * La clave vive solo en D1 y la calificación ocurre en el servidor.
 */

/** Las dos dimensiones inferenciales que mide el instrumento. */
export type InferenceType = "causal" | "predictiva";

/** Momento de aplicación, para comparar pretest contra postest. */
export type Phase = "pretest" | "postest";

/** Ciclo de vida de un código de acceso. */
export type AccessCodeStatus = "active" | "in_use" | "used" | "revoked";

/** Ciclo de vida de un intento. */
export type AttemptStatus = "in_progress" | "completed" | "abandoned";

/** Letra de una opción, tal como se numera en el instrumento impreso. */
export type OptionLetter = "A" | "B" | "C" | "D";

export const OPTION_LETTERS: readonly OptionLetter[] = ["A", "B", "C", "D"];

/** Total de ítems calificables del instrumento. */
export const TOTAL_ITEMS = 16;

/** Ítems por cada dimensión inferencial. */
export const ITEMS_PER_DIMENSION = 8;

/** Niveles de desempeño usados en el informe de resultados. */
export const PERFORMANCE_BANDS = [
  { key: "bajo", label: "Bajo", min: 0, max: 6 },
  { key: "basico", label: "Básico", min: 7, max: 10 },
  { key: "satisfactorio", label: "Satisfactorio", min: 11, max: 13 },
  { key: "avanzado", label: "Avanzado", min: 14, max: 16 },
] as const;

export type PerformanceBandKey = (typeof PERFORMANCE_BANDS)[number]["key"];

/** Respuesta de `GET /api/health`. */
export interface HealthResponse {
  status: "ok";
  database: "conectada" | "sin migrar" | "no disponible";
  items: number;
  instruments: Record<Phase, { version: number; items: number }>;
  version: string;
}

/** Opción tal como se envía al estudiante (ya barajada, sin marca de correcta). */
export interface PublicOption {
  content: string;
}

/** Ítem tal como se envía al estudiante. */
export interface PublicQuestion {
  id: number;
  textId: number;
  /** Número del ítem en el instrumento (1-16). */
  number: number;
  inferenceType: InferenceType;
  stem: string;
  /** Opciones en el orden aleatorio asignado a este intento. */
  options: PublicOption[];
}

/** Texto de lectura. */
export interface PublicText {
  id: number;
  orderIndex: number;
  title: string;
  body: string;
  genre: "narrativo" | "expositivo";
  illustrationKey: string;
}

/**
 * Respuesta ya guardada, tal como se devuelve al retomar la prueba.
 * No incluye `isCorrect`: el estudiante no debe poder deducir su puntaje.
 */
export interface SavedAnswer {
  questionId: number;
  displayedPosition: number;
}

/** Respuesta de `GET /api/attempt`. */
export interface AttemptStateResponse {
  attempt: {
    /**
     * Id numérico secuencial del intento. No es sensible (no revela el
     * código ni la identidad del estudiante); se usa en el cliente solo
     * para namespacing de la cola de autoguardado en localStorage, de modo
     * que un dispositivo compartido no mezcle datos entre dos intentos.
     */
    id: number;
    status: AttemptStatus;
    startedAt: number;
    elapsedMs: number;
    /** Nombre asignado por el gestor. Confirma que el código es el correcto. */
    label: string | null;
    phase: Phase;
  };
  texts: PublicText[];
  questions: PublicQuestion[];
  answers: SavedAnswer[];
}

/**
 * Respuesta de `PUT /api/attempt/answer`.
 *
 * `feedback` solo se incluye para el ítem de calentamiento (no calificable):
 * es la única pregunta de toda la prueba donde el estudiante ve si acertó,
 * porque su propósito es enseñar la mecánica, no medir. Para los 16 ítems
 * reales, `feedback` es siempre `undefined`.
 */
export interface SaveAnswerResponse {
  ok: true;
  savedAt: number;
  feedback?: {
    isCorrect: boolean;
    correctPosition: number;
  };
}

/** Respuesta de `POST /api/attempt/redeem`. */
export interface RedeemResponse {
  ok: true;
  label: string | null;
  phase: Phase;
  /** `true` si se retomó un intento ya iniciado. */
  resumed: boolean;
}

/** Cuerpo de error uniforme de la API. */
export interface ApiError {
  error: string;
}

/* ===========================================================================
   Panel gestor
   Los nombres conservan el estilo snake_case de SQL porque provienen
   directamente de las consultas, sin capa de mapeo intermedia.
   =========================================================================== */

/** Fila de la tabla de códigos del panel gestor. */
export interface AdminCodeRow {
  id: number;
  code: string;
  label: string | null;
  phase: Phase;
  status: AccessCodeStatus;
  batch_id: string | null;
  created_at: number;
  expires_at: number | null;
  notes: string | null;
  attempt_id: number | null;
  attempt_status: AttemptStatus | null;
  attempt_started_at: number | null;
  attempt_completed_at: number | null;
  score_total: number | null;
  answered: number | null;
}

/** Fila del monitor en vivo. */
export interface LiveAttemptRow {
  code: string;
  label: string | null;
  phase: Phase;
  attempt_id: number;
  status: AttemptStatus;
  started_at: number;
  last_seen_at: number;
  elapsed_ms: number;
  answered: number;
  last_question_number: number | null;
}

/** Fila de la tabla de resultados. */
export interface ResultRow {
  code: string;
  label: string | null;
  phase: Phase;
  attempt_id: number;
  status: AttemptStatus;
  started_at: number;
  completed_at: number | null;
  elapsed_ms: number;
  score_total: number | null;
  score_causal: number | null;
  score_predictive: number | null;
  answered: number;
}

/* ===========================================================================
   Análisis, gráficos y exportación (Fase 6)
   =========================================================================== */

/** Una respuesta calificable dentro de un intento, para análisis y exportación. */
export interface AnalyticsAnswer {
  questionNumber: number;
  inferenceType: InferenceType;
  textId: number;
  selectedOption: OptionLetter;
  isCorrect: boolean;
  displayedPosition: number;
  timeSpentMs: number;
  revisionCount: number;
}

/** Intento completado con el detalle de sus respuestas. */
export interface AnalyticsAttempt {
  attemptId: number;
  code: string;
  label: string | null;
  scoreTotal: number;
  scoreCausal: number;
  scorePredictive: number;
  elapsedMs: number;
  startedAt: number;
  completedAt: number;
  answers: AnalyticsAnswer[];
}

/** Estadística psicométrica de un ítem. */
export interface ItemStat {
  number: number;
  inferenceType: InferenceType;
  textId: number;
  correctOption: OptionLetter;
  /** Índice de dificultad: proporción de aciertos (0-1). */
  difficulty: number;
  /**
   * Índice de discriminación por el método de grupos extremos (27% superior
   * menos 27% inferior por puntaje total). `null` si la muestra es
   * insuficiente para formar los grupos (n < 8).
   */
  discrimination: number | null;
  /** Conteo de respuestas por opción, para el análisis de distractores. */
  distractors: Record<OptionLetter, number>;
  totalResponses: number;
}

/** Conteo de estudiantes por nivel de desempeño. */
export interface PerformanceBandCount {
  key: PerformanceBandKey;
  label: string;
  count: number;
}

/** Respuesta de `GET /api/admin/analytics`. */
export interface AnalyticsResponse {
  instrumentVersion: number;
  phase: Phase;
  /** Intentos completados en la fase (tamaño de `attempts`). */
  n: number;
  attempts: AnalyticsAttempt[];
  items: ItemStat[];
  /**
   * Cuántos de los `n` intentos completados respondieron los 16 ítems
   * calificables. `items` y `kr20` se calculan solo sobre este subconjunto
   * (un envío puede completarse sin responder todo); si es menor que `n`,
   * la interfaz debe advertirlo.
   */
  fullyAnsweredN: number;
  /**
   * Coeficiente de confiabilidad KR-20. `null` si `fullyAnsweredN` < 2 o si
   * la varianza total es cero (todos obtuvieron el mismo puntaje).
   */
  kr20: number | null;
  bands: PerformanceBandCount[];
}

/** Puntajes de un estudiante en una fase, para la comparación pareada. */
export interface PairedScore {
  scoreTotal: number;
  scoreCausal: number;
  scorePredictive: number;
  elapsedMs: number;
}

/** Par pretest-postest del mismo estudiante, identificado por el nombre. */
export interface PairedResult {
  label: string;
  pretest: PairedScore;
  postest: PairedScore;
}

/** Respuesta de `GET /api/admin/analytics/paired`. */
export interface PairedResponse {
  pairs: PairedResult[];
  /**
   * Nombres que aparecen más de una vez dentro de la misma fase (posible
   * homónimo o error de tipeo al generar códigos). Esos estudiantes se
   * excluyen de `pairs` porque no se pueden aparear con confianza.
   */
  ambiguousLabels: string[];
}
