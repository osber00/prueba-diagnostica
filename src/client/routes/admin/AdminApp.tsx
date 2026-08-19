import { Navigate, Route, Routes } from "react-router";
import { GuiaLectura } from "@/components/illustrations";
import { useAdminSession } from "./useAdminSession";
import { AdminLogin } from "./AdminLogin";
import { AdminShell } from "./AdminShell";
import { CodesPage } from "./CodesPage";
import { MonitorPage } from "./MonitorPage";
import { ResultsPage } from "./ResultsPage";

function LoadingScreen() {
  return (
    <main className="grid min-h-dvh place-items-center">
      <GuiaLectura mood="greeting" className="size-16 animate-float-soft" />
    </main>
  );
}

export default function AdminApp() {
  const { state, login, logout } = useAdminSession();

  if (state === "checking") return <LoadingScreen />;
  if (state === "anonymous") return <AdminLogin onLogin={login} />;

  return (
    <Routes>
      <Route element={<AdminShell onLogout={() => void logout()} />}>
        <Route index element={<Navigate to="codigos" replace />} />
        <Route path="codigos" element={<CodesPage />} />
        <Route path="monitor" element={<MonitorPage />} />
        <Route path="resultados" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="codigos" replace />} />
      </Route>
    </Routes>
  );
}
