import { useCallback, useEffect, useMemo, useState } from "react";
import type { OptionLetter, PublicQuestion } from "@shared/types";
import { ApiRequestError, fetchAttemptState, submitAttempt } from "@/lib/api";
import { useAutosave } from "@/hooks/useAutosave";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";
import { Tucan } from "@/components/illustrations";
import { buildSteps, findResumeIndex, groupByText, scoredQuestions, type TextGroup } from "./steps";
import { WelcomeScreen } from "./WelcomeScreen";
import { InstructionsScreen } from "./InstructionsScreen";
import { ReadingScreen } from "./ReadingScreen";
import { QuestionScreen } from "./QuestionScreen";
import { ReviewScreen } from "./ReviewScreen";
import { DoneScreen } from "./DoneScreen";

type Phase = "checking" | "welcome" | "flow" | "done" | "fatal-error";

interface AttemptInfo {
  id: number;
  label: string | null;
  startedAt: number;
}

type Progress = { current: number; completed: number[] } | null;

export function StudentApp() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [attempt, setAttempt] = useState<AttemptInfo | null>(null);
  const [groups, setGroups] = useState<TextGroup[]>([]);
  const [steps, setSteps] = useState<ReturnType<typeof buildSteps>>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());
  const [selections, setSelections] = useState<Map<number, OptionLetter>>(new Map());
  const [fatalError, setFatalError] = useState<string | null>(null);

  // Se llaman siempre, sin condicionar al estado de carga: los Hooks de React
  // no pueden invocarse condicionalmente. Los valores de reserva (0, ahora)
  // nunca llegan a mostrarse porque solo se usan dentro de la fase "flow".
  const { queueAnswer } = useAutosave(attempt?.id ?? 0);
  const timer = useElapsedTimer(attempt?.startedAt ?? Date.now());

  const load = useCallback(async () => {
    setPhase("checking");
    try {
      const state = await fetchAttemptState();
      const grouped = groupByText(state.texts, state.questions);
      const builtSteps = buildSteps(grouped);
      const answered = new Set(state.answers.map((a) => a.questionId));
      const sel = new Map(state.answers.map((a) => [a.questionId, a.selectedOption]));

      setAttempt({
        id: state.attempt.id,
        label: state.attempt.label,
        startedAt: state.attempt.startedAt,
      });
      setGroups(grouped);
      setSteps(builtSteps);
      setAnsweredIds(answered);
      setSelections(sel);
      setStepIndex(findResumeIndex(builtSteps, answered));
      setPhase("flow");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setPhase("welcome");
      } else {
        setFatalError(
          err instanceof Error ? err.message : "No se pudo conectar con el servidor.",
        );
        setPhase("fatal-error");
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scored = useMemo(() => scoredQuestions(groups), [groups]);

  const progressForQuestion = useCallback(
    (question: PublicQuestion): Progress => {
      if (question.number === 0) return null;
      const current = scored.findIndex((q) => q.id === question.id);
      const completed = scored
        .map((q, i) => (answeredIds.has(q.id) ? i : -1))
        .filter((i) => i >= 0);
      return { current, completed };
    },
    [scored, answeredIds],
  );

  const progressForGroup = useCallback(
    (group: TextGroup): Progress => {
      const firstScored = group.questions.find((q) => q.number > 0);
      return firstScored ? progressForQuestion(firstScored) : null;
    },
    [progressForQuestion],
  );

  const goBack = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setStepIndex((i) => Math.min(steps.length - 1, i + 1)),
    [steps.length],
  );

  const handleAnswered = useCallback((questionId: number, option: OptionLetter) => {
    setAnsweredIds((prev) => {
      const next = new Set(prev);
      next.add(questionId);
      return next;
    });
    setSelections((prev) => {
      const next = new Map(prev);
      next.set(questionId, option);
      return next;
    });
  }, []);

  const handleJumpTo = useCallback(
    (questionId: number) => {
      const idx = steps.findIndex((s) => s.type === "question" && s.question.id === questionId);
      if (idx >= 0) setStepIndex(idx);
    },
    [steps],
  );

  const handleSubmit = useCallback(async () => {
    await submitAttempt();
    if (attempt) {
      // Ya no hay nada más que reintentar para este intento: se limpia la
      // cola local para no dejar datos de un intento cerrado en el navegador.
      localStorage.removeItem(`pdi_autoguardado_${attempt.id}`);
    }
    setPhase("done");
  }, [attempt]);

  if (phase === "checking") return <LoadingScreen />;

  if (phase === "welcome") {
    return <WelcomeScreen onRedeemed={() => void load()} />;
  }

  if (phase === "fatal-error") {
    return <FatalErrorScreen message={fatalError} onRetry={() => void load()} />;
  }

  if (phase === "done") return <DoneScreen />;

  const step = steps[stepIndex];
  if (!step || !attempt) return <LoadingScreen />;

  switch (step.type) {
    case "instructions":
      return <InstructionsScreen label={attempt.label} onContinue={goNext} />;

    case "reading":
      return (
        <ReadingScreen
          group={step.group}
          progress={progressForGroup(step.group)}
          timerLabel={timer.label}
          onBack={stepIndex > 0 ? goBack : undefined}
          onContinue={goNext}
        />
      );

    case "question":
      return (
        <QuestionScreen
          group={step.group}
          question={step.question}
          progress={progressForQuestion(step.question)}
          timerLabel={timer.label}
          attemptStartedAt={attempt.startedAt}
          initialSelection={selections.get(step.question.id) ?? null}
          onAnswered={handleAnswered}
          queueAnswer={queueAnswer}
          onBack={goBack}
          onNext={goNext}
        />
      );

    case "review":
      return (
        <ReviewScreen
          questions={scored}
          answeredIds={answeredIds}
          timerLabel={timer.label}
          onJumpTo={handleJumpTo}
          onBack={goBack}
          onSubmit={handleSubmit}
        />
      );

    default:
      return null;
  }
}

function LoadingScreen() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <Tucan mood="greeting" className="mx-auto size-16 animate-float-soft" />
        <p className="mt-3 text-sm text-ink-500">Cargando…</p>
      </div>
    </main>
  );
}

function FatalErrorScreen({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <Tucan mood="greeting" className="size-20" />
      <p className="mt-4 text-base font-semibold text-ink-900">
        No se pudo conectar con el servidor.
      </p>
      {message && <p className="mt-1 text-sm text-ink-500">{message}</p>}
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-2xl bg-terracota-500 px-6 py-3 font-extrabold uppercase text-white shadow-[0_4px_0_0_var(--color-terracota-600)] active:translate-y-1 active:shadow-none"
      >
        Reintentar
      </button>
    </main>
  );
}
