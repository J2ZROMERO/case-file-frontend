import { useEffect, useMemo, useState } from "react";

import { AppShell } from "../components/layout";
import { Card, GlobalLoader, Tabs, useToast } from "../components/ui";
import { AuditPanel } from "../features/audit";
import { AuthPanel } from "../features/auth";
import { CompliancePanel } from "../features/compliance";
import { MedicalRecordPanel } from "../features/medical-records";
import { PatientPanel } from "../features/patients";
import { TenantPanel } from "../features/tenants";
import { useAsyncAction } from "../hooks";
import { api } from "../lib";
import type {
  AuditEvent,
  AuthSession,
  ClinicalNote,
  Consent,
  MedicalRecord,
  Patient,
  Prescription,
  Tenant,
} from "../types";

export function App() {
  const asyncAction = useAsyncAction();
  const toast = useToast();
  const [activeView, setActiveView] = useState("security");
  const [activeAccessStep, setActiveAccessStep] = useState("clinic");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  const token = session?.token ?? "";
  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  );

  const resetClinicalState = () => {
    setPatients([]);
    setSelectedPatientId("");
    setRecord(null);
    setNotes([]);
    setConsents([]);
    setPrescriptions([]);
    setAuditEvents([]);
  };

  const createTenant = async (payload: { name: string; legal_name?: string | null }) => {
    const result = await asyncAction.run(() => api.createTenant(payload), { rethrow: true });
    if (!result) return;
    setTenant(result.data);
    setTenantId(result.data.id);
    setSession(null);
    resetClinicalState();
    setActiveAccessStep("user");
    toast.showSuccess(result.message);
  };

  const registerUser = async (payload: Record<string, unknown>) => {
    const result = await asyncAction.run(() => api.registerUser(payload), { rethrow: true });
    if (result) toast.showSuccess(result.message);
  };

  const login = async (payload: { tenant_id: string; email: string; password: string }) => {
    const result = await asyncAction.run(() => api.login(payload), { rethrow: true });
    if (!result) return;
    setSession({
      tenantId: payload.tenant_id,
      token: result.data.access_token,
      email: payload.email,
      role: "tenant_user",
    });
    const patientResult = await asyncAction.run(() =>
      api.listPatients(payload.tenant_id, result.data.access_token),
    );
    if (patientResult) setPatients(patientResult.data);
    setActiveView("patients");
    toast.showSuccess(result.message);
  };

  const refreshPatients = async () => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(() => api.listPatients(tenantId, token));
    if (!result) return;
    setPatients(result.data);
  };

  const createPatient = async (payload: Record<string, unknown>) => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(() => api.createPatient(tenantId, token, payload), { rethrow: true });
    if (!result) return;
    setPatients((current) => [result.data, ...current]);
    setSelectedPatientId(result.data.id);
    setRecord(null);
    toast.showSuccess(result.message);
    await refreshAuditEvents();
  };

  const updatePatient = async (patientId: string, payload: Record<string, unknown>) => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(() => api.updatePatient(tenantId, token, patientId, payload), {
      rethrow: true,
    });
    if (!result) return;
    setPatients((current) => current.map((patient) => (patient.id === patientId ? result.data : patient)));
    toast.showSuccess("Paciente actualizado correctamente.");
    await refreshAuditEvents();
  };

  const createMedicalRecord = async () => {
    if (!tenantId || !token || !selectedPatientId) return;
    const result = await asyncAction.run(() =>
      api.createMedicalRecord(tenantId, token, selectedPatientId),
    );
    if (!result) return;
    setRecord(result.data);
    setNotes([]);
    toast.showSuccess(result.message);
    await refreshAuditEvents();
  };

  const openPatientRecord = async (patientId: string) => {
    if (!tenantId || !token) return;
    setSelectedPatientId(patientId);
    setRecord(null);
    setNotes([]);
    const result = await asyncAction.run(() => api.getPatientMedicalRecord(tenantId, token, patientId));
    if (!result?.data) return;
    const patientRecord = result.data;
    setRecord(patientRecord);
    const notesResult = await asyncAction.run(() => api.listClinicalNotes(tenantId, token, patientRecord.id));
    if (notesResult) setNotes(notesResult.data);
  };

  const refreshNotes = async () => {
    if (!tenantId || !token || !record) return;
    const result = await asyncAction.run(() => api.listClinicalNotes(tenantId, token, record.id));
    if (result) setNotes(result.data);
  };

  const createClinicalNote = async (payload: Record<string, unknown>) => {
    if (!tenantId || !token || !record) return;
    const result = await asyncAction.run(() => api.addClinicalNote(tenantId, token, record.id, payload), {
      rethrow: true,
    });
    if (!result) return;
    setNotes((current) => [...current, result.data]);
    toast.showSuccess(result.message);
    await refreshAuditEvents();
  };

  const refreshCompliance = async () => {
    if (!tenantId || !token || !selectedPatientId) return;
    const [consentData, prescriptionData] = await Promise.all([
      asyncAction.run(() => api.listConsents(tenantId, token, selectedPatientId)),
      asyncAction.run(() => api.listPrescriptions(tenantId, token, selectedPatientId)),
    ]);
    if (consentData) setConsents(consentData.data);
    if (prescriptionData) setPrescriptions(prescriptionData.data);
  };

  const createConsent = async (payload: Record<string, unknown>) => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(() => api.createConsent(tenantId, token, payload), { rethrow: true });
    if (!result) return;
    setConsents((current) => [result.data, ...current]);
    toast.showSuccess(result.message);
    await refreshAuditEvents();
  };

  const createPrescription = async (payload: Record<string, unknown>) => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(() => api.createPrescription(tenantId, token, payload), {
      rethrow: true,
    });
    if (!result) return;
    setPrescriptions((current) => [result.data, ...current]);
    toast.showSuccess(result.message);
    await refreshAuditEvents();
  };

  const refreshAuditEvents = async () => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(() => api.listAuditEvents(tenantId, token));
    if (result) setAuditEvents(result.data);
  };

  useEffect(() => {
    setRecord(null);
    setNotes([]);
    setConsents([]);
    setPrescriptions([]);
  }, [selectedPatientId]);

  const renderActiveView = () => {
    if (activeView === "security") {
      return (
        <div className="grid gap-5">
          <Card>
            <h2 className="section-title">Primeros pasos</h2>
            <p className="mt-1 text-sm text-muted">
              Primero elige la clinica. Despues crea o usa tu usuario para entrar.
            </p>
            <div className="mt-4">
              <Tabs
                activeId={activeAccessStep}
                onChange={setActiveAccessStep}
                items={[
                  { id: "clinic", label: "1. Clinica" },
                  { id: "user", label: "2. Usuario" },
                ]}
              />
            </div>
          </Card>

          {activeAccessStep === "clinic" ? (
            <TenantPanel
              tenant={tenant}
              onCreate={createTenant}
              selectedTenantId={tenantId}
              onTenantIdChange={(value) => {
                setTenantId(value);
                setSession(null);
                resetClinicalState();
              }}
            />
          ) : (
            <AuthPanel
              tenantId={tenantId}
              isAuthenticated={Boolean(session)}
              onRegister={registerUser}
              onLogin={login}
            />
          )}
        </div>
      );
    }

    if (!session) {
      return (
        <Card>
          <h2 className="section-title">Sesion requerida</h2>
          <p className="mt-2 text-sm text-muted">
            Ve a Acceso, selecciona una clinica e inicia sesion para continuar.
          </p>
        </Card>
      );
    }

    if (activeView === "patients") {
      return (
        <PatientPanel
          patients={patients}
          onCreate={createPatient}
          onRefresh={refreshPatients}
          onUpdate={updatePatient}
        />
      );
    }

    if (activeView === "record") {
      return (
        <MedicalRecordPanel
          patients={patients}
          selectedPatientId={selectedPatientId}
          record={record}
          notes={notes}
          onOpenRecord={openPatientRecord}
          onRefreshPatients={refreshPatients}
          onCreateRecord={createMedicalRecord}
          onCreateNote={createClinicalNote}
          onRefreshNotes={refreshNotes}
        />
      );
    }

    if (activeView === "compliance") {
      return (
        <CompliancePanel
          selectedPatientId={selectedPatientId}
          consents={consents}
          prescriptions={prescriptions}
          onCreateConsent={createConsent}
          onCreatePrescription={createPrescription}
          onRefresh={refreshCompliance}
        />
      );
    }

    return <AuditPanel events={auditEvents} tenantId={tenantId} onRefresh={refreshAuditEvents} />;
  };

  return (
    <AppShell
      activeView={activeView}
      isAuthenticated={Boolean(session)}
      onViewChange={setActiveView}
      onLogout={() => {
        setSession(null);
        resetClinicalState();
        setActiveView("security");
      }}
    >
      <GlobalLoader active={asyncAction.isLoading} />

      <Card>
        <h2 className="section-title">Resumen de trabajo</h2>
        <p className="mt-1 text-sm text-muted">
          Esto te muestra donde estas trabajando ahora. Cambiar la clinica o cerrar sesion limpia la seleccion.
        </p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted">Clinica actual</dt>
            <dd className="break-all font-semibold text-ink">{tenantId || "Pendiente"}</dd>
          </div>
          <div>
            <dt className="text-muted">Usuario conectado</dt>
            <dd className="break-all font-semibold text-ink">{session?.email ?? "Pendiente"}</dd>
          </div>
          <div>
            <dt className="text-muted">Paciente seleccionado</dt>
            <dd className="font-semibold text-ink">
              {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "Pendiente"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Expediente abierto</dt>
            <dd className="break-all font-semibold text-ink">{record?.id ?? "Pendiente"}</dd>
          </div>
        </dl>
      </Card>

      {renderActiveView()}
    </AppShell>
  );
}
