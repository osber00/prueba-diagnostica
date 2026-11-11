// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import app from "../src/worker/index";
import { getInstrumentVersion } from "../src/shared/instruments";
import type {
  AnalyticsResponse,
  AttemptStateResponse,
  PairedResponse,
  Phase,
} from "../src/shared/types";

type TestDatabase = Awaited<ReturnType<Miniflare["getD1Database"]>>;
const root = resolve(import.meta.dirname, "..");
let mf: Miniflare;
let db: TestDatabase;
let env: { DB: TestDatabase; ADMIN_MASTER_CODE: string; SESSION_SECRET: string };
let beforeMigration: unknown;
let afterMigration: unknown;
let missingInstrumentStatus: number;
let missingInstrumentCode: string;

function client() {
  let cookie = "";
  return {
    async request(path: string, method = "GET", body?: object) {
      const headers = new Headers({ "content-type": "application/json" });
      if (cookie) headers.set("cookie", cookie);
      const response = await app.request(`/api${path}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      }, env);
      const nextCookie = response.headers.get("set-cookie");
      if (nextCookie) cookie = nextCookie.split(";")[0] ?? "";
      return response;
    },
  };
}

let admin: ReturnType<typeof client>;

async function applyMigration(file: string) {
  // Los fixtures SQL usan literales con comillas simples. No se separan los
  // puntos y coma que pertenecen al cuerpo de un texto o a una justificación.
  const sql = readFileSync(resolve(root, "migrations", file), "utf8")
    .replace(/--[^\n]*/g, "");
  const statements = sql.match(/(?:'(?:''|[^'])*'|[^';])+(?:;|$)/g) ?? [];
  await db.batch(statements.map((statement) => db.prepare(statement.trim())));
}

async function snapshot() {
  return Promise.all([
    "SELECT * FROM texts WHERE instrument_version < 3 ORDER BY id",
    "SELECT * FROM questions WHERE instrument_version < 3 ORDER BY id",
    "SELECT * FROM options WHERE question_id < 300 ORDER BY id",
    "SELECT * FROM attempts ORDER BY id",
    "SELECT * FROM answers ORDER BY id",
    "SELECT * FROM access_codes ORDER BY id",
  ].map(async (sql) => (await db.prepare(sql).all()).results));
}

async function createCode(phase: Phase, label: string) {
  const response = await admin.request("/admin/codes", "POST", {
    quantity: 1, phase, labels: [label],
  });
  expect(response.status).toBe(201);
  const body: { codes: string[] } = await response.json();
  return body.codes[0]!;
}

async function startStudent(phase: Phase, label: string) {
  const code = await createCode(phase, label);
  const student = client();
  expect((await student.request("/attempt/redeem", "POST", { code })).status).toBe(200);
  const state: AttemptStateResponse = await (await student.request("/attempt")).json();
  return { student, state, code };
}

async function answerAll(
  student: ReturnType<typeof client>,
  state: AttemptStateResponse,
  shouldHit: (number: number) => boolean = () => true,
) {
  for (const question of state.questions.filter((q) => q.number > 0)) {
    const correct = await db.prepare(
      `SELECT o.content FROM options o JOIN questions q ON q.id = o.question_id
        WHERE q.id = ? AND o.letter = q.correct_option`,
    ).bind(question.id).first<{ content: string }>();
    const position = question.options.findIndex((o) =>
      shouldHit(question.number) ? o.content === correct?.content : o.content !== correct?.content,
    );
    expect(position).toBeGreaterThanOrEqual(0);
    const response = await student.request("/attempt/answer", "PUT", {
      questionId: question.id, displayedPosition: position,
      timeSpentMs: 1000, elapsedMs: question.number * 1000,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty("feedback");
  }
}

async function finish(phase: Phase, label: string, shouldHit?: (number: number) => boolean) {
  const { student, state } = await startStudent(phase, label);
  await answerAll(student, state, shouldHit);
  const response = await student.request("/attempt/submit", "POST");
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).not.toHaveProperty("scoreTotal");
  expect(body).not.toHaveProperty("score");
  return state.attempt.id;
}

beforeAll(async () => {
  mf = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: "export default { fetch() { return new Response('test'); } };",
    compatibilityDate: "2026-08-01",
    d1Databases: ["DB"],
  }));
  db = await mf.getD1Database("DB");
  env = {
    DB: db,
    ADMIN_MASTER_CODE: "GESTOR-SOLO-PRUEBAS",
    SESSION_SECRET: "secreto-exclusivo-de-pruebas-aisladas-no-produccion",
  };
  const migrations = readdirSync(resolve(root, "migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const file of migrations.filter((f) => !f.startsWith("0004_"))) await applyMigration(file);

  await db.batch([
    db.prepare(`INSERT INTO access_codes (id,code,label,phase,status,created_at) VALUES
      (1,'MAC-TEST-AAAA','Histórico','pretest','used',1),
      (2,'MAC-TEST-BBBB','Versión uno','pretest','in_use',1),
      (3,'MAC-TEST-CCCC','Postest antiguo','postest','in_use',1),
      (4,'MAC-TEST-DDDD','Par de revisión','postest','used',1)`),
    db.prepare(`INSERT INTO attempts
      (id,access_code_id,status,option_seed,started_at,last_seen_at,completed_at,
       score_total,score_causal,score_predictive,instrument_version) VALUES
      (1,1,'completed',123,1,2,2,8,4,4,2),
      (2,2,'in_progress',456,1,1,NULL,NULL,NULL,NULL,1),
      (3,3,'in_progress',789,1,1,NULL,NULL,NULL,NULL,2),
      (4,4,'completed',159,1,2,2,0,0,0,2)`),
    db.prepare(`INSERT INTO answers
      (attempt_id,question_id,selected_option,displayed_position,is_correct,answered_at)
      VALUES (1,201,'C',2,1,2),(2,1,'B',0,1,2),(3,201,'C',1,1,2)`),
  ]);

  admin = client();
  expect((await admin.request("/admin/login", "POST", { code: env.ADMIN_MASTER_CODE })).status).toBe(200);
  missingInstrumentCode = await createCode("postest", "Sin migración");
  const unavailable = await client().request("/attempt/redeem", "POST", { code: missingInstrumentCode });
  missingInstrumentStatus = unavailable.status;

  beforeMigration = await snapshot();
  await applyMigration("0004_postest_inferencial_macajan.sql");
  afterMigration = await snapshot();
}, 60_000);

afterAll(async () => { await mf?.dispose(); });

describe("postest revisado de Macaján", () => {
  it("conserva sin cambios el instrumento y los datos anteriores al aplicar la migración", () => {
    expect(afterMigration).toEqual(beforeMigration);
    expect(getInstrumentVersion("pretest")).toBe(2);
    expect(getInstrumentVersion("postest")).toBe(3);
  });

  it("mantiene los cuatro textos y los 16 enunciados del PDF revisado", async () => {
    const { results: texts } = await db.prepare(
      "SELECT id,title,body FROM texts WHERE instrument_version=3 AND display_order_index>0 ORDER BY display_order_index",
    ).all<{ id: number; title: string; body: string }>();
    expect(texts.map((t) => t.title)).toEqual([
      "Los corrales", "Los sacos de maíz", "Los portátiles de la sala de informática", "El filtro del sistema de agua",
    ]);
    const blocks: string[] = [];
    for (const text of texts) {
      const { results: questions } = await db.prepare(
        "SELECT stem FROM questions WHERE text_id=? AND is_scored=1 ORDER BY display_number",
      ).bind(text.id).all<{ stem: string }>();
      expect(questions).toHaveLength(4);
      blocks.push(`${text.title}\n${text.body.replace(/\s+/gu, " ").trim()}\n${questions.map((q) => q.stem).join("\n")}`);
    }
    // Huella de textos/enunciados extraídos del PDF, normalizando únicamente
    // espacios y los cortes de palabra artificiales de la extracción.
    expect(createHash("sha256").update(blocks.join("\n")).digest("hex"))
      .toBe("0ad0c4d9cdf68914010c8c2855458557c3ea67ab93f1d0662f9be5f65d6098d4");
    expect(createHash("sha256").update(readFileSync(resolve(root, "docs/POSTEST-INFERENCIAL-MACAJAN.pdf"))).digest("hex"))
      .toBe("dc69fbda9b893cda95b08b40dc94ada8f3fe3a7c176a3e417f9fee4f705df418");
  });

  it("equilibra las alternativas y conserva 8 causales, 8 predictivas y la clave contrastada", async () => {
    const { results } = await db.prepare(
      "SELECT id, inference_type, correct_option FROM questions WHERE instrument_version=3 AND is_scored=1 ORDER BY display_number",
    ).all<{ id: number; inference_type: string; correct_option: string }>();
    expect(results).toHaveLength(16);
    expect(results.filter((q) => q.inference_type === "causal")).toHaveLength(8);
    expect(results.filter((q) => q.inference_type === "predictiva")).toHaveLength(8);
    expect(results.map((q) => q.correct_option).join("")).toBe("BDCACADBDBACACBD");
    for (const q of results) {
      const { results: options } = await db.prepare("SELECT content FROM options WHERE question_id=? ORDER BY letter")
        .bind(q.id).all<{ content: string }>();
      expect(options).toHaveLength(4);
      expect(new Set(options.map((o) => o.content)).size).toBe(4);
      expect(new Set(options.map((o) => o.content.trim().split(/\s+/u).length)).size).toBe(1);
    }
  });

  it("no consume el código ni crea un intento si aún falta sembrar el instrumento", async () => {
    expect(missingInstrumentStatus).toBe(503);
    const row = await db.prepare(
      "SELECT ac.status, a.id FROM access_codes ac LEFT JOIN attempts a ON a.access_code_id=ac.id WHERE ac.code=?",
    ).bind(missingInstrumentCode).first<{ status: string; id: number | null }>();
    expect(row).toEqual({ status: "active", id: null });
  });

  it("asigna versiones distintas por fase sin enviar claves al estudiante", async () => {
    for (const phase of ["pretest", "postest"] as const) {
      const { state } = await startStudent(phase, `Asignación ${phase}`);
      const attempt = await db.prepare("SELECT instrument_version FROM attempts WHERE id=?")
        .bind(state.attempt.id).first<{ instrument_version: number }>();
      expect(attempt?.instrument_version).toBe(getInstrumentVersion(phase));
      expect(state.attempt.phase).toBe(phase);
      expect(state.texts).toHaveLength(5);
      expect(state.questions).toHaveLength(17);
      expect(JSON.stringify(state)).not.toMatch(/"(?:correctOption|correct_option|isCorrect|is_correct|rationale|is_scored|letter|selectedOption)"/u);
      expect(state.texts[1]?.title).toBe(phase === "postest" ? "Los corrales" : "El tanque de la huerta");
    }
  });

  it("reanuda el pretest histórico con su versión y respuestas originales", async () => {
    const student = client();
    const response = await student.request("/attempt/redeem", "POST", { code: "MAC-TEST-BBBB" });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ resumed: true, phase: "pretest" });
    const state: AttemptStateResponse = await (await student.request("/attempt")).json();
    expect(state.texts[1]?.title).toBe("La huerta escolar");
    expect(state.answers).toEqual([{ questionId: 1, displayedPosition: 0 }]);
    expect(state.questions.filter((q) => q.number > 0).every((q) => q.id < 200)).toBe(true);
  });

  it("no permite reutilizar un postest de la versión anterior ni cambia sus datos", async () => {
    const response = await client().request("/attempt/redeem", "POST", { code: "MAC-TEST-CCCC" });
    expect(response.status).toBe(409);
    expect(await response.json()).toHaveProperty("error", expect.stringContaining("código nuevo"));
    expect(await db.prepare("SELECT instrument_version,status FROM attempts WHERE id=3").first())
      .toEqual({ instrument_version: 2, status: "in_progress" });
  });

  it("rechaza respuestas de otro instrumento y exige completar las 16 preguntas", async () => {
    const { student, state } = await startStudent("postest", "Control de integridad");
    expect((await student.request("/attempt/answer", "PUT", {
      questionId: 201, displayedPosition: 0, timeSpentMs: 1000, elapsedMs: 1000,
    })).status).toBe(404);
    const response = await student.request("/attempt/submit", "POST");
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ answered: 0, total: 16 });
    expect(await db.prepare("SELECT status FROM attempts WHERE id=?").bind(state.attempt.id).first())
      .toEqual({ status: "in_progress" });
  });

  it("conserva el orden al reanudar, califica 16/16 en el servidor y excluye el ejemplo", async () => {
    const { student, state, code } = await startStudent("postest", "Postest completo");
    const warmup = state.questions.find((q) => q.number === 0)!;
    const feedback = await student.request("/attempt/answer", "PUT", {
      questionId: warmup.id, displayedPosition: 0, timeSpentMs: 1000, elapsedMs: 1000,
    });
    expect(await feedback.json()).toHaveProperty("feedback");
    await answerAll(student, state);
    const resumed = client();
    expect((await resumed.request("/attempt/redeem", "POST", { code })).status).toBe(200);
    const reloaded: AttemptStateResponse = await (await resumed.request("/attempt")).json();
    expect(reloaded.questions).toEqual(state.questions);
    expect(reloaded.answers).toHaveLength(17);
    const response = await resumed.request("/attempt/submit", "POST");
    expect(await response.json()).toEqual({ ok: true, answered: 16 });
    expect(await db.prepare("SELECT score_total,score_causal,score_predictive FROM attempts WHERE id=?")
      .bind(state.attempt.id).first()).toEqual({ score_total: 16, score_causal: 8, score_predictive: 8 });
    expect((await client().request("/attempt/redeem", "POST", { code })).status).toBe(409);
  }, 30_000);

  it("compara el pretest v2 con el postest v3 y no mezcla sus ítems ni postests antiguos", async () => {
    await finish("pretest", "Par de revisión", (number) => number % 2 === 0);
    await finish("postest", "Par de revisión");
    const paired: PairedResponse = await (await admin.request("/admin/analytics/paired")).json();
    expect(paired.pairs.find((p) => p.label === "Par de revisión")).toMatchObject({
      pretest: { scoreTotal: 8, scoreCausal: 4, scorePredictive: 4 },
      postest: { scoreTotal: 16, scoreCausal: 8, scorePredictive: 8 },
    });
    expect(paired.ambiguousLabels).not.toContain("Par de revisión");
    for (const phase of ["pretest", "postest"] as const) {
      const analytics: AnalyticsResponse = await (await admin.request(`/admin/analytics?phase=${phase}`)).json();
      expect(analytics.instrumentVersion).toBe(getInstrumentVersion(phase));
      expect(analytics.items).toHaveLength(16);
      expect(analytics.items.every((item) => phase === "postest" ? item.textId >= 31 : item.textId < 30)).toBe(true);
      if (phase === "pretest") expect(analytics.attempts.some((a) => a.label === "Histórico")).toBe(true);
      else expect(analytics.attempts.some((a) => a.attemptId === 4)).toBe(false);
    }
  }, 30_000);

  it("informa que ambos instrumentos están disponibles", async () => {
    const health = await (await client().request("/health")).json();
    expect(health).toMatchObject({
      database: "conectada", items: 16,
      instruments: { pretest: { version: 2, items: 16 }, postest: { version: 3, items: 16 } },
    });
  });
});
