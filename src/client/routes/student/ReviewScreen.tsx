import { useState } from "react";
import type { PublicQuestion } from "@shared/types";
import { Button } from "@/components/ui/Button";
import { StudentTopBar } from "./StudentTopBar";
import { cn } from "@/lib/cn";

interface ReviewScreenProps {
  /** Las 16 preguntas calificables, en el orden del instrumento. */
  questions: PublicQuestion[];
  answeredIds: ReadonlySet<number>;
  timerLabel: string;
  onJumpTo: (questionId: number) => void;
  onBack?: (() => void) | undefined;
  onExit: () => void;
  onSubmit: () => Promise<void>;
}

export function ReviewScreen({
  questions,
  answeredIds,
  timerLabel,
  onJumpTo,
  onBack,
  onExit,
  onSubmit,
}: ReviewScreenProps) {
  const [confirmingUnanswered, setConfirmingUnanswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const answeredCount = questions.filter((q) => answeredIds.has(q.id)).length;
  const pendingCount = questions.length - answeredCount;

  async function handleSubmit() {
    if (pendingCount > 0 && !confirmingUnanswered) {
      setConfirmingUnanswered(true);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit();
    } catch {
      setSubmitError(
        "No se pudo guardar y enviar todo. Revisa tu conexión y vuelve a intentarlo; tus respuestas siguen en este dispositivo.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh pb-32">
      <StudentTopBar
        progress={{ current: -1, completed: questions.map((_, i) => i).filter((i) => {
          const q = questions[i];
          return q ? answeredIds.has(q.id) : false;
        }) }}
        timerLabel={timerLabel}
        onBack={onBack}
        onExit={onExit}
      />

      <main className="mx-auto max-w-md space-y-5 px-5 pt-4">
        <div className="space-y-1.5 text-center">
          <h1 className="text-xl font-extrabold text-ink-900">Revisa tus respuestas</h1>
          <p className="text-sm text-ink-500">
            Respondiste {answeredCount} de {questions.length} preguntas.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {questions.map((q, i) => {
            const answered = answeredIds.has(q.id);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onJumpTo(q.id)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-2xl border-3 text-lg font-extrabold transition-colors",
                  answered
                    ? "border-terracota-500 bg-terracota-500 text-white"
                    : "border-ink-300 bg-white text-ink-500 hover:bg-ink-100",
                )}
                aria-label={`Ir a la pregunta ${i + 1}${answered ? ", respondida" : ", sin responder"}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {confirmingUnanswered && pendingCount > 0 && (
          <div className="space-y-3 rounded-card border-2 border-cosecha-400 bg-cosecha-50 p-4">
            <p className="text-sm font-semibold text-ink-700">
              Tienes {pendingCount} {pendingCount === 1 ? "pregunta" : "preguntas"} sin
              responder. Puedes revisarlas o enviar así.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setConfirmingUnanswered(false)}
              >
                Revisar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => void handleSubmit()}
                disabled={submitting}
              >
                Enviar así
              </Button>
            </div>
          </div>
        )}

        {submitError && (
          <p role="alert" className="rounded-xl bg-alerta-50 px-4 py-3 text-sm font-semibold text-alerta-700">
            {submitError}
          </p>
        )}
      </main>

      {!confirmingUnanswered && (
        <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink-200 bg-white px-5 py-4 safe-bottom">
          <div className="mx-auto max-w-md">
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar mis respuestas"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
