# Plan gradual para Kingdom Siege multijugador

> **Propuesta; pendiente de autorización.** Este documento no implementa ninguna
> función ni cambia el código, la API o las bases de datos. El backend actual
> vive en `Downloads/kingdom-siege-api/kingdom-siege-api`; usa Express,
> SQLite, `bcryptjs`, JWT y las tablas `users` y `games`. Las fases futuras
> deben preservar las cuentas, partidas, rutas y respuestas actuales.

## Principios de diseño y seguridad

- La API sigue siendo autoridad para identidad, permisos, recursos, acciones,
  producción y resultados. El navegador presenta los datos y solicita
  operaciones; no los decide.
- Mantener bcrypt y JWT actuales. No almacenar ni transferir contraseñas en
  texto claro. Los mensajes privados tampoco se incluyen en perfiles,
  clasificación ni respuestas de búsqueda.
- Usar migraciones versionadas, aditivas y reversibles cuando sea posible.
  Cada fase debe poder desplegarse, verificarse y detenerse sin eliminar las
  tablas o el flujo de juego existente.
- Todas las rutas de objetos aplican autorización en el servidor: un ID enviado
  por el cliente nunca concede acceso por sí solo.
- Paginar consultas, limitar tamaño y velocidad de peticiones, usar consultas
  parametrizadas, transacciones y restricciones de base de datos.
- No habilitar funciones sociales hasta disponer de política de privacidad,
  retención de datos, mecanismo de moderación y contacto para abuso.

## Esquema propuesto por fases

Los nombres son propuestas; se fijarán al implementar. Las tablas nuevas deben
usar claves foráneas hacia `users(id)`, índices para los filtros reales y
fechas UTC. Las migraciones no cambian ni eliminan inicialmente `users` o
`games`.

| Fase | Tablas nuevas | Propósito |
|---|---|---|
| 1 | `player_profiles` | Perfil asociado 1:1 a `users`; nombre público opcional, biografía corta, visibilidad/buscabilidad y fechas. |
| 2 | `friend_requests`, `friendships` | Solicitudes direccionales con estado y relación aceptada con par canónico único de usuarios. |
| 3 | `pvp_battles` | Participantes, estado, fechas, versión de reglas y snapshots de combate generados por el servidor. |
| 4 | `battle_events`, `notifications` | Registro inmutable o append-only de eventos y notificaciones paginables por destinatario. |
| 5 | `private_messages`, `user_blocks`, `user_reports` | Mensajes entre amigos, bloqueos y denuncias con estado de moderación y acceso restringido. |
| 6 | `alliances`, `alliance_members`, `alliance_invitations` | Alianzas, pertenencia e invitaciones; no crear hasta aprobar sus reglas sociales. |

### Columnas y restricciones importantes

- `player_profiles`: `user_id` PK/FK, `display_name` con longitud limitada,
  `bio` corta, `visibility`/`searchable`, opcional `created_at` y
  `updated_at`. No añadir correo, ubicación o nombre legal a la respuesta
  pública. El `username` actual puede servir como identificador inicial.
- `friend_requests`: `id`, `sender_id`, `recipient_id`, `status` (`pending`,
  `accepted`, `rejected`, `cancelled`), fechas y restricciones contra
  auto-solicitudes. Impedir solicitudes pendientes duplicadas en ambos sentidos
  con índices/constraints compatibles con el motor elegido.
- `friendships`: dos IDs ordenados (`user_low_id < user_high_id`), fecha de
  aceptación y estado si se permite terminar una amistad. Un constraint único
  por par evita amistades duplicadas.
- `pvp_battles`: ID no predecible, retador, rival, estado, timestamps,
  snapshots de estadísticas relevantes y versión de la fórmula de combate.
  Guardar el resultado y recompensas generadas por servidor; no aceptar como
  verdad un resultado, recompensa, nivel o saldo enviado por el cliente.
- `battle_events`: batalla, número de secuencia, tipo y datos mínimos del
  evento producidos por el servidor. No guardar datos secretos de autenticación.
- `notifications`: destinatario, tipo, referencia interna, fecha de creación y
  fecha de lectura. La consulta solo devuelve registros del destinatario
  autenticado.
- `private_messages`: remitente, destinatario, cuerpo con límite estricto,
  fechas y estado de moderación/retirada. No publicar el contenido en logs.
- `user_blocks`: `blocker_id`, `blocked_id`, fecha y par direccional único.
- `user_reports`: denunciante, denunciado, categoría, texto acotado opcional,
  referencia a mensaje/batalla si aplica, estado, fechas y acciones de
  moderación. Solo personal autorizado puede leer/modificar denuncias.
- `alliances`: propietario/creador, nombre único normalizado, descripción,
  visibilidad y fechas. `alliance_members` tendrá par único
  (`alliance_id`, `user_id`) y rol. Las invitaciones tendrán emisor,
  destinatario, estado, expiración e índices.

## Contratos de API propuestos

Son rutas nuevas a considerar en el futuro, no cambios actuales. Mantener el
prefijo `/api`, JSON coherente y respuestas sin campos privados.

| Fase | Rutas candidatas |
|---|---|
| 1 — perfiles/clasificación | `GET /api/players/:username`; `PATCH /api/me/profile`; `GET /api/ranking` (la ruta ya existe: ampliar solo si hace falta y conservar su respuesta actual o versionar cualquier cambio). |
| 2 — búsqueda/amistad | `GET /api/players?query=&cursor=`; `GET /api/friends`; `GET /api/friend-requests`; `POST /api/friend-requests`; `POST /api/friend-requests/:id/accept`; `POST /api/friend-requests/:id/reject`; `DELETE /api/friends/:userId`. |
| 3 — PvP | `POST /api/battles/challenges`; `GET /api/battles/challenges`; `POST /api/battles/challenges/:id/accept`; `POST /api/battles/challenges/:id/decline`. Si se elige matchmaking en lugar de retos, diseñar su contrato antes, no añadirlo implícitamente. |
| 4 — historial/notificaciones | `GET /api/battles?cursor=`; `GET /api/battles/:id`; `GET /api/notifications?cursor=`; `POST /api/notifications/:id/read`. |
| 5 — chat/moderación | `GET /api/friends/:userId/messages?cursor=`; `POST /api/friends/:userId/messages`; `POST /api/users/:userId/block`; `DELETE /api/users/:userId/block`; `GET /api/me/blocks`; `POST /api/users/:userId/reports`; rutas internas autenticadas de revisión/moderación, nunca expuestas a usuarios normales. |
| 6 — alianzas | `POST /api/alliances`; `GET /api/alliances?query=&cursor=`; `GET /api/alliances/:id`; `POST /api/alliances/:id/invitations`; `POST /api/alliances/:id/join-requests`; `POST /api/alliances/:id/members/:userId/accept`; `DELETE /api/alliances/:id/members/me`. |

Las rutas para aceptar/rechazar deben validar estado y participantes dentro de
una transacción. No exponer endpoints que permitan modificar directamente una
fila, el saldo, la victoria, el rol o la identidad del actor.

## Fase 1: perfiles y clasificación

**Objetivo:** una identidad pública mínima y una clasificación derivada de la
partida ya guardada.

1. Añadir `player_profiles` con valores predeterminados que no cambien las
   cuentas existentes; decidir si el perfil inicial es público y buscable, y
   ofrecer controles claros de privacidad.
2. Dejar `users` y `games` como fuente de identidad y estado. No duplicar
   victorias o poder en una columna que el cliente pueda editar; calcular la
   clasificación desde `games` en el servidor o mantener un agregado solo como
   caché verificable.
3. Preservar el endpoint existente `GET /api/ranking` y el orden actual
   (poder, luego victorias), añadiendo únicamente campos públicos aprobados.
   Si se necesitara otro formato, versionar la respuesta en vez de romper
   consumidores.
4. Componentes nuevos: `PlayerProfileCard`, `PlayerProfilePage`,
   `RankingPage`, `PrivacySettings` y estados de carga/vacío/error. Enlazar la
   clasificación desde una sección/nav sin quitar City, Army o Map.
5. Validar en servidor longitudes y caracteres permitidos, normalización de
   nombres, disponibilidad de username, campos editables y visibilidad.
   Proteger contra IDOR comprobando si el perfil puede consultarse; no devolver
   campos de cuenta ni `password_hash`.
6. Pruebas: usuarios antiguos reciben un perfil válido por valor por defecto o
   creación perezosa; ranking coincidente con el cálculo actual; cuenta privada
   no aparece en búsqueda/perfil según reglas; usuario no puede editar perfil
   ajeno; respuesta nunca incluye hash, token u otros campos privados.

**Criterio de salida:** producción de ranking estable y perfiles compatibles
con todas las cuentas migradas, sin cambios a login/JWT o estado del juego.

## Fase 2: búsqueda y amistades

1. Añadir `friend_requests` y `friendships`, índices de búsqueda por username y
   estado y restricciones de unicidad. Normalizar búsquedas para que no permitan
   escanear sin límite ni consultar cuentas no buscables.
2. Componentes: `PlayerSearch`, `PlayerSearchResults`,
   `FriendRequestInbox`, `FriendList` y acciones de aceptar, rechazar,
   cancelar o retirar amistad.
3. La API solo permite solicitar a otra persona, nunca a uno mismo; valida que
   destinatario exista y sea buscable, que no exista bloqueo, amistad o
   solicitud incompatible, y que quien acepta/rechaza sea el destinatario
   correcto. Cambiar estado y crear amistad de forma atómica.
4. Evitar enumeración y acoso: resultados paginados, respuesta uniforme cuando
   corresponda, límites por usuario/IP, límite de solicitudes pendientes y
   cooldown por destinatario. No devolver email ni estado sensible del usuario.
5. Pruebas: solicitudes recíprocas/concurrentes, duplicados, IDs ajenos,
   cuentas privadas, auto-solicitudes, límites, cancelación, y persistencia
   tras reiniciar el servicio.

**Criterio de salida:** no hay filas duplicadas ni forma de crear una amistad
sin aceptación válida del destinatario.

## Fase 3: batallas entre jugadores

1. Definir primero el modo de juego: retos asíncronos, expiración, reglas de
   aceptación, uso o no de tropas/recursos actuales, empate, cancelación y
   recompensas. No alterar balance del modo PvE por accidente.
2. Añadir `pvp_battles` con snapshots inmutables de las estadísticas relevantes
   al momento de aceptar/iniciar y versión de reglas. El snapshot lo genera la
   API leyendo `games`, nunca los datos proporcionados por el navegador.
3. Componentes: `BattleChallengeDialog`, `IncomingChallenges`,
   `BattleArena`, resultado y estados de carga/error.
4. La API verifica amistad o permiso para retar, identidad y estado del reto,
   expiración, elegibilidad, cooldown, vida y recursos. Calcula combate y toda
   recompensa en el servidor. Actualiza partidas y batalla en una transacción
   con locks/controles de concurrencia e idempotencia para evitar doble
   resolución.
5. No permitir que cambiar el request, repetir una llamada, editar localStorage
   o manipular la hora del cliente altere poder, pérdidas, recompensa o
   victorias. Aplicar límites anti-farming entre la misma pareja y reglas para
   cuentas propias/colusión.
6. Pruebas: resultados deterministas para una versión de reglas, ataques
   simultáneos, doble aceptación/resolución, replay de petición, datos
   manipulados, recursos insuficientes, rollback ante error y aislamiento de
   información del oponente.

**Criterio de salida:** una batalla no puede conceder dos veces recompensas ni
crear saldos negativos incluso ante requests concurrentes o repetidos.

## Fase 4: historial y notificaciones

1. Añadir `battle_events` y `notifications`. Retener snapshots necesarios para
   explicar el resultado; limitar los datos almacenados a lo necesario.
2. Componentes: `BattleHistory`, `BattleDetails`, `NotificationCenter` y
   contadores de no leídas. Empezar con consulta periódica/paginada; evaluar
   tiempo real solo con métricas y presupuesto.
3. La API pagina con cursores estables, autoriza dueño/participante en cada
   detalle y notificación, y marca leído solo el registro del destinatario.
   Crear notificaciones en la misma transacción que el evento o con una cola
   reintentable idempotente.
4. Pruebas: aislamiento entre usuarios, orden/paginación sin saltos,
   notificaciones duplicadas, reintentos, concurrencia de lectura y resultado
   idéntico al snapshot de batalla.

**Criterio de salida:** historial consistente y sin filtración de batallas o
notificaciones de otros jugadores.

## Fase 5: chat con bloqueo, denuncia y moderación

No habilitar chat público. Empezar solo con mensajes privados entre amistades
aceptadas; bloqueo y denuncia deben estar disponibles desde el primer release
del chat.

1. Crear `private_messages`, `user_blocks` y `user_reports`, con políticas de
   retención, permisos administrativos restringidos y registro de acciones de
   moderación. No añadir una ruta de administración pública.
2. Componentes: `FriendChat`, `MessageComposer`, `BlockUserDialog`,
   `ReportUserDialog` y una consola moderada solo accesible al rol autorizado.
3. En cada envío comprobar amistad vigente, que ninguna dirección de la pareja
   haya bloqueado a la otra, estado de cuentas, tamaño/codificación del
   mensaje y límites de frecuencia. Sanitizar texto y renderizarlo como texto,
   nunca como HTML confiable.
4. Protección contra spam: cuotas por cuenta/IP, intervalos mínimos, límite de
   mensajes y destinatarios por periodo, longitud estricta, backoff, detección
   de ráfagas y límites de solicitudes. Para varias instancias, usar un almacén
   compartido de rate limiting o contadores atómicos; el rate limiter en
   memoria de una instancia no es suficiente.
5. Protección contra abuso: bloquear impide mensajes y solicitudes futuras en
   ambos sentidos según política definida; reportar registra categoría y
   contexto mínimo, ofrece confirmación al denunciante y no revela al denunciado
   quién lo reportó. Limitar abuso de denuncias y permitir revisión/apelación.
6. No incluir contenido de mensajes, JWT, contraseñas, tokens ni datos
   privados en logs. Definir borrado/retención y acceso a evidencia; encriptar
   transporte y almacenamiento gestionado según capacidades del proveedor.
   Limitar retención y acceso a staff. No prometer cifrado de extremo a extremo
   si no se implementa.
7. Para tiempo real, preferir una capa gestionada (por ejemplo Supabase
   Realtime) solo después de comprobar autorización por canal y sus cuotas.
   El contenido persistido debe seguir validándose mediante API/DB; no exponer
   una credencial privilegiada en el bundle del frontend.
8. Pruebas: envío entre amigos, rechazo a no-amigos/bloqueados, bloqueo
   simultáneo, spam y límites, contenido malicioso, reportes sin filtración,
   permisos de moderador, no exposición en logs, eliminación/retención y
   recuperación de conexión.

**Criterio de salida:** el usuario puede bloquear y denunciar fácilmente, y la
API impide que WebSocket o petición HTTP evadan amistad, bloqueo o límites.

## Fase 6: alianzas

1. Crear `alliances`, `alliance_members` y `alliance_invitations` con límites
   de tamaño, roles explícitos, integridad referencial y estados de invitación.
2. Componentes: `AllianceSearch`, `AllianceProfile`, `AllianceRoster`,
   `AllianceInvitations` y configuración de roles.
3. La API comprueba membresía y rol en cada operación; controla nombre,
   tamaño, spam de invitaciones, disolución y traspaso de propiedad. No aceptar
   `alliance_id` como prueba de membresía.
4. Definir si se comparte historial, chat o ranking y qué campos puede ver cada
   miembro antes de habilitarlos. Reutilizar bloqueo/denuncia y moderación.
5. Pruebas: invitaciones repetidas/expiradas, permisos, expulsión y salida
   concurrentes, propietario único, cambios de rol, límites de tamaño y
   aislamiento entre alianzas.

**Criterio de salida:** pertenencia y permisos son consistentes bajo
concurrencia y no revelan información de otras alianzas.

## Validaciones en el servidor y defensa contra trampas

- Derivar siempre actor desde JWT verificado; no aceptar `userId`, saldos,
  niveles, tropas, victorias, permisos, timestamps de autoridad o resultados
  del body como identidad/verdad.
- Mantener las reglas actuales del juego en el servidor: `/game/collect`
  limita segundos y deriva producción de niveles guardados; `/game/upgrade`,
  `/train`, `/repair` y `/attack` validan recursos y reglas antes de escribir.
- En PvP, resolver y persistir combate desde estado servidor y snapshots
  versionados. Usar transacciones, constraints, bloqueo de filas y claves de
  idempotencia en operaciones reintentables.
- Validar tipos, longitudes, rangos, enumeraciones y pertenencia de recursos;
  escapar/sanitizar salidas y usar SQL parametrizado. Aplicar límites de JSON y
  timeouts.
- Añadir telemetría de abuso sin registrar secretos ni mensajes privados.
  Detectar patrones (batallas repetidas, farming entre cuentas relacionadas)
  con revisión, no castigo automático irreversible sin política.
- Evitar que score/ranking enviado por cliente se almacene como puntuación
  autoritativa. Calcularlo a partir de campos del juego validados.

## Privacidad, bloqueo y denuncia

- Publicar solo username o nombre público y campos que el jugador elija.
  Separar visibilidad de perfil y aparición en búsqueda/ranking si es necesario.
- No exponer identificadores de autenticación innecesarios, email, hash,
  IP, JWT, mensajes o reportes en perfiles, búsquedas, ranking ni logs.
- Usar consultas paginadas, resultados mínimos y límites de búsqueda para
  reducir scraping/enumeración.
- El bloqueo debe verificarse en servidor en mensajes, invitaciones, retos,
  amistades y notificaciones relacionadas; definir el comportamiento de
  relaciones existentes al bloquear.
- Denuncias visibles solo para personal de moderación autorizado. Definir
  categorías, evidencia mínima, retención, SLA realista, apelación y
  eliminación según obligaciones legales antes del lanzamiento.
- Publicar normas comunitarias y política de privacidad/contacto de abuso antes
  de abrir perfiles, chat o denuncias al público.

## Migraciones sin perder las cuentas actuales

1. Mantener `users`, `games`, IDs, username y `password_hash` intactos. Nunca
   solicitar a los jugadores que se registren otra vez.
2. Añadir tablas y columnas opcionales con migraciones versionadas y por etapas;
   los valores por defecto deben permitir que cuentas antiguas sigan iniciando
   sesión aunque aún no exista un perfil social.
3. Hacer que la migración sea idempotente y transaccional donde el motor lo
   permita; añadir índices/constraints después de medir y verificar duplicados.
4. Hacer backup consistente previo, comprobar integridad y restauración en una
   copia. Mantener SQLite y los procedimientos de rollback hasta tener
   autorización separada para cambiar de motor. Para despliegue PostgreSQL,
   seguir además el plan [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md).
5. Ensayar migraciones sobre una copia de cuentas reales protegida; comparar
   recuentos, IDs, estados de juego, hashes sin imprimirlos, ranking y
   referencias.
6. Desplegar primero código compatible con esquema viejo/nuevo, luego aplicar
   migración aditiva, verificar, activar la función por feature flag y observar.
   Si falla, desactivar la bandera o volver a la versión compatible sin borrar
   datos.
7. Tener migración inversa solo para cambios reversibles; para mensajes,
   denuncias e historial, definir exportación/retención antes. No borrar datos
   sociales ni recrear cuentas como mecanismo de rollback.

## Pruebas por fase

Además de los casos enumerados en cada fase:

- Pruebas unitarias de validadores, permisos, normalización y fórmulas.
- Pruebas de API de status codes y respuestas, incluyendo `401`, `403`, `404`,
  `409` y rate limits; nunca variar el contrato existente por error.
- Pruebas de integración contra una base efímera del mismo motor que producción,
  incluyendo constraints, transacciones y migraciones desde el esquema actual.
- Pruebas de concurrencia y repetición (race conditions, retries y peticiones
  duplicadas), especialmente para amistad, batallas y consumo de recursos.
- Pruebas de autorización por objeto/IDOR y de privacidad con dos cuentas
  independientes.
- Pruebas de frontend para estados de carga/vacío/error, accesibilidad y que las
  secciones existentes City/Army/Map siguen operativas.
- Pruebas de seguridad de entrada: payloads grandes, Unicode, HTML/script,
  SQL injection, enumeración, scraping y abuso de rate limits.
- Antes de abrir cada fase, backup restaurable, migración ensayada, feature flag
  de apagado y monitorización de errores/uso.

## Costes y límites aproximados para una primera versión gratuita

Estimación orientativa, consultada el **1 de noviembre de 2026** en las páginas
oficiales enlazadas; los proveedores pueden cambiar precios, cuotas o
disponibilidad. **US$0 no equivale a servicio público siempre disponible.**
Presupuesto y límites deben revisarse otra vez antes de publicar.

| Proveedor/servicio | Uso de prueba gratuito aproximado | Límites y riesgo práctico |
|---|---|---|
| Cloudflare Pages | US$0 para alojar el bundle estático en Free. | La documentación indica 500 builds/mes, un build concurrente y hasta 20.000 archivos por sitio. Normalmente adecuado para el frontend de una beta pequeña; funciones serverless, si se añaden, tienen cuotas Workers propias. |
| Render Web Service Free | US$0 para pruebas. | El servicio puede dormir tras 15 minutos sin tráfico, tardar cerca de un minuto en reactivarse, consumir las 750 horas gratuitas mensuales de workspace y tener filesystem efímero. Render advierte que las instancias gratuitas no son para producción: SQLite local perdería persistencia en reinicios/suspensión. Para disponibilidad continua presupuestar instancia pagada según tarifa vigente. |
| Supabase Free PostgreSQL | US$0; cuota publicada: 500 MB de base de datos, 5 GB de egress, 50.000 MAU y hasta 2 proyectos activos. | Proyecto puede pausarse después de una semana de inactividad. Compartición de recursos y falta de backups diarios incluidos hacen imprescindible probar exportación/restauración. Adecuado para prototipo de baja carga, no promesa de SLA. |
| Supabase Realtime Free (para fase 5) | Incluido en Free según cuotas publicadas. | Hasta 200 conexiones concurrentes, 100 mensajes/segundo y 100 canales por conexión. Aplicar cuotas por usuario y confirmar modelo de autorización antes de usarlo para chat. |

**Resumen económico:** una demo o alfa con tráfico muy bajo podría comenzar cerca
de **US$0/mes**, aceptando cold starts, suspensión por inactividad, límites y
backups manuales. Una beta pública con disponibilidad continua probablemente
necesitará un Web Service pagado en Render; como referencia, Supabase publica
Pro desde **US$25/mes** con cuotas/compute descritos en su página de precios.
El total real depende de compute, egress, uso y opciones; revisar calculadoras
y límites actuales, configurar alertas/spend caps y no prometer gratuidad
permanente.

Fuentes oficiales de cuotas consultadas:

- [Cloudflare Pages: limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Render: free instance limitations](https://render.com/docs/free)
- [Render: pricing](https://render.com/pricing)
- [Supabase: pricing](https://supabase.com/pricing)
- [Supabase Realtime: limits](https://supabase.com/docs/guides/realtime/limits)

## Orden recomendado de implementación

1. **Preparación transversal:** acordar privacidad, normas, política de
   retención, estrategia de despliegue/backups y feature flags; cubrir la API
   actual con pruebas de contrato y autorización.
2. **Fase 1:** perfiles públicos mínimos y clasificación compatible con el
   ranking existente.
3. **Fase 2:** búsqueda acotada, solicitudes y amistades aceptadas.
4. **Fase 3:** retos PvP server-authoritative, snapshots y persistencia atómica.
5. **Fase 4:** historial y notificaciones paginadas.
6. **Fase 5:** chat solo entre amigos, desplegado junto con bloqueo, denuncia,
   límites anti-spam y flujo de moderación operativo.
7. **Fase 6:** alianzas, roles e invitaciones después de medir uso y carga de
   moderación.
8. En cada paso: migración aditiva, tests, backup, despliegue con bandera
   desactivada, validación, activación gradual y plan de apagado. No comenzar la
   fase siguiente si hay defectos de privacidad, pérdida de datos o
   autorización.

**No implementar ninguna fase hasta recibir autorización explícita.**
