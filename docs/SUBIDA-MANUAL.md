# Publicar la primera versión

Preparado el 10 de septiembre de 2026. Esta entrega incluye el juego actual; cuentas, guardado en Supabase y visitas siguen pendientes. El progreso local de localhost no aparece automáticamente en el dominio nuevo: exporta la partida desde el juego e impórtala en el sitio publicado.

## 1. Subir a GitHub

Repositorio: https://github.com/puma-afk/miMundo-v2

1. Abre el repositorio. Si está vacío, pulsa «uploading an existing file»; si tiene archivos, «Add file > Upload files».
2. Abre en Windows la carpeta `ENTREGA-GITHUB-2026-09-10/github`. Selecciona TODO su contenido y arrástralo a la página de subida. Arrastra su contenido, no la carpeta `github` completa.
3. Deben aparecer en la raíz `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `index.html`, `.gitignore`, `.node-version` y las carpetas `src`, `public`, `docs`, `scripts` y `tests`. Incluye también README, tsconfig y vite.config. Activa la visualización de archivos ocultos si fuera necesario.
4. Revisa la lista y confirma con el mensaje «Primera versión del jardín de los ecos». En un repositorio vacío puedes usar la rama `main`; si ya tiene contenido, revisa lo existente antes de reemplazar archivos.
5. Espera a que termine. Confirma que `src/main.ts` y `public` estén presentes y que `package.json` esté en la raíz.

No subas un ZIP como sustituto del código: GitHub no lo descomprime. No agregues node_modules, dist, assets-source, archivos .env ni partidas personales. Esta carpeta ya los excluye. La entrega es una copia: el desarrollo continúa en `mundo-v2`, y hay que actualizar la copia para publicar cambios posteriores.

La subida web admite 100 archivos por operación y 25 MiB por archivo. Esta entrega cabe en esos límites.

## 2. Cloudflare Pages

Después de completar toda la subida, entra a Cloudflare, abre Workers & Pages y crea un proyecto **Pages** conectado a Git. Selecciona GitHub y `puma-afk/miMundo-v2`. Si el flujo muestra un comando de despliegue `wrangler deploy`, estás en el flujo de Workers: vuelve y elige Pages.

Configuración:

| Campo | Valor |
| --- | --- |
| Nombre sugerido | mi-mundo-v2 (u otro disponible) |
| Rama de producción | La rama donde subiste el código, normalmente main |
| Framework | Vite, o None con los valores siguientes |
| Directorio raíz | Vacío: package.json debe estar en la raíz |
| Comando de compilación | pnpm build |
| Directorio de salida | dist |
| Variable de compilación NODE_VERSION | 24.19.0 |
| Variable de compilación PNPM_VERSION | 11.19.0 |

El repositorio fija esas versiones en package.json y .node-version y conserva el lockfile. Cloudflare instalará las dependencias antes de compilar. No necesita claves de Supabase para ejecutar esta versión local. Guarda y despliega; espera a que el estado sea correcto y abre el enlace pages.dev.

## 3. Comprobar el enlace

- Abre el juego en el celular, comprueba movimiento, botones y lectura de una historia.
- Planta y escribe un mensaje, recarga y comprueba que permanecen en el mismo navegador.
- Prueba exportar e importar una partida. Conserva tu copia fuera del navegador.
- El guardado todavía depende del navegador y dominio; no es una cuenta ni una copia en la nube. El modo privado o borrar los datos del navegador puede eliminarlo.
- Comprueba la música después de tocar el botón de reproducción.

## Datos que debe compartir el propietario después

- Confirmación de que terminó la subida y nombre de la rama.
- URL pública pages.dev y nombre del proyecto Cloudflare.
- Si falla, el registro de compilación sin secretos.
- Para la siguiente etapa de cuentas: clave pública publishable de Supabase (o anon pública heredada). La URL ya está guardada: https://lnjwbnhhwsmtonuxlasd.supabase.co. Nunca compartir una clave secret/service_role, contraseña de base de datos ni token administrativo en el chat o repositorio.

No se necesita contraseña de GitHub ni Cloudflare para esta subida manual. El acceso a cuentas y visitas requiere implementar y probar el esquema, Auth y políticas de acceso antes de anunciarlo como disponible.

Referencias:
- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/
