import { ArrowRight, Building2, Plus, Stethoscope } from "lucide-react";
import { useState } from "react";

import { Button, Card, EmptyState, FormField, Modal } from "../../components/ui";
import { useAppForm } from "../../hooks";
import type { ManagedClinic, Patient, StaffMember } from "../../types";

type Props = {
  activeClinicId: string;
  clinics: ManagedClinic[];
  staff: StaffMember[];
  patients: Patient[];
  onRefresh: () => Promise<void>;
  onCreate: (payload: { name: string; legal_name?: string | null }) => Promise<void>;
  onAssociateStaff: (targetClinicId: string, userId: string) => Promise<void>;
  onReferPatient: (targetClinicId: string, patientId: string, reason: string) => Promise<void>;
};

export function ClinicManagementPanel({ activeClinicId, clinics, staff, patients, onRefresh, onCreate, onAssociateStaff, onReferPatient }: Props) {
  const [actionError, setActionError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [staffClinic, setStaffClinic] = useState<ManagedClinic | null>(null);
  const [patientClinic, setPatientClinic] = useState<ManagedClinic | null>(null);
  const [staffUserId, setStaffUserId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [reason, setReason] = useState("");
  const [consent, setConsent] = useState(false);
  const form = useAppForm<{ name: string; legal_name: string }>({ defaultValues: { name: "", legal_name: "" } });

  const closeStaffModal = () => { setStaffClinic(null); setStaffUserId(""); };
  const closePatientModal = () => { setPatientClinic(null); setPatientId(""); setReason(""); setConsent(false); };

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Clínicas</h2>
          <p className="text-sm text-muted">Administra tus clínicas y sus relaciones.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button type="button" variant="secondary" onClick={onRefresh}>Actualizar</Button>
          <Button type="button" icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>Crear clínica</Button>
        </div>
      </div>

      {clinics.length ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <table className="responsive-table w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Clínica</th>
                <th className="px-4 py-3">Razón social</th>
                <th className="px-4 py-3">Personal</th>
                <th className="px-4 py-3">Pacientes</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {clinics.map((clinic) => {
                const isActive = clinic.id === activeClinicId;
                return (
                  <tr key={clinic.id} className={isActive ? "bg-brand-50/60" : "hover:bg-slate-50"}>
                    <td data-label="Clínica" className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-semibold text-ink"><Building2 className="h-4 w-4 text-brand-700" />{clinic.name}</span>
                    </td>
                    <td data-label="Razón social" className="px-4 py-3 text-muted">{clinic.legal_name || "Sin registrar"}</td>
                    <td data-label="Personal" className="px-4 py-3 text-ink">{clinic.staff_count}</td>
                    <td data-label="Pacientes" className="px-4 py-3 text-ink">{clinic.patient_count}</td>
                    <td data-label="Estado" className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-brand-100 text-brand-800" : clinic.is_active ? "bg-slate-100 text-slate-700" : "bg-red-50 text-red-700"}`}>
                        {isActive ? "Clínica activa" : clinic.is_active ? "Disponible" : "Inactiva"}
                      </span>
                    </td>
                    <td data-label="Acciones" className="px-4 py-3 text-right">
                      {isActive ? <span className="text-xs text-muted">Estás trabajando aquí</span> : (
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <Button type="button" variant="secondary" icon={<Stethoscope className="h-4 w-4" />} onClick={() => setStaffClinic(clinic)}>Asociar personal</Button>
                          <Button type="button" variant="secondary" icon={<ArrowRight className="h-4 w-4" />} onClick={() => setPatientClinic(clinic)}>Referir paciente</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="mt-5"><EmptyState title="Sin clínicas" description="Crea la primera clínica administrable." /></div>}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Crear clínica" description="Registra una nueva clínica bajo tu administración.">
        <form className="grid gap-3" onSubmit={form.submit(async (values) => { await onCreate({ name: values.name, legal_name: values.legal_name || null }); form.reset({ name: "", legal_name: "" }); setCreateOpen(false); })}>
          <FormField label="Nombre comercial" registration={form.register("name", { required: "Escribe el nombre." })} error={form.formState.errors.name} />
          <FormField label="Razón social (opcional)" registration={form.register("legal_name")} error={form.formState.errors.legal_name} />
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit">Crear clínica</Button></div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(staffClinic)} onClose={closeStaffModal} title="Asociar personal" description={`Clínica destino: ${staffClinic?.name ?? ""}`}>
        <div className="grid gap-4">
          {actionError ? <p role="alert" className="text-sm text-red-700">{actionError}</p> : null}
          <p className="text-sm text-muted">La persona conservará una sola cuenta y podrá elegir esta clínica al ingresar.</p>
          <label className="grid gap-1.5"><span className="field-label">Persona de la clínica actual</span><select className="field-control" value={staffUserId} onChange={(event) => setStaffUserId(event.target.value)}><option value="">Seleccionar</option>{staff.map((person) => <option key={person.user_id} value={person.user_id}>{person.full_name} · {person.email}</option>)}</select></label>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={closeStaffModal}>Cancelar</Button><Button type="button" disabled={!staffClinic || !staffUserId} onClick={async () => { if (!staffClinic) return; setActionError(""); try { await onAssociateStaff(staffClinic.id, staffUserId); closeStaffModal(); } catch (error) { setActionError(error instanceof Error ? error.message : "No se pudo asociar el personal."); } }}>Asociar</Button></div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(patientClinic)} onClose={closePatientModal} title="Referir paciente" description={`Clínica destino: ${patientClinic?.name ?? ""}`}>
        <div className="grid gap-4">
          {actionError ? <p role="alert" className="text-sm text-red-700">{actionError}</p> : null}
          <p className="text-sm text-muted">Se comparte la ficha básica. El expediente original permanece en la clínica actual.</p>
          <label className="grid gap-1.5"><span className="field-label">Paciente</span><select className="field-control" value={patientId} onChange={(event) => setPatientId(event.target.value)}><option value="">Seleccionar</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="field-label">Motivo de la referencia (obligatorio)</span><textarea className="field-control min-h-24" required minLength={5} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
          <label className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm"><input className="mt-1" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Confirmo que el paciente autorizó la referencia a esta clínica.</span></label>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={closePatientModal}>Cancelar</Button><Button type="button" disabled={!patientClinic || !patientId || !consent || reason.trim().length < 5} onClick={async () => { if (!patientClinic) return; setActionError(""); try { await onReferPatient(patientClinic.id, patientId, reason); closePatientModal(); } catch (error) { setActionError(error instanceof Error ? error.message : "No se pudo referir al paciente."); } }}>Referir paciente</Button></div>
        </div>
      </Modal>
    </Card>
  );
}
