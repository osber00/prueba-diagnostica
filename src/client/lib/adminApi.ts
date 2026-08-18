import type {
  AdminCodeRow,
  AnalyticsResponse,
  ApiError,
  LiveAttemptRow,
  PairedResponse,
  Phase,
} from "@shared/types";
import type { GenerateCodesRequest } from "@shared/schemas";
import { ApiRequestError } from "./api";

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

export async function adminLogin(code: string): Promise<{ ok: true }> {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return parseJson(res);
}

export async function adminMe(): Promise<{ ok: true }> {
  const res = await fetch("/api/admin/me");
  return parseJson(res);
}

export async function adminLogout(): Promise<{ ok: true }> {
  const res = await fetch("/api/admin/logout", { method: "POST" });
  return parseJson(res);
}

export interface GenerateCodesResponse {
  ok: true;
  batchId: string;
  codes: string[];
}

export async function generateCodes(
  payload: GenerateCodesRequest,
): Promise<GenerateCodesResponse> {
  const res = await fetch("/api/admin/codes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function listCodes(phase?: Phase): Promise<{ codes: AdminCodeRow[] }> {
  const query = phase ? `?phase=${phase}` : "";
  const res = await fetch(`/api/admin/codes${query}`);
  return parseJson(res);
}

export async function revokeCode(id: number): Promise<{ ok: true }> {
  const res = await fetch(`/api/admin/codes/${id}/revoke`, { method: "POST" });
  return parseJson(res);
}

export async function resetCode(id: number): Promise<{ ok: true }> {
  const res = await fetch(`/api/admin/codes/${id}/reset`, { method: "POST" });
  return parseJson(res);
}

export async function fetchLive(): Promise<{ attempts: LiveAttemptRow[]; serverTime: number }> {
  const res = await fetch("/api/admin/live");
  return parseJson(res);
}

export async function fetchAnalytics(phase: Phase): Promise<AnalyticsResponse> {
  const res = await fetch(`/api/admin/analytics?phase=${phase}`);
  return parseJson(res);
}

export async function fetchPaired(): Promise<PairedResponse> {
  const res = await fetch("/api/admin/analytics/paired");
  return parseJson(res);
}

export { ApiRequestError };
