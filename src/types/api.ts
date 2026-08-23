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
  email: string;
  role: string;
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
