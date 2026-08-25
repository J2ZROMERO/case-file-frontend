import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { AppShell, WorkContextHeader } from "../components/layout";
import { Card, GlobalLoader, useToast } from "../components/ui";
import { AuditPanel } from "../features/audit";
import { AuthPanel } from "../features/auth";
import type { ClinicAccess, ClinicSelection } from "../features/auth";
import { CompliancePanel } from "../features/compliance";
import { MedicalRecordPanel } from "../features/medical-records";
import { PatientPanel } from "../features/patients";
import { StaffPanel } from "../features/staff";
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
  DoctorAssignment,
  StaffMember,
  Appointment,
  DoctorAvailability,
  Tenant,
} from "../types";

const AppointmentPanel = lazy(() =>
  import("../features/appointments").then((module) => ({ default: module.AppointmentPanel })),
);

export function App() {
  const asyncAction = useAsyncAction();
  const toast = useToast();
  const [activeView, setActiveView] = useState("security");
  const [clinicSelection, setClinicSelection] = useState<ClinicSelection | null>(null);
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
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [clinicalStaff, setClinicalStaff] = useState<StaffMember[]>([]);
  const [doctorAssignment, setDoctorAssignment] = useState<DoctorAssignment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

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
    setStaff([]);
    setClinicalStaff([]);
    setDoctorAssignment(null);
    setAppointments([]);
  };

  const createTenant = async (payload: { name: string; legal_name?: string | null }) => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(
      () => api.createManagedTenant(tenantId, token, payload),
      { rethrow: true },
    );
    if (result) toast.showSuccess(result.message);
  };

  const identifyUser = async (payload: { email: string; password: string }) => {
    const result = await asyncAction.run(() => api.identifyUser(payload), { rethrow: true });
    if (result) setClinicSelection(result.data);
  };

  const selectClinic = async (clinic: ClinicAccess) => {
    if (!clinicSelection) return;
    const result = await asyncAction.run(
      () => api.selectTenant(clinicSelection.selection_token, clinic.id),
      { rethrow: true },
    );
    if (!result) return;
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
    });
    const canManageStaff = result.data.role === "tenant_admin";
    const canAssignDoctors = canManageStaff || result.data.role === "reception";
    const canUseAgenda = canAssignDoctors || result.data.role === "doctor";
    const [patientResult, staffResult, clinicalResult, appointmentResult] = await Promise.all([
      asyncAction.run(() => api.listPatients(resolvedTenantId, result.data.access_token)),
      canManageStaff
        ? asyncAction.run(() => api.listStaff(resolvedTenantId, result.data.access_token))
        : Promise.resolve(null),
      canAssignDoctors
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
    const result = await asyncAction.run(
      () => api.assignDoctor(tenantId, token, record.id, doctorUserId),
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
    const result = await asyncAction.run(() => api.updateStaffStatus(tenantId, token, membershipId, isActive));
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

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    if (!tenantId || !token) return;
    const result = await asyncAction.run(() => api.updateAppointmentStatus(tenantId, token, appointmentId, status), { rethrow: true });
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
    const result = await asyncAction.run(() => api.setDoctorAvailability(tenantId, token, doctorUserId, days), { rethrow: true });
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
      return (
        <div className="grid gap-5">
          <Card className="border-brand-100 bg-brand-50/40">
            <h2 className="section-title">Administración</h2>
            <p className="mt-1 text-sm text-muted">
              Gestiona clínicas, personal y quién puede trabajar en esta clínica.
            </p>
          </Card>
          <TenantPanel
            tenant={null}
            onCreate={createTenant}
            selectedTenantId=""
            onTenantIdChange={() => undefined}
            showAccessCode={false}
          />
          <StaffPanel staff={staff} onCreate={createStaff} onStatusChange={updateStaffStatus} />
        </div>
      );
    }

    return <AuditPanel events={auditEvents} tenantId={tenantId} onRefresh={refreshAuditEvents} />;
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

      {session ? (
        <WorkContextHeader
          clinicName={tenant?.name ?? "Clínica activa"}
          userName={session.fullName}
          recordName={
            selectedPatient
              ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
              : "Ninguno"
          }
        />
      ) : null}

      {renderActiveView()}
    </AppShell>
  );
}
