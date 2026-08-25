import type {
  AuditEvent,
  ClinicalNote,
  Consent,
  MedicalRecord,
  Patient,
  Prescription,
  DoctorAssignment,
  StaffMember,
  Appointment,
  DoctorAvailability,
  PortalAppointment,
  PortalMedication,
  PortalProfile,
  Tenant,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type ApiResult<T> = {
  status: "success";
  message: string;
  data: T;
};

type ApiEnvelope<T> = ApiResult<T> | { status: "error"; message: string; errors?: Record<string, string> };

export class ApiRequestError extends Error {
  fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.fieldErrors = fieldErrors;
  }
}

type RequestOptions = {
  tenantId?: string;
  token?: string;
  body?: unknown;
  method?: "GET" | "POST" | "PATCH";
};

function successMessage(path: string, method: string): string {
  if (method === "GET") return "Informacion actualizada.";
  if (path.includes("/auth/register")) return "Usuario creado correctamente.";
  if (path.includes("/auth/login")) return "Sesion iniciada correctamente.";
  if (path.includes("/tenants")) return "Clinica creada correctamente.";
  if (path.includes("/patients")) return "Paciente guardado correctamente.";
  if (path.includes("/medical-records") && path.includes("/notes")) return "Nota clinica firmada correctamente.";
  if (path.includes("/medical-records")) return "Expediente creado correctamente.";
  if (path.includes("/consents")) return "Consentimiento firmado correctamente.";
  if (path.includes("/prescriptions")) return "Receta firmada correctamente.";
  return "Accion completada correctamente.";
}

function fieldNameFromLocation(location: unknown): string | null {
  if (!Array.isArray(location)) return null;
  const field = location[location.length - 1];
  return typeof field === "string" ? field : null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Response-Envelope": "true",
  };
  if (options.tenantId) {
    headers["X-Tenant-ID"] = options.tenantId;
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (Array.isArray(payload.detail)) {
      const fieldErrors = payload.detail.reduce(
        (accumulator: Record<string, string>, item: { loc?: unknown; msg?: string }) => {
          const field = fieldNameFromLocation(item.loc);
          if (field && item.msg) accumulator[field] = item.msg;
          return accumulator;
        },
        {},
      );
      throw new ApiRequestError("Revisa los campos marcados.", fieldErrors);
    }
    if (payload.status === "error") {
      throw new ApiRequestError(payload.message || `HTTP ${response.status}`, payload.errors ?? {});
    }
    throw new ApiRequestError(payload.detail || `HTTP ${response.status}`);
  }

  const payload = (await response.json()) as T | ApiEnvelope<T>;
  if (
    payload &&
    typeof payload === "object" &&
    "status" in payload &&
    "message" in payload &&
    "data" in payload
  ) {
    return payload as ApiResult<T>;
  }

  return {
    status: "success",
    message: successMessage(path, options.method ?? "GET"),
    data: payload as T,
  };
}

export const api = {
  createTenant: (body: { name: string; legal_name?: string | null }) =>
    request<Tenant>("/tenants", { method: "POST", body }),
  createManagedTenant: (tenantId: string, token: string, body: { name: string; legal_name?: string | null }) =>
    request<Tenant>("/tenants/managed", { method: "POST", tenantId, token, body }),
  registerUser: (body: Record<string, unknown>) =>
    request<{ id: string; tenant_id: string; email: string; full_name: string; role: string }>(
      "/auth/register",
      { method: "POST", body },
    ),
  login: (body: { tenant_id: string; email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user_id: string; full_name: string; role: string; tenant_id: string; tenant_name: string }>("/auth/login", { method: "POST", body }),
  identifyUser: (body: { email: string; password: string }) =>
    request<{ selection_token: string; user_id: string; full_name: string; email: string; clinics: Array<{ id: string; name: string; role: string }> }>("/auth/identify", { method: "POST", body }),
  selectTenant: (selectionToken: string, tenantId: string) =>
    request<{ access_token: string; token_type: string; user_id: string; full_name: string; role: string; tenant_id: string; tenant_name: string }>("/auth/select-tenant", { method: "POST", body: { selection_token: selectionToken, tenant_id: tenantId } }),
  listStaff: (tenantId: string, token: string) => request<StaffMember[]>("/staff", { tenantId, token }),
  listClinicalStaff: (tenantId: string, token: string) => request<StaffMember[]>("/staff/clinical", { tenantId, token }),
  createStaff: (tenantId: string, token: string, body: Record<string, unknown>) =>
    request<StaffMember>("/staff", { method: "POST", tenantId, token, body }),
  updateStaffStatus: (tenantId: string, token: string, membershipId: string, isActive: boolean) =>
    request<StaffMember>(`/staff/${membershipId}/status`, { method: "PATCH", tenantId, token, body: { is_active: isActive } }),
  listAppointments: (tenantId: string, token: string) =>
    request<Appointment[]>("/appointments", { tenantId, token }),
  createAppointment: (tenantId: string, token: string, body: Record<string, unknown>) =>
    request<Appointment>("/appointments", { method: "POST", tenantId, token, body }),
  updateAppointmentStatus: (tenantId: string, token: string, appointmentId: string, status: string) =>
    request<Appointment>(`/appointments/${appointmentId}/status`, { method: "PATCH", tenantId, token, body: { status } }),
  getDoctorAvailability: (tenantId: string, token: string, doctorUserId: string) =>
    request<DoctorAvailability[]>(`/appointments/availability/${doctorUserId}`, { tenantId, token }),
  setDoctorAvailability: (tenantId: string, token: string, doctorUserId: string, days: DoctorAvailability[]) =>
    request<DoctorAvailability[]>("/appointments/availability", { method: "POST", tenantId, token, body: { doctor_user_id: doctorUserId, days } }),
  createPatientInvitation: (tenantId: string, token: string, patientId: string) =>
    request<{ token: string; tenant_id: string; patient_id: string; patient_email: string; expires_at: string }>(`/portal/invitations/${patientId}`, { method: "POST", tenantId, token }),
  acceptPatientInvitation: (token: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/portal/accept", { method: "POST", body: { token, password } }),
  patientPortalLogin: (tenantId: string, email: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/portal/login", { method: "POST", body: { tenant_id: tenantId, email, password } }),
  getPortalProfile: (token: string) => request<PortalProfile>("/portal/me", { token }),
  getPortalAppointments: (token: string) => request<PortalAppointment[]>("/portal/appointments", { token }),
  getPortalMedications: (token: string) => request<PortalMedication[]>("/portal/medications", { token }),
  createPatient: (tenantId: string, token: string, body: Record<string, unknown>) =>
    request<Patient>("/patients", { method: "POST", tenantId, token, body }),
  listPatients: (tenantId: string, token: string) => request<Patient[]>("/patients", { tenantId, token }),
  updatePatient: (tenantId: string, token: string, patientId: string, body: Record<string, unknown>) =>
    request<Patient>(`/patients/${patientId}`, { method: "PATCH", tenantId, token, body }),
  createMedicalRecord: (tenantId: string, token: string, patientId: string) =>
    request<MedicalRecord>("/medical-records", {
      method: "POST",
      tenantId,
      token,
      body: { patient_id: patientId },
    }),
  getPatientMedicalRecord: (tenantId: string, token: string, patientId: string) =>
    request<MedicalRecord | null>(`/medical-records/patient/${patientId}`, { tenantId, token }),
  addClinicalNote: (tenantId: string, token: string, recordId: string, body: Record<string, unknown>) =>
    request<ClinicalNote>(`/medical-records/${recordId}/notes`, {
      method: "POST",
      tenantId,
      token,
      body,
    }),
  listClinicalNotes: (tenantId: string, token: string, recordId: string) =>
    request<ClinicalNote[]>(`/medical-records/${recordId}/notes`, { tenantId, token }),
  getDoctorAssignment: (tenantId: string, token: string, recordId: string) =>
    request<DoctorAssignment | null>(`/medical-records/${recordId}/assignment`, { tenantId, token }),
  assignDoctor: (tenantId: string, token: string, recordId: string, doctorUserId: string) =>
    request<DoctorAssignment>(`/medical-records/${recordId}/assignment`, {
      method: "POST",
      tenantId,
      token,
      body: { doctor_user_id: doctorUserId },
    }),
  createConsent: (tenantId: string, token: string, body: Record<string, unknown>) =>
    request<Consent>("/consents", { method: "POST", tenantId, token, body }),
  listConsents: (tenantId: string, token: string, patientId: string) =>
    request<Consent[]>(`/consents/patient/${patientId}`, { tenantId, token }),
  createPrescription: (tenantId: string, token: string, body: Record<string, unknown>) =>
    request<Prescription>("/prescriptions", { method: "POST", tenantId, token, body }),
  listPrescriptions: (tenantId: string, token: string, patientId: string) =>
    request<Prescription[]>(`/prescriptions/patient/${patientId}`, { tenantId, token }),
  listAuditEvents: (tenantId: string, token: string) =>
    request<AuditEvent[]>("/audit-events", { tenantId, token }),
};
