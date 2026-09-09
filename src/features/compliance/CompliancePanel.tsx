import { useState } from "react";
import { Eye, FileCheck2, ImageUp, Pill, Plus, Printer, RefreshCw } from "lucide-react";

import { Button, Card, EmptyState, FormField, Modal } from "../../components/ui";
import { useAppForm } from "../../hooks";
import { formatDateTime } from "../../lib";
import type { Consent, Prescription } from "../../types";
import { PrescriptionSheet } from "./PrescriptionSheet";

type CompliancePanelProps = {
  selectedPatientId: string;
  consents: Consent[];
  prescriptions: Prescription[];
  onCreateConsent: (payload: Record<string, unknown>) => Promise<void>;
  onCreatePrescription: (payload: Record<string, unknown>) => Promise<void>;
  onRefresh: () => Promise<void>;
  canPrescribe: boolean;
};

type ConsentForm = {
  title: string;
  content: string;
  signed_by: string;
  witness_name: string;
};

type PrescriptionForm = {
  source_type: "text" | "image";
  prescription_text: string;
};

export function CompliancePanel({
  selectedPatientId,
  consents,
  prescriptions,
  onCreateConsent,
  onCreatePrescription,
  onRefresh,
  canPrescribe,
}: CompliancePanelProps) {
  const [activeModal, setActiveModal] = useState<"consent" | "prescription" | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionError, setPrescriptionError] = useState("");
  const [prescriptionImage, setPrescriptionImage] = useState<{ name: string; dataUrl: string } | null>(null);
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
      source_type: "text",
      prescription_text: "",
    },
  });
  const prescriptionSource = prescriptionForm.watch("source_type");

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
              <p className="text-sm text-muted">Documentos firmados por el paciente.</p>
            </div>
            {canPrescribe ? <Button
              type="button"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setActiveModal("consent")}
              disabled={!selectedPatientId}
            >
              Agregar
            </Button> : null}
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
              <p className="text-sm text-muted">Expide, consulta e imprime las recetas del paciente.</p>
            </div>
            <Button
              type="button"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => { setPrescriptionError(""); setActiveModal("prescription"); }}
              disabled={!selectedPatientId || !canPrescribe}
            >
              Nueva receta
            </Button>
          </div>
          {!selectedPatientId ? (
            <p className="mb-3 rounded-lg bg-slate-50 p-3 text-sm text-muted">Selecciona un paciente para consultar o expedir sus recetas.</p>
          ) : !canPrescribe ? (
            <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Solo el médico asignado a este expediente puede expedir una receta. Administración puede consultarla e imprimirla después de que el médico la genere.</p>
          ) : null}
          <div className="grid gap-2">
            {prescriptions.length === 0 ? (
              <EmptyState title="Sin recetas" description="Las recetas firmadas apareceran aqui." />
            ) : (
              prescriptions.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{item.document?.source_type === "image"
                      ? `Imagen: ${item.document.image_name ?? "receta adjunta"}`
                      : item.document?.prescription_text
                        ? item.document.prescription_text.slice(0, 100)
                    : item.document?.medications?.length
                      ? `${item.document.medications.length} medicamento${item.document.medications.length === 1 ? "" : "s"}: ${item.document.medications.map((medication) => medication.medication_name).join(", ")}`
                      : item.document?.medication_name ?? item.medication}</p>
                    <p className="text-muted">{item.prescribed_by} · {formatDateTime(item.signed_at)}</p>
                  </div>
                  {item.document ? (
                    <Button type="button" variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={() => setSelectedPrescription(item)}>
                      Ver e imprimir
                    </Button>
                  ) : <span className="text-xs text-muted">Registro anterior sin formato imprimible</span>}
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
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button type="submit" icon={<FileCheck2 className="h-4 w-4" />} disabled={!selectedPatientId}>Firmar consentimiento</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === "prescription"}
        onClose={() => setActiveModal(null)}
        title="Nueva receta ordinaria"
        description="Escribe la receta completa en un solo campo o adjunta una imagen."
      >
        <form
          className="grid gap-3"
          onSubmit={prescriptionForm.submit(async (values) => {
            try {
              setPrescriptionError("");
              await onCreatePrescription({
                patient_id: selectedPatientId,
                source_type: values.source_type,
                prescription_text: values.source_type === "text" ? values.prescription_text : null,
                image_name: values.source_type === "image" ? prescriptionImage?.name : null,
                image_data_url: values.source_type === "image" ? prescriptionImage?.dataUrl : null,
              });
              prescriptionForm.reset({
                source_type: "text",
                prescription_text: "",
              });
              setPrescriptionImage(null);
              setPrescriptionError("");
              setActiveModal(null);
            } catch (error) {
              setPrescriptionError(error instanceof Error ? error.message : "No se pudo expedir la receta. Revisa los campos marcados.");
              prescriptionForm.applyServerError(error, "prescription_text");
            }
          })}
        >
          <FormField
            label="Formato de la receta"
            as="select"
            registration={prescriptionForm.register("source_type", { onChange: () => { setPrescriptionError(""); setPrescriptionImage(null); } })}
          >
            <option value="text">Texto libre</option>
            <option value="image">Imagen</option>
          </FormField>
          {prescriptionSource === "text" ? (
            <FormField
              label="Detalle completo de la receta"
              as="textarea"
              placeholder={'Ejemplo:\nParacetamol 500 mg, tomar una tableta cada 8 horas durante 3 días...'}
              registration={prescriptionForm.register("prescription_text", {
                validate: (value) => prescriptionSource !== "text" || value.trim().length >= 3 || "Escribe el detalle completo de la receta.",
              })}
              error={prescriptionForm.formState.errors.prescription_text}
            />
          ) : (
            <label className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 p-4">
              <span className="field-label">Imagen de la receta</span>
              <input
                className="field-control"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setPrescriptionError("");
                  if (!file) return setPrescriptionImage(null);
                  if (file.size > 5 * 1024 * 1024) {
                    event.target.value = "";
                    setPrescriptionImage(null);
                    return setPrescriptionError("La imagen no puede superar 5 MB.");
                  }
                  const reader = new FileReader();
                  reader.onload = () => setPrescriptionImage({ name: file.name, dataUrl: String(reader.result) });
                  reader.readAsDataURL(file);
                }}
              />
              <span className="text-xs text-muted">JPG, PNG o WebP, máximo 5 MB.</span>
              {prescriptionImage ? <span className="text-sm font-medium text-brand-700"><ImageUp className="mr-1 inline h-4 w-4" />{prescriptionImage.name}</span> : null}
            </label>
          )}
          {prescriptionError ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{prescriptionError} Corrige los campos señalados y vuelve a intentarlo.</p> : null}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button type="submit" icon={<Pill className="h-4 w-4" />} disabled={!selectedPatientId || (prescriptionSource === "image" && !prescriptionImage)}>Guardar receta</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(selectedPrescription)}
        onClose={() => setSelectedPrescription(null)}
        title="Receta lista para imprimir"
        description="Revísala y firma a mano después de imprimirla."
      >
        {selectedPrescription ? (
          <div className="grid gap-4">
            <div className="prescription-print-root overflow-x-auto"><PrescriptionSheet prescription={selectedPrescription} /></div>
            <div className="flex justify-end gap-2 print:hidden">
              <Button type="button" variant="ghost" onClick={() => setSelectedPrescription(null)}>Cerrar</Button>
              <Button type="button" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Imprimir</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
