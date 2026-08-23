import { FieldPath, FieldValues, SubmitHandler, useForm, UseFormProps } from "react-hook-form";

import { ApiRequestError } from "../lib";

export function useAppForm<T extends FieldValues>(options?: UseFormProps<T>) {
  const form = useForm<T>({ mode: "onBlur", ...options });

  const submit =
    (handler: SubmitHandler<T>) =>
    (event?: React.BaseSyntheticEvent): Promise<void> =>
      form.handleSubmit(handler)(event);

  const applyServerError = (error: unknown, fallbackField?: FieldPath<T>) => {
    if (error instanceof ApiRequestError) {
      const entries = Object.entries(error.fieldErrors);
      entries.forEach(([field, message]) => {
        form.setError(field as FieldPath<T>, { message });
      });
      if (entries.length === 0 && fallbackField) {
        form.setError(fallbackField, { message: error.message });
      }
      return;
    }

    if (fallbackField) {
      form.setError(fallbackField, {
        message: error instanceof Error ? error.message : "Ocurrio un error inesperado.",
      });
    }
  };

  return { ...form, submit, applyServerError };
}
