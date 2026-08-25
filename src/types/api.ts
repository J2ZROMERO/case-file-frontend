export type Tenant = {
  id: string;
  name: string;
  legal_name: string | null;
  is_active: boolean;
};

export type Patient = {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string | null;
  curp: string | null;
};

export type MedicalRecord = {
  id: string;
  tenant_id: string;
  patient_id: string;
  status: string;
};

export type ClinicalNoteType =
  | "initial_history"
  | "evolution_note"
  | "interconsultation_note"
  | "emergency_note"
  | "hospitalization_note"
  | "discharge_note"
  | "prescription"
  | "informed_consent";

export type ClinicalNote = {
  id: string;
  tenant_id: string;
  medical_record_id: string;
  note_type: ClinicalNoteType;
  content: string;
  authored_by: string;
  professional_license: string;
  signed_at: string;
};

export type AuditEvent = {
  id: string;
  tenant_id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  occurred_at: string;
  ip_address: string | null;
  user_agent: string | null;
};

export type AuthSession = {
  tenantId: string;
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
};

export type StaffMember = {
  membership_id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  professional_license: string | null;
  specialty: string | null;
  specialty_license: string | null;
  can_provide_consultations: boolean;
  is_verified: boolean;
};

export type DoctorAssignment = {
  doctor_user_id: string;
  doctor_name: string;
  professional_license: string;
  specialty: string | null;
  assigned_by_user_id: string;
  assigned_at: string;
};

export type Appointment = {
  id: string;
  tenant_id: string;
  patient_id: string;
  patient_name: string;
  doctor_user_id: string;
  doctor_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  visit_type: string;
  reason: string | null;
  internal_notes: string | null;
};

export type DoctorAvailability = {
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export type PortalProfile = {
  patient_id: string;
  full_name: string;
  email: string;
  clinic_name: string;
};

export type PortalAppointment = {
  id: string;
  doctor_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  visit_type: string;
};

export type PortalMedication = {
  prescription_id: string;
  medication: string;
  indications: string;
  prescribed_by: string;
  signed_at: string;
  medication_name: string | null;
  dose: string | null;
  schedule_times: string[];
  starts_on: string | null;
  ends_on: string | null;
};

export type Consent = {
  id: string;
  tenant_id: string;
  patient_id: string;
  title: string;
  content: string;
  signed_by: string;
  witness_name: string | null;
  signed_at: string;
};

export type Prescription = {
  id: string;
  tenant_id: string;
  patient_id: string;
  diagnosis: string;
  medication: string;
  indications: string;
  prescribed_by: string;
  professional_license: string;
  signed_at: string;
};

export type ApiError = {
  detail?: string | Array<{ msg: string; loc: string[] }>;
};
