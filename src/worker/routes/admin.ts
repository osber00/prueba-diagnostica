import { Hono } from "hono";
import type { AppEnv } from "../types";
import { adminLoginRequestSchema, generateCodesRequestSchema } from "@shared/schemas";
import type {
  AdminCodeRow,
  AnalyticsAttempt,
  AnalyticsResponse,
  InferenceType,
  LiveAttemptRow,
  OptionLetter,
  PairedResponse,
  PairedResult,
  PairedScore,
  PerformanceBandCount,
  ResultRow,
} from "@shared/types";
import {
  ACTIVE_INSTRUMENT_VERSION,
  PERFORMANCE_BANDS,
  TOTAL_ITEMS,
} from "@shared/types";
import { now } from "../lib/db";
import { generateBatchId, generateCodes } from "../lib/codes";
import { sha256Hex, timingSafeEqual } from "../lib/crypto";
import {
  ADMIN_TTL_MS,
  clearAdminSession,
  getAdminSession,
  setAdminSession,
} from "../lib/session";
import { logAudit } from "../lib/audit";
import { computeItemStats, computeKR20, type AnswerForStats } from "../lib/psychometrics";
import {
  canAttemptAdminLogin,
  clearAdminLoginFailures,
  recordFailedAdminLogin,
} from "../lib/ratelimit";

export const adminRoutes = new Hono<AppEnv>();

/* ---------------------------------------------------------------------------
   Autenticación
--------------------------------------------------------------------------- */

/**
 * Middleware de acceso al panel.
 *
 * Valida dos cosas: que la cookie tenga firma válida y que la sesión siga
 * existiendo en la base. Lo segundo permite revocar sesiones sin cambiar el
 * secreto de firma.
 */
adminRoutes.use("*", async (c, next) => {
  const ruta = c.req.path;
  if (ruta.endsWith("/login")) return next();

  const sessionId = await getAdminSession(c, c.env.SESSION_SECRET);
  if (!sessionId) return c.json({ error: "Sesión no iniciada" }, 401);

  const hash = await sha256Hex(sessionId);
  const session = await c.env.DB.prepare(
    "SELECT id, expires_at FROM admin_sessions WHERE token_hash = ?",
  )
    .bind(hash)
    .first<{ id: string; expires_at: number }>();

  if (!session || session.expires_at < now()) {
    clearAdminSession(c);
    return c.json({ error: "La sesión expiró" }, 401);
  }

  await c.env.DB.prepare("UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?")
    .bind(now(), session.id)
    .run();

  return next();
});

adminRoutes.post("/login", async (c) => {
  const ip = c.req.header("cf-connecting-ip") ?? "desconocida";
  if (!(await canAttemptAdminLogin(c.env.DB, ip))) {
    return c.json({ error: "Demasiados intentos. Espera 15 minutos." }, 429);
  }

  const body: unknown = await c.req.json().catch(() => null);
  const input = adminLoginRequestSchema.safeParse(body);
  if (!input.success) return c.json({ error: "Código inválido" }, 400);

  const expected = c.env.ADMIN_MASTER_CODE;
  if (!expected) {
    console.error("ADMIN_MASTER_CODE no está configurado");
    return c.json({ error: "El panel no está configurado" }, 500);
  }

  // Comparación de tiempo constante: no debe poder deducirse el código
  // midiendo cuánto tarda la respuesta.
  if (!timingSafeEqual(input.data.code, expected)) {
    if (!(await recordFailedAdminLogin(c.env.DB, ip))) {
      return c.json({ error: "No se pudo validar el acceso" }, 503);
    }
    await logAudit(c.env.DB, "gestor", "login_fallido", c.req.header("cf-connecting-ip"));
    return c.json({ error: "Código incorrecto" }, 401);
  }

  const sessionId = crypto.randomUUID();
  const timestamp = now();

  await c.env.DB.batch([
    // Limpieza oportunista de sesiones vencidas: evita una tarea programada.
    c.env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at < ?").bind(timestamp),
    c.env.DB.prepare(
      `INSERT INTO admin_sessions (id, token_hash, created_at, expires_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      await sha256Hex(sessionId),
      timestamp,
      timestamp + ADMIN_TTL_MS,
      timestamp,
    ),
  ]);

  await setAdminSession(c, sessionId, c.env.SESSION_SECRET);
  await clearAdminLoginFailures(c.env.DB, ip);
  await logAudit(c.env.DB, "gestor", "login_exitoso");

  return c.json({ ok: true });
});

adminRoutes.get("/me", (c) => c.json({ ok: true }));

adminRoutes.post("/logout", async (c) => {
  const sessionId = await getAdminSession(c, c.env.SESSION_SECRET);
  if (sessionId) {
    await c.env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ?")
      .bind(await sha256Hex(sessionId))
      .run();
  }
  clearAdminSession(c);
  return c.json({ ok: true });
});

/* ---------------------------------------------------------------------------
   Códigos de acceso
--------------------------------------------------------------------------- */

adminRoutes.post("/codes", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const input = generateCodesRequestSchema.safeParse(body);
  if (!input.success) {
    return c.json({ error: "Datos inválidos", detalle: input.error.issues }, 400);
  }

  const { quantity, phase, labels, notes, validForDays } = input.data;
  const codes = generateCodes(quantity);

  if (codes.length < quantity) {
    return c.json({ error: "No se pudieron generar códigos únicos" }, 500);
  }

  const batchId = generateBatchId();
  const timestamp = now();
  const expiresAt =
    validForDays === undefined ? null : timestamp + validForDays * 86_400_000;

  await c.env.DB.batch(
    codes.map((code, index) =>
      c.env.DB.prepare(
        `INSERT INTO access_codes (code, label, phase, status, batch_id, created_at, expires_at, notes)
         VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`,
      ).bind(
        code,
        labels?.[index]?.trim() || null,
        phase,
        batchId,
        timestamp,
        expiresAt,
        notes ?? null,
      ),
    ),
  );

  await logAudit(
    c.env.DB,
    "gestor",
    "codigos_generados",
    `${quantity} códigos, fase ${phase}, lote ${batchId}`,
  );

  return c.json({ ok: true, batchId, codes }, 201);
});

adminRoutes.get("/codes", async (c) => {
  const phase = c.req.query("phase");
  const filtroFase = phase === "pretest" || phase === "postest" ? phase : null;

  const { results } = await c.env.DB.prepare(
    `SELECT ac.id, ac.code, ac.label, ac.phase, ac.status, ac.batch_id,
            ac.created_at, ac.expires_at, ac.notes,
            a.id            AS attempt_id,
            a.status        AS attempt_status,
            a.started_at    AS attempt_started_at,
            a.completed_at  AS attempt_completed_at,
            a.score_total   AS score_total,
            (SELECT COUNT(*) FROM answers WHERE attempt_id = a.id) AS answered
       FROM access_codes ac
       LEFT JOIN attempts a ON a.access_code_id = ac.id
      WHERE (?1 IS NULL OR ac.phase = ?1)
      ORDER BY ac.created_at DESC, ac.code`,
  )
    .bind(filtroFase)
    .all<AdminCodeRow>();

  return c.json({ codes: results });
});

/** Anula un código. Los intentos terminados se conservan para el análisis. */
adminRoutes.post("/codes/:id/revoke", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Identificador inválido" }, 400);

  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE access_codes SET status = 'revoked' WHERE id = ?").bind(id),
    c.env.DB.prepare(
      "UPDATE attempts SET status = 'abandoned' WHERE access_code_id = ? AND status = 'in_progress'",
    ).bind(id),
  ]);

  await logAudit(c.env.DB, "gestor", "codigo_anulado", `código ${id}`);
  return c.json({ ok: true });
});

/**
 * Reinicia el intento asociado a un código.
 *
 * Es la única vía para que un estudiante repita la prueba: cubre el caso de
 * un envío accidental o un problema técnico durante la aplicación.
 * Borra las respuestas, así que queda registrado en la auditoría.
 */
adminRoutes.post("/codes/:id/reset", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Identificador inválido" }, 400);

  const attempt = await c.env.DB.prepare(
    "SELECT id FROM attempts WHERE access_code_id = ?",
  )
    .bind(id)
    .first<{ id: number }>();

  if (!attempt) return c.json({ error: "Ese código no tiene ningún intento" }, 404);

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM answers WHERE attempt_id = ?").bind(attempt.id),
    c.env.DB.prepare("DELETE FROM attempts WHERE id = ?").bind(attempt.id),
    c.env.DB.prepare("UPDATE access_codes SET status = 'active' WHERE id = ?").bind(id),
  ]);

  await logAudit(
    c.env.DB,
    "gestor",
    "intento_reiniciado",
    `código ${id}, intento ${attempt.id}`,
  );

  return c.json({ ok: true });
});

/* ---------------------------------------------------------------------------
   Monitor en vivo
--------------------------------------------------------------------------- */

/**
 * Estado de los intentos en curso.
 * Pensado para consultarse cada 10 segundos durante la aplicación presencial.
 */
adminRoutes.get("/live", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ac.code, ac.label, ac.phase,
             a.id AS attempt_id, a.status, a.started_at, a.last_seen_at, a.elapsed_ms,
             (SELECT COUNT(*) FROM answers ans
               JOIN questions q ON q.id = ans.question_id
              WHERE ans.attempt_id = a.id AND q.is_scored = 1) AS answered,
             (SELECT q.display_number FROM answers ans
               JOIN questions q ON q.id = ans.question_id
              WHERE ans.attempt_id = a.id AND q.is_scored = 1
              ORDER BY ans.answered_at DESC LIMIT 1) AS last_question_number
       FROM attempts a
       JOIN access_codes ac ON ac.id = a.access_code_id
      WHERE a.status = 'in_progress'
      ORDER BY a.last_seen_at DESC`,
  ).all<LiveAttemptRow>();

  return c.json({ attempts: results, serverTime: now() });
});

/* ---------------------------------------------------------------------------
   Resultados
--------------------------------------------------------------------------- */

adminRoutes.get("/results", async (c) => {
  const phase = c.req.query("phase");
  const filtroFase = phase === "pretest" || phase === "postest" ? phase : null;

  const { results } = await c.env.DB.prepare(
    `SELECT ac.code, ac.label, ac.phase,
            a.id AS attempt_id, a.status, a.started_at, a.completed_at,
            a.elapsed_ms, a.score_total, a.score_causal, a.score_predictive,
            (SELECT COUNT(*) FROM answers ans
              JOIN questions q ON q.id = ans.question_id
             WHERE ans.attempt_id = a.id AND q.is_scored = 1) AS answered
       FROM attempts a
       JOIN access_codes ac ON ac.id = a.access_code_id
      WHERE a.status = 'completed' AND (?1 IS NULL OR ac.phase = ?1)
      ORDER BY a.completed_at DESC`,
  )
    .bind(filtroFase)
    .all<ResultRow>();

  return c.json({ results });
});

/* ---------------------------------------------------------------------------
   Análisis, gráficos y exportación
--------------------------------------------------------------------------- */

interface AnalyticsAttemptRow {
  attempt_id: number;
  code: string;
  label: string | null;
  score_total: number;
  score_causal: number;
  score_predictive: number;
  elapsed_ms: number;
  started_at: number;
  completed_at: number;
}

interface AnalyticsAnswerRow {
  attempt_id: number;
  question_number: number;
  inference_type: InferenceType;
  text_id: number;
  correct_option: OptionLetter;
  selected_option: OptionLetter;
  is_correct: 0 | 1;
  displayed_position: number;
  time_spent_ms: number;
  revision_count: number;
}

/**
 * Datos completos para el panel de análisis de una fase: intentos con su
 * detalle de respuestas, estadísticas por ítem, KR-20 y niveles de
 * desempeño. Se resuelve en una sola llamada para que la tabla, los
 * gráficos y las exportaciones (CSV/JSON) usen exactamente los mismos datos.
 */
adminRoutes.get("/analytics", async (c) => {
  const phase = c.req.query("phase");
  if (phase !== "pretest" && phase !== "postest") {
    return c.json({ error: "Falta el parámetro phase (pretest o postest)" }, 400);
  }

  const [attemptRows, answerRows] = await Promise.all([
    c.env.DB.prepare(
      `SELECT a.id AS attempt_id, ac.code, ac.label,
              a.score_total, a.score_causal, a.score_predictive,
              a.elapsed_ms, a.started_at, a.completed_at
         FROM attempts a
         JOIN access_codes ac ON ac.id = a.access_code_id
         WHERE a.status = 'completed' AND ac.phase = ? AND a.instrument_version = ?
         ORDER BY a.completed_at DESC`,
    )
      .bind(phase, ACTIVE_INSTRUMENT_VERSION)
      .all<AnalyticsAttemptRow>(),
    c.env.DB.prepare(
      `SELECT ans.attempt_id, q.display_number AS question_number, q.inference_type,
              q.text_id, q.correct_option, ans.selected_option, ans.is_correct,
              ans.displayed_position, ans.time_spent_ms, ans.revision_count
         FROM answers ans
         JOIN questions q ON q.id = ans.question_id
         JOIN attempts a ON a.id = ans.attempt_id
         JOIN access_codes ac ON ac.id = a.access_code_id
         WHERE a.status = 'completed' AND ac.phase = ? AND q.is_scored = 1
           AND a.instrument_version = ?
         ORDER BY ans.attempt_id, q.display_number`,
    )
      .bind(phase, ACTIVE_INSTRUMENT_VERSION)
      .all<AnalyticsAnswerRow>(),
  ]);

  const answersByAttempt = new Map<number, AnalyticsAnswerRow[]>();
  for (const row of answerRows.results) {
    const bucket = answersByAttempt.get(row.attempt_id);
    if (bucket) bucket.push(row);
    else answersByAttempt.set(row.attempt_id, [row]);
  }

  const attempts: AnalyticsAttempt[] = attemptRows.results.map((row) => ({
    attemptId: row.attempt_id,
    code: row.code,
    label: row.label,
    scoreTotal: row.score_total,
    scoreCausal: row.score_causal,
    scorePredictive: row.score_predictive,
    elapsedMs: row.elapsed_ms,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    answers: (answersByAttempt.get(row.attempt_id) ?? []).map((a) => ({
      questionNumber: a.question_number,
      inferenceType: a.inference_type,
      textId: a.text_id,
      selectedOption: a.selected_option,
      isCorrect: a.is_correct === 1,
      displayedPosition: a.displayed_position,
      timeSpentMs: a.time_spent_ms,
      revisionCount: a.revision_count,
    })),
  }));

  // Se reagrupan las respuestas crudas (con `correct_option`, que no viaja al
  // cliente) para alimentar el cálculo psicométrico, en lugar de derivarlas
  // de `attempts.answers` que ya no la incluye.
  const scoreByAttempt = new Map(attempts.map((a) => [a.attemptId, a.scoreTotal]));
  const statsAnswersByAttempt = new Map<number, AnswerForStats[]>();
  for (const row of answerRows.results) {
    const answer: AnswerForStats = {
      questionNumber: row.question_number,
      inferenceType: row.inference_type,
      textId: row.text_id,
      correctOption: row.correct_option,
      selectedOption: row.selected_option,
      isCorrect: row.is_correct === 1,
    };
    const bucket = statsAnswersByAttempt.get(row.attempt_id);
    if (bucket) bucket.push(answer);
    else statsAnswersByAttempt.set(row.attempt_id, [answer]);
  }

  // La psicometría (dificultad, discriminación, KR-20) exige que todos los
  // intentos comparen el mismo conjunto de ítems. Un intento "completado"
  // con respuestas de menos (el envío no exige responder los 16) rompería
  // esa comparación: sesgaría la dificultad de los ítems que solo alcanzó a
  // ver el grupo con más tiempo, y descuadraría a `k` frente a la varianza
  // de puntajes usada por KR-20. Se excluyen aquí mediante supresión por
  // lista (listwise deletion), la práctica estándar para este caso.
  const fullyAnsweredAttempts = [...statsAnswersByAttempt.entries()].filter(
    ([, answers]) => answers.length === TOTAL_ITEMS,
  );

  const items = computeItemStats(
    fullyAnsweredAttempts.map(([attemptId, answers]) => ({
      attemptId,
      scoreTotal: scoreByAttempt.get(attemptId) ?? 0,
      answers,
    })),
  );

  const kr20 = computeKR20(
    items,
    fullyAnsweredAttempts.map(([attemptId]) => scoreByAttempt.get(attemptId) ?? 0),
  );

  const bands: PerformanceBandCount[] = PERFORMANCE_BANDS.map((band) => ({
    key: band.key,
    label: band.label,
    count: attempts.filter((a) => a.scoreTotal >= band.min && a.scoreTotal <= band.max).length,
  }));

  return c.json<AnalyticsResponse>({
    instrumentVersion: ACTIVE_INSTRUMENT_VERSION,
    phase,
    n: attempts.length,
    attempts,
    items,
    fullyAnsweredN: fullyAnsweredAttempts.length,
    kr20,
    bands,
  });
});

/**
 * Comparación pareada pretest-postest del mismo estudiante, identificado por
 * el nombre asignado al código. Solo incluye pares con ambas fases
 * completadas; si un estudiante solo tiene una fase, no aparece aquí (sigue
 * disponible en la tabla de resultados de esa fase).
 */
adminRoutes.get("/analytics/paired", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ac.label, ac.phase, a.score_total, a.score_causal, a.score_predictive,
            a.elapsed_ms, a.completed_at
       FROM attempts a
       JOIN access_codes ac ON ac.id = a.access_code_id
       WHERE a.status = 'completed' AND ac.label IS NOT NULL
         AND a.instrument_version = ?
       ORDER BY a.completed_at DESC`,
  ).bind(ACTIVE_INSTRUMENT_VERSION).all<{
    label: string;
    phase: "pretest" | "postest";
    score_total: number;
    score_causal: number;
    score_predictive: number;
    elapsed_ms: number;
    completed_at: number;
  }>();

  // El nombre es texto libre que el gestor escribe al generar códigos (no
  // hay un identificador estable de estudiante entre fases), así que dos
  // homónimos o un error de tipeo pueden coincidir por accidente. Antes de
  // aparear por nombre se cuenta cuántos intentos completados hay por
  // (nombre normalizado, fase): si hay más de uno, ese nombre queda fuera
  // de `pairs` en lugar de aparear al azar con el primero encontrado.
  const countsByLabelPhase = new Map<string, number>();
  for (const row of results) {
    const countKey = `${row.label.trim().toLowerCase()}|${row.phase}`;
    countsByLabelPhase.set(countKey, (countsByLabelPhase.get(countKey) ?? 0) + 1);
  }

  // El ORDER BY completed_at DESC garantiza que la primera fila vista para
  // cada combinación (nombre normalizado, fase) es la más reciente.
  const byLabel = new Map<string, { label: string; pretest?: PairedScore; postest?: PairedScore }>();
  const ambiguousKeys = new Set<string>();
  for (const row of results) {
    const key = row.label.trim().toLowerCase();
    // Se registra la etiqueta (con su capitalización original) para todos
    // los casos, ambiguos o no, para poder listarla en `ambiguousLabels`.
    const entry = byLabel.get(key) ?? { label: row.label.trim() };
    byLabel.set(key, entry);

    if ((countsByLabelPhase.get(`${key}|${row.phase}`) ?? 0) > 1) {
      ambiguousKeys.add(key);
      continue;
    }

    entry[row.phase] = {
      scoreTotal: row.score_total,
      scoreCausal: row.score_causal,
      scorePredictive: row.score_predictive,
      elapsedMs: row.elapsed_ms,
    };
  }

  const pairs: PairedResult[] = [...byLabel.entries()]
    .filter(([key]) => !ambiguousKeys.has(key))
    .map(([, e]) => e)
    .filter((e): e is { label: string; pretest: PairedScore; postest: PairedScore } =>
      Boolean(e.pretest && e.postest),
    )
    .map((e) => ({ label: e.label, pretest: e.pretest, postest: e.postest }));

  const ambiguousLabels = [...byLabel.entries()]
    .filter(([key]) => ambiguousKeys.has(key))
    .map(([, e]) => e.label);

  return c.json<PairedResponse>({ pairs, ambiguousLabels });
});
