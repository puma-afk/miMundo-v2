# Música de las cartas

En la vista previa local ya están conectadas las canciones: Beso en el buzón y Cama y mesa en la carta final. El botón permite reproducir o pausar; cerrar la carta detiene la canción. No hay reproducción ni descarga automática. La música del jardín se pausa al reproducir una carta. Cambiar de página conserva la canción.

## Para que funcionen en el enlace publicado

1. En Supabase abre SQL Editor → New query. Copia todo `supabase/migrations/005_private_audio.sql`, pégalo y pulsa Run. Es un SQL nuevo, posterior a los que ya ejecutaste.
2. Entra a Storage. Abre el bucket `gift-audio` que acaba de crearse. Debe seguir como privado.
3. Dentro de ese bucket crea una carpeta llamada `september-gift-2026`.
4. Entra en esa carpeta, pulsa Upload files y sube estos dos archivos de `private-gifts/audio`:
   - `cama-y-mesa-roberto-carlos.mp3`
   - `beso-josean-log.mp3`
5. Conserva esos nombres. No los subas a GitHub ni a public. Se corrigieron las extensiones duplicadas; el archivo que venía como MPEG contiene tramas MP3 (MPEG Layer III). No se recodificaron los audios. Ambos se probaron con el navegador.

La configuración privada gift.json ya contiene los nombres. El archivo ASIGNAR-EVENTO-MANUAL.sql también está actualizado. La asignación por correo al primer inicio de sesión sigue pendiente; cuando se implemente debe incluir los campos file de las canciones. Sin regalo asignado, ninguna cuenta obtiene acceso a los audios.

El reproductor solicita un enlace temporal de 15 minutos al pulsar reproducir. La política solo permite los archivos enumerados en el regalo de la cuenta autenticada. Las visitas públicas no reciben el regalo ni el reproductor. La vista previa sirve el audio solo a conexiones locales con soporte de rangos; no forma parte del build publicado.

Estado: los audios están integrados localmente. No se han ejecutado el SQL 005 ni la subida de archivos en el Supabase remoto por el agente.
