import { useCallback, useEffect, useRef, useState } from "react";

interface QueueEntry<T> {
  item: T;
  queuedAt: number;
}

interface UseOfflineQueueOptions<T> {
  /** Clave de localStorage. Debe ser única por contexto (aquí, por intento). */
  storageKey: string;
  /** Envía un elemento. Debe lanzar una excepción si falla. */
  send: (item: T) => Promise<void>;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Cola de trabajos pendientes persistida en localStorage.
 *
 * Pensada para la conectividad rural intermitente de la I.E. Macaján: si una
 * petición falla —o el dispositivo pierde señal— el trabajo se conserva y se
 * reintenta con backoff exponencial, y también de inmediato en cuanto el
 * navegador reporta que la conexión volvió. Sobrevive a recargas de página y
 * a que el estudiante cierre el navegador por accidente, porque el estado
 * vive en localStorage, no solo en memoria.
 *
 * `send` se guarda en una ref en lugar de ir en las dependencias de `flush`:
 * así el llamador no necesita memoizarla, y la cola no se reconstruye ni
 * pierde temporizadores en cada renderizado.
 */
export function useOfflineQueue<T>({
  storageKey,
  send,
  baseDelayMs = 2000,
  maxDelayMs = 30_000,
}: UseOfflineQueueOptions<T>) {
  const [entries, setEntries] = useState<Record<string, QueueEntry<T>>>(() =>
    readStorage<T>(storageKey),
  );

  const entriesRef = useRef(entries);
  const sendRef = useRef(send);
  const isFlushingRef = useRef(false);
  const retryDelayRef = useRef(baseDelayMs);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  entriesRef.current = entries;
  sendRef.current = send;

  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );

  const persist = useCallback(
    (next: Record<string, QueueEntry<T>>) => {
      entriesRef.current = next;
      setEntries(next);
      writeStorage(storageKey, next);
    },
    [storageKey],
  );

  const flush = useCallback(async () => {
    if (isFlushingRef.current) return;
    if (Object.keys(entriesRef.current).length === 0) return;

    isFlushingRef.current = true;
    let anyFailed = false;

    // Secuencial, no en paralelo: sobre una conexión rural débil, disparar
    // varias peticiones a la vez solo compite por el mismo ancho de banda
    // escaso y puede hacer que todas fallen en lugar de que una tenga éxito.
    for (const key of Object.keys(entriesRef.current)) {
      const entry = entriesRef.current[key];
      if (!entry) continue;

      try {
        await sendRef.current(entry.item);
        const rest = { ...entriesRef.current };
        delete rest[key];
        persist(rest);
      } catch {
        anyFailed = true;
      }
    }

    isFlushingRef.current = false;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (anyFailed) {
      retryDelayRef.current = Math.min(retryDelayRef.current * 1.6, maxDelayMs);
      timeoutRef.current = setTimeout(() => void flush(), retryDelayRef.current);
    } else {
      retryDelayRef.current = baseDelayMs;
    }
  }, [persist, baseDelayMs, maxDelayMs]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      retryDelayRef.current = baseDelayMs;
      void flush();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flush, baseDelayMs]);

  useEffect(() => {
    // Al montar, se reintenta cualquier trabajo que haya quedado pendiente
    // de una sesión anterior (cierre abrupto del navegador, recarga, etc.).
    void flush();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enqueue = useCallback(
    (key: string, item: T) => {
      // Se sobrescribe por clave: si el estudiante cambia de opción varias
      // veces antes de que la primera petición salga, solo importa la
      // selección más reciente.
      persist({ ...entriesRef.current, [key]: { item, queuedAt: Date.now() } });
      void flush();
    },
    [persist, flush],
  );

  return {
    enqueue,
    pendingCount: Object.keys(entries).length,
    isOnline,
  };
}

function readStorage<T>(key: string): Record<string, QueueEntry<T>> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, QueueEntry<T>>) : {};
  } catch {
    return {};
  }
}

function writeStorage<T>(key: string, value: Record<string, QueueEntry<T>>): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage puede fallar en modo privado o por cuota agotada.
    // No es crítico: el trabajo sigue en memoria durante la sesión actual.
  }
}
