import { useCallback, useEffect, useState } from "react";
import { adminLogin, adminLogout, adminMe, ApiRequestError } from "@/lib/adminApi";

type SessionState = "checking" | "authenticated" | "anonymous";

/**
 * Sesión del panel gestor.
 *
 * La cookie es HttpOnly (no la puede leer este hook directamente), así que
 * el estado de autenticación se deriva de `GET /api/admin/me`: si responde
 * 200, hay sesión válida; si responde 401, no la hay. Esto también cubre la
 * expiración a las 8 horas sin lógica adicional en el cliente.
 */
export function useAdminSession() {
  const [state, setState] = useState<SessionState>("checking");

  const check = useCallback(async () => {
    setState("checking");
    try {
      await adminMe();
      setState("authenticated");
    } catch {
      setState("anonymous");
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const login = useCallback(async (code: string) => {
    await adminLogin(code);
    setState("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminLogout();
    } finally {
      setState("anonymous");
    }
  }, []);

  return { state, login, logout };
}

export { ApiRequestError };
