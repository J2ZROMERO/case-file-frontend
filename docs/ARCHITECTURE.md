# Arquitectura técnica del frontend

## 1. Clasificación

Aplicación SPA React + TypeScript construida con Vite. Su estructura es **feature-first** con una biblioteca UI común,
un cliente HTTP central y tipos compartidos. React es un adaptador de presentación; las reglas de autorización y
cumplimiento permanecen en el backend.

No es todavía un frontend hexagonal completo: `App.tsx` funciona como composition root, controlador de flujo y store
en memoria; las features reciben callbacks, pero varios payloads usan `Record<string, unknown>` y el cliente HTTP es
concreto. Esto permite cambiar componentes visuales con facilidad, pero cambiar React requiere extraer modelos de
vista, puertos y controladores neutrales.

## 2. Orden de dependencias

```text
types (contratos de datos)
  ↑
lib (API, formato) + hooks (estado transversal)
  ↑
components/ui (primitivas visuales)
  ↑
features (casos de interacción por capacidad)
  ↑
app/App.tsx (composición, sesión y navegación)
  ↑
main.tsx (bootstrap React y selección app/portal)
```

Las features pueden usar `ui`, hooks, lib y types; `ui` no debe importar features. El backend es la autoridad. El
frontend valida para experiencia, no para seguridad.

## 3. Directorios

- `src/app`: composición, sesión, selección de tenant/paciente y coordinación.
- `src/features`: auth, pacientes, personal, clínicas, expediente, documentos, agenda, auditoría y portal.
- `src/components/ui`: Button, Card, FormField, Modal, Tabs, Toast, loader y estado vacío.
- `src/components/layout`: shell responsivo y contexto de trabajo.
- `src/hooks`: formulario estándar y acciones asíncronas.
- `src/lib/api.ts`: único gateway HTTP y normalización de envelope/errores.
- `src/lib/format.ts`: presentación de fechas.
- `src/types`: contrato TypeScript de API.
- `src/styles.css` y `tailwind.config.js`: tokens y reglas globales.

Los `index.ts` son barrels para que consumidores dependan de la interfaz pública de cada carpeta, no de rutas internas.

## 4. Estado y flujo

`App` mantiene sesión y datos en memoria; al seleccionar clínica obtiene pacientes y, según rol, personal, médicos,
citas y clínicas administradas. Cada feature recibe datos y callbacks. `useAsyncAction` centraliza loading/error;
`useAppForm` traduce `ApiRequestError.fieldErrors` a errores de `react-hook-form`; `ToastProvider` comunica éxito/error.

La sesión del personal no se persiste: recargar obliga a iniciar sesión, reduciendo persistencia de token. El portal sí
usa `sessionStorage` para sobrevivir navegación dentro de la pestaña. Véase `SECURITY_AND_EXPORTS.md`.

## 5. API y empaquetado

- Desarrollo: si la página corre en `5173`, el cliente usa `http://127.0.0.1:8000`.
- Distribución: usa `window.location.origin`, por lo que portable funciona en `8765` y certificado en `8000`.
- `VITE_API_BASE_URL` permite un adaptador remoto explícito.
- Todas las llamadas agregan JSON, `X-Response-Envelope`, Bearer y `X-Tenant-ID` cuando corresponda.
- El envelope se normaliza y errores Pydantic se asignan a campos.

Este cambio de mismo-origen elimina la incompatibilidad que provocaba que el portable sirviera UI en `8765` mientras
el JavaScript buscaba la API en `8000`.

## 6. Técnicas implementadas

- Component composition, props/callbacks y separación container/presentation parcial.
- Feature folders y public API mediante barrel exports.
- TypeScript para contratos y un discriminated union del envelope.
- Lazy loading/Suspense para aplicación, portal y agenda.
- Controlled/uncontrolled forms con react-hook-form y validación inmediata.
- Promise.all para cargas independientes posteriores al login.
- Progressive disclosure por rol y contexto clínico.
- Responsive design mobile-first y tablas convertidas en tarjetas.
- Print stylesheet aislado para receta tamaño carta.
- Exportación cliente iCalendar con Blob/Object URL.

## 7. Qué cambiar para sustituir React o el kit UI

### Cambiar Tailwind/kit de componentes

Mantener las props públicas de `components/ui` y reimplementar internamente Button/Card/FormField/Modal/Tabs/Toast.
Migrar primero todas las clases repetidas a esas primitivas. No cambiar features ni API.

### Cambiar React

1. Extraer interfaces `AuthGateway`, `PatientGateway`, etc. desde `lib/api.ts`.
2. Extraer modelos/controladores de flujo sin hooks ni JSX.
3. Sustituir `Record<string, unknown>` por comandos tipados.
4. Mover selección/sesión a un store neutral o state machine testeable.
5. Crear adaptador Vue/Svelte/Angular que consuma esos controladores y tokens visuales.

Hoy el contrato HTTP/types es reutilizable; la orquestación de `App.tsx` todavía depende de hooks React.

## 8. Deuda y mejoras

- Dividir `App.tsx` en session/tenant/patient controllers o reducers.
- Generar tipos/cliente desde OpenAPI para evitar deriva manual.
- Agregar routing real y guards; hoy la vista activa es estado local.
- Error boundary para fallos de chunks/render y pantalla de diagnóstico.
- Tests unitarios de hooks/componentes, contract tests y E2E Playwright.
- Accesibilidad automatizada/manual: teclado, focus trap, aria-live, contraste y zoom 200%.
- Internacionalización; textos están embebidos en español.
- State machine para flujos de login, selección y documentos.
- Paginación/virtualización para datos grandes.
