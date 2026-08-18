import { Hono } from "hono";
import type { HealthResponse } from "@shared/types";
import type { AppEnv } from "./types";
import { countScoredQuestions } from "./lib/db";
import { studentRoutes } from "./routes/student";
import { adminRoutes } from "./routes/admin";

export type { Env, AppEnv } from "./types";

const APP_VERSION = "0.2.0";

const app = new Hono<AppEnv>().basePath("/api");

/**
 * Sonda de salud. Confirma que el Worker responde y que D1 está migrada.
 * No expone información sensible: solo el conteo de ítems sembrados.
 */
app.get("/health", async (c) => {
  let database: HealthResponse["database"] = "no disponible";
  let items = 0;

  try {
    items = await countScoredQuestions(c.env.DB);
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
    version: APP_VERSION,
  });
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
