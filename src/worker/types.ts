/**
 * Bindings del Worker.
 *
 * Los valores marcados como secret se cargan con `wrangler secret put`
 * y en desarrollo local desde `.dev.vars`.
 */
export interface Env {
  DB: D1Database;
  /** Código de acceso al panel gestor. */
  ADMIN_MASTER_CODE: string;
  /** Clave para firmar sesiones (HMAC-SHA256). Mínimo 32 bytes. */
  SESSION_SECRET: string;
}

export type AppEnv = { Bindings: Env };
