import { randomInt } from "./crypto";

/**
 * Alfabeto sin caracteres que se confunden al leer o digitar en un móvil:
 * se excluyen O, 0, I, 1 y L. Quedan 31 símbolos.
 *
 * Es una decisión de usabilidad, no estética: los códigos se reparten impresos
 * en papel y se digitan en pantallas pequeñas.
 *
 * Entropía: 31^8 ≈ 8,5 × 10^11 combinaciones. Con el límite de intentos por IP
 * es inviable adivinar un código por fuerza bruta.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const GROUP_LENGTH = 4;
const PREFIX = "MAC";

/** Genera un código con formato `MAC-XXXX-XXXX`. */
export function generateCode(): string {
  const group = () =>
    Array.from(
      { length: GROUP_LENGTH },
      () => ALPHABET[randomInt(ALPHABET.length)] ?? "A",
    ).join("");

  return `${PREFIX}-${group()}-${group()}`;
}

/**
 * Genera `quantity` códigos distintos entre sí.
 *
 * La unicidad definitiva la garantiza la restricción UNIQUE de D1; este Set
 * solo evita colisiones dentro del mismo lote antes de tocar la base.
 */
export function generateCodes(quantity: number): string[] {
  const codes = new Set<string>();

  // Cota de seguridad: el espacio es 31^8, la colisión es improbable,
  // pero el bucle no debe poder quedarse girando.
  let guard = quantity * 20;
  while (codes.size < quantity && guard-- > 0) {
    codes.add(generateCode());
  }

  return [...codes];
}

/**
 * Normaliza lo que escribe el estudiante: mayúsculas, sin separadores y con
 * los guiones recolocados. Acepta `mac4f7k2p9q`, `MAC 4F7K 2P9Q`, etc.
 *
 * Deliberadamente NO intenta adivinar caracteres mal leídos. Un carácter fuera
 * del alfabeto (O, 0, I, 1, L) es ambiguo: sustituirlo por conjetura produciría
 * un código válido pero ajeno, que podría pertenecer a otro estudiante.
 * Es preferible rechazarlo y pedir que lo revise.
 */
export function normalizeCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[\s\-_.]/g, "");
  const body = cleaned.startsWith(PREFIX) ? cleaned.slice(PREFIX.length) : cleaned;

  if (body.length !== GROUP_LENGTH * 2) return cleaned;

  return `${PREFIX}-${body.slice(0, GROUP_LENGTH)}-${body.slice(GROUP_LENGTH)}`;
}

/** Caracteres que el estudiante pudo digitar pero no existen en el alfabeto. */
export function findAmbiguousCharacters(input: string): string[] {
  const cleaned = input.toUpperCase().replace(/[\s\-_.]/g, "");
  const body = cleaned.startsWith(PREFIX) ? cleaned.slice(PREFIX.length) : cleaned;

  return [...new Set(body)].filter((char) => !ALPHABET.includes(char));
}

/** Identificador de lote, para agrupar los códigos emitidos en una generación. */
export function generateBatchId(): string {
  return `lote_${Date.now().toString(36)}_${randomInt(0xffff).toString(36)}`;
}
