import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "./crypto";

/**
 * Sesiones firmadas con HMAC-SHA256.
 *
 * Existen dos tipos independientes:
 *   - `attempt`: liga al estudiante con su intento en curso.
 *   - `admin`:   da acceso al panel gestor.
 *
 * Ambas viajan en cookies HttpOnly, de modo que ningún script del cliente
 * pueda leerlas ni suplantarlas.
 */

export const ATTEMPT_COOKIE = "pdi_intento";
export const ADMIN_COOKIE = "pdi_gestor";

/** Duración de la sesión del estudiante: cubre con holgura una jornada escolar. */
const ATTEMPT_TTL_MS = 12 * 60 * 60 * 1000;

/** Duración de la sesión del gestor. */
export const ADMIN_TTL_MS = 8 * 60 * 60 * 1000;

interface SessionPayload {
  /** Identificador del sujeto: id de intento o id de sesión de gestor. */
  sub: string;
  /** Expiración, en milisegundos desde época. */
  exp: number;
}

function encode(payload: SessionPayload): string {
  // btoa sobre JSON: el payload no es secreto, solo debe ser inalterable.
  return btoa(JSON.stringify(payload)).replace(/=+$/, "");
}

function decode(raw: string): SessionPayload | null {
  try {
    const json = atob(raw + "=".repeat((4 - (raw.length % 4)) % 4));
    const parsed: unknown = JSON.parse(json);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "sub" in parsed &&
      "exp" in parsed &&
      typeof (parsed as SessionPayload).sub === "string" &&
      typeof (parsed as SessionPayload).exp === "number"
    ) {
      return parsed as SessionPayload;
    }
  } catch {
    // Payload corrupto: se trata como sesión inexistente.
  }
  return null;
}

async function issue(
  subject: string,
  ttlMs: number,
  secret: string,
): Promise<string> {
  return sign(encode({ sub: subject, exp: Date.now() + ttlMs }), secret);
}

async function read(token: string, secret: string): Promise<string | null> {
  const payload = await verify(token, secret);
  if (!payload) return null;

  const session = decode(payload);
  if (!session || session.exp < Date.now()) return null;

  return session.sub;
}

/* ---------------------------------------------------------------------------
   Cookies
--------------------------------------------------------------------------- */

/**
 * `Secure` se activa solo bajo HTTPS.
 *
 * En Cloudflare el tráfico siempre es HTTPS, así que en producción la cookie
 * siempre lleva la marca. En desarrollo el servidor es http://localhost y, al
 * probar desde un móvil real, http://192.168.x.x: en ambos casos una cookie
 * `Secure` sería descartada por el cliente y la sesión no funcionaría.
 */
function cookieOptions(c: Context, maxAgeSeconds: number) {
  const isHttps = new URL(c.req.url).protocol === "https:";

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "Lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function setAttemptSession(
  c: Context,
  attemptId: number,
  secret: string,
): Promise<void> {
  const token = await issue(String(attemptId), ATTEMPT_TTL_MS, secret);
  setCookie(c, ATTEMPT_COOKIE, token, cookieOptions(c, ATTEMPT_TTL_MS / 1000));
}

export async function getAttemptSession(
  c: Context,
  secret: string,
): Promise<number | null> {
  const token = getCookie(c, ATTEMPT_COOKIE);
  if (!token) return null;

  const subject = await read(token, secret);
  if (!subject) return null;

  const attemptId = Number(subject);
  return Number.isInteger(attemptId) && attemptId > 0 ? attemptId : null;
}

export function clearAttemptSession(c: Context): void {
  deleteCookie(c, ATTEMPT_COOKIE, { path: "/" });
}

export async function setAdminSession(
  c: Context,
  sessionId: string,
  secret: string,
): Promise<void> {
  const token = await issue(sessionId, ADMIN_TTL_MS, secret);
  setCookie(c, ADMIN_COOKIE, token, cookieOptions(c, ADMIN_TTL_MS / 1000));
}

export async function getAdminSession(
  c: Context,
  secret: string,
): Promise<string | null> {
  const token = getCookie(c, ADMIN_COOKIE);
  if (!token) return null;
  return read(token, secret);
}

export function clearAdminSession(c: Context): void {
  deleteCookie(c, ADMIN_COOKIE, { path: "/" });
}
