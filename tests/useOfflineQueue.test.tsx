import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOfflineQueue } from "../src/client/hooks/useOfflineQueue";

describe("useOfflineQueue", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("recupera y envía la cola cuando cambia la clave del intento", async () => {
    localStorage.setItem(
      "attempt-42",
      JSON.stringify({ answer: { item: { questionId: 7 }, queuedAt: 1 } }),
    );
    const send = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ storageKey }) => useOfflineQueue({ storageKey, send }),
      { initialProps: { storageKey: "attempt-0" } },
    );

    rerender({ storageKey: "attempt-42" });

    await waitFor(() => expect(send).toHaveBeenCalledWith({ questionId: 7 }));
    await waitFor(() => expect(localStorage.getItem("attempt-42")).toBe("{}"));
  });

  it("informa que no puede vaciar la cola si el envío falla", async () => {
    const send = vi.fn().mockRejectedValue(new Error("offline"));
    const { result, unmount } = renderHook(() =>
      useOfflineQueue({ storageKey: "attempt-8", send, baseDelayMs: 60_000 }),
    );

    act(() => result.current.enqueue("answer", { questionId: 8 }));

    let flushed = true;
    await act(async () => {
      flushed = await result.current.flush();
    });

    expect(flushed).toBe(false);
    expect(result.current.pendingCount).toBe(1);
    expect(localStorage.getItem("attempt-8")).toContain("questionId");
    unmount();
  });

  it("conserva y envía una respuesta que cambia durante un envío en curso", async () => {
    let releaseFirst: (() => void) | undefined;
    const firstSend = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const send = vi
      .fn()
      .mockImplementationOnce(() => firstSend)
      .mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useOfflineQueue<{ option: number }>({ storageKey: "attempt-9", send }),
    );

    act(() => result.current.enqueue("answer", { option: 0 }));
    await waitFor(() => expect(send).toHaveBeenCalledWith({ option: 0 }));
    act(() => result.current.enqueue("answer", { option: 3 }));
    releaseFirst?.();

    await waitFor(() => expect(send).toHaveBeenCalledWith({ option: 3 }));
    await waitFor(() => expect(result.current.pendingCount).toBe(0));
  });
});
