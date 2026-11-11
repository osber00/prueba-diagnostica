import { Hono } from "hono";
import type { HealthResponse } from "@shared/types";
import type { AppEnv } from "./types";
import { INSTRUMENT_VERSIONS } from "@shared/instruments";
import { countScoredQuestions } from "./lib/db";
import { studentRoutes } from "./routes/student";
import { adminRoutes } from "./routes/admin";

export type { Env, AppEnv } from "./types";

const APP_VERSION = "0.4.0";

const app = new Hono<AppEnv>().basePath("/api");

/**
 * Sonda de salud. Confirma que el Worker responde y que D1 está migrada.
 * No expone información sensible: solo el conteo de ítems sembrados.
 */
app.get("/health", async (c) => {
  let database: HealthResponse["database"] = "no disponible";
  let items = 0;
  let postestItems = 0;

  try {
    [items, postestItems] = await Promise.all([
      countScoredQuestions(c.env.DB, INSTRUMENT_VERSIONS.pretest),
      countScoredQuestions(c.env.DB, INSTRUMENT_VERSIONS.postest),
    ]);
    database = "conectada";
  } catch (error) {
    // Antes de aplicar las migraciones la tabla no existe todavía.
    database =
      error instanceof Error && /no such table/i.test(error.message)
        ? "sin migrar"
        : "no disponible";
  }

  return c.json<HealthResponse>({
    status: "ok",
    database,
    items,
    instruments: {
      pretest: { version: INSTRUMENT_VERSIONS.pretest, items },
      postest: { version: INSTRUMENT_VERSIONS.postest, items: postestItems },
    },
    version: APP_VERSION,
  });
});

app.use("/attempt/*", async (c, next) => {
  if (!hasValidSecrets(c.env)) {
    return c.json({ error: "El servicio no está configurado correctamente" }, 503);
  }
  return next();
});

app.use("/admin/*", async (c, next) => {
  if (!hasValidSecrets(c.env)) {
    return c.json({ error: "El servicio no está configurado correctamente" }, 503);
  }
  return next();
});

app.route("/attempt", studentRoutes);
app.route("/admin", adminRoutes);

/** Cualquier ruta /api desconocida responde JSON, nunca el index.html. */
app.notFound((c) => c.json({ error: "Ruta no encontrada" }, 404));

app.onError((error, c) => {
  console.error("Error no controlado:", error);
  return c.json({ error: "Error interno del servidor" }, 500);
});

export default app;

function hasValidSecrets(env: AppEnv["Bindings"]): boolean {
  return (
    typeof env.ADMIN_MASTER_CODE === "string" &&
    env.ADMIN_MASTER_CODE.length >= 6 &&
    typeof env.SESSION_SECRET === "string" &&
    new TextEncoder().encode(env.SESSION_SECRET).length >= 32
  );
}
