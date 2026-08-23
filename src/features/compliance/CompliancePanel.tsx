import { useState } from "react";
import { FileCheck2, Pill, Plus, RefreshCw } from "lucide-react";

import { Button, Card, EmptyState, FormField, Modal } from "../../components/ui";
import { useAppForm } from "../../hooks";
import { formatDateTime } from "../../lib";
import type { Consent, Prescription } from "../../types";

type CompliancePanelProps = {
  selectedPatientId: string;
  consents: Consent[];
  prescriptions: Prescription[];
  onCreateConsent: (payload: Record<string, unknown>) => Promise<void>;
  onCreatePrescription: (payload: Record<string, unknown>) => Promise<void>;
  onRefresh: () => Promise<void>;
};

type ConsentForm = {
  title: string;
  content: string;
  signed_by: string;
  witness_name: string;
};

type PrescriptionForm = {
  diagnosis: string;
  medication: string;
  indications: string;
  prescribed_by: string;
  professional_license: string;
};

export function CompliancePanel({
  selectedPatientId,
  consents,
  prescriptions,
  onCreateConsent,
  onCreatePrescription,
  onRefresh,
}: CompliancePanelProps) {
  const [activeModal, setActiveModal] = useState<"consent" | "prescription" | null>(null);
  const consentForm = useAppForm<ConsentForm>({
    defaultValues: {
      title: "Consentimiento informado",
      content: "El paciente recibe informacion suficiente sobre riesgos, beneficios y alternativas.",
      signed_by: "Paciente",
      witness_name: "",
    },
  });
  const prescriptionForm = useAppForm<PrescriptionForm>({
    defaultValues: {
      diagnosis: "Diagnostico clinico",
      medication: "Medicamento, dosis y presentacion",
      indications: "Indicaciones terapeuticas completas.",
      prescribed_by: "Dra. Maria Ruiz",
      professional_license: "1234567",
    },
  });

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title">Documentos clinicos</h2>
            <p className="text-sm text-muted">Consulta los documentos disponibles y crea uno solo cuando lo necesites.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={onRefresh}
            disabled={!selectedPatientId}
          >
            Actualizar documentos
          </Button>
        </div>

        {!selectedPatientId && (
          <div className="mt-4">
            <EmptyState title="Selecciona un paciente" description="Elige un paciente para consultar o crear sus documentos." />
          </div>
        )}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Consentimientos</h2>
              <p className="text-sm text-muted">Documentos firmados y auditables.</p>
            </div>
            <Button
              type="button"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setActiveModal("consent")}
              disabled={!selectedPatientId}
            >
              Agregar
            </Button>
          </div>
          <div className="grid gap-2">
          {consents.length === 0 ? (
            <EmptyState title="Sin consentimientos" description="Los consentimientos firmados apareceran aqui." />
          ) : (
            consents.map((item) => (
              <div key={item.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="text-muted">{item.signed_by} · {formatDateTime(item.signed_at)}</p>
              </div>
            ))
          )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Recetas</h2>
              <p className="text-sm text-muted">Prescripciones firmadas por el profesional.</p>
            </div>
            <Button
              type="button"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setActiveModal("prescription")}
              disabled={!selectedPatientId}
            >
              Agregar
            </Button>
          </div>
          <div className="grid gap-2">
            {prescriptions.length === 0 ? (
              <EmptyState title="Sin recetas" description="Las recetas firmadas apareceran aqui." />
            ) : (
              prescriptions.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-ink">{item.diagnosis}</p>
                  <p className="text-muted">{item.medication} · {formatDateTime(item.signed_at)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={activeModal === "consent"}
        onClose={() => setActiveModal(null)}
        title="Nuevo consentimiento"
        description="Registra la informacion y firma el consentimiento."
      >
        <form
          className="grid gap-3"
          onSubmit={consentForm.submit(async (values) => {
            try {
              await onCreateConsent({
                ...values,
                patient_id: selectedPatientId,
                witness_name: values.witness_name || null,
              });
              consentForm.reset({ title: "", content: "", signed_by: "", witness_name: "" });
              setActiveModal(null);
            } catch (error) {
              consentForm.applyServerError(error, "content");
            }
          })}
        >
          <FormField label="Titulo" registration={consentForm.register("title", { required: "Titulo obligatorio." })} error={consentForm.formState.errors.title} />
          <FormField
            label="Contenido"
            as="textarea"
            registration={consentForm.register("content", {
              required: "Contenido obligatorio.",
              minLength: { value: 20, message: "Detalle insuficiente." },
            })}
            error={consentForm.formState.errors.content}
          />
          <FormField label="Firma de" registration={consentForm.register("signed_by", { required: "Firma obligatoria." })} error={consentForm.formState.errors.signed_by} />
          <FormField label="Testigo" registration={consentForm.register("witness_name")} error={consentForm.formState.errors.witness_name} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button type="submit" icon={<FileCheck2 className="h-4 w-4" />} disabled={!selectedPatientId}>Firmar consentimiento</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === "prescription"}
        onClose={() => setActiveModal(null)}
        title="Nueva receta"
        description="Captura la prescripcion y los datos del profesional."
      >
        <form
          className="grid gap-3"
          onSubmit={prescriptionForm.submit(async (values) => {
            try {
              await onCreatePrescription({ ...values, patient_id: selectedPatientId });
              prescriptionForm.reset({
                diagnosis: "",
                medication: "",
                indications: "",
                prescribed_by: values.prescribed_by,
                professional_license: values.professional_license,
              });
              setActiveModal(null);
            } catch (error) {
              prescriptionForm.applyServerError(error, "diagnosis");
            }
          })}
        >
          <FormField
            label="Diagnostico"
            registration={prescriptionForm.register("diagnosis", { required: "Diagnostico obligatorio." })}
            error={prescriptionForm.formState.errors.diagnosis}
          />
          <FormField
            label="Medicamento"
            as="textarea"
            registration={prescriptionForm.register("medication", { required: "Medicamento obligatorio." })}
            error={prescriptionForm.formState.errors.medication}
          />
          <FormField
            label="Indicaciones"
            as="textarea"
            registration={prescriptionForm.register("indications", { required: "Indicaciones obligatorias." })}
            error={prescriptionForm.formState.errors.indications}
          />
          <FormField
            label="Medico"
            registration={prescriptionForm.register("prescribed_by", { required: "Medico obligatorio." })}
            error={prescriptionForm.formState.errors.prescribed_by}
          />
          <FormField
            label="Cedula"
            registration={prescriptionForm.register("professional_license", { required: "Cedula obligatoria." })}
            error={prescriptionForm.formState.errors.professional_license}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button type="submit" icon={<Pill className="h-4 w-4" />} disabled={!selectedPatientId}>Firmar receta</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
