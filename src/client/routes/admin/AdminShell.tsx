import { NavLink, Outlet } from "react-router";
import { cn } from "@/lib/cn";

interface AdminShellProps {
  onLogout: () => void;
}

const TABS = [
  { to: "/gestor/codigos", label: "Códigos" },
  { to: "/gestor/monitor", label: "Monitor en vivo" },
  { to: "/gestor/resultados", label: "Resultados" },
];

export function AdminShell({ onLogout }: AdminShellProps) {
  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-ink-200 bg-white px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold text-ink-900">Panel gestor</p>
            <p className="text-xs text-ink-700">Prueba diagnóstica · I.E. Macaján</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border-2 border-ink-200 px-3 py-1.5 text-sm font-bold text-ink-700 hover:bg-ink-100"
          >
            Cerrar sesión
          </button>
        </div>

        <nav className="mx-auto mt-3 flex max-w-5xl gap-2">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "rounded-xl px-3 py-1.5 text-sm font-bold transition-colors",
                  isActive
                    ? "bg-terracota-600 text-white"
                    : "text-ink-700 hover:bg-ink-100",
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
