# Mejoras locales después de la versión 1.0

Acuerdo del 12 de septiembre de 2026. Trabajar primero en mundo-v2; no publicar ni reemplazar ENTREGA-GITHUB hasta revisar los sprints.

## Sprint 1 — Descubrimiento y álbum
- Mostrar únicamente recuerdos descubiertos, también en el tablero lateral.
- Estado vacío sin títulos, objetos ni ubicaciones que revelen las historias.
- Tarjetas compactas de cristal marfil/lavanda, símbolos SVG y una columna en celular.
- Mantener la lectura desde los objetos. No alterar partidas existentes.
- No inventar fechas de descubrimiento para los recuerdos antiguos.

## Sprint 2 — Ambiente y tiempo
- Sustituir controles manuales de hora por Jardín de ensueño, Bosque encantado y Brisa celeste.
- Ciclo visual automático: 30 minutos reales por día completo, también en bosque.
- Guardar preferencia de ambiente; asegurar continuidad del reloj al recargar y volver.
- Mantener crecimiento de plantas con tiempo real, independiente del cielo.
- Indicador pequeño de hora virtual y fase; al expandir, fecha real y días reales desde la creación del jardín. No inventar antigüedad de partidas sin esa información.

## Sprint 3 — Guardado y fechas
- Estado real: dispositivo, nube, guardando, pendiente de sincronizar o error.
- Mostrar fecha/hora del último guardado exitoso, separando local de nube.
- Acceso claro a Google desde modo invitado; exportar es respaldo opcional.
- Verificar persistencia, cambio de cuenta y fallos de red sin mezclar mundos.

## Sprint 4 — Visitas y comentarios
Cambio autorizado: las visitas podrán leer todas las cartas, mensajes y el evento compartido, incluida la respuesta. La privacidad anterior del evento frente a visitantes queda sustituida por este acuerdo; otros mundos continúan sin recibir el evento.
- Enlace y código revocables. No usar UID ni correo como código público.
- Lectura sin cuenta; para comentar, cuenta propia de Google.
- Publicar una copia de contenido legible, nunca credenciales, correo ni datos de autenticación del propietario.
- Prohibir modificar, importar/exportar o guardar como propia la partida visitada. Cambiar de cuenta solo afecta a la sesión del visitante.
- Comentarios por tarjeta, estilo conversación sencilla: autor, texto y fecha; tabla separada del guardado. No son respuestas a la propuesta ni avances del evento.
- Validar permisos en Supabase, texto limitado y frecuencia; propietario puede eliminar comentarios, autores pueden eliminar los propios.
- Compartir contenido completo requiere actualizar RPC de publicación/lectura, acceso al audio y UI de lectura del evento sin avances ni editores.
- Migración nueva compatible con enlaces existentes; no hacer públicos los datos mediante acceso directo a world_gifts o world_saves.
- Sin buscador público ni presencia multijugador en esta etapa.

## Validación y entrega
Verificar celular y escritorio, partida existente, invitado, dueño, otra cuenta y visitante anónimo. Pruebas de permisos: leer lo compartido, rechazar escrituras sobre partida ajena y comentarios con autor falsificado. Build antes de preparar una nueva carpeta de entrega. Las migraciones se entregan para ejecución manual del usuario; no afirmar que están activas en Supabase sin comprobarlo.

## Estado
Sprint 1: álbum y tablero implementados. TypeScript correcto. Verificado en navegador a 390 y 1440 px: vacío sin spoilers, descubrimiento tras guardar y sin desbordamiento horizontal. Diseño móvil revisado en captura. No se añadieron fechas ficticias ni se modificaron guardados.
Sprint 2: implementado en local. Ciclo visual de 30 minutos calculado con reloj real, independiente de pausas y FPS; sigue en bosque. Tres paletas ligeras, preferencia guardada en este navegador. Indicador expandible con hora/día virtual y fecha/hora real. Jardines nuevos guardan createdAt; jardines antiguos mantienen antigüedad desconocida y usan una referencia estable solo para el reloj visual. Crecimiento real intacto. Pruebas de navegador 390/1440 px: reloj accesible, cambio real de iluminación, preferencia persistente y continuidad tras recarga. 29 pruebas anteriores y 2 nuevas correctas.
Sprint 3: implementado en local. Ajustes y Mi cuenta muestran estado, fecha local y confirmación remota por separado. Los metadatos locales se escriben en la misma transacción que la partida (invitados: clave independiente en IndexedDB; cuentas: localSavedAt en el sobre local). No se inventan fechas para copias antiguas. Un fallo conserva la confirmación anterior y muestra error. Guardado automático explicado y acceso a cuenta desde Ajustes. Verificado: 32 pruebas unitarias/BD, navegador móvil con guardado fallido simulado, fecha persistente tras recarga, aislamiento de cuentas, desconexión y conflictos mediante Supabase simulado.
Sprint 4: implementado en local. Invitaciones por UUID o código de 12 caracteres para cualquier cuenta; lectura del evento completo y dedicatorias, sin escritura/exportación de la partida visitada. Comentarios por tarjeta con cuenta propia, paginación, límites y eliminación por autor/propietario. Revocar rota credenciales y desactiva acceso conservando la conversación. Audio mediante invitación activa y URL temporal. Nuevas migraciones 007 y 008, aún NO aplicadas al Supabase real. Ver docs/ACTIVAR-VISITAS-1.1.md. Pruebas SQL de permisos, contenido compartido, plantas sin regar, comentarios y audio; navegador móvil/escritorio para lectura, envío/eliminación simulados y Google/visitas. Falta validación real tras aplicar SQL y configurar retorno de Google. No se publicó una entrega nueva.


## Revisión y limpieza posterior
Versión 1.1 revisada. Ya no crear ni regenerar carpetas de entrega; trabajar desde mundo-v2. Se retiraron las entregas duplicadas y el script prepare-release. Ver README.md y REVISION-SEGURIDAD-1.1.md. Aplicar manualmente SQL 009 antes de publicar la corrección del límite de comentarios.
