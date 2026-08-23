import { KeyRound, UserPlus } from "lucide-react";
import { useState } from "react";

import { Button, Card, FormField, Tabs } from "../../components/ui";
import { useAppForm } from "../../hooks";

type AuthPanelProps = {
  tenantId: string;
  isAuthenticated: boolean;
  onRegister: (payload: Record<string, unknown>) => Promise<void>;
  onLogin: (payload: { tenant_id: string; email: string; password: string }) => Promise<void>;
};

type RegisterForm = {
  email: string;
  full_name: string;
  password: string;
  confirm_password: string;
  role: string;
};

type LoginForm = {
  email: string;
  password: string;
};

export function AuthPanel({ tenantId, isAuthenticated, onRegister, onLogin }: AuthPanelProps) {
  const [activeTab, setActiveTab] = useState("login");
  const registerForm = useAppForm<RegisterForm>({
    defaultValues: {
      email: "admin@clinica.test",
      full_name: "Admin Clinico",
      password: "Password123",
      confirm_password: "Password123",
      role: "tenant_admin",
    },
  });
  const loginForm = useAppForm<LoginForm>({
    defaultValues: { email: "admin@clinica.test", password: "Password123" },
  });

  return (
    <Card>
      <div className="mb-4">
        <h2 className="section-title">Usuarios y acceso</h2>
        <p className="text-sm text-muted">Crea una persona autorizada o entra para empezar a trabajar.</p>
      </div>

      <Tabs
        activeId={activeTab}
        onChange={setActiveTab}
        items={[
          { id: "login", label: "Iniciar sesion" },
          { id: "register", label: "Crear usuario" },
        ]}
      />

      {activeTab === "register" ? (
        <form
          className="mt-4 grid gap-3"
          onSubmit={registerForm.submit(async (values) => {
            try {
              const { confirm_password: _confirmPassword, ...payload } = values;
              await onRegister({ ...payload, tenant_id: tenantId });
              registerForm.reset({
                email: "",
                full_name: "",
                password: "",
                confirm_password: "",
                role: values.role,
              });
            } catch (error) {
              registerForm.applyServerError(error, "email");
            }
          })}
        >
          <FormField
            label="Email"
            type="email"
            registration={registerForm.register("email", { required: "Email obligatorio." })}
            error={registerForm.formState.errors.email}
          />
          <FormField
            label="Nombre completo"
            registration={registerForm.register("full_name", { required: "Nombre obligatorio." })}
            error={registerForm.formState.errors.full_name}
          />
          <FormField
            label="Password"
            type="password"
            registration={registerForm.register("password", {
              required: "Password obligatorio.",
              minLength: { value: 8, message: "Minimo 8 caracteres." },
            })}
            error={registerForm.formState.errors.password}
          />
          <FormField
            label="Confirmar password"
            type="password"
            registration={registerForm.register("confirm_password", {
              required: "Confirma el password.",
              validate: (value) =>
                value === registerForm.watch("password") || "Los passwords no coinciden.",
            })}
            error={registerForm.formState.errors.confirm_password}
          />
          <FormField label="Rol" as="select" registration={registerForm.register("role")}>
            <option value="tenant_admin">Administrador</option>
            <option value="doctor">Medico</option>
            <option value="nurse">Enfermeria</option>
            <option value="reception">Recepcion</option>
            <option value="auditor">Auditor</option>
          </FormField>
          <Button type="submit" icon={<UserPlus className="h-4 w-4" />} disabled={!tenantId}>
            Crear usuario
          </Button>
        </form>
      ) : (
        <form
          className="mt-4 grid gap-3"
          onSubmit={loginForm.submit(async (values) => {
            try {
              await onLogin({ ...values, tenant_id: tenantId });
              loginForm.reset({ email: "", password: "" });
            } catch (error) {
              loginForm.applyServerError(error, "password");
            }
          })}
        >
          <FormField
            label="Email"
            type="email"
            registration={loginForm.register("email", { required: "Email obligatorio." })}
            error={loginForm.formState.errors.email}
          />
          <FormField
            label="Password"
            type="password"
            registration={loginForm.register("password", { required: "Password obligatorio." })}
            error={loginForm.formState.errors.password}
          />
          <Button type="submit" icon={<KeyRound className="h-4 w-4" />} disabled={!tenantId}>
            Entrar
          </Button>
          {isAuthenticated ? (
            <p className="rounded-md bg-brand-50 p-3 text-sm font-semibold text-brand-700">
              Sesion activa. Ya puedes trabajar con pacientes y expedientes.
            </p>
          ) : null}
        </form>
      )}
    </Card>
  );
}
