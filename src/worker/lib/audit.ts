import { now } from "./db";

/**
 * Registro de auditoría.
 *
 * Deja rastro de las acciones sensibles (emisión y anulación de códigos,
 * reinicio de intentos, envíos) para poder reconstruir lo ocurrido durante la
 * aplicación si aparece una anomalía en los datos.
 *
 * Nunca debe interrumpir la operación principal: si falla, se registra en
 * consola y se continúa.
 */
export async function logAudit(
  db: D1Database,
  actor: string,
  action: string,
  detail?: string,
): Promise<void> {
  try {
    await db
      .prepare(
        "INSERT INTO audit_log (actor, action, detail, created_at) VALUES (?, ?, ?, ?)",
      )
      .bind(actor, action, detail ?? null, now())
      .run();
  } catch (error) {
    console.error("No se pudo escribir en la auditoría:", error);
  }
}
