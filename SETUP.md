# Instalación y ejecución de Kingdom Siege en Windows

Esta guía explica cómo arrancar Kingdom Siege desde PowerShell. El juego tiene
dos servicios que se ejecutan por separado: la API y el frontend. La API debe
estar disponible para iniciar sesión, guardar la partida y usar las acciones del
juego.

> **Importante:** este proyecto contiene el frontend, pero no incluye el
> backend, su `package.json` ni su `.env.example`. Consigue y descomprime el
> proyecto de la API de Kingdom Siege por separado antes de empezar. No basta
> con instalar este frontend.

## 1. Requisitos previos

1. Instala una versión LTS de [Node.js](https://nodejs.org/). npm se instala con
   Node.js. Comprueba que ambos comandos están disponibles:

   ```powershell
   node --version
   npm --version
   ```

2. Usa un navegador compatible y actualizado, como Microsoft Edge, Google
   Chrome o Mozilla Firefox.
3. [Visual Studio Code](https://code.visualstudio.com/) es opcional. Puedes
   editar los archivos con VS Code o con el Bloc de notas de Windows.
4. Descomprime los proyectos del frontend y de la API en carpetas separadas.
   En los ejemplos siguientes, sustituye las rutas por las carpetas reales que
   contengan el `package.json` correspondiente.

## 2. Estructura y servicios

| Servicio | Tecnología | Puerto local habitual | Dirección |
|---|---|---:|---|
| Frontend | React + Vite | 5173 | `http://localhost:5173` |
| API | Node.js + Express | 3001 | `http://localhost:3001/api` |
| Base de datos | SQLite | No usa un puerto | Archivo local de la API, normalmente dentro de `data` |

El frontend envía las peticiones a la URL configurada en `VITE_API_URL`. El
valor de ejemplo del proyecto es `http://localhost:3001/api`. La API y el
frontend deben estar ejecutándose simultáneamente en dos ventanas de PowerShell
diferentes.

## 3. Instalar y arrancar la API

1. **Descomprime el proyecto de la API** en una carpeta local. La carpeta debe
   incluir el `package.json` del backend y el archivo `.env.example`. Este
   repositorio del frontend no contiene esos archivos del backend.
2. Abre PowerShell desde el menú Inicio.
3. Entra en la carpeta que contiene el `package.json` de la API. Cambia la ruta
   de ejemplo por la ruta donde descomprimiste el backend:

   ```powershell
   Set-Location "C:\ruta\al\proyecto\kingdom-siege-api"
   Test-Path .\package.json
   Test-Path .\.env.example
   ```

   Ambos comandos deben devolver `True`. Si no, busca la subcarpeta correcta:
   es posible que el ZIP haya creado una carpeta adicional al descomprimirse.
4. Instala las dependencias del backend:

   ```powershell
   npm install
   ```

5. Crea la carpeta de datos de SQLite si todavía no existe:

   ```powershell
   New-Item -ItemType Directory -Force -Path .\data
   ```

6. Copia la plantilla de variables de entorno:

   ```powershell
   Copy-Item .\.env.example .\.env
   notepad .\.env
   ```

7. En `.env`, configura las variables requeridas por la API. Usa los nombres
   indicados por el backend. Ejemplo para desarrollo local:

   ```dotenv
   PORT=3001
   JWT_SECRET=REEMPLAZA_ESTO_POR_UN_SECRETO_ALEATORIO_LARGO
   FRONTEND_ORIGIN=http://localhost:5173
   ```

   `JWT_SECRET` es un valor privado: reemplaza el texto de ejemplo por un
   secreto largo, único y aleatorio. No uses el valor del ejemplo en un entorno
   compartido y no publiques ni envíes el secreto a otras personas. Si la
   plantilla de la API contiene otras variables necesarias, consérvalas y
   configúralas también.
8. Arranca la API con el script definido por el proyecto del backend:

   ```powershell
   npm run dev
   ```

   Si el comando indica que falta el script `dev`, consulta el `package.json`
   de esa API y usa el script de desarrollo que realmente ofrezca. Mantén esta
   ventana abierta.
9. En otra ventana de PowerShell, comprueba el endpoint de salud:

   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3001/api/health"
   ```

   La API debe devolver una respuesta de estado saludable. Si el backend
   documenta otro formato de respuesta, comprueba que la petición responde sin
   error HTTP.

## 4. Instalar y arrancar el frontend

1. Abre **otra ventana** de PowerShell. Entra en la carpeta del juego que
   contiene el `package.json`. En este proyecto la carpeta tiene esta
   estructura:

   ```text
   kingdom-siege-game\
   ├── package.json
   ├── .env.example
   └── src\
       ├── main.jsx
       ├── App.jsx
       ├── components\
       ├── data\
       ├── pages\
       └── services\
   ```

   Por ejemplo, si descomprimiste el archivo con una carpeta adicional:

   ```powershell
   Set-Location "C:\ruta\de\descarga\kingdom-siege-game\kingdom-siege-game"
   Test-Path .\package.json
   ```

   Continúa solo si devuelve `True`.
2. Instala las dependencias del frontend:

   ```powershell
   npm install
   ```

3. Copia la plantilla local de entorno y ábrela:

   ```powershell
   Copy-Item .\.env.example .\.env
   notepad .\.env
   ```

4. Comprueba que `.env` contiene la dirección base de la API local:

   ```dotenv
   VITE_API_URL=http://localhost:3001/api
   ```

   Guarda el archivo. Vite lee las variables `VITE_*` al iniciar y al compilar;
   si cambias esta URL, reinicia el servidor de Vite.
5. Arranca el frontend:

   ```powershell
   npm run dev
   ```

6. Abre en el navegador la dirección que muestre Vite; normalmente es
   `http://localhost:5173/`. Deja abierta esta ventana de PowerShell.

## 5. Registrar una cuenta y comprobar el guardado

1. Verifica que la API y Vite siguen en ejecución, cada uno en su ventana de
   PowerShell.
2. En la página del juego, elige la opción para crear una cuenta. Escribe un
   nombre de usuario y una contraseña y envía el formulario. La contraseña
   debe cumplir los requisitos que muestre la pantalla.
3. Para volver a entrar, usa el formulario de inicio de sesión con esa misma
   cuenta.
4. Comprueba que la partida responde usando City, Army o Map. Por ejemplo,
   mejora un edificio, entrena tropas o realiza una batalla si dispones de
   recursos.
5. Cierra sesión y vuelve a iniciar sesión con la misma cuenta. La API debe
   devolver los recursos, edificios, tropas, victorias y estado de las murallas
   guardados para ese jugador. La recopilación periódica de recursos también
   necesita que la API permanezca disponible.

## 6. Si Vite usa el puerto 5174

Si el puerto 5173 está ocupado, Vite puede iniciar automáticamente en el 5174.
Abre la URL exacta que imprime Vite y actualiza también el origen permitido por
la API:

1. Detén la API con `Ctrl + C` en su ventana de PowerShell.
2. Abre el `.env` **del backend**:

   ```powershell
   notepad .\.env
   ```

3. Cambia el origen para que coincida exactamente con la URL del navegador:

   ```dotenv
   FRONTEND_ORIGIN=http://localhost:5174
   ```

4. Guarda el archivo y vuelve a ejecutar `npm run dev` en la carpeta de la API.
5. Si el navegador muestra un error de CORS usando `127.0.0.1` en lugar de
   `localhost`, configura `FRONTEND_ORIGIN` con el origen exacto mostrado en la
   barra de direcciones. El esquema, el host y el puerto deben coincidir.

## 7. Comandos útiles

Ejecuta cada comando desde la carpeta del servicio apropiado (API o frontend):

```powershell
# Instalar las dependencias del proyecto actual
npm install

# Ejecutar el servidor de desarrollo
npm run dev

# Generar la compilación de producción del frontend
npm run build

# Revisar vulnerabilidades conocidas en las dependencias del proyecto actual
npm audit
```

Para detener un servidor de desarrollo o de vista previa, enfoca su ventana de
PowerShell y pulsa **Ctrl + C**.

### Encontrar y cerrar un proceso que ocupa un puerto

Por ejemplo, para averiguar quién está usando el puerto 5173:

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess

Get-Process -Id <PID>
```

Sustituye `<PID>` por el número `OwningProcess` mostrado. Si confirmas que es un
servidor que quieres detener, ciérralo por su identificador:

```powershell
Stop-Process -Id <PID>
```

Para investigar el puerto de la API, reemplaza `5173` por `3001`. No cierres
procesos que no reconozcas; también puedes dejar que Vite use el siguiente
puerto disponible y actualizar `FRONTEND_ORIGIN`.

## 8. Errores frecuentes

### `Failed to fetch`

- Confirma que la API está ejecutándose y que `http://localhost:3001/api` es el
  valor de `VITE_API_URL` en el `.env` del frontend.
- Comprueba el endpoint:

  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3001/api/health"
  ```

- Comprueba que el puerto de la API en `PORT` coincide con la URL configurada en
  `VITE_API_URL`. Reinicia Vite después de cambiar `.env`.

### `SQLITE_CANTOPEN`

- Asegúrate de ejecutar la API desde su carpeta de proyecto.
- Comprueba que existe `data` en la ubicación que espera el backend:

  ```powershell
  New-Item -ItemType Directory -Force -Path .\data
  ```

- Confirma que la cuenta de Windows puede escribir en esa carpeta y revisa la
  ruta de la base de datos configurada por el backend.

### `Port 5173 is in use`

- Identifica el proceso con los comandos de la sección anterior y detenlo solo
  si corresponde.
- También puedes aceptar el puerto alternativo que ofrezca Vite. Si usa 5174,
  actualiza `FRONTEND_ORIGIN` en el `.env` de la API y reinicia el backend.

### `Cannot find package.json`

- PowerShell está en una carpeta que no contiene el manifiesto del servicio.
- Comprueba la ubicación actual y el archivo:

  ```powershell
  Get-Location
  Test-Path .\package.json
  ```

- Usa `Set-Location` para entrar en la carpeta correcta. Frontend y backend
  tienen sus propios `package.json`; instala y ejecuta cada uno desde su
  carpeta.

### `Failed to load /src/main.jsx`

- En el frontend, asegúrate de que PowerShell está en la raíz correcta del
  proyecto, donde están `package.json` y `index.html`.
- Comprueba que el archivo existe:

  ```powershell
  Test-Path .\src\main.jsx
  ```

- Si devuelve `False`, corrige la carpeta actual o vuelve a descomprimir el
  frontend completo. Arranca Vite desde esa raíz.

### La API no responde

- Revisa los mensajes en la ventana de PowerShell donde ejecutaste el backend.
- Comprueba que el puerto configurado en `PORT` está libre y que la API muestra
  que se inició sin errores.
- Prueba `http://localhost:3001/api/health`. Si configuraste otro `PORT`,
  sustituye `3001` por ese puerto y actualiza `VITE_API_URL` en consecuencia.

### Pantalla blanca

- Recarga el navegador y revisa los errores de la consola del navegador y de la
  terminal de Vite.
- Comprueba que se ejecutó `npm install` desde la carpeta del frontend y que
  Vite muestra la URL correcta.
- Verifica que `src/main.jsx` existe. Si la consola indica un problema de API,
  comprueba también que el backend responde y que `VITE_API_URL` es correcto.

### Problemas de CORS

- Configura `FRONTEND_ORIGIN` en el `.env` del backend con el origen exacto del
  navegador, por ejemplo `http://localhost:5173` o
  `http://localhost:5174`.
- No añadas la ruta `/api` a `FRONTEND_ORIGIN`: es un origen, no la URL de la
  API.
- Reinicia el backend después de editar `.env`. Si cambiaste `VITE_API_URL`,
  reinicia también Vite.

## 9. Compilación y vista previa de producción

1. Mantén disponible la API en el entorno al que apunta el frontend.
2. En PowerShell, entra en la carpeta del frontend y confirma que
   `VITE_API_URL` apunta a la API que utilizará la compilación.
3. Genera los archivos estáticos:

   ```powershell
   npm run build
   ```

   Vite escribe la compilación en `dist`.
4. Para probar localmente esa compilación, ejecuta:

   ```powershell
   npm run preview
   ```

   Abre la dirección que indique Vite (el puerto de vista previa suele ser
   `4173`). Si la API valida el origen mediante CORS, permite también el origen
   exacto de vista previa en `FRONTEND_ORIGIN` durante la prueba y reinicia la
   API. Una compilación desplegada en otro dominio necesitará que
   `VITE_API_URL` y los orígenes permitidos de la API correspondan al entorno de
   despliegue; vuelve a compilar después de cambiar la URL del frontend.

## 10. Lista de comprobación

- [ ] `node --version` y `npm --version` muestran versiones instaladas.
- [ ] La API tiene sus dependencias instaladas y su carpeta `data` existe.
- [ ] El `.env` de la API define `PORT`, `JWT_SECRET` y
      `FRONTEND_ORIGIN`, con un secreto privado reemplazado localmente.
- [ ] La API se ejecuta en su propia ventana de PowerShell y responde en
      `/api/health`.
- [ ] El `.env` del frontend define `VITE_API_URL=http://localhost:3001/api` o
      la dirección correspondiente a la API.
- [ ] Vite se ejecuta en una segunda ventana y he abierto la URL que indicó.
- [ ] Puedo registrar una cuenta e iniciar sesión.
- [ ] Los recursos cambian y la partida se conserva al volver a iniciar sesión.
- [ ] Si Vite usa 5174 u otro puerto, `FRONTEND_ORIGIN` coincide con el origen
      abierto en el navegador.
- [ ] Puedo ejecutar `npm run build` en la carpeta del frontend.
