import { useCallback } from "react";
import { useOfflineQueue } from "./useOfflineQueue";
import { saveAnswer } from "@/lib/api";
import type { SaveAnswerRequest } from "@shared/schemas";

/**
 * Autoguardado de las respuestas calificables.
 *
 * Deliberadamente "silencioso": no expone si la respuesta fue correcta (esa
 * es la esencia de una prueba diagnóstica). El ítem de calentamiento, que sí
 * necesita retroalimentación inmediata, NO pasa por este hook: se guarda con
 * una llamada directa a `saveAnswer` desde `QuestionScreen`, porque necesita
 * la respuesta del servidor de inmediato en lugar de una cola en segundo plano.
 *
 * La cola se namespacea con `attemptId` para que un dispositivo compartido
 * entre estudiantes (frecuente en un aula rural) nunca mezcle el autoguardado
 * de un intento con el de otro.
 */
export function useAutosave(attemptId: number) {
  const send = useCallback(async (job: SaveAnswerRequest) => {
    await saveAnswer(job);
  }, []);

  const { enqueue, pendingCount, isOnline } = useOfflineQueue<SaveAnswerRequest>({
    storageKey: `pdi_autoguardado_${attemptId}`,
    send,
  });

  const queueAnswer = useCallback(
    (job: SaveAnswerRequest) => {
      enqueue(String(job.questionId), job);
    },
    [enqueue],
  );

  return { queueAnswer, pendingCount, isOnline };
}
