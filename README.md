# Medical Case File Frontend

Proyecto frontend independiente. Tiene su propio versionado de Node/npm, dependencias, scripts, build y tracking de git.

## Stack

```txt
React
TypeScript
Vite
Tailwind
react-hook-form
lucide-react
```

## Versionado Del Entorno

El entorno recomendado queda fijado por proyecto:

```txt
.nvmrc          Node para nvm/nvm-windows
.node-version  Node para fnm/asdf/mise
package.json   packageManager, engines y volta
package-lock.json
```

Versiones esperadas:

```txt
Node: 22.12.0
npm:  10.9.0
```

## Instalar Node/npm Recomendado

Con nvm-windows:

```powershell
nvm install 22.12.0
nvm use 22.12.0
node -v
npm -v
```

Con Git Bash, despues de instalar nvm-windows:

```bash
nvm install 22.12.0
nvm use 22.12.0
node -v
npm -v
```

Con Volta:

```bash
volta install node@22.12.0 npm@10.9.0
```

## Instalar Dependencias

Para desarrollo:

```bash
npm install
```

Para CI/deploy o instalacion reproducible:

```bash
npm ci
```

## Ejecutar App

PowerShell:

```powershell
cd C:\Users\Jose-\OneDrive\Desktop\medical_case_file\frontend
npm run dev
```

CMD:

```bat
cd C:\Users\Jose-\OneDrive\Desktop\medical_case_file\frontend
npm run dev
```

Git Bash:

```bash
cd "/c/Users/Jose-/OneDrive/Desktop/medical_case_file/frontend"
npm run dev
```

URL:

```txt
http://127.0.0.1:5173
```

## Build

```bash
npm run build
```

## Respuestas Y Formularios

El frontend usa un contrato unico para leer respuestas:

```ts
{
  status: "success" | "error",
  message: "Mensaje claro para el usuario",
  data: {}
}
```

Cuando una accion sale bien, el formulario limpia sus campos y muestra un toast global. Cuando falla por datos del formulario, el error aparece debajo del campo correspondiente usando `react-hook-form`; no se muestra como error global.

## Deploy

Comando recomendado para deploy:

```bash
npm ci
npm run build
```

El artefacto queda en:

```txt
dist/
```

## Nota Sobre npm Global

Este proyecto no versiona una copia de npm dentro del repositorio. El versionado correcto se declara con:

```txt
.nvmrc
.node-version
packageManager
engines
volta
package-lock.json
```

Cada maquina o pipeline debe instalar la version indicada de Node/npm y ejecutar:

```bash
npm ci
npm run build
```

Esto es mas portable para deploy que guardar npm dentro del proyecto.

## Git

Inicializar tracking solo del frontend:

```bash
cd "/c/Users/Jose-/OneDrive/Desktop/medical_case_file/frontend"
git init
git add .
git commit -m "Initial frontend"
```

## Documentación técnica

- `docs/ARCHITECTURE.md`: capas, estado, dependencias y sustitución de framework/kit.
- `docs/DESIGN_SYSTEM.md`: estilos, tipografía, tokens, componentes, accesibilidad, tamaño de letra y dark mode.
- `docs/SECURITY_AND_EXPORTS.md`: sesión, confianza, impresión, iCalendar y patrón de exportación segura.
