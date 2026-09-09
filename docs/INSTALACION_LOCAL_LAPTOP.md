# Instalación local desde los dos repositorios

Windows de 64 bits. Ejecuta los comandos en PowerShell, en este orden. Continúa al siguiente bloque solo si el anterior termina sin errores. No necesitas EXE propio, ZIP de la aplicación, Docker ni PostgreSQL.

## 1. Instalar herramientas

Instala Python, Node.js y Git y después abre una nueva ventana de PowerShell.

- [Python 3.12.10 para Windows x64](https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe): marca **Add Python to PATH**.
- [Node.js 22.12.0 para Windows x64](https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi): incluye npm.
- [Git para Windows](https://git-scm.com/install/windows).

Estas son las versiones de referencia del empaquetado y del frontend actuales; no son una afirmación de que sean las versiones más recientes.

Comprueba:

```powershell
py -3.12 --version
node --version
npm.cmd --version
git --version
```

## 2. Clonar los repositorios por separado

Sustituye las dos URL de ejemplo por las direcciones reales de tus repositorios. Git te pedirá autenticarte si son privados; no pongas contraseñas en los comandos.

```powershell
New-Item -ItemType Directory -Force C:\ExpedienteClinico
Set-Location C:\ExpedienteClinico
git clone URL_DEL_REPOSITORIO_BACKEND back
git clone URL_DEL_REPOSITORIO_FRONTEND front
```

La estructura que usaremos es:

```text
C:\ExpedienteClinico\
  back\       Repositorio del backend
  front\      Repositorio del frontend
  frontend\   Interfaz compilada, generada en el paso 4
  datos\      Base de datos, clave local, registros y respaldos
```

Los repositorios siguen siendo independientes. El nombre `frontend` se reserva para la interfaz compilada porque el backend actual busca esa carpeta junto a su propio repositorio. No clones el código fuente allí para esta instalación.

## 3. Instalar dependencias del backend

```powershell
Set-Location C:\ExpedienteClinico\back
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

No necesitas activar el entorno virtual: los comandos usan directamente su Python.

## 4. Instalar y compilar el frontend

```powershell
Set-Location C:\ExpedienteClinico\front
npm.cmd ci
$env:VITE_API_BASE_URL = 'http://127.0.0.1:8000'
npm.cmd run build
```

Si la compilación termina correctamente, copia sus archivos a la carpeta que sirve el backend:

```powershell
New-Item -ItemType Directory -Force C:\ExpedienteClinico\frontend
Copy-Item -Path C:\ExpedienteClinico\front\dist\* -Destination C:\ExpedienteClinico\frontend -Recurse -Force
```

La variable anterior se incorpora a la compilación. No contiene contraseñas. No hace falta dejar Node ejecutándose: el backend servirá estos archivos.

## 5. Configurar credenciales y arrancar la aplicación local

Se prepararon dos archivos privados en el backend de la computadora actual:

- `.env.instalacion`: contiene una `SECRET_KEY` aleatoria para firmar sesiones.
- `credenciales-instalacion.txt`: contiene la contraseña generada para tu futura cuenta administradora.

Ambos están excluidos de Git: **no llegarán al clonar**. Cópialos por separado a la carpeta `back` de la laptop. Antes del primer arranque, ejecuta:

```powershell
Set-Location C:\ExpedienteClinico\back
Copy-Item -LiteralPath .env.instalacion -Destination .env
```

Hazlo una sola vez en la instalación nueva; no reemplaces un `.env` existente durante actualizaciones sin revisar su contenido. El backend carga `.env` al ejecutarse desde `back`. Nunca copies estos secretos al frontend ni a variables `VITE_*`.

La contraseña del administrador se introduce manualmente en la pantalla inicial, usando el archivo privado como referencia. No hay una variable `ADMIN_PASSWORD`: la aplicación guarda un hash cuando creas la cuenta. Los demás usuarios tendrán las contraseñas que les asignes al registrarlos. SQLite no usa contraseña de conexión y `SECRET_KEY` no cifra el archivo de base de datos.

```powershell
Set-Location C:\ExpedienteClinico\back
$env:EXPEDIENTE_CLINICO_DATA_DIR = 'C:\ExpedienteClinico\datos'
$env:HOST = '127.0.0.1'
$env:PORT = '8000'
$env:DATABASE_URL = ''
.\.venv\Scripts\python.exe -m app.runtime
```

Deja esa ventana abierta para esta primera comprobación y abre [la aplicación](http://127.0.0.1:8000). Puedes comprobar el proceso en [health](http://127.0.0.1:8000/health).

En una instalación nueva aparece el formulario para crear la clínica y la cuenta administradora. **Tú escribirás el correo y la contraseña generada en ese momento.** No hay contraseñas prellenadas en esta guía. SQLite no necesita usuario ni contraseña de servidor. La aplicación utilizará la clave interna del `.env` que acabas de copiar; si no configuras `SECRET_KEY`, genera una automáticamente en `.secret-key` dentro de la carpeta de datos.

Usamos el frontend compilado y el runtime sin recarga de desarrollo. Solo queda un proceso servidor local; no debes ejecutar `npm run dev` ni `npm run preview` para el uso diario.

## 6. Dejar el inicio automático

Después de comprobar que funciona, detén el arranque manual con **Ctrl+C** en su ventana.

Ejecuta este bloque una sola vez para crear el archivo de arranque:

```powershell
@"
@echo off
set "EXPEDIENTE_CLINICO_DATA_DIR=C:\ExpedienteClinico\datos"
set "HOST=127.0.0.1"
set "PORT=8000"
set "DATABASE_URL="
cd /d "C:\ExpedienteClinico\back"
start "" "C:\ExpedienteClinico\back\.venv\Scripts\pythonw.exe" -m app.runtime
"@ | Set-Content -LiteralPath C:\ExpedienteClinico\Iniciar.cmd -Encoding ascii

$inicioWindows = [Environment]::GetFolderPath('Startup')
Copy-Item -LiteralPath C:\ExpedienteClinico\Iniciar.cmd -Destination (Join-Path $inicioWindows 'ExpedienteClinico.cmd') -Force
```

Ejecuta `C:\ExpedienteClinico\Iniciar.cmd` una vez para arrancarlo ahora. A partir del siguiente inicio de sesión de Windows arrancará automáticamente. No ejecutes el archivo repetidamente si ya está corriendo. Puedes guardar [la dirección local](http://127.0.0.1:8000) como favorito del navegador.

Este inicio automático ocurre al entrar a tu cuenta de Windows; no es un servicio que arranque antes de iniciar sesión. El servidor permanece en segundo plano al cerrar el navegador. Para esta instalación sencilla, reiniciar Windows y entrar de nuevo también reinicia el proceso.

## 7. Comprobar y conservar los datos

- Reinicia Windows, entra a tu cuenta y abre la aplicación para comprobar el inicio automático.
- Prueba con datos ficticios: crea un paciente, consulta su información y revisa la bitácora.
- Desconecta Internet y comprueba que puedes consultar y guardar. Internet solo es necesario inicialmente para clonar y descargar dependencias, y después para obtener actualizaciones.
- La base se guarda en `C:\ExpedienteClinico\datos\expediente-clinico.db`.
- Los registros están en `C:\ExpedienteClinico\datos\registros\expediente-clinico.log`.
- El runtime genera respaldos al arrancar cuando existe una base y cada 24 horas mientras está corriendo; están en `C:\ExpedienteClinico\datos\respaldos`.
- Conserva copias de los respaldos y sus manifiestos `.json` en un disco externo. No borres `datos` ni `.secret-key` al actualizar el código.

## Para las modificaciones posteriores

Backend y frontend se actualizarán desde sus propios repositorios. Los datos quedan fuera de ambos. Después de cambios del frontend será necesario volver a compilar y copiar `dist`; después de cambios del backend será necesario reiniciar el servidor. Si cambian dependencias, también habrá que instalarlas. No ejecutes actualizaciones sobre la instalación en uso sin un respaldo previo.

Antes de clonar en la laptop, asegúrate de que los cambios que quieres instalar estén guardados y subidos a ambos repositorios. Los cambios locales que aún no se han publicado no aparecerán al clonar.

Esta guía se revisó contra el código local el 8 de septiembre de 2026. Los comandos de instalación no se han ejecutado en la laptop destino. La comprobación visual pendiente de la bitácora debe completarse antes de dar esa función por validada para el uso diario.
