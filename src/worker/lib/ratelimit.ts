import { now } from "./db";

/**
 * Límite de intentos de canje por dirección IP.
 *
 * DECISIÓN CRÍTICA: solo se contabilizan los canjes FALLIDOS.
 *
 * El motivo es el contexto de aplicación. En la I.E. Macaján los 37 estudiantes
 * se conectan por la misma red, de modo que Cloudflare ve una única IP para todo
 * el grupo. Si se contara cada canje, el límite se agotaría hacia el estudiante
 * número 11 y la prueba quedaría bloqueada en plena aplicación.
 *
 * Un canje exitoso demuestra que quien lo hace posee un código legítimo, así que
 * no consume cuota y además reinicia el contador. Un ataque de fuerza bruta, en
 * cambio, produce fallos casi exclusivamente, y ahí sí se frena.
 *
 * Se implementa sobre D1 en lugar de Durable Objects para no salir del plan
 * gratuito. No se busca exactitud transaccional, sino frenar la automatización.
 */

const WINDOW_MS = 10 * 60 * 1000;

/**
 * Fallos tolerados por IP dentro de la ventana.
 *
 * Holgado a propósito: con 37 estudiantes digitando códigos desde el papel,
 * unos cuantos errores de tecleo son normales y no deben bloquear al grupo.
 * Sigue siendo irrisorio frente a las 31^8 combinaciones posibles.
 */
const MAX_FAILURES = 30;

/** Comprueba si la IP puede seguir intentando. No modifica el contador. */
export async function canAttemptRedeem(
  db: D1Database,
  ip: string,
): Promise<boolean> {
  try {
    const row = await db
      .prepare("SELECT count, window_start FROM redeem_attempts WHERE ip = ?")
      .bind(ip)
      .first<{ count: number; window_start: number }>();

    if (!row) return true;

    // Ventana vencida: el contador ya no aplica.
    if (row.window_start < now() - WINDOW_MS) return true;

    return row.count < MAX_FAILURES;
  } catch (error) {
    // Ante un fallo del control se permite el paso: bloquear a un estudiante
    // durante la aplicación es peor que aceptar un intento extra.
    console.error("Fallo al consultar el control de intentos:", error);
    return true;
  }
}

/** Registra un canje fallido. */
export async function recordFailedRedeem(
  db: D1Database,
  ip: string,
): Promise<void> {
  const timestamp = now();

  try {
    await db
      .prepare(
        `INSERT INTO redeem_attempts (ip, count, window_start)
         VALUES (?1, 1, ?2)
         ON CONFLICT (ip) DO UPDATE SET
           count        = CASE WHEN redeem_attempts.window_start < ?3 THEN 1
                               ELSE redeem_attempts.count + 1 END,
           window_start = CASE WHEN redeem_attempts.window_start < ?3 THEN ?2
                               ELSE redeem_attempts.window_start END`,
      )
      .bind(ip, timestamp, timestamp - WINDOW_MS)
      .run();
  } catch (error) {
    console.error("Fallo al registrar el intento:", error);
  }
}

/** Limpia el contador de una IP tras un canje exitoso. */
export async function clearRedeemFailures(
  db: D1Database,
  ip: string,
): Promise<void> {
  try {
    await db.prepare("DELETE FROM redeem_attempts WHERE ip = ?").bind(ip).run();
  } catch (error) {
    console.error("Fallo al limpiar el contador de intentos:", error);
  }
}
