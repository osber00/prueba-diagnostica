import { GuiaLectura } from "@/components/illustrations";

/**
 * Pantalla final. Deliberadamente sin puntaje: es una prueba diagnóstica,
 * no un juego. El resultado lo revisa el docente desde el panel gestor.
 */
export function DoneScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-8 text-center">
      <GuiaLectura mood="celebrating" className="size-32 animate-pop-in" />

      <div className="mt-6 space-y-2">
        <h1 className="text-2xl font-extrabold text-ink-900">¡Terminaste!</h1>
        <p className="text-base leading-relaxed text-ink-500">
          Gracias por tu esfuerzo y por leer con atención. Ya puedes cerrar esta
          ventana.
        </p>
      </div>
    </main>
  );
}
