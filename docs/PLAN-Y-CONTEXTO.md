> ESTADO VIGENTE 12/09/2026: versión 1.1, sprints 1–4 implementados. Carpeta principal mundo-v2; no crear copias de entrega. Ver README.md, GITHUB-Y-DESPLIEGUE.md y REVISION-SEGURIDAD-1.1.md. Nueva migración 009 para el límite de comentarios; aplicar manualmente. Lo que sigue es contexto histórico.

> Estado más reciente: el regalo dejó de ser global. Personalización y carta se obtienen de world_gifts con RLS por UUID; configuración real solo en private-gifts (ignorado). Búsqueda de cuatro pistas implementada y probada. Ver REGALOS-PRIVADOS.md. Google, asignación del UUID, audio de las canciones y visitas siguen pendientes. No publicar la entrega antigua.

> Edición de regalo implementada: bienvenida para la destinataria y carta del buzón con tres escenas anime/chibi animadas. Ver REGALOS-PRIVADOS.md. Google se conectará al final; visitas aún pendientes. El propietario mostró ejecución SQL correcta en Supabase; falta comprobar una sesión y guardado reales.

> Actualización del 10 de septiembre de 2026: la fase de cuentas y sincronización ya tiene implementación local. Ver `ACTIVAR-SUPABASE.md` para arquitectura, pruebas y activación pendiente de SQL/correo. Las menciones anteriores a «sin Auth ni sincronización» describen el estado previo. No está verificado el guardado en el Supabase real ni se ha publicado. Avatar incluido ahora en Save. La entrega antigua está desactualizada; regenerarla tras validar esta etapa.
# Mi Mundo — plan de continuidad y contexto

> Actualización posterior: botón Google con PKCE, pistas futuras ocultas, cartas del evento rediseñadas y visitas por enlace en modo lectura implementados localmente. Ver GOOGLE-Y-VISITAS.md para el estado vigente. Falta ejecutar SQL 003 en Supabase, asignar el UUID destinatario y probar Google/visitas reales. Las notas anteriores de «visitas pendientes» se refieren a antes de esta implementación.

Actualizado: 10 de septiembre de 2026. Zona horaria del propietario: America/La_Paz.

Este documento reúne las decisiones de la conversación y la siguiente etapa. Es un plan, no una afirmación de que los servicios pendientes ya estén conectados. Para retomar el trabajo, contrastar siempre este documento con el código y las pruebas actuales.

## 1. Propósito y preferencias del usuario

Crear un videojuego web de fantasía, íntimo y tranquilo, que pueda regalarse a su novia mediante un enlace por su cumpleaños. Fecha, nombre, dedicatoria y modalidad privada/compartida todavía no están definidos. El mundo crecerá con nuevas islas, plantas, recuerdos y, después, animales y actividades.

- Priorizar celular, cargas pequeñas y pocos efectos simultáneos.
- Formas suaves y fantasía; evitar estética de bloques tipo Minecraft.
- Interfaz transparente con textura sutil, detalles marfil/dorados, paneles plegables y controles táctiles cómodos. El usuario ha pedido varias veces que el tablero no tape el paisaje.
- Historias cortas, visuales e interactivas. Cada objeto abre su historia; el álbum y las tarjetas dan pistas, pero no deben abrir todas las historias desde cualquier lugar.
- Mantener mensajes personales en objetos y plantas, guardado local y Exportar/Importar jardín.
- Relación del cielo FIJA: una hora real equivale a diez minutos de juego. Se quitó el selector de velocidad por petición del usuario. No reintroducirlo sin una nueva solicitud.
- El crecimiento usa tiempo real, no la hora visual del cielo. Actualmente el cielo avanza durante el juego y su hora no constituye un reloj persistente sincronizado entre dispositivos.
- Implementar por etapas y comprobar lo existente antes de añadir más carga.

## 2. Qué está implementado

La aplicación activa es `mundo-v2/`. La carpeta superior contiene un prototipo anterior y archivos del usuario: no sustituirlos ni limpiarlos indiscriminadamente.

| Área | Estado real |
| --- | --- |
| Motor | TypeScript, Vite y Babylon.js; renderizado en el navegador |
| Jardín | Isla inicial, avatar mujer/hombre, movimiento, cámara, joystick y seis parcelas |
| Cultivo | Flor de luna y helecho estelar; seis horas reales para madurar; un riego adelanta tres horas; no mueren por ausencia |
| Recuerdos | Seis historias del jardín; carta y flor con apertura interactiva; otras historias breves; colección con pistas |
| Mensajes | Texto personal de hasta 500 caracteres en objetos y plantas; lectura, edición, eliminación y exportación |
| Interfaz | Explorar/Mi jardín/Avatar, tarjetas de plantas y recuerdos, vista previa 3D del avatar y burbujas contextuales |
| Ambiente | Cielo, día/noche, música, gestos de plantar/regar/leer, pétalos al florecer y mariposas limitadas |
| Accesibilidad | Movimiento reducido y controles de cierre/teclado; necesita auditoría más amplia en dispositivos reales |
| Segunda isla | Bosque Lunar provisional, cuatro parcelas, refugio restaurable y encuentro propio |
| Desbloqueo | Tres flores plantadas en el jardín, una florecida y dos recuerdos guardados; al viajar se conserva el desbloqueo |
| Viaje | Guarda destino y recarga la página; solo una escena de isla activa; conserva progreso de ambas |
| Persistencia | IndexedDB local, validación de copias, detección de escritura desde otra pestaña, Exportar/Importar JSON |

No están implementados: cuentas, Supabase/Firebase, sincronización en la nube, respaldo remoto programado, multijugador, publicación definitiva ni experiencia personalizada de cumpleaños. No hay simulación de lluvia/clima: hay cielo e iluminación. El avatar es procedural; varios modelos son provisionales.

La preferencia de avatar está en almacenamiento local separado de la partida. Debe incorporarse al perfil al añadir cuentas; no afirmar que hoy viaja dentro de la exportación JSON.

## 3. Decisiones de guardado y alojamiento

La conversación se orientó a **Supabase para cuentas y progreso**, con el juego y los modelos publicados por separado. Cloudflare Pages es una opción propuesta para el sitio. Firebase Auth + Firestore y Cloudflare Workers + D1 se evaluaron como alternativas, pero no se han creado ni conectado recursos.

Objetivo inicial: aproximadamente diez cuentas que juegan individualmente. Un plan gratuito puede ser suficiente para una prueba pequeña; no se ha medido consumo en producción y no se garantiza capacidad ni gratuidad permanente.

Separar tres cosas:

1. Guardado local duradero: mantiene la partida aun si falla internet.
2. Sincronización: replica cambios confirmados entre dispositivo y cuenta.
3. Respaldo: conserva versiones recuperables fuera de la base principal, incluso ante borrado accidental o pérdida del proveedor.

Subir una partida a Supabase no equivale a tener un respaldo independiente. El uso real genera actividad, pero no garantiza evitar la pausa del plan gratuito.

## 4. Flujo propuesto de sincronización

### Al entrar

- Permitir jugar localmente si la nube no responde. Mostrar con claridad que todavía no hay confirmación remota.
- Con sesión válida, descargar la revisión remota del mundo autorizado y compararla con la copia local.
- En la primera vinculación, ofrecer conservar la partida local o recuperar la nube con información suficiente; no sobrescribir silenciosamente ninguna.
- Separar los datos locales por cuenta y mundo. Cambiar de cuenta no debe subirle los mensajes o la partida del usuario anterior.

### Al hacer cambios

- Plantar, regar, guardar mensajes, desbloquear o viajar escriben primero en IndexedDB.
- Guardar la partida local y la operación pendiente en una misma transacción para que sobrevivan cierres inesperados.
- Enviar operaciones con identificador único, versión de formato, mundo y revisión base. Los reintentos no deben duplicar acciones.
- El servidor comprueba identidad, permisos, validez de los datos y revisión antes de aceptar; devuelve la revisión confirmada.
- Si falla, conservar la cola y reintentar con espera creciente al recuperar conexión/sesión. No borrar pendientes hasta recibir confirmación.
- No enviar posiciones del avatar, fotogramas ni animaciones a la base de partidas.
- No usar únicamente el reloj del dispositivo para decidir qué copia gana. Ante conflicto de revisiones, preservar ambas y resolverlo explícitamente; comenzar evitando edición simultánea del mismo mundo.

Estados visibles: **Guardado en este dispositivo**, **Sincronizando**, **Guardado en la nube**, **Sin conexión: cambios pendientes** y **Hay dos versiones: revisar**. La confirmación de nube debe corresponder a la revisión actual, no a una anterior.

### Durante la sesión y al salir

El usuario quiere respaldos periódicos o al salir, manteniendo exportación manual. Propuesta inicial, todavía ajustable:

- Reintento de sincronización cada dos minutos solo si hay cambios pendientes; no generar consultas artificiales para evitar la pausa.
- Copia histórica local cada treinta minutos si la partida cambió; conservar una cantidad limitada, por ejemplo diez.
- Al pasar la página a segundo plano, intentar vaciar la cola y conservar inmediatamente lo pendiente en local.
- El cierre de una pestaña o aplicación móvil NO garantiza tiempo para terminar peticiones. No depender de `beforeunload`, de un botón Salir ni de un temporizador de navegador como única protección.
- Al volver a entrar, continuar los pendientes y verificar la revisión remota.

## 5. Respaldo independiente y recuperación

Propuesta: tarea externa diaria, inicialmente a las 04:00 de America/La_Paz, con horario por confirmar antes de activarla. Debe funcionar aunque nadie tenga el juego abierto. Este documento **no crea una automatización**.

Alcance del respaldo completo:

- Esquema y datos de mundos, partidas, versiones, mensajes, regalos y permisos.
- Información necesaria para asociar cuentas y mundos; la migración de autenticación debe planificarse aparte.
- Fotografías, audios y otros archivos originales, si se añaden: guardar los archivos, no solo sus URLs.
- Versión de la aplicación y de las migraciones; manifiesto con fecha, tamaño y sumas de verificación.

Conservar inicialmente siete copias diarias, cuatro semanales y tres mensuales, sujeto a tamaño y cuotas. Guardarlas fuera del proveedor principal, con acceso privado y cifrado; no subir respaldos, mensajes privados ni credenciales al repositorio o a `public/`.

El programador, el destino y sus límites gratuitos están pendientes de elegir. Una tarea que vive exclusivamente dentro del proyecto que puede pausarse no constituye un respaldo independiente fiable.

Probar una restauración antes del regalo y después de cambios de formato importantes. Alertar si falla una copia o si la última copia correcta envejece. Un respaldo diario solo permite recuperar hasta su última ejecución; podrían faltar cambios posteriores si tampoco existe copia local.

Migración futura: exportar/capturar el último estado, detener escrituras durante el cambio, restaurar en un destino de prueba, comprobar cantidades y permisos, reasociar identidades verificadas y actualizar la conexión. Migrar a otro PostgreSQL y migrar a Firestore requieren trabajos distintos. Conservar adaptadores separados reduce cambios en el juego, pero no convierte la migración en automática.

Sin base recuperable, sin respaldo y sin copia local/exportada, no se puede prometer recuperar los datos.

## 6. Estructura propuesta de datos

Diseño inicial para revisar al implementar, no tablas existentes:

| Entidad | Propósito |
| --- | --- |
| `profiles` | Identificador del jugador, nombre visible y avatar; vinculación verificada con el proveedor de acceso |
| `worlds` | Mundo, propietario, tema/plantilla, fechas y privacidad |
| `world_members` | Jugadores autorizados y rol: propietario, visitante o editor |
| `world_saves` | Estado JSON versionado, número de revisión y confirmación temporal del servidor |
| `sync_operations` | Identificadores de operaciones aceptadas para impedir duplicados; retención limitada |
| `world_snapshots` | Versiones históricas acotadas para recuperación, diferentes de la partida activa |
| `gifts` | Contenido preparado por el autor y destinatario; separado del progreso que ella genera |

La partida actual usa `schemaVersion: 1`. Antes de modificarla para cuentas, definir y probar una migración que conserve plantas, recuerdos, mensajes, islas y logros de las copias antiguas. El JSON portable debe tener identificadores del juego estables, sin depender únicamente de IDs internos del proveedor.

Los modelos GLB y la música compartida no van en filas de partidas ni se duplican por usuario. Para fotos/mensajes privados, el enlace debe requerir autorización; esconderlos en la interfaz no es privacidad.

En Supabase, activar y probar políticas de acceso por fila. El cliente puede usar la clave pública prevista para ese uso; ninguna clave de servicio/administración debe estar en el navegador, en variables VITE_* ni en archivos públicos. La asignación de dueño y roles se valida en servidor. Definir un contrato transaccional de actualización por revisión; no confiar en un `upsert` indiscriminado.

## 7. Organización de código

Actualmente:

```text
src/
  domain/gardening.ts                 Formato Save, crecimiento y validación
  domain/achievements.ts              Requisitos del Bosque Lunar
  application/gardenGame.ts           Acciones, SavePort y confirmación de escritura
  infrastructure/persistence/        IndexedDB y conflictos entre pestañas
  infrastructure/assets/             Carga de modelos por escena
  content/                            Parcelas, islas, historias y música
  presentation/world/                Jardín, bosque, cielo y efectos
  presentation/player/               Avatar, entrada y vista previa
  presentation/memories/             Álbum y lector
  presentation/ui/                   Interface y estilos
  main.ts                             Inicio y manejo de errores
```

Añadir por etapas, sin trasladar toda la lógica a `interface.ts`:

```text
src/domain/accounts/                  Identidad propia del juego y permisos
src/domain/sync/                      Revisiones, operaciones y conflictos
src/application/sync/                 Coordinador de guardado y reintentos
src/application/auth/                 Sesión y vinculación de partida
src/infrastructure/auth/              Adaptador del proveedor
src/infrastructure/sync/              Adaptador remoto y cola IndexedDB
src/presentation/account/             Acceso, recuperación y estado de sincronización
supabase/migrations/                  Tablas, índices, políticas y funciones
tests/sync/                           Pruebas de contratos, conflictos y acceso
scripts/backup/                       Exportación/restauración del operador
```

Las carpetas anteriores son propuestas; no asumir que ya existen. Mantener la lógica de juego independiente del SDK remoto. Antes de ampliar la interfaz, extraer funciones por característica y consolidar las muchas reglas CSS acumuladas, comprobando que no cambie el aspecto aceptado.

## 8. Etapas y criterios de entrega

### A. Base portable y protección local

Definir versión del formato, separar preferencia de perfil de estado del mundo, preparar cola duradera, límites de tamaño y exportación completa. Probar actualización desde las partidas actuales, cierre inesperado y restauración JSON.

### B. Cuentas y nube — siguiente prioridad funcional

Crear/configurar el proyecto del proveedor en la cuenta del usuario, elegir acceso por Google o correo y configurar recuperación. Implementar políticas, sesión, elección inicial local/nube, sincronización por revisión y estados visibles.

Aceptación: desde un segundo navegador, la misma cuenta recupera el mismo mundo. Una cuenta diferente no puede leer ni editarlo. Perder conexión no pierde acciones; cerrar durante una sincronización no duplica plantas. Una sesión caducada o un servicio pausado muestra pendientes recuperables. Migrar el avatar local al perfil.

### C. Respaldo y ensayo de desastre

Elegir destino y programador externos, configurar retención y avisos, exportar esquema/datos/archivos y restaurar una copia en un entorno aislado. No considerar terminada esta etapa solo por generar un archivo.

### D. Regalo y publicación

Pedir únicamente los datos faltantes: fecha del cumpleaños, nombre, dedicatorias y quién puede acceder. Separar contenido del regalo de la partida inicial de ella. Incorporar bienvenida personalizada y sorpresa final sin abrir todos los recuerdos desde el álbum.

Preparar alojamiento HTTPS y dominio/enlace estable, redirecciones de acceso y recuperación. Probar el juego completo en el tipo de celular real destinatario y con conexión móvil. Revisar que la nube esté operativa antes del cumpleaños; conservar una copia exportada. El enlace local 127.0.0.1 no es el enlace que se regalará.

### E. Modelos definitivos y contenido

El usuario planea conseguir paquetes más adelante. Esperar los archivos; no comprar en su nombre. Inspeccionar licencias, formatos y peso antes de integrar. Empezar por dos árboles, hongos, helechos y un refugio de estilo consistente. Medir descarga, memoria y fluidez; un ZIP grande no tiene que publicarse entero.

### F. Visitas y multijugador posterior

Primero mundos propios y permisos de invitación, luego visitas simultáneas para dos personas. Un mundo guardado es estado, no un servidor 3D permanentemente activo por usuario. Reutilizar modelos y calcular crecimiento al consultar marcas temporales.

Separar presencia/posición temporal del guardado permanente. No escribir cada fotograma en la base. Definir autorización de acciones, desconexión y concurrencia antes de habilitar edición compartida. Probar consumo con diez usuarios conectados antes de prometer que el nivel gratuito basta. No desarrollar ahora un MMO, chat público ni simulación continua de todos los mundos.

## 9. Cómo retomar y verificar

Desde `mundo-v2/`:

```sh
pnpm dev
pnpm test
pnpm build
pnpm preview --port 5175
```

Desarrollo usa normalmente 5174; vista previa 5175. `dist/` es generado: editar `src/` y volver a compilar antes de mostrar la vista previa. No asumir que los servidores sigan activos entre sesiones.

Los scripts de navegador usan Playwright con Edge. Consultar su encabezado; varios requieren la variable PLAYWRIGHT_MODULE con la ruta local al paquete y el servidor de desarrollo. Algunos usan el inspector `window.__MI_MUNDO_DEV__`, ausente de producción. Utilizan perfiles temporales; no modificar el progreso personal del usuario para probar desbloqueos.

Pruebas relevantes: `smoke-browser.mjs`, `islands-browser.mjs`, `islands-production.mjs`, `messages-browser.mjs`, `fixed-pace-browser.mjs`, `care-browser.mjs`, `ambient-browser.mjs` y las pruebas de dominio en `tests/`. Revisar y adaptar expectativas antiguas al cambiar comportamientos intencionalmente. Los resultados históricos no sustituyen una ejecución después de cambios.

Limitación conocida de validación: las pruebas móviles realizadas son emulación de pantalla/tacto en Edge, no mediciones de batería, temperatura o FPS garantizados en un teléfono físico.

## 10. Fuentes y decisiones todavía abiertas

Referencias consultadas durante esta conversación; verificar términos y cuotas nuevamente al contratar/configurar:

- Supabase, pausa y restauración: https://supabase.com/docs/guides/platform/free-project-pausing
- Supabase, respaldo y restauración: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- Supabase, precios: https://supabase.com/pricing
- Cloudflare Pages, límites: https://developers.cloudflare.com/pages/platform/limits/
- Firestore, cuotas: https://firebase.google.com/docs/firestore/quotas
- Cloudflare D1, precios: https://developers.cloudflare.com/d1/platform/pricing/

Supabase indica actualmente que puede pausar proyectos gratuitos con poca actividad durante siete días y que su restauración desde el panel tiene una ventana de un año. Entrar una vez por semana no garantiza evitarla. No usar peticiones ficticias como estrategia de respaldo.

Pendientes de decisión: proveedor definitivo y cuentas de administración; método de acceso; fecha y privacidad del regalo; ubicación, horario y retención del respaldo; política de conflictos; qué puede editar un invitado. Estas decisiones no bloquean documentar contratos y preparar pruebas locales, pero sí ciertas configuraciones externas.

Documentos relacionados: `islas.md` describe el bosque; `historias.md` describe el catálogo; `assets-source/bosque-lunar/README.md` explica dónde reunir modelos. Los documentos de mejoras anteriores son históricos: si contradicen estas decisiones posteriores, revisar el código y este plan antes de actuar.


## Actualización de servicios — 10 de septiembre

El usuario proporcionó el repositorio https://github.com/puma-afk/miMundo-v2 y el proyecto Supabase https://lnjwbnhhwsmtonuxlasd.supabase.co. Se registró en Cloudflare mediante GitHub; falta confirmar el proyecto Pages. Consultar `SERVICIOS-Y-DESPLIEGUE.md`. Estas referencias no significan que cuentas, sincronización o despliegue estén implementados.



