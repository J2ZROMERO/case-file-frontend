import { useMemo, useState } from "react";
import { ArrowLeft, FilePlus2, FolderOpen, PenLine, RefreshCw, Search, UserRound } from "lucide-react";

import { Button, Card, EmptyState, FormField, Modal } from "../../components/ui";
import { formatDateTime } from "../../lib";
import { useAppForm } from "../../hooks";
import type { ClinicalNote, ClinicalNoteType, DoctorAssignment, MedicalRecord, Patient, StaffMember } from "../../types";

const noteTypes: Array<{ value: ClinicalNoteType; label: string }> = [
  { value: "initial_history", label: "Historia clinica" },
  { value: "evolution_note", label: "Nota de evolucion" },
  { value: "interconsultation_note", label: "Interconsulta" },
  { value: "emergency_note", label: "Urgencias" },
  { value: "hospitalization_note", label: "Hospitalizacion" },
  { value: "discharge_note", label: "Egreso" },
  { value: "prescription", label: "Receta" },
  { value: "informed_consent", label: "Consentimiento" },
];

type MedicalRecordPanelProps = {
  patients: Patient[];
  selectedPatientId: string;
  record: MedicalRecord | null;
  notes: ClinicalNote[];
  onOpenRecord: (patientId: string) => Promise<void>;
  onRefreshPatients: () => Promise<void>;
  onCreateRecord: () => Promise<void>;
  onCreateNote: (payload: Record<string, unknown>) => Promise<void>;
  onRefreshNotes: () => Promise<void>;
  clinicalStaff: StaffMember[];
  doctorAssignment: DoctorAssignment | null;
  userId: string;
  userRole: string;
  onAssignDoctor: (doctorUserId: string) => Promise<void>;
};

type NoteForm = {
  note_type: ClinicalNoteType;
  content: string;
};

export function MedicalRecordPanel({
  patients,
  selectedPatientId,
  record,
  notes,
  onOpenRecord,
  onRefreshPatients,
  onCreateRecord,
  onCreateNote,
  onRefreshNotes,
  clinicalStaff,
  doctorAssignment,
  userId,
  userRole,
  onAssignDoctor,
}: MedicalRecordPanelProps) {
  const [assignmentError, setAssignmentError] = useState("");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorUserId, setDoctorUserId] = useState("");
  const form = useAppForm<NoteForm>({
    defaultValues: {
      note_type: "evolution_note",
      content: "Paciente estable, se documenta evolucion clinica y plan terapeutico.",
    },
  });

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLocaleLowerCase("es-MX");
    if (!term) return patients;
    return patients.filter((patient) =>
      [patient.first_name, patient.last_name, patient.email, patient.curp ?? ""]
        .join(" ")
        .toLocaleLowerCase("es-MX")
        .includes(term),
    );
  }, [patientSearch, patients]);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? null;
  const canAssignDoctor = userRole === "tenant_admin" || userRole === "reception";
  const canSignNote = userRole === "doctor" && doctorAssignment?.doctor_user_id === userId;

  return (
    <Card>
      {!isDetailOpen ? (
        <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Expedientes</h2>
          <p className="text-sm text-muted">Elige el expediente que quieres consultar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={onRefreshPatients}
          >
            Actualizar pacientes
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Buscar pacientes</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={patientSearch}
            onChange={(event) => setPatientSearch(event.target.value)}
            placeholder="Buscar por nombre, correo o CURP"
            className="field-control pl-9"
          />
        </label>
        <span className="text-sm text-muted">{filteredPatients.length} pacientes</span>
      </div>

      {patients.length === 0 ? (
        <EmptyState title="Sin pacientes" description="Agrega pacientes desde la seccion Pacientes." />
      ) : filteredPatients.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay pacientes que coincidan con la busqueda." />
      ) : (
        <div className="mb-5 sm:overflow-hidden sm:rounded-lg sm:border sm:border-slate-200">
          <div>
            <table className="responsive-table min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Correo electrónico</th>
                  <th className="px-4 py-3 font-semibold">CURP</th>
                  <th className="px-4 py-3 text-right font-semibold">Expediente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPatients.map((patient) => {
                  const isSelected = patient.id === selectedPatientId;
                  return (
                    <tr key={patient.id} className={isSelected ? "bg-brand-50" : "hover:bg-slate-50"}>
                      <td data-label="Paciente" className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{patient.first_name} {patient.last_name}</td>
                      <td data-label="Correo" className="break-all px-4 py-3 text-muted">{patient.email || "Sin correo"}</td>
                      <td data-label="CURP" className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{patient.curp || "No registrada"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant={isSelected ? "primary" : "secondary"}
                          icon={<FolderOpen className="h-4 w-4" />}
                          onClick={async () => {
                            setIsDetailOpen(true);
                            await onOpenRecord(patient.id);
                          }}
                        >
                          {isSelected ? "Ver expediente" : "Seleccionar expediente"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

        </>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-700">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Expediente seleccionado</p>
                <h2 className="text-lg font-semibold text-ink">
                  {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "Cargando paciente..."}
                </h2>
                {selectedPatient && <p className="text-sm text-muted">{selectedPatient.email}</p>}
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => {
                setIsDetailOpen(false);
                setIsNoteModalOpen(false);
              }}
            >
              Elegir otro expediente
            </Button>
          </div>

      <div>
      {record ? (
        <div className="mb-4 grid gap-3 rounded-xl bg-slate-100 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="font-semibold text-ink">Médico responsable</p>
            {canAssignDoctor ? (
              <label className="mt-2 block max-w-md">
                <span className="sr-only">Seleccionar médico responsable</span>
                <select className="field-control" value={doctorUserId || doctorAssignment?.doctor_user_id || ""} onChange={(event) => setDoctorUserId(event.target.value)}>
                  <option value="">Selecciona un médico</option>
                  {clinicalStaff.map((doctor) => (
                    <option key={doctor.user_id} value={doctor.user_id}>{doctor.full_name} · Cédula {doctor.professional_license}</option>
                  ))}
                </select>
              </label>
            ) : doctorAssignment ? (
              <div className="mt-2 rounded-lg bg-white p-3">
                <p className="font-semibold text-ink">{doctorAssignment.doctor_name}</p>
                <p className="text-muted">Cédula {doctorAssignment.professional_license}{doctorAssignment.specialty ? ` · ${doctorAssignment.specialty}` : ""}</p>
              </div>
            ) : (
              <p className="mt-1 text-muted">Administración debe asignar un médico antes de firmar notas.</p>
            )}
          </div>
          {assignmentError ? <p role="alert" className="text-sm text-red-700">{assignmentError}</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            {canAssignDoctor ? <Button type="button" disabled={!(doctorUserId || doctorAssignment?.doctor_user_id)} onClick={async () => { setAssignmentError(""); try { await onAssignDoctor(doctorUserId || doctorAssignment!.doctor_user_id); } catch (error) { setAssignmentError(error instanceof Error ? error.message : "No se pudo cambiar la asignación."); } }}>Guardar asignación</Button> : null}
            <Button type="button" variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={onRefreshNotes}>Actualizar notas</Button>
          </div>
        </div>
      ) : selectedPatientId ? (
        <div className="mb-4 flex flex-col gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">Este paciente aun no tiene expediente</p>
            <p className="text-sm text-muted">Puedes crearlo cuando decidas comenzar su registro clinico.</p>
          </div>
          <Button type="button" icon={<FilePlus2 className="h-4 w-4" />} onClick={onCreateRecord}>Crear expediente</Button>
        </div>
      ) : (
        <EmptyState
          title="Selecciona un paciente"
          description="Usa la tabla para abrir el expediente que deseas consultar."
        />
      )}

      {record && canSignNote && (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            icon={<PenLine className="h-4 w-4" />}
            onClick={() => setIsNoteModalOpen(true)}
          >
            Crear nota clinica
          </Button>
        </div>
      )}

      <div className="mt-4 grid gap-3">
        {notes.length === 0 ? (
          <EmptyState title="Sin notas" description="Las notas firmadas apareceran en esta linea de tiempo." />
        ) : (
          notes.map((note) => (
            <article key={note.id} className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold text-ink">{note.note_type}</span>
                <span className="text-xs text-muted">{formatDateTime(note.signed_at)}</span>
              </div>
              <p className="mt-2 text-sm text-ink">{note.content}</p>
              <p className="mt-2 text-xs text-muted">
                {note.authored_by} · Cedula {note.professional_license}
              </p>
            </article>
          ))
        )}
      </div>

      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Nueva nota clinica"
        description="Completa la informacion y firma la nota cuando este lista."
      >
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={form.submit(async (values) => {
            try {
              await onCreateNote(values);
              form.reset({ note_type: values.note_type, content: "" });
              setIsNoteModalOpen(false);
            } catch (error) {
              form.applyServerError(error, "content");
            }
          })}
        >
          <FormField
            label="Tipo de nota"
            as="select"
            registration={form.register("note_type", { required: "Tipo obligatorio." })}
            error={form.formState.errors.note_type}
          >
            {noteTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </FormField>
          <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
            <p className="font-semibold">{doctorAssignment?.doctor_name}</p>
            <p>Cédula {doctorAssignment?.professional_license}</p>
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Contenido clinico"
              as="textarea"
              registration={form.register("content", {
                required: "Contenido obligatorio.",
                minLength: { value: 20, message: "Agrega detalle clinico suficiente." },
              })}
              error={form.formState.errors.content}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:col-span-2 sm:flex sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsNoteModalOpen(false)}>Cancelar</Button>
            <Button type="submit" icon={<PenLine className="h-4 w-4" />} disabled={!record}>Firmar nota</Button>
          </div>
        </form>
      </Modal>
      </div>
        </>
      )}
    </Card>
  );
}
