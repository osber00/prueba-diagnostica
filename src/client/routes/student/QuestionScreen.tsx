import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { PublicQuestion } from "@shared/types";
import type { SaveAnswerRequest } from "@shared/schemas";
import { Button } from "@/components/ui/Button";
import { OptionCard } from "@/components/ui/OptionCard";
import { Sheet } from "@/components/ui/Sheet";
import { getIllustration } from "@/components/illustrations";
import { saveAnswer } from "@/lib/api";
import { StudentTopBar } from "./StudentTopBar";
import type { TextGroup } from "./steps";

interface QuestionScreenProps {
  group: TextGroup;
  question: PublicQuestion;
  /** `null` para el ítem de calentamiento: no cuenta entre los 16 ítems. */
  progress: { current: number; completed: number[] } | null;
  timerLabel: string;
  attemptStartedAt: number;
  /** Selección previa, si el estudiante ya había respondido y volvió atrás. */
  initialSelection: number | null;
  /** Actualiza el estado local del padre (progreso, resumen). No hace red. */
  onAnswered: (questionId: number, position: number) => void;
  /** Autoguardado en segundo plano, usado solo para los 16 ítems reales. */
  queueAnswer: (job: SaveAnswerRequest) => void;
  onBack?: (() => void) | undefined;
  onExit: () => void;
  onNext: () => void;
}

const isWarmup = (q: PublicQuestion) => q.number === 0;

export function QuestionScreen({
  group,
  question,
  progress,
  timerLabel,
  attemptStartedAt,
  initialSelection,
  onAnswered,
  queueAnswer,
  onBack,
  onExit,
  onNext,
}: QuestionScreenProps) {
  const [selected, setSelected] = useState<number | null>(initialSelection);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctPosition: number;
  } | null>(null);
  const [warmupError, setWarmupError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const enteredAtRef = useRef(Date.now());
  const Illustration = getIllustration(group.text.illustrationKey);

  // Al cambiar de pregunta se reinicia el cronómetro por-ítem y se limpia
  // cualquier retroalimentación de una visita anterior.
  useEffect(() => {
    enteredAtRef.current = Date.now();
    setSelected(initialSelection);
    setFeedback(null);
    setWarmupError(null);
    // Solo debe reaccionar al cambio de pregunta, no a `initialSelection`
    // (que es estable dentro de la misma visita a la pantalla).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  async function handleSelect(position: number) {
    const timeSpentMs = Date.now() - enteredAtRef.current;
    enteredAtRef.current = Date.now();

    setSelected(position);
    onAnswered(question.id, position);

    const job: SaveAnswerRequest = {
      questionId: question.id,
      displayedPosition: position,
      timeSpentMs,
      elapsedMs: Date.now() - attemptStartedAt,
    };

    if (isWarmup(question)) {
      // El calentamiento necesita el resultado de inmediato para enseñar la
      // mecánica; por eso aquí sí se espera la respuesta del servidor, en
      // lugar de pasar por la cola de autoguardado silenciosa.
      setWarmupError(null);
      try {
        const res = await saveAnswer(job);
        setFeedback(res.feedback ?? null);
      } catch {
        setWarmupError(
          "No se pudo verificar tu respuesta. No importa, puedes continuar.",
        );
      }
    } else {
      queueAnswer(job);
    }
  }

  const locked = isWarmup(question) && feedback !== null;

  function handleRadioKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const radios = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
    );
    const current = radios.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;

    let next = current;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % radios.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (current - 1 + radios.length) % radios.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = radios.length - 1;
    else return;

    event.preventDefault();
    radios[next]?.focus();
    radios[next]?.click();
  }

  return (
    <div className="min-h-dvh pb-32">
      <StudentTopBar progress={progress} timerLabel={timerLabel} onBack={onBack} onExit={onExit} />

      <main className="mx-auto max-w-md space-y-5 px-5 pt-4">
        {isWarmup(question) && (
          <p className="text-center text-xs font-bold uppercase tracking-wide text-rio-600">
            Ejemplo — no cuenta para tu resultado
          </p>
        )}

        <Button
          variant="info"
          size="md"
          onClick={() => setSheetOpen(true)}
          className="gap-2"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.5c-3-3-8-3-9.5 0v11c1.5-3 6.5-3 9.5 0m0-11c3-3 8-3 9.5 0v11c-1.5-3-6.5-3-9.5 0m0-11v11"
            />
          </svg>
          Ver el texto: {group.text.title}
        </Button>

        <h1 className="text-lg font-extrabold leading-snug text-ink-900 text-balance-pretty">
          {question.stem}
        </h1>

        <div
          role="radiogroup"
          aria-label="Opciones de respuesta"
          className="space-y-3"
          onKeyDown={handleRadioKeyDown}
        >
          {question.options.map((opt, i) => {
            let correct = false;
            let incorrect = false;

            if (isWarmup(question) && feedback) {
              if (i === feedback.correctPosition) correct = true;
              else if (i === selected && !feedback.isCorrect) incorrect = true;
            }

            return (
              <OptionCard
                key={`${question.id}-${i}`}
                selected={i === selected}
                correct={correct}
                incorrect={incorrect}
                disabled={locked}
                tabIndex={selected === i || (selected === null && i === 0) ? 0 : -1}
                onClick={() => void handleSelect(i)}
              >
                {opt.content}
              </OptionCard>
            );
          })}
        </div>

        {warmupError && (
          <p role="alert" className="rounded-xl bg-alerta-50 px-4 py-3 text-sm font-semibold text-alerta-700">
            {warmupError}
          </p>
        )}

        {isWarmup(question) && feedback && (
          <p className="rounded-xl bg-rio-50 px-4 py-3 text-sm leading-relaxed text-rio-700">
            {feedback.isCorrect
              ? "¡Muy bien! Combinaste varias pistas del texto para llegar a esa conclusión, aunque no estuviera escrita tal cual."
              : "No era esa, pero fíjate en la idea: hay que combinar varias pistas del texto para llegar a una conclusión, aunque no esté escrita tal cual."}{" "}
            Así funcionan las preguntas de esta prueba.
          </p>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 space-y-1.5 border-t-2 border-ink-200 bg-white px-5 py-4 safe-bottom">
        <div className="mx-auto max-w-md">
          <Button onClick={onNext}>
            {isWarmup(question) ? "Continuar con la prueba" : "Siguiente"}
          </Button>
          {selected === null && !isWarmup(question) && (
            <p className="mt-2 text-center text-xs text-ink-300">
              Puedes responder esta pregunta más tarde, desde la revisión final.
            </p>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={group.text.title}>
        <Illustration className="mb-4 w-full rounded-card" />
        {group.text.body.split("\n\n").map((paragraph, i) => (
          <p key={i} className="mb-3 leading-relaxed text-ink-700 last:mb-0">
            {paragraph}
          </p>
        ))}
      </Sheet>
    </div>
  );
}
