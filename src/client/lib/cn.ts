/**
 * Une clases condicionales.
 *
 * Se implementa a mano en lugar de usar `clsx` + `tailwind-merge`: son ~8 KB
 * que no se justifican en una aplicación que debe cargar sobre datos móviles
 * rurales. A cambio, hay que evitar pasar clases contradictorias.
 */
export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}
