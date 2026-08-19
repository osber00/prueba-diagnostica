import { Hono } from "hono";
import type { AppEnv } from "../types";
import type {
  AttemptStateResponse,
  PublicQuestion,
  SaveAnswerResponse,
  SavedAnswer,
} from "@shared/types";
import { ACTIVE_INSTRUMENT_VERSION } from "@shared/types";
import { redeemRequestSchema, saveAnswerRequestSchema } from "@shared/schemas";
import {
  getAnswerKey,
  getQuestionsWithOptions,
  getTexts,
  now,
  type AccessCodeRow,
  type AnswerRow,
  type AttemptRow,
} from "../lib/db";
import { createAttemptSeed, shuffleForAttempt } from "../lib/shuffle";
import { computeScore } from "../lib/scoring";
import {
  clearAttemptSession,
  getAttemptSession,
  setAttemptSession,
} from "../lib/session";
import { findAmbiguousCharacters, normalizeCode } from "../lib/codes";
import {
  canAttemptRedeem,
  clearRedeemFailures,
  recordFailedRedeem,
} from "../lib/ratelimit";
import { logAudit } from "../lib/audit";

export const studentRoutes = new Hono<AppEnv>();

/* ---------------------------------------------------------------------------
   POST /api/attempt/redeem — canje del código e inicio del intento
--------------------------------------------------------------------------- */

studentRoutes.post("/redeem", async (c) => {
  const raw: unknown = await c.req.json().catch(() => null);
  const input = redeemRequestSchema.safeParse({
    code: normalizeCode(
      typeof raw === "object" && raw !== null && "code" in raw
        ? String((raw as { code: unknown }).code ?? "")
        : "",
    ),
  });

  if (!input.success) {
    // Si el estudiante digitó O, 0, I, 1 o L, el mensaje lo dice explícitamente:
    // esos caracteres no existen en los códigos y suelen ser mala lectura.
    const ambiguous = findAmbiguousCharacters(
      typeof raw === "object" && raw !== null && "code" in raw
        ? String((raw as { code: unknown }).code ?? "")
        : "",
    );

    return c.json(
      {
        error:
          ambiguous.length > 0
            ? `El código no lleva la letra o el número "${ambiguous.join('", "')}". Revísalo y vuelve a intentarlo.`
            : "El código no tiene el formato correcto. Debe ser como MAC-4F7K-2P9Q.",
      },
      400,
    );
  }

  const ip = c.req.header("cf-connecting-ip") ?? "desconocida";
  if (!(await canAttemptRedeem(c.env.DB, ip))) {
    return c.json(
      { error: "Demasiados intentos fallidos. Espera unos minutos y vuelve a probar." },
      429,
    );
  }

  const code = await c.env.DB.prepare(
    `SELECT id, code, label, phase, status, batch_id, created_at, expires_at, notes
       FROM access_codes WHERE code = ?`,
  )
    .bind(input.data.code)
    .first<AccessCodeRow>();

  // Un código inexistente es la señal típica de fuerza bruta: sí consume cuota.
  if (!code) {
    await recordFailedRedeem(c.env.DB, ip);
    return c.json({ error: "Ese código no existe. Revísalo con tu docente." }, 404);
  }

  // Los siguientes casos corresponden a códigos reales: no consumen cuota,
  // porque quien los presenta ya demostró tener un código legítimo.
  if (code.status === "revoked") {
    return c.json({ error: "Ese código fue anulado. Solicita uno nuevo." }, 403);
  }

  if (code.expires_at !== null && code.expires_at < now()) {
    return c.json({ error: "Ese código ya venció. Solicita uno nuevo." }, 403);
  }

  const existing = await c.env.DB.prepare(
    `SELECT id, access_code_id, status, option_seed, started_at, last_seen_at,
             completed_at, elapsed_ms, score_total, score_causal, score_predictive, user_agent,
             instrument_version
       FROM attempts WHERE access_code_id = ?`,
  )
    .bind(code.id)
    .first<AttemptRow>();

  // Ya terminó: no se permite repetir sin que el gestor reinicie el intento.
  if (existing?.status === "completed") {
    return c.json(
      { error: "Con ese código ya se envió la prueba. Habla con tu docente." },
      409,
    );
  }

  const timestamp = now();
  const userAgent = c.req.header("user-agent")?.slice(0, 300) ?? null;

  // Retoma el intento en curso en lugar de crear uno nuevo:
  // es exactamente el caso de una caída de señal o un navegador cerrado.
  let attemptId: number;

  if (existing) {
    attemptId = existing.id;
    await c.env.DB.prepare(
      "UPDATE attempts SET last_seen_at = ? WHERE id = ?",
    )
      .bind(timestamp, attemptId)
      .run();
  } else {
    const inserted = await c.env.DB.prepare(
      `INSERT INTO attempts (access_code_id, status, option_seed, started_at, last_seen_at,
                             user_agent, instrument_version)
       VALUES (?, 'in_progress', ?, ?, ?, ?, ?)
       RETURNING id`,
    )
      .bind(
        code.id,
        createAttemptSeed(),
        timestamp,
        timestamp,
        userAgent,
        ACTIVE_INSTRUMENT_VERSION,
      )
      .first<{ id: number }>();

    if (!inserted) {
      return c.json({ error: "No se pudo iniciar la prueba. Intenta de nuevo." }, 500);
    }

    attemptId = inserted.id;

    await c.env.DB.prepare(
      "UPDATE access_codes SET status = 'in_use' WHERE id = ?",
    )
      .bind(code.id)
      .run();

    await logAudit(c.env.DB, "estudiante", "intento_iniciado", code.code);
  }

  // El canje fue legítimo: se libera el contador de la red del colegio.
  await clearRedeemFailures(c.env.DB, ip);

  await setAttemptSession(c, attemptId, c.env.SESSION_SECRET);

  return c.json({
    ok: true,
    // El nombre es el que el gestor asignó al código. Sirve de confirmación
    // visual para que nadie responda con el código de otro por error.
    label: code.label,
    phase: code.phase,
    resumed: Boolean(existing),
  });
});

/* ---------------------------------------------------------------------------
   GET /api/attempt — estado del intento, textos e ítems (sin la clave)
--------------------------------------------------------------------------- */

studentRoutes.get("/", async (c) => {
  const attemptId = await getAttemptSession(c, c.env.SESSION_SECRET);
  if (attemptId === null) return c.json({ error: "Sesión no iniciada" }, 401);

  const attempt = await c.env.DB.prepare(
    `SELECT id, access_code_id, status, option_seed, started_at, last_seen_at,
             completed_at, elapsed_ms, score_total, score_causal, score_predictive, user_agent,
             instrument_version
       FROM attempts WHERE id = ?`,
  )
    .bind(attemptId)
    .first<AttemptRow>();

  if (!attempt) {
    clearAttemptSession(c);
    return c.json({ error: "El intento ya no existe" }, 404);
  }
  if (attempt.status === "abandoned") {
    clearAttemptSession(c);
    return c.json({ error: "Ese código fue anulado. Solicita uno nuevo." }, 403);
  }

  const code = await c.env.DB.prepare(
    "SELECT label, phase FROM access_codes WHERE id = ?",
  )
    .bind(attempt.access_code_id)
    .first<{ label: string | null; phase: "pretest" | "postest" }>();

  const [texts, questions, answers] = await Promise.all([
    getTexts(c.env.DB, attempt.instrument_version),
    getQuestionsWithOptions(c.env.DB, attempt.instrument_version),
    c.env.DB.prepare(
      `SELECT id, attempt_id, question_id, selected_option, displayed_position,
              is_correct, answered_at, time_spent_ms, revision_count
         FROM answers WHERE attempt_id = ?`,
    )
      .bind(attemptId)
      .all<AnswerRow>(),
  ]);

  // Aquí se descartan tanto `correctOption` como las letras canónicas. El
  // cliente recibe solo contenido ordenado y responde por posición visual.
  const publicQuestions: PublicQuestion[] = questions.map((q) => ({
    id: q.id,
    textId: q.textId,
    number: q.number,
    inferenceType: q.inferenceType,
    stem: q.stem,
    options: shuffleForAttempt(q.options, attempt.option_seed, q.id).map((option) => ({
      content: option.content,
    })),
  }));

  // Tampoco se envía `is_correct`: el estudiante no debe poder deducir su puntaje.
  const savedAnswers: SavedAnswer[] = answers.results.map((a) => ({
    questionId: a.question_id,
    displayedPosition: a.displayed_position,
  }));

  return c.json<AttemptStateResponse>({
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.started_at,
      elapsedMs: attempt.elapsed_ms,
      label: code?.label ?? null,
      phase: code?.phase ?? "pretest",
    },
    texts,
    questions: publicQuestions,
    answers: savedAnswers,
  });
});

/* ---------------------------------------------------------------------------
   PUT /api/attempt/answer — autoguardado idempotente
--------------------------------------------------------------------------- */

studentRoutes.put("/answer", async (c) => {
  const attemptId = await getAttemptSession(c, c.env.SESSION_SECRET);
  if (attemptId === null) return c.json({ error: "Sesión no iniciada" }, 401);

  const body: unknown = await c.req.json().catch(() => null);
  const input = saveAnswerRequestSchema.safeParse(body);
  if (!input.success) return c.json({ error: "Datos inválidos" }, 400);

  const attempt = await c.env.DB.prepare(
    "SELECT status, option_seed, instrument_version FROM attempts WHERE id = ?",
  )
    .bind(attemptId)
    .first<Pick<AttemptRow, "status" | "option_seed" | "instrument_version">>();

  if (!attempt) return c.json({ error: "El intento ya no existe" }, 404);
  if (attempt.status === "abandoned") {
    clearAttemptSession(c);
    return c.json({ error: "Ese código fue anulado. Solicita uno nuevo." }, 403);
  }
  if (attempt.status === "completed") {
    return c.json({ error: "La prueba ya fue enviada" }, 409);
  }

  const questions = await getQuestionsWithOptions(c.env.DB, attempt.instrument_version);
  const question = questions.find((candidate) => candidate.id === input.data.questionId);
  if (!question) return c.json({ error: "La pregunta no existe" }, 404);

  const shuffledOptions = shuffleForAttempt(
    question.options,
    attempt.option_seed,
    question.id,
  );
  const selectedOption = shuffledOptions[input.data.displayedPosition];
  if (!selectedOption) return c.json({ error: "La opción no existe" }, 400);

  const isCorrect = question.correctOption === selectedOption.letter ? 1 : 0;
  const timestamp = now();

  // UPSERT: el cliente puede reenviar la misma respuesta tras un fallo de red
  // sin duplicar filas. `revision_count` solo crece si la opción cambió.
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO answers (attempt_id, question_id, selected_option, displayed_position,
                            is_correct, answered_at, time_spent_ms, revision_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)
       ON CONFLICT (attempt_id, question_id) DO UPDATE SET
         selected_option    = excluded.selected_option,
         displayed_position = excluded.displayed_position,
         is_correct         = excluded.is_correct,
         answered_at        = excluded.answered_at,
         time_spent_ms      = answers.time_spent_ms + excluded.time_spent_ms,
         revision_count     = answers.revision_count +
           CASE WHEN answers.selected_option <> excluded.selected_option THEN 1 ELSE 0 END`,
    ).bind(
      attemptId,
      input.data.questionId,
      selectedOption.letter,
      input.data.displayedPosition,
      isCorrect,
      timestamp,
      input.data.timeSpentMs,
    ),
    c.env.DB.prepare(
      "UPDATE attempts SET last_seen_at = ?, elapsed_ms = MAX(elapsed_ms, ?) WHERE id = ?",
    ).bind(timestamp, input.data.elapsedMs, attemptId),
  ]);

  // Se confirma el guardado sin revelar si la respuesta fue correcta,
  // EXCEPTO en el ítem de calentamiento (no calificable): su único propósito
  // es enseñar la mecánica de la prueba, así que ahí sí se informa el
  // acierto y la opción correcta. En los 16 ítems reales `feedback` no viaja.
  return c.json<SaveAnswerResponse>({
    ok: true,
    savedAt: timestamp,
    ...(question.isScored
      ? {}
      : {
          feedback: {
            isCorrect: isCorrect === 1,
            correctPosition: shuffledOptions.findIndex(
              (option) => option.letter === question.correctOption,
            ),
          },
        }),
  });
});

/* ---------------------------------------------------------------------------
   POST /api/attempt/submit — cierre y calificación
--------------------------------------------------------------------------- */

studentRoutes.post("/submit", async (c) => {
  const attemptId = await getAttemptSession(c, c.env.SESSION_SECRET);
  if (attemptId === null) return c.json({ error: "Sesión no iniciada" }, 401);

  const attempt = await c.env.DB.prepare(
    `SELECT id, access_code_id, status, started_at, elapsed_ms, instrument_version
       FROM attempts WHERE id = ?`,
  )
    .bind(attemptId)
    .first<
      Pick<
        AttemptRow,
        "id" | "access_code_id" | "status" | "started_at" | "elapsed_ms" | "instrument_version"
      >
    >();

  if (!attempt) return c.json({ error: "El intento ya no existe" }, 404);
  if (attempt.status === "abandoned") {
    clearAttemptSession(c);
    return c.json({ error: "Ese código fue anulado. Solicita uno nuevo." }, 403);
  }

  // Reenvío tras un fallo de red: se responde igual que la primera vez.
  if (attempt.status === "completed") {
    return c.json({ ok: true, alreadySubmitted: true });
  }

  const [key, answers] = await Promise.all([
    getAnswerKey(c.env.DB, attempt.instrument_version),
    c.env.DB.prepare(
      "SELECT question_id, selected_option FROM answers WHERE attempt_id = ?",
    )
      .bind(attemptId)
      .all<Pick<AnswerRow, "question_id" | "selected_option">>(),
  ]);

  const score = computeScore(key, answers.results);
  const timestamp = now();

  await c.env.DB.batch([
    c.env.DB.prepare(
       `UPDATE attempts
          SET status = 'completed', completed_at = ?, score_total = ?,
              score_causal = ?, score_predictive = ?, last_seen_at = ?,
              elapsed_ms = MAX(elapsed_ms, ?)
         WHERE id = ?`,
    ).bind(
      timestamp,
      score.total,
      score.causal,
      score.predictive,
      timestamp,
      timestamp - attempt.started_at,
      attemptId,
    ),
    c.env.DB.prepare("UPDATE access_codes SET status = 'used' WHERE id = ?").bind(
      attempt.access_code_id,
    ),
  ]);

  await logAudit(c.env.DB, "estudiante", "prueba_enviada", `intento ${attemptId}`);

  clearAttemptSession(c);

  // Deliberadamente sin puntaje: es una prueba diagnóstica, no un juego.
  return c.json({ ok: true, answered: score.answered });
});

/* ---------------------------------------------------------------------------
   POST /api/attempt/logout — salir sin enviar (aula con móviles compartidos)
--------------------------------------------------------------------------- */

studentRoutes.post("/logout", (c) => {
  clearAttemptSession(c);
  return c.json({ ok: true });
});
