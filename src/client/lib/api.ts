import type {
  ApiError,
  AttemptStateResponse,
  RedeemResponse,
  SaveAnswerResponse,
} from "@shared/types";
import type { SaveAnswerRequest } from "@shared/schemas";

/** Error de API con el código de estado HTTP, para distinguir 401 de 429, etc. */
export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      body !== null && typeof body === "object" && "error" in body
        ? String((body as ApiError).error)
        : `Error ${res.status}`;
    throw new ApiRequestError(res.status, message);
  }

  return body as T;
}

export async function redeemCode(code: string): Promise<RedeemResponse> {
  const res = await fetch("/api/attempt/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return parseJson<RedeemResponse>(res);
}

export async function fetchAttemptState(): Promise<AttemptStateResponse> {
  const res = await fetch("/api/attempt");
  return parseJson<AttemptStateResponse>(res);
}

export async function saveAnswer(
  payload: SaveAnswerRequest,
): Promise<SaveAnswerResponse> {
  const res = await fetch("/api/attempt/answer", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<SaveAnswerResponse>(res);
}

export interface SubmitResponse {
  ok: true;
  answered: number;
  alreadySubmitted?: boolean;
}

export async function submitAttempt(): Promise<SubmitResponse> {
  const res = await fetch("/api/attempt/submit", { method: "POST" });
  return parseJson<SubmitResponse>(res);
}
