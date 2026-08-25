import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";

import { ToastProvider } from "./components/ui";
import "./styles.css";

const params = new URLSearchParams(window.location.search);
const isPatientPortal = params.has("invite") || params.get("portal") === "1";
const App = lazy(() => import("./app").then((module) => ({ default: module.App })));
const PatientPortal = lazy(() => import("./features/portal/PatientPortal").then((module) => ({ default: module.PatientPortal })));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-surface text-sm text-muted">Cargando...</div>}>
        {isPatientPortal ? <PatientPortal /> : <App />}
      </Suspense>
    </ToastProvider>
  </React.StrictMode>,
);
