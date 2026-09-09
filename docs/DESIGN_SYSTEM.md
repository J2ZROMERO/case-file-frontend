# Sistema de diseño

## 1. Principios

Interfaz clínica sobria, legible, consistente y mobile-first. Toda pantalla debe reutilizar primitivas y tokens; evitar
valores aislados en una feature. La interfaz no comunica autorización por sí sola: sólo representa capacidades del API.

## 2. Tipografía

Stack de aplicación actual:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Inter no está empaquetada/importada, así que normalmente se usa la fuente de sistema. Esto evita red externa y mejora
privacidad/rendimiento. La receta usa Arial/Helvetica para previsibilidad de impresión y `Georgia` sólo para el símbolo
Rx. Pesos predominantes: 400 texto, 500 etiquetas, 600 controles/títulos, 700 título principal.

Escala observada: 11–12 px para metadatos, 14 px texto compacto, 16 px controles móviles, 18 px sección, 20–24 px
títulos. Para accesibilidad, no añadir tamaños menores y preferir `rem` sobre `px` fuera de artefactos de impresión.

## 3. Color y tokens actuales

| Token | Valor | Uso |
|---|---|---|
| `brand-50` | `#eef8f6` | fondo suave |
| `brand-100` | `#d4eee9` | focus ring |
| `brand-500` | `#1c8f84` | acento |
| `brand-600` | `#14736c` | acción primaria |
| `brand-700` | `#105d58` | hover/énfasis |
| `ink` | `#172026` | texto principal |
| `muted` | `#65747d` | texto secundario |
| `surface` | `#f6f8f9` | fondo de aplicación |
| `shadow-soft` | `0 10px 30px rgba(23,32,38,.08)` | elevación de Card |

También se usan escalas Slate y Red de Tailwind. Para modo oscuro deben convertirse en tokens semánticos, no invertir
colores dentro de cada componente.

## 4. Geometría y layout

- Contenedor `page-shell`: máximo `7xl`, padding 12/24/32 px y espacio vertical 16/20 px.
- Touch targets: `min-h-11` o `min-h-12` (44–48 px).
- Radio: 8 px controles/botones, 12 px cards.
- Sidebar de 260 px en desktop; navegación inferior desplazable en móvil.
- Breakpoints Tailwind estándar; corte principal `lg`, adaptación móvil por debajo de `640px`.
- Tablas `.responsive-table`: tabla desktop y tarjetas con `data-label` móvil.

## 5. Componentes base

- `Button`: variantes primary/secondary/ghost, icono, disabled y focus común.
- `Card`: superficie, borde, padding y sombra.
- `FormField`: etiqueta, input/textarea/select y mensaje de error.
- `Modal`: diálogo reutilizable (debe auditarse focus trap/aria).
- `Tabs`: navegación local por opciones.
- `Toast`: mensajes globales.
- `GlobalLoader`: bloqueo visual de acción en progreso.
- `EmptyState`: ausencia de datos con lenguaje consistente.
- `AppShell`: navegación y estructura responsiva.
- `WorkContextHeader`: clínica, usuario y paciente/expediente activo.

Regla: antes de crear una clase repetida en una feature, extender una primitiva o token. Las excepciones de receta se
permiten porque es un documento imprimible con medidas físicas.

## 6. Tamaño de letra global

Para permitir “normal/grande/muy grande” sin romper pantallas:

1. Definir `--font-scale: 1` en `:root` y `html { font-size: calc(100% * var(--font-scale)); }`.
2. Guardar sólo la preferencia no sensible (`1`, `1.125`, `1.25`).
3. Usar `rem`, layout flexible, `minmax(0,1fr)`, wrap y alturas mínimas, nunca alturas fijas.
4. Probar 200% de zoom y 320 CSS px.
5. Mantener receta con escala de impresión propia; no heredar preferencia si altera formato legal.

El código ya usa mayormente unidades Tailwind relativas y layout flexible, por lo que es viable; los tamaños `px` de
receta y algunos metadatos deben permanecer limitados a impresión o migrarse.

## 7. Modo claro/oscuro

Estado actual: sólo claro. Implementación recomendada:

1. Declarar variables semánticas `--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`,
   `--color-primary`, `--color-focus`, `--color-danger`.
2. Mapear Tailwind a `rgb(var(--...)/<alpha-value>)`.
3. Definir `[data-theme="dark"]` y usar `color-scheme: dark`.
4. Preferir sistema con `prefers-color-scheme`, permitiendo override local.
5. Cambiar primitivas base; eliminar `bg-white/text-slate-*` directos en features progresivamente.
6. Mantener receta forzada a fondo blanco y texto negro en `@media print`.
7. Verificar contraste WCAG AA, focus, gráficos/calendario e imágenes.

Hoy no basta activar `darkMode: 'class'`: existen colores literales/directos en componentes y CSS de receta.

## 8. Accesibilidad

Ya existen labels envolventes, controles heredando fuente, focus visible y touch targets. Faltan pruebas/evidencia de:

- orden de tabulación y focus al abrir/cerrar modal;
- `role=dialog`, `aria-modal`, nombre accesible y escape;
- toast/loading con `aria-live`/`aria-busy`;
- navegación activa con `aria-current`;
- nombres para botones sólo icono;
- contraste, lectores de pantalla, reducción de movimiento y zoom 200%;
- encabezados/labels adecuados de tablas responsivas.

## 9. Checklist de una pantalla nueva

- Usa `page-shell`, Card, Button y FormField existentes.
- Tiene estados loading, vacío, error, éxito y permiso denegado.
- Funciona teclado/móvil/zoom, texto largo y datos vacíos.
- No codifica color/tipografía si existe token.
- No guarda datos clínicos o tokens en storage/logs.
- No confía en visibilidad para autorización.
- Incluye prueba y actualiza documentación si introduce patrón nuevo.
