# Revisión de seguridad y pruebas — 12/09/2026

Versión revisada: 1.1. No es una certificación de ausencia de vulnerabilidades. Se revisaron guardado, aislamiento entre usuarios, asignación del evento, publicación, comentarios, audio, secretos y dependencias.

## Hallazgo corregido
**Límite de comentarios eludible al borrar el mensaje.** La función 007 miraba los mensajes existentes para aplicar los 15 segundos. Un autor podía borrar su comentario y volver a enviar inmediatamente.

Se añadió `supabase/migrations/009_comment_cooldown.sql`: mantiene la fecha de envío en una tabla privada por autor, fuera de los mensajes eliminables. La comprobación y la actualización ocurren en una transacción con bloqueo por usuario. La prueba reproduce borrado seguido de reenvío y exige rechazarlo.

**Pendiente de activación:** ejecutar 009 manualmente en Supabase. El cambio de código en GitHub no ejecuta SQL. Las migraciones 007 y 008 que ya aplicaste se conservan.

## Resultados locales
- 33 pruebas Node/PGlite correctas: permisos, identidad, RLS, revisiones, conflictos, copias, evento y comentarios.
- Navegador: accounts-browser, google-visits-browser y visits-v2-browser correctos. Incluyen aislamiento invitado/cuenta, desconexión, retorno simulado de Google, cartas compartidas en lectura, texto que contiene etiquetas HTML tratado como texto y envío/eliminación de comentarios.
- Compilación TypeScript/Vite correcta. Sigue existiendo el aviso de tamaño del motor 3D; no es un fallo de compilación ni un hallazgo de seguridad.
- Auditoría de dependencias (`pnpm audit`, registro remoto): 0 avisos conocidos en las dependencias resueltas a la fecha de revisión. No detecta vulnerabilidades desconocidas ni garantiza el código propio.
- Escaneo de código, archivos públicos y bundle: sin correo/carta personal configurados, claves administrativas ni archivos privados versionados. `pnpm check:private` repite este control sin crear copias.
- Cabeceras para Cloudflare: no incrustación en marcos, no sniffing MIME y no envío de Referer, además de desactivar permisos de cámara, micrófono y ubicación. Se aplicarán al siguiente despliegue.

## Comprobaciones reales, sin modificar datos
Supabase respondió:
- Google habilitado.
- RPC de visitas v2 y lectura de comentarios: 200 con null/lista vacía para una invitación inexistente.
- Acceso anónimo directo a world_saves, world_gifts, gift_invitations, visit_comments y world_visits: 401 con código PostgreSQL 42501 (denegado).
- Las solicitudes de OAuth desde localhost, 127.0.0.1 y el dominio publicado obtuvieron redirección 302 hacia Google. El estado de OAuth no permite deducir aquí el destino final; esto **no confirma por sí solo** que el retorno conserve la invitación. Falta recorrer Google con una sesión real en el dominio desplegado.

No se inició sesión como la destinataria, no se publicaron comentarios reales y no se aplicaron migraciones ni cambios a partidas reales.

## Límites y observaciones
- Conocer una invitación activa concede lectura de su contenido, deliberadamente. Revocar no puede borrar lo que ya fue leído o descargado. La interfaz de visita no ofrece exportación, pero el contenido legible en un navegador no puede hacerse incopiable.
- Los apodos de comentarios no son identidades verificadas.
- Las conversaciones no tienen moderación automática; el propietario puede eliminar mensajes. Los límites reducen abuso, no sustituyen una protección global si el sitio crece mucho.
- Los permisos de audio se probaron con PostgreSQL simulado. La reproducción y redirección final de Google deben verificarse con una invitación propia tras publicar.
- Las fechas locales dependen del reloj del dispositivo; no sirven como prueba de auditoría del servidor.

## Carpeta y Git
Se eliminaron las dos carpetas antiguas de entrega y el generador prepare-release. El proyecto está en mundo-v2; recursos originales y prototipo superior se conservaron.
Git detecta en la carpeta superior el remoto del proyecto antiguo miMundo. No se cambió ese remoto ni se creó un repositorio nuevo que pudiera romper el historial. Ver GITHUB-Y-DESPLIEGUE.md antes de sincronizar con miMundo-v2.
