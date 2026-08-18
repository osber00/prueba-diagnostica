import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { StudentApp } from "./routes/student/StudentApp";
import { HealthCheck } from "./routes/HealthCheck";
import { DesignPreview } from "./routes/DesignPreview";

// El panel gestor (incluida la librería de gráficos) se carga bajo demanda.
// Los estudiantes nunca descargan este código.
const AdminApp = lazy(() => import("./routes/admin/AdminApp"));

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div
        className="size-10 animate-spin rounded-full border-4 border-ink-200 border-t-terracota-500"
        role="status"
        aria-label="Cargando"
      />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Fase 4 reemplazará esta ruta por el flujo del estudiante. */}
          <Route path="/" element={<StudentApp />} />
          <Route path="/_status" element={<HealthCheck />} />
          <Route path="/_preview" element={<DesignPreview />} />
          <Route path="/gestor/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
