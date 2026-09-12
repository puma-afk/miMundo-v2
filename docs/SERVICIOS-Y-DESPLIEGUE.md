# Servicios del proyecto

Actualizado: 10 de septiembre de 2026.

## Enlaces confirmados por el propietario

- GitHub de la nueva versión: https://github.com/puma-afk/miMundo-v2
- URL Git: https://github.com/puma-afk/miMundo-v2.git
- Supabase Project URL: https://lnjwbnhhwsmtonuxlasd.supabase.co
- Referencia del proyecto Supabase: `lnjwbnhhwsmtonuxlasd`
- Cloudflare: el propietario ya se registró mediante GitHub. Falta confirmar que exista un proyecto Pages conectado y conocer su URL pública.

El repositorio de la carpeta superior sigue apuntando a `puma-afk/miMundo`. No cambiar su remote por el de v2 ni subir el prototipo completo accidentalmente.

## Cloudflare Pages

Registrarse con GitHub no conecta automáticamente un repositorio para desplegarlo.

En Workers & Pages, crear una aplicación Pages e importar el repositorio `puma-afk/miMundo-v2`. Autorizar a Cloudflare el acceso a ese repositorio si lo solicita.

Configuración prevista si v2 queda en la raíz del nuevo repositorio:

- Comando de compilación: `pnpm build`.
- Carpeta de salida: `dist`.
- Directorio raíz: raíz del repositorio (vacío).
- Rama de producción: seleccionar la rama que se haya subido; verificar su nombre, no asumirlo.
- Usar Node 24.19.0 y pnpm 11.19.0, fijados en el proyecto. El primer despliegue debe confirmar también la instalación limpia en Cloudflare.

Si el repositorio contuviera una carpeta `mundo-v2/` en lugar de los archivos directamente, cambiar el directorio raíz a `mundo-v2`.

El propietario puede compartir el enlace público `https://...pages.dev` y el nombre del proyecto después de crearlo. Si falla el despliegue, compartir el mensaje de error y el registro de compilación, ocultando cualquier secreto. No hace falta compartir contraseña ni token de Cloudflare para realizar esta conexión desde su panel.

Referencia oficial: https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/

## Supabase: lo que todavía falta

El código de cuentas, sincronización y esquema SQL está implementado localmente. Falta ejecutar la migración en el proyecto, configurar las plantillas OTP y el proveedor SMTP, y verificar el acceso y guardado reales. Seguir `ACTIVAR-SUPABASE.md`.

El propietario ya proporcionó la clave **publishable**; quedó como configuración pública en `src/content/cloud.ts`. La lectura pública de Auth respondió HTTP 200. Nunca poner claves secret/service_role, contraseña de la base ni tokens administrativos en el cliente, el repositorio o variables VITE_*.

Configurar Site URL y URLs de redirección autorizadas cuando se conozca el dominio Pages. Los valores públicos pueden reemplazarse mediante variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. No afirmar que ya hay guardado en el proyecto real hasta ejecutar la migración y probarlo.

## Estado

Enlaces guardados. Publicación GitHub, primer despliegue Pages y conexión de Supabase deben verificarse por separado y registrar aquí su resultado cuando se completen.

### Comprobación de acceso del 10 de septiembre de 2026

- El propietario indica haber completado el inicio de sesión. Todavía no se pudo validar acceso al repositorio.
- Git 2.55.0 y Git Credential Manager 2.9.0 están instalados.
- La consulta HTTPS falla antes de autenticar: Windows bloquea la carga de `libcurl-4.dll` por una directiva de Control de aplicaciones, incluso fuera del entorno restringido.
- SSH alcanza la comprobación de identidad del servidor, pero no existe una clave de host ED25519 conocida para GitHub. No se desactivó esa comprobación ni se validó la autenticación SSH.
- No se ha hecho commit ni push de v2, y el remote del prototipo permanece sin cambios.
- Siguiente diagnóstico: ejecutar `git ls-remote https://github.com/puma-afk/miMundo-v2.git` en PowerShell del propietario para determinar si el bloqueo también afecta a su terminal.
- El propietario confirmó el mismo error en PowerShell y el instalador actualizado también fue bloqueado. Se acordó la subida manual desde el navegador.
- Se preparó `ENTREGA-GITHUB-2026-09-10/github` en la carpeta superior, como copia de entrega. Las instrucciones están en `SUBIDA-MANUAL.md`. El código de trabajo continúa en `mundo-v2`.
