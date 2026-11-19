import type { Phase } from "./types";

/** El pretest permanece disponible para consulta, pero ya no se aplica. */
export const OPEN_STUDENT_PHASE = "postest" as const;

/** La versión del pretest no cambia al incorporar un instrumento de postest. */
export const INSTRUMENT_VERSIONS = {
  pretest: 2,
  postest: 3,
} as const satisfies Record<Phase, number>;

export function getInstrumentVersion(phase: Phase): number {
  return INSTRUMENT_VERSIONS[phase];
}
