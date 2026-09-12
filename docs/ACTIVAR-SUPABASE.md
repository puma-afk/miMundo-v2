# Activar las cuentas y el guardado

Actualizado: 10 de septiembre de 2026.

> Decisión posterior: el propietario mostró ejecución SQL correcta y prefiere dejar la conexión de Google para el final. El código actual sigue ofreciendo OTP. El SMTP descrito aquí solo se necesita si se mantiene ese método; Google no requiere enviar estos códigos. Aún falta la prueba de cuenta y guardado con el servicio real. Ver también `REGALOS-PRIVADOS.md`.

## Estado real

El código local ya incluye acceso por correo y código, aislamiento por cuenta, guardado local, sincronización con revisiones y resolución explícita de conflictos. La clave pública facilitada por el propietario está en `src/content/cloud.ts`; el endpoint público Auth respondió HTTP 200 con correo y registros habilitados. Esto NO prueba que el correo llegue ni que las tablas estén instaladas. No se enviaron correos ni se crearon cuentas durante las pruebas.

La carpeta antigua `ENTREGA-GITHUB-2026-09-10` es anterior a estas mejoras. No publicarla. Se regenerará cuando terminemos la activación y las pruebas reales. Continuar desarrollando en `mundo-v2`.

## 1. Crear las tablas y permisos

1. Abre https://supabase.com/dashboard/project/lnjwbnhhwsmtonuxlasd
2. En SQL Editor crea una consulta nueva.
3. Copia TODO `supabase/migrations/001_accounts_and_worlds.sql` y ejecuta Run.
4. Debe terminar correctamente. La migración no modifica el esquema Auth ni crea usuarios. Puede ejecutarse de nuevo sobre este mismo esquema.

Se crean `world_saves`, `world_snapshots` y `save_my_world`. Cada mundo tiene un identificador estable y un propietario. RLS limita la lectura al propietario; la escritura directa de tablas se prohíbe a clientes. La función comprueba el usuario autenticado, tamaño/formato básico, revisión anterior e identificador de operación. Nunca reemplaza una revisión distinta silenciosamente.

La clave publishable no permite ejecutar esta migración. Se necesita tu sesión del Dashboard; no compartas contraseña, clave service_role ni tokens administrativos.

## 2. Activar el correo de acceso

En Authentication, comprueba que Email está habilitado y que se permite crear usuarios. Mantén la verificación del correo activada.

En las plantillas de correo, configura **Magic Link / OTP** y **Confirm signup** con un código en lugar de un enlace. Asunto sugerido: `Tu código para Mi Mundo`.

```html
<h2>Entra a tu jardín</h2>
<p>Escribe este código en Mi Mundo:</p>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
<p>Si no lo pediste, puedes ignorar este correo.</p>
```

El juego verifica el código mediante `verifyOtp(type: 'email')`. No procesa enlaces mágicos ni tokens en la URL; no dejes la plantilla por defecto con solamente `ConfirmationURL`.

**Para enviar a tu novia se necesita un SMTP propio configurado en Supabase.** El servidor de correo de prueba de Supabase solo envía a miembros del equipo del proyecto, y tiene límites estrictos (actualmente 2 mensajes/hora). No agregues a jugadores al equipo administrativo para sortearlo. Configura un proveedor SMTP compatible y guarda host, puerto, remitente y credenciales SOLO en Supabase. Probar entrega a un correo fuera del equipo antes del cumpleaños. No hace falta compartir las credenciales SMTP conmigo.

Cuando exista el dominio de Cloudflare, configura también Site URL y las URLs autorizadas correspondientes al sitio. El acceso por código no depende de abrir un enlace de redirección.

## 3. Prueba local real antes de publicar

1. Ejecuta `pnpm dev` en `mundo-v2` y abre http://localhost:5174.
2. Pulsa la nube «Mi cuenta», escribe tu correo y solicita un código. Esta acción SÍ enviará un correo.
3. Entra con el código. Si la cuenta es nueva, elige explícitamente llevar el jardín sin cuenta o empieza uno nuevo. No hay transferencia automática de un jardín a otra cuenta.
4. Planta, escribe un mensaje y cambia el avatar. Pulsa «Guardar en mi cuenta ahora» y comprueba el mensaje de confirmación y la fecha.
5. Abre otro navegador o celular, entra con la misma cuenta y elige «Recuperar la cuenta». Comprueba plantas, mensajes, isla y avatar.
6. En dos dispositivos, guarda cambios distintos: debe aparecer la elección de versión. Exporta ambas antes de resolver. La versión reemplazada se conserva entre las últimas cinco copias locales de recuperación, descargables como JSON importable.
7. Corta la conexión después de abrir el juego, haz un cambio y vuelve a conectarte: debe seguir pendiente y enviarse después. El juego necesita cargar sus archivos web para arrancar; no es todavía una aplicación instalable garantizada sin conexión.
8. Cierra sesión: debe volver al jardín sin cuenta, sin mezclar sus datos. Vuelve a entrar a la cuenta para reenviar cualquier cambio pendiente en ese dispositivo.

## Cómo guarda

- Sin cuenta: conserva IndexedDB `mi-mundo-v2`, clave `garden`.
- Con cuenta: IndexedDB `mi-mundo-accounts`, claves `account:<userId>`. Partida, revisión y operación pendiente se escriben juntas en una transacción.
- Cada acción se guarda localmente antes de actualizar el juego. Se intenta sincronizar tras unos 5 segundos, al recuperar conexión, al cambiar visibilidad y cada 2 minutos mientras el juego está visible. Los intentos al salir son de mejor esfuerzo; no se garantiza una petición al cerrar el navegador.
- La operación pendiente sobrevive a una recarga. Una respuesta perdida no duplica un guardado. Los cambios hechos mientras se envía una petición siguen pendientes para el siguiente envío.
- Una segunda pestaña no puede sustituir silenciosamente el registro local: ante conflicto debe recargarse.
- Se consulta el estado remoto incluso sin cambios locales cada 2 minutos con el juego visible; no hay Realtime ni servidor que simule el mundo permanentemente.
- Un jardín más reciente en la cuenta se recupera con elección explícita. No se fusionan automáticamente plantas ni mensajes.
- Supabase conserva hasta 10 versiones anteriores, como máximo una nueva instantánea por cada 30 minutos con cambios. Son recuperación dentro de la misma base; NO un respaldo externo programado. La exportación JSON sigue siendo necesaria.
- El avatar ahora forma parte de la partida exportada y sincronizada. La preferencia antigua se migra solo al jardín sin cuenta.

## Arquitectura y continuidad

- `src/application/cloudSync.ts`: protocolo independiente de Supabase; puertos local y remoto; cola de operaciones y conflictos.
- `src/infrastructure/persistence/accountStore.ts`: almacenamiento transaccional por usuario.
- `src/infrastructure/cloud/supabase.ts`: SDK oficial y adaptador RPC con timeout; la identidad del propietario también se verifica en SQL.
- `src/presentation/ui/accountPanel.ts`: acceso, estado, resolución, recuperación y salida.
- `supabase/migrations/001_accounts_and_worlds.sql`: esquema versionado y permisos.
- `tests/cloudSync.test.ts`: desconexión, recarga, respuestas perdidas, escritura durante envío, conflictos y pestañas.
- `tests/database.test.ts`: migración ejecutada en PostgreSQL WebAssembly (PGlite), con roles y Auth simulados; aislamiento, prohibición de escritura directa, versiones, reintentos e instantáneas.
- `scripts/accounts-browser.mjs`: flujo móvil con Supabase interceptado, sin correos reales. No sustituye a las pruebas reales de dos cuentas en Supabase.

Las visitas por invitación, carta de cumpleaños y un respaldo externo automático siguen pendientes. No se han agregado permisos de visita ni exposición pública del mundo. La integración de cuentas está lista para activar y verificar, no declarada lista para producción.

### Verificación local realizada

- `pnpm test`: 25 pruebas correctas, incluyendo SQL ejecutado en PostgreSQL WebAssembly.
- `scripts/accounts-browser.mjs`: acceso OTP simulado, aislamiento invitado/cuenta, adopción explícita, guardado, recarga con Supabase desconectado, conflictos, avatar y cierre de sesión.
- `scripts/smoke-browser.mjs`: nueve comprobaciones del juego correctas; sin errores de página. Se corrigió la superposición del botón de mensaje sobre la acción de regar.
- Vista móvil emulada de 320 px: barra de herramientas y ventana de cuenta dentro de pantalla. No equivale a medir rendimiento en un celular físico.
- Compilación de TypeScript/Vite verificada localmente. Instalación limpia en Cloudflare y prueba con Auth/SQL del proyecto real pendientes.

## Despliegue posterior

Conservar `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package.json` y `.node-version`. Node 24.19.0, pnpm 11.19.0, build `pnpm build`, salida `dist`. La configuración pública ya está en el código para la subida manual. Opcionalmente se puede reemplazar en Cloudflare con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`; nunca usar claves administrativas con prefijo VITE.

Después de activar SQL y correo, compartir solamente: resultado de ejecución SQL, confirmación de que llegaron los códigos y cualquier mensaje de error sin secretos. Más adelante, compartir URL pages.dev para configurar y probar la versión publicada.

Referencias oficiales:
- https://supabase.com/docs/reference/javascript/auth-signinwithotp
- https://supabase.com/docs/reference/javascript/auth-verifyotp
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/database/postgres/row-level-security
