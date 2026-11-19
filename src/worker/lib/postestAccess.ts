import { generateCode } from "./codes";
import { now, type AccessCodeRow } from "./db";

/** El registro de pretest nunca cambia: el postest utiliza otro acceso. */
export async function resolvePostestAccess(
  db: D1Database,
  original: AccessCodeRow,
): Promise<AccessCodeRow> {
  if (original.phase === "postest") return original;

  const linkedAccess = () => db.prepare(
    `SELECT ac.*
       FROM postest_code_links link
       JOIN access_codes ac ON ac.id = link.postest_access_code_id
      WHERE link.pretest_access_code_id = ? AND ac.phase = 'postest'`,
  ).bind(original.id).first<AccessCodeRow>();

  const linked = await linkedAccess();
  if (linked) return linked;

  for (let retry = 0; retry < 3; retry++) {
    const code = generateCode();
    const timestamp = now();
    try {
      // D1 ejecuta el batch como una transacción. Los NOT EXISTS impiden
      // crear accesos huérfanos si dos dispositivos canjean a la vez.
      await db.batch([
        db.prepare(
          `INSERT INTO access_codes
             (code, label, phase, status, batch_id, created_at, expires_at, notes)
           SELECT ?, label, 'postest', 'active',
                  'postest_reutilizado_' || COALESCE(batch_id, CAST(id AS TEXT)),
                  ?, expires_at, 'Acceso al postest con el código original del pretest.'
             FROM access_codes
            WHERE id = ? AND phase = 'pretest'
              AND NOT EXISTS (
                SELECT 1 FROM postest_code_links WHERE pretest_access_code_id = ?
              )`,
        ).bind(code, timestamp, original.id, original.id),
        db.prepare(
          `INSERT INTO postest_code_links
             (pretest_access_code_id, postest_access_code_id, created_at)
           SELECT ?, id, ? FROM access_codes
            WHERE code = ? AND phase = 'postest'
              AND NOT EXISTS (
                SELECT 1 FROM postest_code_links WHERE pretest_access_code_id = ?
              )`,
        ).bind(original.id, timestamp, code, original.id),
      ]);
    } catch (error) {
      // Solo se reintenta una colisión de código; no se ocultan fallos de D1.
      if (!(error instanceof Error) || !/UNIQUE constraint failed: access_codes\.code/i.test(error.message)) {
        throw error;
      }
    }

    const access = await linkedAccess();
    if (access) return access;
  }

  throw new Error("No se pudo vincular el acceso al postest");
}
