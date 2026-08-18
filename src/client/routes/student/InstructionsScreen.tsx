import type { ReactNode } from "react";
import { Tucan } from "@/components/illustrations";
import { Button } from "@/components/ui/Button";

interface InstructionsScreenProps {
  label: string | null;
  onContinue: () => void;
}

export function InstructionsScreen({ label, onContinue }: InstructionsScreenProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-8">
      <div className="space-y-6 text-center">
        <Tucan mood="greeting" className="mx-auto size-24" />

        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold text-ink-900">
            {label ? `¡Hola, ${label}!` : "¡Hola!"}
          </h1>
          <p className="text-sm text-ink-500">
            Antes de empezar, lee esto con calma.
          </p>
        </div>

        <ul className="space-y-3 rounded-card border-2 border-ink-200 bg-white p-5 text-left text-sm leading-relaxed text-ink-700">
          <Item>Vas a leer 4 textos cortos. Después de cada uno respondes 4 preguntas.</Item>
          <Item>
            No todas las respuestas están escritas tal cual en el texto: a veces
            tendrás que relacionar varias pistas para llegar a una conclusión.
          </Item>
          <Item>Puedes volver a leer el texto en cualquier momento mientras respondes.</Item>
          <Item>Puedes avanzar y retroceder, y cambiar una respuesta antes de enviarla.</Item>
          <Item>No hay tiempo límite. Tómate el tiempo que necesites.</Item>
        </ul>

        <Button onClick={onContinue}>Empezar con un ejemplo</Button>
      </div>
    </main>
  );
}

function Item({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 text-rio-500" aria-hidden="true">
        ●
      </span>
      <span>{children}</span>
    </li>
  );
}
