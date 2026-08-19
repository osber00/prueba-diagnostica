import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { OptionCard } from "@/components/ui/OptionCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sheet } from "@/components/ui/Sheet";
import {
  Tucan,
  HuertaIllustration,
  TransporteIllustration,
  LecturaIllustration,
  ArroyoIllustration,
  CalentamientoIllustration,
} from "@/components/illustrations";

/**
 * Vitrina temporal del sistema de diseño (Fase 3).
 * Se retira o se protege tras verificar visualmente los componentes;
 * el flujo real del estudiante llega en la Fase 4.
 */
export function DesignPreview() {
  const [selected, setSelected] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <main className="mx-auto min-h-dvh max-w-md space-y-8 px-5 py-6">
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-ink-300">Mascota</h2>
        <div className="flex justify-around rounded-card bg-ink-100 p-4">
          <Tucan mood="greeting" className="size-20" />
          <Tucan mood="cheering" className="size-20" />
          <Tucan mood="celebrating" className="size-20" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-ink-300">
          Ilustraciones (4 textos + calentamiento)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <CalentamientoIllustration className="rounded-card border-2 border-ink-100" />
          <HuertaIllustration className="rounded-card border-2 border-ink-100" />
          <TransporteIllustration className="rounded-card border-2 border-ink-100" />
          <LecturaIllustration className="rounded-card border-2 border-ink-100" />
          <ArroyoIllustration className="rounded-card border-2 border-ink-100" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-ink-300">
          Barra de progreso
        </h2>
        <ProgressBar total={16} current={6} completed={[0, 1, 2, 3, 4, 5]} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-ink-300">
          Tarjetas de opción
        </h2>
        <div className="space-y-3">
          {[
            "Porque recibían más sol y el suelo perdía humedad con rapidez.",
            "Porque las semillas usadas en esa zona tenían menor capacidad de crecimiento.",
            "Porque las hojas secas impedían que las raíces absorbieran suficiente agua.",
            "Porque los estudiantes aplicaban demasiada agua en la mañana.",
          ].map((text, i) => (
            <OptionCard key={i} selected={selected === i} onClick={() => setSelected(i)}>
              {text}
            </OptionCard>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-ink-300">
          Estados de retroalimentación (solo calentamiento)
        </h2>
        <div className="space-y-3">
          <OptionCard correct>Porque vio que podía llover y fue a buscar una sombrilla.</OptionCard>
          <OptionCard incorrect>Porque había olvidado la maleta en la sala.</OptionCard>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-ink-300">Botones</h2>
        <div className="space-y-3">
          <Button variant="primary">Continuar</Button>
          <Button variant="info">Ver el texto</Button>
          <Button variant="secondary">Volver</Button>
          <Button variant="danger">Anular código</Button>
          <Button disabled>Deshabilitado</Button>
          <Button onClick={() => setSheetOpen(true)} variant="info">
            Abrir bottom-sheet
          </Button>
        </div>
      </section>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="El tanque de la huerta">
        <p className="leading-relaxed text-ink-700">
          En la huerta escolar se utiliza un tanque que se llena completamente
          cada lunes. Durante varias semanas, cuando había seis eras sembradas y
          se regaban una vez al día, el agua alcanzaba normalmente hasta el viernes...
        </p>
      </Sheet>
    </main>
  );
}
