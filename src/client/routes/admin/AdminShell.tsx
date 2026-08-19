import { NavLink, Outlet } from "react-router";
import { cn } from "@/lib/cn";

interface AdminShellProps {
  onLogout: () => void;
}

const TABS = [
  { to: "/gestor/codigos", label: "Códigos", icon: "M6 8h12M6 12h12M6 16h8" },
  { to: "/gestor/monitor", label: "Monitor en vivo", icon: "M4 12h3l2-5 4 10 2-5h5" },
  { to: "/gestor/resultados", label: "Resultados", icon: "M5 19V9m7 10V5m7 14v-7" },
];

export function AdminShell({ onLogout }: AdminShellProps) {
  return (
    <div className="min-h-dvh bg-[#f3f6f7]">
      <header className="sticky top-0 z-20 border-b border-ink-200/80 bg-white/95 px-4 shadow-[0_8px_24px_-20px_rgba(36,62,72,0.65)] backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-rio-600 text-white shadow-[0_6px_16px_-8px_rgba(23,113,106,0.9)]" aria-hidden="true">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5.5A3.5 3.5 0 018.5 2H20v16H8.5A3.5 3.5 0 005 21.5v-16z" />
                <path d="M5 5.5A3.5 3.5 0 001.5 2H1v16h.5A3.5 3.5 0 015 21.5" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-extrabold tracking-tight text-ink-900">Panel gestor</p>
              <p className="text-xs text-ink-500">Comprensión lectora · I.E. Macaján</p>
            </div>
          </div>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto rounded-xl bg-ink-100/70 p-1 sm:order-none sm:w-auto">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-[background-color,color,box-shadow]",
                    isActive
                      ? "bg-white text-rio-700 shadow-[0_4px_12px_-8px_rgba(36,62,72,0.7)]"
                      : "text-ink-500 hover:bg-white/70 hover:text-ink-900",
                  )
                }
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={tab.icon} />
                </svg>
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-bold text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-100"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
