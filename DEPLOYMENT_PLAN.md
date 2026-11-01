# Plan de publicación de Kingdom Siege

> **Estado: propuesta pendiente de autorización.** Este documento describe los
> pasos para una futura publicación. No se han cambiado archivos de aplicación,
> dependencias, configuración, datos ni servicios de hosting. SQLite sigue
> siendo la base de datos actual. No se ha consultado ni copiado ningún valor
> secreto de `.env`.

## 1. Objetivo y límites

Publicar el frontend React/Vite en Cloudflare Pages, la API Node.js/Express en
Render y migrar la persistencia de SQLite a PostgreSQL en Supabase, conservando
las operaciones y respuestas que utiliza el juego.

La publicación deberá mantener:

- Registro, inicio de sesión, contraseñas cifradas con bcrypt y autenticación
  mediante JWT.
- Recursos, niveles de edificios, tropas, murallas, victorias y marca temporal
  de la partida.
- Producción de recursos calculada y aplicada por la API.
- Ranking público y su orden actual.
- Validaciones y autorización de las operaciones del juego en el servidor.
- Desarrollo local mediante `localhost` y la base SQLite durante la transición.
- Las rutas y formas de respuesta existentes; no se requiere una nueva ruta
  pública ni un cambio de contrato para realizar la migración.

No se debe eliminar SQLite hasta terminar el periodo de validación acordado y
aceptar explícitamente la retirada del camino de rollback.

## 2. Estructura revisada

Los dos proyectos están en directorios separados:

```text
Downloads\
├── kingdom-siege-game\
│   └── kingdom-siege-game\       # raíz del frontend
└── kingdom-siege-api\
    └── kingdom-siege-api\       # raíz de la API
```

### Frontend

- [package.json](./package.json): scripts `dev`, `build` y `preview`; React,
  React DOM, Vite, `lucide-react` y `framer-motion`.
- [src/services/api.js](./src/services/api.js): `VITE_API_URL`, llamada HTTP y
  envío del token de sesión.
- [src/App.jsx](./src/App.jsx) y [src/components/Login.jsx](./src/components/Login.jsx):
  restauración de sesión, registro e inicio de sesión.
- [src/pages/GamePage.jsx](./src/pages/GamePage.jsx): acciones de juego y
  recolección periódica.
- [src/components/CityPanel.jsx](./src/components/CityPanel.jsx),
  [src/components/ArmyPanel.jsx](./src/components/ArmyPanel.jsx) y
  [src/components/MapPanel.jsx](./src/components/MapPanel.jsx): secciones y
  acciones de juego.
- [src/data/gameConfig.js](./src/data/gameConfig.js): edificios y enemigos.
- [.env.example](./.env.example): variable pública de compilación
  `VITE_API_URL`, actualmente con el destino local `http://localhost:3001/api`.
- No se encontró un `.gitignore` en la raíz del frontend.
- El frontend no tiene actualmente una vista que consulte el ranking.

### API

La raíz del backend está en `../../kingdom-siege-api/kingdom-siege-api/`
respecto a este documento.

- `package.json`: scripts `dev` (`node --watch src/server.js`) y `start`
  (`node src/server.js`); Express, SQLite, `bcryptjs`, `jsonwebtoken`, CORS,
  Helmet y rate limiting.
- `package-lock.json`: versiones bloqueadas que deben mantenerse sincronizadas
  con cualquier cambio futuro de dependencias.
- `.gitignore`: excluye `node_modules/`, `.env` y `data/*.db` y sus ficheros
  auxiliares.
- `src/db.js`: crea las tablas SQLite `users` y `games` en
  `data/kingdom-siege.db`.
- `src/auth.js`: firma y valida JWT usando `JWT_SECRET`.
- `src/server.js`: rutas, hashing bcrypt con coste 12, CORS, limitación de
  peticiones, validaciones y lógica autoritativa del juego.
- `.env.example`: nombres de configuración `PORT`, `JWT_SECRET` y
  `FRONTEND_ORIGIN`. No se incluyeron valores en este plan.
- La carpeta `data` contiene una base SQLite y ficheros WAL/SHM. No se han
  abierto ni modificado.

El backend tiene actualmente estas rutas:

| Ruta | Uso |
|---|---|
| `GET /api/health` | Health check |
| `POST /api/auth/register` | Alta, hash bcrypt, usuario y partida inicial |
| `POST /api/auth/login` | Verificación de contraseña y emisión de JWT |
| `GET /api/game` | Lectura de la partida autenticada |
| `POST /api/game/upgrade` | Validación de tipo/coste y mejora |
| `POST /api/game/train` | Validación de comida/oro y entrenamiento |
| `POST /api/game/repair` | Validación de madera y reparación de murallas |
| `POST /api/game/attack` | Validación del enemigo, combate y victorias |
| `POST /api/game/collect` | Producción de comida, madera y oro |
| `GET /api/ranking` | Top 50 por poder y, en empate, victorias |

El ranking ya existe en la API, pero no se encontró un consumidor en la
interfaz actual. La migración conservará el endpoint y su respuesta
`{ ranking: [...] }`; cualquier interfaz para mostrarlo sería una mejora
separada, no una condición de esta publicación.

## 3. Diseño de despliegue propuesto

1. **Cloudflare Pages:** desplegar el frontend desde su propia carpeta/repo,
   con `npm run build` y directorio de salida `dist`. Definir
   `VITE_API_URL` en la configuración de build como la URL HTTPS pública de la
   API terminada en `/api`. Es una variable incorporada al bundle en build, no
   un secreto; volver a compilar tras cambiarla.
2. **Render:** configurar la raíz del servicio para la carpeta de la API,
   instalar con `npm ci` y ejecutar `npm start`. La API debe escuchar el puerto
   proporcionado por Render (`process.env.PORT`) y exponer
   `/api/health` como health check.
3. **Supabase PostgreSQL:** crear el esquema y los roles/conexión necesarios.
   Guardar la URL de conexión exclusivamente como secreto del servicio Render.
   Usar TLS y el método de conexión/pooler que Supabase recomiende para el
   runtime y la región elegida. No incluir credenciales, claves `service_role`
   ni `DATABASE_URL` en el frontend, el repositorio, logs o documentación.
4. **CORS:** conservar el origen local `http://localhost:5173` para desarrollo
   y permitir el dominio exacto de producción de Cloudflare Pages. Definir
   expresamente cómo se tratarán previews de Cloudflare; no usar comodines para
   cualquier origen. Reiniciar/redeploy de la API tras cambiar la
   configuración.
5. **Secretos:** configurar `JWT_SECRET` en el gestor de variables de Render.
   Mantener el mismo valor durante migración y rollback para no invalidar
   innecesariamente los JWT existentes. Rotarlo solo en una operación separada
   y planificada. Cloudflare Pages solo recibe variables públicas `VITE_*`.
6. **Planes gratuitos:** antes de publicar, comprobar cuotas, suspensión por
   inactividad, límites de conexiones, almacenamiento, backups, regiones y
   condiciones vigentes de Cloudflare, Render y Supabase. Los límites de los
   proveedores pueden cambiar y el plan no presupone una disponibilidad
   concreta.

## 4. Archivos que previsiblemente habrá que cambiar

Los siguientes cambios pertenecen a una fase posterior y requieren
autorización. La lista se confirmará de nuevo antes de implementarlos.

### Frontend

- `.gitignore` **nuevo**: excluir `node_modules/`, `dist/`, `.env` y archivos
  locales de desarrollo sin excluir fuentes ni lockfile.
- `.env.example`: mantener el valor local como ejemplo y documentar el nombre
  `VITE_API_URL`; nunca poner secretos aquí.
- `src/services/api.js`: conservar rutas y token; garantizar que builds
  desplegados usan la URL de API configurada y que los fallos de red se
  notifican claramente. Evitar que una compilación de producción caiga
  silenciosamente en `localhost`.
- `package.json` y `package-lock.json`: cambiar solo si el proceso de build,
  compatibilidad de Node o pruebas requieren cambios justificados.
- `SETUP.md` y `README.md`: añadir instrucciones para desarrollo local y
  despliegue sin publicar valores secretos.
- La interfaz de ranking **solo si se aprueba como alcance**: crear un
  componente/página que consuma `GET /api/ranking` y respete la respuesta
  existente. No cambiar el ranking del backend para hacer caber la interfaz.

### API

- `src/server.js`: preservar las rutas, validaciones, códigos y esquemas JSON;
  mantener bcrypt, JWT, Helmet y rate limiting. Separar configuración de
  CORS para los orígenes local, producción y previews explícitamente
  permitidos. Mantener el health check útil para Render.
- `src/auth.js`: mantener `bcryptjs` y la validación JWT. No cambiar el formato
  del token sin una migración de clientes autorizada.
- `src/db.js`: añadir acceso PostgreSQL y selección de proveedor mediante
  configuración del servidor, manteniendo inicialmente la implementación
  SQLite como opción local y de rollback. Usar consultas parametrizadas,
  transacciones compatibles con PostgreSQL y control seguro de conexiones.
- `src/server.js` o nuevos módulos `src/repositories/*`: mover la persistencia
  de las rutas a métodos compartidos/repositorios para que upgrade, train,
  repair, attack, collect, login, register, game y ranking no dependan de
  sintaxis SQLite. La lógica y validación seguirán en servidor.
- `package.json` y `package-lock.json`: añadir el driver PostgreSQL elegido
  (por ejemplo, `pg`) y, si conviene, scripts explícitos de migración/verificación.
  No quitar `sqlite` ni `sqlite3` durante las fases de convivencia y rollback.
- `.env.example`: documentar nombres como `DATABASE_URL` y, si se adopta,
  `DATABASE_DRIVER`; solo valores de ejemplo no utilizables como secretos.
  Mantener `PORT`, `JWT_SECRET` y `FRONTEND_ORIGIN`.
- `.gitignore`: conservar exclusión de `.env` y SQLite; añadir backups,
  volcados y archivos temporales de migración. Los dumps con datos personales
  deben quedar fuera del repositorio y con acceso restringido.
- `README.md`: actualizar instalación, modos local/producción y comandos de
  migración/rollback después de que sean implementados y probados.
- **Nuevos archivos previstos:** `migrations/001_initial.sql`,
  `scripts/migrate-sqlite-to-postgres.js`, `scripts/verify-database-migration.js`
  y pruebas automatizadas para repositorios, transacciones y contratos HTTP.
  Podrán cambiar de nombre o estructura al diseñar la implementación.

No se modificarán ahora estos archivos ni ningún otro recurso del proyecto.

## 5. Modelo PostgreSQL y compatibilidad

Crear en Supabase las tablas equivalentes:

- `users`: identificador compatible con los IDs existentes, `username`
  único/no nulo, `password_hash` no nulo y `created_at` con tipo temporal
  apropiado.
- `games`: `user_id` como PK/FK con borrado en cascada, y columnas no nulas
  para `food`, `wood`, `gold`, `troops`, `health`, `farm`, `lumber`,
  `barracks`, `castle`, `victories` y `updated_at`.
- Mantener los valores iniciales y unidades actuales. No convertir niveles ni
  reinterpretar recursos durante la migración.
- Preservar el hashing: `password_hash` contiene hashes bcrypt existentes.
  Copiar los hashes literalmente; no importar contraseñas en texto claro ni
  recalcularlos. Verificar inicio de sesión con cuentas de prueba tras
  migrarlas.
- Preservar IDs de usuarios y volver a sincronizar la secuencia/identity de
  PostgreSQL para evitar colisiones con registros nuevos.
- Convertir los timestamps SQLite (`CURRENT_TIMESTAMP`, almacenados ahora como
  texto) de forma explícita a UTC/tipo temporal. Comparar valores antes y
  después y documentar cualquier normalización.
- Mantener el contrato de partida con `updated_at` expuesto como `updatedAt` si
  así lo consume el frontend.
- Mantener el cálculo del poder y el ranking: poder descendente, victorias
  descendentes como desempate, límite de 50 y campos `{ username, victories,
  power }`.
- Ejecutar operaciones que descuentan/otorgan recursos en transacciones
  atómicas. En PostgreSQL, bloquear la fila de la partida durante decisiones
  de coste/combate (por ejemplo, `SELECT ... FOR UPDATE`) y probar peticiones
  concurrentes; nunca confiar en el saldo presentado por el navegador.

Producción existente en el servidor: cada segundo solicitado, limitada hoy a
1–60 segundos por petición, aplica `farm * 8` comida, `lumber * 6` madera y
`castle * 2` oro. Mantener la fórmula, el límite y la ruta de colección. Las
estimaciones del frontend no sustituyen el cálculo persistido por la API.

## 6. Migración de los datos SQLite existentes

La migración se ejecutará solo después de autorización, con acceso controlado
a Supabase y ensayada primero en una base PostgreSQL no productiva.

1. **Inventariar sin divulgar datos:** confirmar ruta local de la DB,
   recuentos de filas y el esquema esperado. No imprimir hashes, usuarios,
   connection strings ni datos sensibles en logs o comandos compartidos.
2. **Ensayo y criterios:** probar script y esquema con una copia protegida de la
   base. Definir previamente recuentos esperados, tolerancia cero a partidas
   huérfanas y cómo verificar importación completa de usuarios y partidas.
3. **Congelar escrituras:** programar una ventana de mantenimiento y detener la
   API SQLite antes de copiar. No permitir que SQLite reciba escrituras durante
   el corte. Si se usa WAL, solicitar checkpoint con la API detenida y crear
   un backup SQLite consistente; no copiar solo el archivo principal mientras
   existan escrituras pendientes en `-wal`.
4. **Validar origen y guardar rollback:** conservar intactos DB, WAL/SHM según
   corresponda; comprobar `PRAGMA integrity_check` y
   `PRAGMA foreign_key_check`. Crear una copia de seguridad fechada,
   restringida y verificada. El `.gitignore` evita añadir DBs por accidente,
   pero no reemplaza un backup.
5. **Crear destino vacío:** aplicar migraciones SQL versionadas en Supabase.
   Hacer DDL idempotente/revisable, constraints e índices necesarios sin
   sobrescribir tablas productivas preexistentes.
6. **Exportar e importar en orden y transacción:** importar `users` primero y
   `games` después, preservando IDs, hashes, todos los recursos/atributos y
   timestamps. Importar sin acceso público a la base y sin registrar filas en
   logs. Sincronizar la secuencia de IDs. Si la importación falla, revertir la
   transacción y no habilitar el servicio PostgreSQL.
7. **Verificar exhaustivamente:** comparar conteos por tabla, IDs, claves
   foráneas, partidas huérfanas, valores mínimo/máximo y sumas de cada recurso,
   niveles, tropas, salud, victorias y timestamps. Comparar resultado del
   ranking y poder calculado. Probar login bcrypt existente y JWT con el mismo
   `JWT_SECRET`; probar acciones en usuarios de prueba y verificar rollback de
   transacciones al faltar recursos. No cambiar formato de respuestas.
8. **Corte controlado:** cambiar la configuración del servicio Render al
   adaptador PostgreSQL, conservar una versión SQLite seleccionable, reiniciar
   y comprobar health check, registro/login, partida, todas las acciones y
   ranking antes de retirar mantenimiento.
9. **Observación:** revisar logs sin secretos/datos personales, errores HTTP,
   latencia, conexiones y consistencia durante el periodo acordado. Mantener
   SQLite y sus backups intactos hasta aceptar el cutover.

Si hay escrituras concurrentes imposibles de congelar, no se hará una copia
simple con tráfico abierto. Se diseñará y ensayará una estrategia de
sincronización/delta con reconciliación explícita antes de elegir una ventana
de corte.

## 7. Validación previa a la publicación

- Ejecutar `npm ci` y `npm run build` en el frontend; revisar la URL resultante
  y que el bundle no contenga secretos.
- Probar en local con `VITE_API_URL=http://localhost:3001/api` y la API
  seleccionando SQLite. Confirmar que el flujo local sigue funcionando.
- Ejecutar pruebas de API sobre SQLite y PostgreSQL para comparar status,
  bodies JSON, errores por recursos insuficientes, autenticación, y límites de
  recursos. Añadir pruebas si el backend carece de ellas.
- Probar todas las rutas existentes: registro duplicado/validación, login
  correcto e incorrecto, lectura de partida, upgrade, train, repair, attack,
  collect, ranking y health.
- Probar acciones simultáneas para asegurar que saldos no queden negativos ni
  se concedan dos mejoras/victorias a partir del mismo saldo.
- Confirmar CORS para `localhost`, dominio Pages de producción y solo los
  previews autorizados. Confirmar HTTPS en frontend/API y health check Render.
- Probar alta nueva, usuario importado, conservación de sesión/JWT, persistencia
  tras reiniciar Render y restauración desde backup.
- Confirmar que los mensajes de error del cliente no exponen SQL, stack traces,
  secretos ni detalles internos de PostgreSQL.

## 8. Estrategia de rollback a SQLite

No usar dual-write como mecanismo de rollback: puede dejar bases divergentes y
no ofrece consistencia suficiente.

### Antes de abrir escrituras PostgreSQL al público

1. Mantener activado el modo de mantenimiento.
2. Seleccionar nuevamente SQLite con la versión anterior del servicio y su ruta
   de datos existente; redeploy/reiniciar Render.
3. Verificar `/api/health`, login y lecturas con la DB SQLite preservada.
4. Reabrir el tráfico solo después de validar la restauración.

### Después de aceptar escrituras en PostgreSQL

1. Activar mantenimiento y detener o rechazar todas las escrituras.
2. No apuntar directamente a la copia SQLite anterior: perdería las partidas
   y acciones creadas desde el cutover.
3. Exportar el estado PostgreSQL más reciente (usuarios, hashes y partidas) y
   aplicar un proceso inverso probado a una **copia** SQLite; conservar IDs,
   timestamps, integridad referencial y valores.
4. Verificar recuentos, sumas, partidas, login/JWT y ranking en SQLite.
5. Cambiar Render a la versión/adaptador SQLite, manteniendo el mismo
   `JWT_SECRET`, y probar antes de reabrir escrituras.
6. Si la exportación inversa falla, mantener mantenimiento y reparar/recuperar
   PostgreSQL en lugar de abrir un SQLite desactualizado.

Antes del cutover deben existir backups verificados y un ensayo cronometrado de
ambas rutas. No retirar SQLite, su driver, la base congelada ni el adaptador
hasta el fin del periodo de rollback y aprobación expresa.

## 9. Orden de trabajo cuando se autorice

1. Acordar dominios, raíz/repos de cada servicio, límites del plan gratuito,
   periodo de mantenimiento y política de backups.
2. Añadir pruebas de contrato y preparar el adaptador PostgreSQL manteniendo
   SQLite como camino local predeterminado.
3. Añadir esquema/versionado y scripts seguros de importación/verificación;
   ensayar con una copia.
4. Validar todas las rutas, acciones, ranking y transacciones en ambos motores.
5. Configurar Cloudflare Pages, Render y Supabase sin publicar secretos en Git;
   confirmar variables y CORS en los paneles de cada proveedor.
6. Respaldar y congelar SQLite, ejecutar migración, verificar paridad y realizar
   el cutover con mantenimiento.
7. Observar el servicio, decidir entre rollback o aceptación y, solo con nueva
   autorización, planificar la retirada futura de SQLite.

**No comenzar ninguno de estos pasos ni desplegar servicios hasta recibir
autorización.**
