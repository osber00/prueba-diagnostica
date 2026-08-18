/**
 * Utilidades criptográficas basadas en WebCrypto.
 *
 * Se evita cualquier librería de JWT a propósito: HMAC-SHA256 nativo cubre la
 * necesidad y mantiene el Worker por debajo del límite de CPU del plan gratuito.
 */

const encoder = new TextEncoder();

/** Convierte bytes a hexadecimal en minúsculas. */
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 en hexadecimal. Se usa para guardar tokens sin almacenarlos en claro. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toHex(digest);
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Firma un payload y devuelve `payload.firma`. */
export async function sign(payload: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toHex(signature)}`;
}

/**
 * Verifica un token firmado y devuelve el payload, o `null` si no es válido.
 *
 * La comparación la hace `crypto.subtle.verify`, que es de tiempo constante:
 * no se compara con `===` para no filtrar información por temporización.
 */
export async function verify(
  token: string,
  secret: string,
): Promise<string | null> {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signatureHex = token.slice(separator + 1);

  if (signatureHex.length !== 64 || !/^[0-9a-f]+$/.test(signatureHex)) return null;

  const signature = new Uint8Array(
    signatureHex.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
  );
  if (signature.length !== 32) return null;

  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(payload),
  );

  return valid ? payload : null;
}

/**
 * Comparación de cadenas en tiempo constante.
 * Necesaria al validar el código maestro del gestor.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bytesA = encoder.encode(a);
  const bytesB = encoder.encode(b);

  // La longitud sí se filtra, pero eso no compromete el secreto.
  if (bytesA.length !== bytesB.length) return false;

  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) {
    diff |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
  }
  return diff === 0;
}

/** Entero aleatorio criptográficamente seguro en [0, max). */
export function randomInt(max: number): number {
  const buffer = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;

  // Se descartan los valores del último tramo incompleto para evitar sesgo.
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0] ?? 0;
  } while (value >= limit);

  return value % max;
}
