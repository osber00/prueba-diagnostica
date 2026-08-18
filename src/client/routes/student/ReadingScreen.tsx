import { Button } from "@/components/ui/Button";
import { getIllustration } from "@/components/illustrations";
import { StudentTopBar } from "./StudentTopBar";
import type { TextGroup } from "./steps";

interface ReadingScreenProps {
  group: TextGroup;
  /** `null` en el texto de calentamiento: no cuenta dentro de los 16 ítems. */
  progress: { current: number; completed: number[] } | null;
  timerLabel: string;
  onBack?: (() => void) | undefined;
  onContinue: () => void;
}

export function ReadingScreen({
  group,
  progress,
  timerLabel,
  onBack,
  onContinue,
}: ReadingScreenProps) {
  const Illustration = getIllustration(group.text.illustrationKey);
  const isWarmup = group.text.orderIndex === 0;

  return (
    <div className="min-h-dvh pb-28">
      <StudentTopBar progress={progress} timerLabel={timerLabel} onBack={onBack} />

      <main className="mx-auto max-w-md space-y-5 px-5 pt-4">
        {isWarmup && (
          <p className="text-center text-xs font-bold uppercase tracking-wide text-rio-600">
            Ejemplo — no cuenta para tu resultado
          </p>
        )}

        <Illustration className="w-full rounded-card" />

        <div className="space-y-3">
          <h1 className="text-xl font-extrabold text-ink-900">{group.text.title}</h1>
          {group.text.body.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-ink-700 text-balance-pretty">
              {paragraph}
            </p>
          ))}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink-200 bg-white px-5 py-4 safe-bottom">
        <div className="mx-auto max-w-md">
          <Button onClick={onContinue}>Ya leí, continuar</Button>
        </div>
      </div>
    </div>
  );
}
