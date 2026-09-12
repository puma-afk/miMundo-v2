# Activar visitas y conversaciones — versión local 1.1

Esta función está implementada y probada en local con base simulada. No se aplicó ningún cambio a tu Supabase ni se publicó el sitio.

## 1. Supabase
En SQL Editor crea una consulta y ejecuta, en este orden:
1. supabase/migrations/007_visits_and_comments.sql
2. supabase/migrations/008_visit_audio.sql
Requieren las migraciones anteriores del proyecto. No borres ni reemplaces las tablas. Son nuevas migraciones compatibles con partidas existentes.

007 permite compartir desde cualquier cuenta. Agrega códigos, copias de cartas y mensajes y conversaciones separadas de las partidas.
008 permite reproducir únicamente las canciones del evento incluidas en una invitación activa. El bucket gift-audio sigue privado. Los archivos de música deben estar subidos como antes. El acceso usa una URL temporal de 60 segundos: un enlace ya emitido puede funcionar hasta vencer; revocar no borra contenido que alguien ya leyó o descargó.

## 2. Google
En Supabase, Authentication → URL Configuration, añade la URL de retorno de visitas para cada origen que uses. Ejemplos:
- http://localhost:5174/**
- http://127.0.0.1:5174/**
- https://mimundo-v2.pages.dev/**
El retorno conserva ?visit=... para volver a la isla después de entrar con Google. El callback de Google Cloud continúa siendo el de Supabase; no hay que cambiarlo.

## 3. Probar en local
1. Inicia sesión con tu propia cuenta y confirma que el mundo esté guardado en la nube.
2. Abre el icono de brújula: «Visitar y compartir mundos».
3. Pulsa «Crear / actualizar invitación». La pantalla explica que se comparten cartas, mensajes y respuesta, si existen.
4. Copia el enlace y ábrelo en otra ventana privada. También puedes pegar su código de 12 caracteres en el formulario de visitas.
5. Acércate a objetos para leer historias y dedicatorias. El visitante no puede plantar, editar, guardar una respuesta al evento ni exportar/importar la partida.
6. Dentro de una carta abre «Voces que se quedan». Se pueden leer comentarios sin cuenta. Google habilita el formulario de nombre y mensaje. Ese nombre es un apodo elegido, no una identidad verificada.
7. El autor y el propietario pueden eliminar comentarios. Comprueba ambos casos con cuentas diferentes.
8. Desactiva la invitación: el enlace/código anterior debe dejar de funcionar. Los comentarios se conservan y vuelven a estar disponibles al crear una nueva invitación, con enlace y código nuevos.

No publiques de nuevo hasta terminar esta comprobación. Las invitaciones antiguas siguen mostrando su copia anterior hasta que el dueño pulse actualizar. Los cambios nuevos del jardín no aparecen automáticamente: guarda en la nube y actualiza la invitación.

## Alcance
- Compartir no asigna el evento a otros jugadores. Solo la cuenta destinataria puede responder y progresar en él.
- Las visitas muestran el jardín principal compartido. No hay jugadores simultáneos ni buscador público.
- Conversación por las seis tarjetas de recuerdos, sin respuestas anidadas ni notificaciones. Las plantas muestran dedicatorias en lectura.
- Hasta 500 caracteres por comentario, 15 segundos entre envíos y 500 comentarios por jardín. Se leen de 30 en 30.
- Credenciales, correo, UID del propietario y datos de acceso no forman parte de la copia pública.
- Las pruebas locales cubren permisos SQL y UI con servicios simulados. Falta confirmar en tu Supabase real el retorno de Google, el audio y las nuevas migraciones.

## Revisión posterior
Ejecutar también `009_comment_cooldown.sql` después de 007 y 008. Corrige el límite de envío para que borrar un comentario no permita enviar otro inmediatamente. Ver `REVISION-SEGURIDAD-1.1.md`.
