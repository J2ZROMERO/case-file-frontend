# Seguridad del cliente y exportación de archivos

## 1. Sesión y datos

La sesión del personal se mantiene en memoria de React y desaparece al recargar/cerrar. El portal guarda su JWT en
`sessionStorage`; esto limita persistencia a la pestaña, pero cualquier XSS en el origen podría leerlo. La CSP impide
scripts externos/inline no autorizados y React escapa texto por defecto; no se usa `dangerouslySetInnerHTML`.

No deben almacenarse pacientes, notas, recetas, contraseñas o JWT en `localStorage`, logs, analytics o cachés de service
worker. Para despliegue remoto se prefiere cookie HttpOnly/Secure/SameSite y una estrategia CSRF documentada.

## 2. Confianza

- React y validación de formulario son experiencia; el backend vuelve a validar todo.
- Roles en navegación no autorizan: cada endpoint aplica tenant/rol/relación.
- `VITE_*` es público dentro del bundle; nunca contiene secretos.
- Imágenes data URL deben considerarse datos clínicos sensibles.
- URLs de invitación contienen secreto de un solo uso: compartir por canal seguro y no registrar query strings.

## 3. Exportaciones existentes

### Agenda iCalendar

`AppointmentPanel` genera un `.ics` en el navegador con Blob, crea una URL temporal, simula descarga y revoca la URL.
Incluye datos de agenda, por lo que el archivo debe tratarse como sensible. Pendientes: escaping RFC 5545 completo,
timezone/VTIMEZONE, UID estable, CRLF/folding, clasificación y auditoría de la exportación.

### Receta

`PrescriptionSheet` renderiza la instantánea firmada y `window.print()` permite imprimir o “Guardar como PDF”. CSS
`@media print` oculta el resto, fuerza carta 8.5×11 pulgadas, fondo blanco y medidas físicas.

Esto no crea un PDF firmado ni garantiza render idéntico entre navegadores. Para exportación clínica formal se requiere
generación server-side determinista, hash, folio, zona/fecha, versión de plantilla, firma/sello cuando aplique, auditoría
del evento y pruebas visuales.

### No implementado

- Expediente completo PDF/ZIP y resumen clínico.
- Consentimiento PDF con evidencia de firma.
- CSV de pacientes/auditoría.
- Portabilidad/interoperabilidad FHIR.
- Exportación ARCO y paquete de evidencia.

## 4. Patrón para nuevas exportaciones

1. Autorizar en backend por tenant, rol, relación y propósito.
2. Crear un caso de uso `RequestExport` neutral y registrar solicitud/resultado.
3. Obtener snapshot consistente y minimizar campos.
4. Para archivos grandes, job asíncrono + object storage cifrado.
5. Generar formato determinista; hash SHA-256, metadata, versión y expiración.
6. Entregar mediante descarga autenticada/URL efímera, `Content-Disposition` seguro y `nosniff`.
7. Revocar/eliminar según retención y registrar descarga.
8. Probar permisos cruzados, inyección en CSV, nombres de archivo, tamaño, unicode y render.

Nunca construir nombres de archivo con entrada sin sanear ni incluir fórmulas ejecutables en CSV (`=`, `+`, `-`, `@`).

## 5. Error y resiliencia

El cliente normaliza errores HTTP y asigna validaciones a campos. Pendientes: ErrorBoundary global, pantalla “servidor
no disponible”, timeout/cancelación con AbortController, retry sólo en operaciones idempotentes, correlación request-id
y manejo explícito de chunks obsoletos tras actualización.
