import type { ComponentType } from "react";
import { CalentamientoIllustration } from "./CalentamientoIllustration";
import { HuertaIllustration } from "./HuertaIllustration";
import { TransporteIllustration } from "./TransporteIllustration";
import { LecturaIllustration } from "./LecturaIllustration";
import { ArroyoIllustration } from "./ArroyoIllustration";
import { TanqueHuertaIllustration } from "./TanqueHuertaIllustration";
import { GeneradorIllustration } from "./GeneradorIllustration";
import { DosCaminosIllustration } from "./DosCaminosIllustration";
import { MangosIllustration } from "./MangosIllustration";

export { GuiaLectura } from "./GuiaLectura";
export { CalentamientoIllustration } from "./CalentamientoIllustration";
export { HuertaIllustration } from "./HuertaIllustration";
export { TransporteIllustration } from "./TransporteIllustration";
export { LecturaIllustration } from "./LecturaIllustration";
export { ArroyoIllustration } from "./ArroyoIllustration";
export { TanqueHuertaIllustration } from "./TanqueHuertaIllustration";
export { GeneradorIllustration } from "./GeneradorIllustration";
export { DosCaminosIllustration } from "./DosCaminosIllustration";
export { MangosIllustration } from "./MangosIllustration";

interface IllustrationProps {
  className?: string;
}

/**
 * Registro que conecta `illustration_key` (columna `texts.illustration_key`
 * en D1) con su componente SVG.
 *
 * Vive en el cliente porque las ilustraciones son código, no datos: mantener
 * la clave en la base y el dibujo en el bundle evita mandar SVGs por la red.
 */
export const ILLUSTRATIONS: Record<string, ComponentType<IllustrationProps>> = {
  calentamiento: CalentamientoIllustration,
  huerta: HuertaIllustration,
  transporte: TransporteIllustration,
  lectura: LecturaIllustration,
  arroyo: ArroyoIllustration,
  "tanque-huerta": TanqueHuertaIllustration,
  generador: GeneradorIllustration,
  "dos-caminos": DosCaminosIllustration,
  mangos: MangosIllustration,
};

/** Ilustración por clave, con reserva silenciosa si la clave no existe. */
export function getIllustration(key: string): ComponentType<IllustrationProps> {
  return ILLUSTRATIONS[key] ?? HuertaIllustration;
}
