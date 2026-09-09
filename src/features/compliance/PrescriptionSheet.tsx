import type { Prescription } from "../../types";

type Props = { prescription: Prescription };

function value(text: string | null | undefined) {
  return text || "—";
}

export function PrescriptionSheet({ prescription }: Props) {
  const document = prescription.document;
  if (!document) return null;
  const issuedAt = new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date(document.issued_at));
  const medications = document.medications?.length ? document.medications : [{
    medication_name: document.medication_name,
    concentration: document.concentration,
    pharmaceutical_form: document.pharmaceutical_form,
    quantity: document.quantity,
    dose: document.dose,
    administration_route: document.administration_route,
    frequency: document.frequency,
    treatment_duration: document.treatment_duration,
    indications: document.indications,
  }];

  return (
    <article className="prescription-sheet bg-white text-slate-950">
      <header className="prescription-sheet__header">
        <div>
          <p className="prescription-sheet__eyebrow">RECETA MÉDICA</p>
          <h1>{document.clinic_name}</h1>
          <p>{value(document.clinic_address)}</p>
          {document.clinic_phone ? <p>Tel. {document.clinic_phone}</p> : null}
        </div>
        <div className="prescription-sheet__folio">
          <span>Folio</span>
          <strong>{document.folio}</strong>
          <span>{issuedAt}</span>
        </div>
      </header>

      <section className="prescription-sheet__patient">
        <div><span>Paciente</span><strong>{document.patient_name}</strong></div>
        <div><span>Fecha de nacimiento</span><strong>{value(document.patient_birth_date)}</strong></div>
      </section>

      <section className="prescription-sheet__diagnosis">
        <span>Detalle de la receta</span>
        {document.source_type === "image" && document.image_data_url ? (
          <img className="mt-3 max-h-[620px] w-full object-contain" src={document.image_data_url} alt={document.image_name ?? "Receta adjunta"} />
        ) : (
          <p className="whitespace-pre-wrap">{document.prescription_text ?? document.diagnosis}</p>
        )}
      </section>

      {!document.source_type ? <div className="prescription-sheet__medications">
        {medications.map((medication, index) => (
          <section className="prescription-sheet__treatment" key={`${medication.medication_name}-${index}`}>
            <p className="prescription-sheet__rx">{index + 1}</p>
            <div>
              <h2>{value(medication.medication_name)}</h2>
              <p>{[medication.concentration, medication.pharmaceutical_form].filter(Boolean).join(" · ")}</p>
              <dl>
                <div><dt>Dosis</dt><dd>{value(medication.dose)}</dd></div>
                <div><dt>Vía</dt><dd>{value(medication.administration_route)}</dd></div>
                <div><dt>Frecuencia</dt><dd>{value(medication.frequency)}</dd></div>
                <div><dt>Duración</dt><dd>{value(medication.treatment_duration)}</dd></div>
                <div><dt>Cantidad a surtir</dt><dd>{value(medication.quantity)}</dd></div>
              </dl>
              <div className="prescription-sheet__instructions"><span>Indicaciones</span><p>{medication.indications}</p></div>
            </div>
          </section>
        ))}
      </div> : null}

      <footer className="prescription-sheet__footer">
        <div className="prescription-sheet__notice">Documento para receta ordinaria. Los medicamentos controlados pueden requerir un recetario especial autorizado.</div>
        <div className="prescription-sheet__signature">
          <div className="prescription-sheet__signature-line" />
          <strong>{document.prescriber_name}</strong>
          <span>{value(document.specialty)}</span>
          <span>Cédula profesional {document.professional_license}</span>
          {document.specialty_license ? <span>Cédula de especialidad {document.specialty_license}</span> : null}
          <span>Firma autógrafa</span>
        </div>
      </footer>
    </article>
  );
}
