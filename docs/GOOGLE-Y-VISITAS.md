# Google, evento privado y visitas

Música implementada en las cartas del buzón y la estrella. Ver ACTIVAR-MUSICA.md para instalar SQL 005 y subir los dos audios al almacenamiento privado antes de publicar. El propietario confirma ejecutados los SQL anteriores, salvo la asignación del destinatario.

## Probar sin la cuenta destinataria

En tu computadora abre `http://localhost:5174/?gift-preview=1`. Funciona también si ya iniciaste sesión con otra cuenta: esta pantalla usa un guardado de prueba separado y no sincroniza con Supabase. Pulsa «Probar desde el inicio» para crear otra prueba vacía sin borrar ninguna partida. El parámetro preview-run identifica esa prueba y conserva su avance al recargar. Este acceso solo existe en desarrollo local; no concede regalos a cuentas de producción.

Las cartas del evento usan una sola cabecera y controles SVG circulares con etiquetas accesibles: flecha derecha para avanzar, izquierda para volver, marca de verificación para guardar la respuesta y X para regresar a la isla.

Para volver al juego con guardado en cuenta, pulsa ☁ en la vista previa; abre el mundo normal y su panel de cuenta. «Volver a mi mundo» también permite salir. En desarrollo, el mundo normal tiene el enlace «Probar evento». El tablero Tu jardín ahora indica la carta pendiente y filtra las pistas futuras, al igual que el álbum y la isla. Los recuerdos del árbol y de la botella son historias libres, no pasos de la búsqueda. Las ubicaciones de las cartas normales se identifican como «Estás aquí» para no confundirlas con destinos.

El botón Continuar con Google usa Supabase OAuth con PKCE. El SDK procesa el regreso antes de cargar la partida. No agregar el secreto OAuth al frontend: se configura únicamente en el proveedor Google de Supabase.

## Activación en Supabase

Respuesta única: ejecutar también `supabase/migrations/004_sealed_response.sql` en SQL Editor → Run. Impide sobrescribir una respuesta ya guardada en la nube. No ha sido ejecutada en el Supabase real por el agente. El juego ya bloquea la edición local y las importaciones que quiten o cambien una respuesta cerrada. La tarjeta muestra un campo corto que crece con el texto; después de guardar solo se muestra la respuesta, sin editor. Una respuesta vacía no cierra la carta.

1. En Authentication → URL Configuration, autorizar `http://localhost:5174/` como Redirect URL durante las pruebas. El botón vuelve a ese origen sin el parámetro de vista previa. Al publicar, configurar Site URL y Redirect URL con el dominio real.
2. El callback de Google Cloud sigue siendo `https://lnjwbnhhwsmtonuxlasd.supabase.co/auth/v1/callback`. Usar como origen JavaScript `http://localhost:5174` y posteriormente el dominio publicado.
3. Ejecutar las migraciones 002 y 003 si aún no están instaladas, después de 001. Son repetibles. La ejecución remota no está realizada por el agente.
4. La destinataria debe iniciar sesión. Copiar su UUID desde Authentication → Users. Ejecutar `node scripts/prepare-private-gift.mjs UUID` y ejecutar el SQL generado en `private-gifts/assign-gift.sql` en el SQL Editor. Nunca subir private-gifts a GitHub. El nombre o correo visible no concede acceso al evento.

## Recorrido exclusivo

Solo la cuenta con regalo asignado (y la vista previa local de desarrollo) ve las cartas especiales. Buzón → farol → flor → estrella: objetos y tarjetas futuros ocultos hasta terminar la carta anterior. Las tres páginas se recorren en orden; la última guarda la pista. Las cartas anteriores se pueden releer. Un fallo de guardado permite reintentar y no desbloquea el siguiente objeto.

Una vista previa con progreso anterior conserva las pistas ya descubiertas: no se borró el progreso del propietario. La carta original se conserva íntegra y la respuesta es privada.

## Compartir

Actualización de presentación: no mostrar «no es una pista» ni explicaciones sobre envío/guardado dentro de las cartas. Todos los recuerdos usan controles SVG. Los enlaces de prueba y cambio a vista previa están limitados a desarrollo y nunca se montan en la ruta de visita; el visitante solo tiene «Salir de la visita».

La cuenta asignada dispone del botón Compartir mi jardín (↗). Primero guardar en su cuenta; luego Crear / actualizar enlace publica una copia de ese guardado. No hay publicación automática. El enlace permite visitar sin cuenta o con una sesión existente; no modifica ni carga el mundo propio del visitante.

La RPC construye una copia pública por lista explícita de campos. Excluye mensajes, carta, respuesta, progreso del evento e identidad. La tabla no permite lectura directa; la visita usa un token aleatorio. Solo el propietario asignado puede publicar su copia y revocarla. Actualizar conserva el enlace; desactivarlo impide nuevas cargas, pero no borra una copia ya abierta en otro navegador.

Esta primera visita es al jardín principal, en modo exploración; no es multijugador simultáneo. El botón de actualización permite elegir cuándo reflejar nuevos cambios. No compartir enlaces localhost como entrega: requieren el dominio publicado.

## Validación

Pruebas SQL con PostgreSQL local para lectura anónima por token, aislamiento, sanitización y revocación; pruebas de navegador para recorrido, Google PKCE y visita. Queda pendiente la prueba real de acceso Google y visitas tras instalar SQL en Supabase y asignar la cuenta. La entrega manual antigua está desactualizada.
