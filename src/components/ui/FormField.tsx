import { FieldError, UseFormRegisterReturn } from "react-hook-form";

type FormFieldProps = {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  type?: string;
  placeholder?: string;
  as?: "input" | "textarea" | "select";
  children?: React.ReactNode;
};

export function FormField({
  label,
  registration,
  error,
  type = "text",
  placeholder,
  as = "input",
  children,
}: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="field-label">{label}</span>
      {as === "textarea" ? (
        <textarea className="field-control min-h-28 resize-y" placeholder={placeholder} {...registration} />
      ) : as === "select" ? (
        <select className="field-control" {...registration}>
          {children}
        </select>
      ) : (
        <input className="field-control" type={type} placeholder={placeholder} {...registration} />
      )}
      {error ? <span className="field-error">{error.message}</span> : null}
    </label>
  );
}

