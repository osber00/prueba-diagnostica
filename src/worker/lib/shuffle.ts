/**
 * Barajado determinista de opciones.
 *
 * Motivo: la clave del instrumento sigue el patrón regular B-D-A-C repetido
 * cuatro veces. Un estudiante que lo detecte puede acertar sin inferir, lo que
 * invalidaría la medición. Barajar el orden por estudiante elimina el patrón
 * sin modificar el instrumento validado.
 *
 * El barajado es determinista (semilla del intento + id del ítem) para que:
 *   1. El estudiante vea siempre el mismo orden si recarga o retoma la prueba.
 *   2. No haya que persistir el orden de las 16 preguntas en la base de datos.
 */

/**
 * Generador congruencial lineal de 32 bits (parámetros de Numerical Recipes).
 *
 * No es criptográficamente seguro y no necesita serlo: solo debe producir una
 * permutación reproducible. La imprevisibilidad no aporta nada aquí porque el
 * estudiante ya ve el resultado.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Combina la semilla del intento con el id del ítem. */
function deriveSeed(attemptSeed: number, questionId: number): number {
  // Multiplicar por un primo grande dispersa semillas contiguas,
  // evitando que ítems consecutivos compartan permutación.
  return (Math.imul(attemptSeed ^ questionId, 2654435761) >>> 0) || 1;
}

/**
 * Devuelve una permutación de `items` reproducible para el par
 * (semilla de intento, id de ítem). Usa Fisher-Yates.
 */
export function shuffleForAttempt<T>(
  items: readonly T[],
  attemptSeed: number,
  questionId: number,
): T[] {
  const random = createRandom(deriveSeed(attemptSeed, questionId));
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = result[i];
    const b = result[j];
    // Guardas exigidas por noUncheckedIndexedAccess; ambos índices son válidos.
    if (a !== undefined && b !== undefined) {
      result[i] = b;
      result[j] = a;
    }
  }

  return result;
}

/** Semilla aleatoria para un intento nuevo. */
export function createAttemptSeed(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  // Se evita el 0 porque anularía el generador congruencial.
  return (buffer[0] ?? 1) || 1;
}
