# Entrega 1.0 — 12 de septiembre

El código incluye Google con PKCE, guardado local y sincronización, copias exportables, evento privado con cuatro cartas, respuesta cerrada, dos canciones privadas y visitas de solo lectura por enlace.

La asignación automática busca una invitación privada usando el correo confirmado de auth.users. El cliente no decide el destinatario. El archivo local private-gifts/ACTIVAR-REGALO.sql contiene la configuración real y las migraciones; no forma parte de GitHub ni de la web publicada.

## Para publicar en Cloudflare Pages desde GitHub

Subir el CONTENIDO de la carpeta github de la entrega a la raíz del repositorio miMundo-v2. package.json debe quedar en la raíz, no dentro de otra carpeta. No usar la entrega del 10 de septiembre.

- Comando de compilación: `pnpm build`
- Carpeta de salida: `dist`
- Directorio raíz: dejar vacío
- Variable de entorno `NODE_VERSION`: `24.19.0`
- Variable de entorno `PNPM_VERSION`: `11.19.0`

Las claves públicas de Supabase ya están configuradas. El secreto de Google permanece únicamente en Supabase.

Cuando Cloudflare entregue la URL https://…pages.dev:
1. En Supabase → Authentication → URL Configuration, poner esa URL como Site URL y agregarla con `/` al final en Redirect URLs.
2. En Google Cloud → cliente OAuth, agregar esa URL sin ruta como origen JavaScript. Mantener como redirección el callback https://lnjwbnhhwsmtonuxlasd.supabase.co/auth/v1/callback.
3. Abrir el enlace público e iniciar sesión con una cuenta de prueba. Plantar, guardar y verificar desde otro navegador que se puede recuperar la partida. Probar el enlace de visita cuando la cuenta del evento esté asignada.

Documentación oficial: https://developers.cloudflare.com/pages/configuration/build-image/ y https://developers.cloudflare.com/pages/get-started/git-integration/.

## Estado y límites

La compilación y las pruebas locales no sustituyen una prueba en el dominio real. Quedan fuera de la ejecución local: ejecutar el SQL privado en Supabase, confirmar la subida de los MP3 a Storage, subir el repositorio y publicar. La asignación por correo se realiza al entrar en el juego después de iniciar sesión; la cuenta destinataria no debe existir de antemano.

Las visitas muestran una copia del jardín principal, no multijugador en tiempo real. No incluyen cartas, respuestas ni mensajes privados. Los controles de vista previa no existen en producción. No borrar progresos para hacer pruebas: la vista previa local usa partidas separadas.
