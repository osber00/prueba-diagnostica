import { useState, type FormEvent } from "react";
import { Tucan } from "@/components/illustrations";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/adminApi";

interface AdminLoginProps {
  onLogin: (code: string) => Promise<void>;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await onLogin(code.trim());
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "No se pudo conectar. Revisa tu conexión e intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-8">
      <div className="space-y-6 text-center">
        <Tucan mood="greeting" className="mx-auto size-20" />

        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold text-ink-900">Panel gestor</h1>
          <p className="text-sm text-ink-500">
            Prueba diagnóstica · Institución Educativa Macaján
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-2">
            <label htmlFor="admin-code" className="block text-sm font-bold text-ink-700">
              Código de acceso del gestor
            </label>
            <input
              id="admin-code"
              type="password"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={code}
              onChange={(e) => {
                setError(null);
                setCode(e.target.value);
              }}
              className="w-full rounded-2xl border-3 border-ink-200 bg-white px-4 py-3 text-center text-lg font-bold text-ink-900 focus:border-rio-500 focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-alerta-50 px-4 py-3 text-sm font-semibold text-alerta-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={!code.trim() || loading}>
            {loading ? "Verificando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
