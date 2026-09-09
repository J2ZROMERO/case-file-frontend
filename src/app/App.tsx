import { useActionReason } from "../components/ui/ActionReasonDialog";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { AppShell, WorkContextHeader } from "../components/layout";
import { Card, GlobalLoader, Modal, useToast } from "../components/ui";
import { AuditPanel } from "../features/audit";
import { AuthPanel, FirstRunSetup } from "../features/auth";
import type { ClinicAccess, ClinicSelection, FirstRunSetupForm } from "../features/auth";
import { CompliancePanel } from "../features/compliance";
import { ClinicManagementPanel } from "../features/clinics";
import { MedicalRecordPanel } from "../features/medical-records";
import { PatientPanel } from "../features/patients";
import { StaffPanel } from "../features/staff";
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
  DoctorAssignment,
  StaffMember,
  Appointment,
  DoctorAvailability,
  Tenant,
  ManagedClinic,
} from "../types";

const AppointmentPanel = lazy(() =>
  import("../features/appointments").then((module) => ({ default: module.AppointmentPanel })),
);

export function App() {
  const asyncAction = useAsyncAction();
  const toast = useToast();
  const { requestReason, reasonDialog } = useActionReason();
  const reasonFor = async (title: string, summary: string, changes: string[] = []) => {
    const reason = await requestReason({ title, summary, changes });
    if (!reason) throw new Error("Acción cancelada. No se guardaron cambios.");
    return reason;
  };
  const [activeView, setActiveView] = useState("security");
  const [clinicSelection, setClinicSelection] = useState<ClinicSelection | null>(null);
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [clinicalStaff, setClinicalStaff] = useState<StaffMember[]>([]);
  const [doctorAssignment, setDoctorAssignment] = useState<DoctorAssignment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [managedClinics, setManagedClinics] = useState<ManagedClinic[]>([]);

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
    setAuditError(null);
    setStaff([]);
    setClinicalStaff([]);
    setDoctorAssignment(null);
    setAppointments([]);
    setManagedClinics([]);
  };

  const createTenant = async (payload: { name: string; legal_name?: string | null }) => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(
      () => api.createManagedTenant(tenantId, token, payload),
      { rethrow: true },
    );
    if (result) {
      toast.showSuccess(result.message);
      await refreshManagedClinics();
    }
  };

  const refreshManagedClinics = async () => {
    if (!tenantId || !token || session?.role !== "tenant_admin") return;
    const result = await asyncAction.run(() => api.listManagedClinics(tenantId, token));
    if (result) setManagedClinics(result.data);
  };

  const associateStaffToClinic = async (targetClinicId: string, userId: string) => {
    if (!tenantId || !token) return;
    const person = staff.find((item) => item.user_id === userId);
    const target = managedClinics.find((item) => item.id === targetClinicId);
    const change = await reasonFor("Asignar personal a otra clínica", `${person?.full_name ?? "Personal"} tendrá acceso a ${target?.name ?? "la clínica destino"}.`, [`Conserva su acceso a ${tenant?.name ?? "la clínica actual"}.`]);
    const result = await asyncAction.run(() => api.associateStaffToClinic(tenantId, token, targetClinicId, userId, change), { rethrow: true });
    if (result) { toast.showSuccess("Personal asociado correctamente."); await refreshManagedClinics(); }
  };

  const referPatientToClinic = async (targetClinicId: string, patientId: string, reason: string) => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(() => api.referPatientToClinic(tenantId, token, targetClinicId, { patient_id: patientId, consent_confirmed: true, reason: reason || null }), { rethrow: true });
    if (result) { toast.showSuccess("Paciente referido correctamente."); await refreshManagedClinics(); }
  };

  const identifyUser = async (payload: { email: string; password: string }) => {
    const result = await asyncAction.run(() => api.identifyUser(payload), { rethrow: true });
    if (result) setClinicSelection(result.data);
  };

  const createInitialAdmin = async (payload: FirstRunSetupForm) => {
    const result = await asyncAction.run(
      () => api.bootstrapAdmin({ ...payload, clinic_legal_name: payload.clinic_legal_name || null }),
      { rethrow: true },
    );
    if (!result) return;
    setSetupRequired(false);
    toast.showSuccess("Clínica y administrador creados correctamente.");
    await identifyUser({ email: payload.email, password: payload.password });
  };

  const openClinicSwitcher = async () => {
    if (!token) return;
    const result = await asyncAction.run(() => api.myClinics(token));
    if (result) setClinicSelection(result.data);
  };

  const selectClinic = async (clinic: ClinicAccess) => {
    if (!clinicSelection) return;
    const result = await asyncAction.run(
      () => api.selectTenant(clinicSelection.selection_token, clinic.id),
      { rethrow: true },
    );
    if (!result) return;
    resetClinicalState();
    const resolvedTenantId = result.data.tenant_id;
    setTenantId(resolvedTenantId);
    setTenant({ id: resolvedTenantId, name: result.data.tenant_name, legal_name: null, is_active: true });
    setSession({
      tenantId: resolvedTenantId,
      token: result.data.access_token,
      userId: result.data.user_id,
      fullName: result.data.full_name,
      email: clinicSelection.email,
      role: result.data.role,
      permissions: result.data.permissions,
    });
    const canManageStaff = result.data.role === "tenant_admin";
    const canAssignDoctors = canManageStaff || result.data.role === "reception";
    const canUseAgenda = canAssignDoctors || result.data.role === "doctor";
    const [patientResult, staffResult, clinicalResult, appointmentResult] = await Promise.all([
      asyncAction.run(() => api.listPatients(resolvedTenantId, result.data.access_token)),
      canManageStaff
        ? asyncAction.run(() => api.listStaff(resolvedTenantId, result.data.access_token))
        : Promise.resolve(null),
      canUseAgenda
        ? asyncAction.run(() => api.listClinicalStaff(resolvedTenantId, result.data.access_token))
        : Promise.resolve(null),
      canUseAgenda
        ? asyncAction.run(() => api.listAppointments(resolvedTenantId, result.data.access_token))
        : Promise.resolve(null),
    ]);
    if (patientResult) setPatients(patientResult.data);
    if (staffResult) setStaff(staffResult.data);
    if (clinicalResult) setClinicalStaff(clinicalResult.data);
    if (appointmentResult) setAppointments(appointmentResult.data);
    if (canManageStaff) {
      const clinicResult = await asyncAction.run(() => api.listManagedClinics(resolvedTenantId, result.data.access_token));
      if (clinicResult) setManagedClinics(clinicResult.data);
    }
    setClinicSelection(null);
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
    toast.showSuccess(result.message);
    await refreshAuditEvents();
  };

  const updatePatient = async (patientId: string, payload: Record<string, unknown>) => {
    if (!tenantId || !token) return;
    const previous = patients.find((item) => item.id === patientId);
    const labels: Record<string, string> = { first_name: "Nombre", last_name: "Apellidos", birth_date: "Fecha de nacimiento", curp: "CURP" };
    const changes = previous ? Object.entries(labels).filter(([key]) => (previous[key as keyof Patient] ?? null) !== (payload[key] ?? null)).map(([key, label]) => `${label}: ${previous[key as keyof Patient] || "Sin registrar"} → ${payload[key] || "Sin registrar"}`) : [];
    const change = changes.length ? await reasonFor("Corregir datos del paciente", `${previous?.first_name ?? ""} ${previous?.last_name ?? ""} · ${tenant?.name ?? ""}`, changes) : {};
    const result = await asyncAction.run(() => api.updatePatient(tenantId, token, patientId, { ...payload, ...change }), {
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
    const [notesResult, assignmentResult] = await Promise.all([
      asyncAction.run(() => api.listClinicalNotes(tenantId, token, patientRecord.id)),
      asyncAction.run(() => api.getDoctorAssignment(tenantId, token, patientRecord.id)),
    ]);
    if (notesResult) setNotes(notesResult.data);
    if (assignmentResult) setDoctorAssignment(assignmentResult.data);
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

  const assignDoctor = async (doctorUserId: string) => {
    if (!tenantId || !token || !record) return;
    const nextDoctor = clinicalStaff.find((item) => item.user_id === doctorUserId);
    const change = doctorAssignment && doctorAssignment.doctor_user_id !== doctorUserId
      ? await reasonFor("Cambiar médico responsable", `${selectedPatient?.first_name ?? "Paciente"} ${selectedPatient?.last_name ?? ""} · ${tenant?.name ?? ""}`, [`${doctorAssignment.doctor_name} → ${nextDoctor?.full_name ?? "Médico seleccionado"}`]) : {};
    const result = await asyncAction.run(
      () => api.assignDoctor(tenantId, token, record.id, doctorUserId, change),
      { rethrow: true },
    );
    if (!result) return;
    setDoctorAssignment(result.data);
    toast.showSuccess("Médico asignado correctamente.");
  };

  const createStaff = async (payload: Record<string, unknown>) => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(() => api.createStaff(tenantId, token, payload), { rethrow: true });
    if (!result) return;
    setStaff((current) => [...current, result.data]);
    if (result.data.role === "doctor") setClinicalStaff((current) => [...current, result.data]);
    toast.showSuccess("Cuenta creada correctamente.");
  };

  const updateStaffStatus = async (membershipId: string, isActive: boolean) => {
    if (!tenantId || !token) return;
    const person = staff.find((item) => item.membership_id === membershipId);
    const change = await reasonFor(isActive ? "Restaurar acceso" : "Quitar acceso a la clínica", `${person?.full_name ?? "Personal"} · ${tenant?.name ?? "Clínica activa"}`, [isActive ? "Inactivo → Activo" : "Activo → Inactivo", "Los accesos a otras clínicas se conservan."]);
    const result = await asyncAction.run(() => api.updateStaffStatus(tenantId, token, membershipId, isActive, change), { rethrow: true });
    if (!result) return;
    setStaff((current) => current.map((person) => person.membership_id === membershipId ? result.data : person));
    const clinicalResult = await asyncAction.run(() => api.listClinicalStaff(tenantId, token));
    if (clinicalResult) setClinicalStaff(clinicalResult.data);
  };

  const createAppointment = async (payload: Record<string, unknown>) => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(() => api.createAppointment(tenantId, token, payload), { rethrow: true });
    if (!result) return;
    setAppointments((current) => [...current, result.data]);
    toast.showSuccess("Cita guardada correctamente.");
  };

  const rescheduleAppointment = async (appointmentId: string, payload: { starts_at: string; ends_at: string }) => {
    if (!tenantId || !token) return;
    const appointment = appointments.find((item) => item.id === appointmentId);
    const change = await reasonFor("Reprogramar cita", `${appointment?.patient_name ?? "Paciente"} · ${appointment?.doctor_name ?? "Médico"} · ${tenant?.name ?? ""}`, [`${appointment ? new Date(appointment.starts_at).toLocaleString("es-MX") : "Horario anterior"} → ${new Date(payload.starts_at).toLocaleString("es-MX")}`, `Término: ${new Date(payload.ends_at).toLocaleString("es-MX")}`]);
    const result = await asyncAction.run(() => api.rescheduleAppointment(tenantId, token, appointmentId, { ...payload, ...change }), { rethrow: true });
    if (!result) return;
    setAppointments((current) => current.map((item) => item.id === appointmentId ? result.data : item));
    toast.showSuccess("Cita reprogramada correctamente.");
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    if (!tenantId || !token) return;
    const appointment = appointments.find((item) => item.id === appointmentId);
    const labels: Record<string, string> = { cancelled: "Cancelada", completed: "Terminada", no_show: "No asistió", scheduled: "Por confirmar", confirmed: "Confirmada", checked_in: "En espera", in_consultation: "En consulta" };
    const critical = status !== appointment?.status && (["cancelled", "no_show"].includes(status) || ["completed", "cancelled", "no_show"].includes(appointment?.status ?? ""));
    const change = critical ? await reasonFor("Cambiar estado de cita", `${appointment?.patient_name ?? "Paciente"} · ${appointment?.doctor_name ?? "Médico"} · ${tenant?.name ?? ""}`, [`${labels[appointment?.status ?? ""] ?? "Estado anterior"} → ${labels[status] ?? status}`]) : {};
    const result = await asyncAction.run(() => api.updateAppointmentStatus(tenantId, token, appointmentId, status, change), { rethrow: true });
    if (!result) return;
    setAppointments((current) => current.map((item) => item.id === appointmentId ? result.data : item));
  };

  const getDoctorAvailability = async (doctorUserId: string): Promise<DoctorAvailability[]> => {
    if (!tenantId || !token) return [];
    const result = await asyncAction.run(() => api.getDoctorAvailability(tenantId, token, doctorUserId));
    return result?.data ?? [];
  };

  const setDoctorAvailability = async (doctorUserId: string, days: DoctorAvailability[]) => {
    if (!tenantId || !token) return;
    const doctorName = clinicalStaff.find((item) => item.user_id === doctorUserId)?.full_name ?? session?.fullName ?? "Médico";
    const change = await reasonFor("Cambiar horario de atención", `${doctorName} · ${tenant?.name ?? ""}`, ["Se reemplazará el horario disponible para agendar citas."]);
    const result = await asyncAction.run(() => api.setDoctorAvailability(tenantId, token, doctorUserId, days, change), { rethrow: true });
    if (result) toast.showSuccess("Horario guardado correctamente.");
  };

  const createPatientInvitation = async (patientId: string): Promise<string> => {
    if (!tenantId || !token) return "";
    const result = await asyncAction.run(() => api.createPatientInvitation(tenantId, token, patientId), { rethrow: true });
    if (!result) return "";
    return `${window.location.origin}/?invite=${encodeURIComponent(result.data.token)}&clinic=${encodeURIComponent(result.data.tenant_id)}`;
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
    if (!tenantId || !token || !["tenant_admin", "auditor"].includes(session?.role ?? "")) return;
    setAuditLoading(true);
    setAuditError(null);
    try {
      const result = await api.listAuditEvents(tenantId, token);
      setAuditEvents(result.data);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : "No se pudo cargar la actividad.");
    } finally { setAuditLoading(false); }
  };

  useEffect(() => {
    void api.getBootstrapStatus()
      .then((result) => setSetupRequired(result.data.setup_required))
      .catch(() => setSetupRequired(false));
  }, []);

  useEffect(() => {
    setRecord(null);
    setNotes([]);
    setConsents([]);
    setPrescriptions([]);
  }, [selectedPatientId]);

  useEffect(() => {
    if (activeView === "compliance" && selectedPatientId && tenantId && token) {
      void refreshCompliance();
    }
  }, [activeView, selectedPatientId, tenantId, token]);

  useEffect(() => {
    if (activeView !== "audit" || !tenantId || !token || !["tenant_admin", "auditor"].includes(session?.role ?? "")) return;
    let cancelled = false;
    setAuditLoading(true);
    setAuditError(null);
    api.listAuditEvents(tenantId, token)
      .then((result) => { if (!cancelled) setAuditEvents(result.data); })
      .catch((error) => { if (!cancelled) setAuditError(error instanceof Error ? error.message : "No se pudo cargar la actividad."); })
      .finally(() => { if (!cancelled) setAuditLoading(false); });
    return () => { cancelled = true; };
  }, [activeView, tenantId, token, session?.role]);

  const renderActiveView = () => {
    if (activeView === "security") {
      if (setupRequired === null) {
        return <Card><p className="text-sm text-muted">Comprobando configuración inicial...</p></Card>;
      }
      if (setupRequired) {
        return <FirstRunSetup onCreate={createInitialAdmin} />;
      }
      return (
        <AuthPanel
          selection={clinicSelection}
          onIdentify={identifyUser}
          onSelectClinic={selectClinic}
          onBack={() => setClinicSelection(null)}
        />
      );
    }

    if (!session) {
      return (
        <Card>
          <h2 className="section-title">Inicia sesión para continuar</h2>
          <p className="mt-2 text-sm text-muted">
            Ve a Acceso, elige tu clínica y entra con tu cuenta.
          </p>
        </Card>
      );
    }

    if (activeView === "patients") {
      return (
        <PatientPanel
          patients={patients}
          onCreate={createPatient}
          canCreate={session.permissions?.includes("patient.create") ?? ["tenant_admin", "reception", "doctor"].includes(session.role)}
          onRefresh={refreshPatients}
          onUpdate={updatePatient}
          canInvite={session.role === "tenant_admin" || session.role === "reception"}
          onInvite={createPatientInvitation}
        />
      );
    }

    if (activeView === "appointments") {
      return (
        <Suspense fallback={<Card><p className="text-sm text-muted">Cargando agenda...</p></Card>}>
        <AppointmentPanel
          appointments={appointments}
          patients={patients}
          doctors={clinicalStaff}
          userId={session.userId}
          userRole={session.role}
          onCreate={createAppointment}
          onReschedule={rescheduleAppointment}
          onStatusChange={updateAppointmentStatus}
          onGetAvailability={getDoctorAvailability}
          onSetAvailability={setDoctorAvailability}
        />
        </Suspense>
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
          clinicalStaff={clinicalStaff}
          doctorAssignment={doctorAssignment}
          userId={session.userId}
          userRole={session.role}
          onAssignDoctor={assignDoctor}
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
          canPrescribe={session.role === "doctor" && doctorAssignment?.doctor_user_id === session.userId}
        />
      );
    }

    if (activeView === "staff") {
      return <StaffPanel staff={staff} currentUserId={session.userId} clinicName={tenant?.name ?? "Clínica activa"} clinicId={tenantId} clinics={managedClinics} onAssociate={associateStaffToClinic} onCreate={createStaff} onStatusChange={updateStaffStatus} />;
    }

    if (activeView === "clinics") {
      return <ClinicManagementPanel activeClinicId={tenantId} clinics={managedClinics} staff={staff} patients={patients} onRefresh={refreshManagedClinics} onCreate={createTenant} onAssociateStaff={associateStaffToClinic} onReferPatient={referPatientToClinic} />;
    }

    return <AuditPanel loading={auditLoading} error={auditError} events={auditEvents} tenantId={tenantId} onRefresh={refreshAuditEvents} />;
  };

  return (
    <AppShell
      activeView={activeView}
      isAuthenticated={Boolean(session)}
      userRole={session?.role}
      onViewChange={setActiveView}
      onLogout={() => {
        setSession(null);
        setClinicSelection(null);
        resetClinicalState();
        setActiveView("security");
      }}
    >
      <GlobalLoader active={asyncAction.isLoading} />
      {reasonDialog}

      {session ? (
        <WorkContextHeader
          clinicName={tenant?.name ?? "Clínica activa"}
          onChangeClinic={openClinicSwitcher}
          onManageStaff={() => setActiveView("staff")}
          userName={session.fullName}
          userRole={session.role}
          recordName={
            selectedPatient
              ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
              : "Ninguno"
          }
        />
      ) : null}

      <div key={tenantId}>{renderActiveView()}</div>
      <Modal isOpen={Boolean(session && clinicSelection)} onClose={() => setClinicSelection(null)} title="Cambiar clínica">
        {session && clinicSelection ? <AuthPanel selection={clinicSelection} onIdentify={identifyUser} onSelectClinic={selectClinic} onBack={() => setClinicSelection(null)} backLabel="Cancelar" /> : null}
      </Modal>
    </AppShell>
  );
}
