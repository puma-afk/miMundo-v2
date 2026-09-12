# GitHub y Cloudflare — trabajar directamente en mundo-v2

No se generan copias de entrega. El código válido es el contenido de mundo-v2.

## Atención al repositorio local
En la revisión del 12/09/2026, Git detectaba un repositorio en la carpeta superior miMundo, cuyo origin era git@github.com:puma-afk/miMundo.git. Es el prototipo antiguo. Abrir mundo-v2 en un editor no crea por sí solo un repositorio independiente.

El destino de esta versión es https://github.com/puma-afk/miMundo-v2.git. Usa el método de conexión que ya configuraste, comprobando la carpeta raíz y el remoto antes de confirmar/subir. No se cambió el remoto del prototipo ni se creó un historial Git nuevo durante la revisión.

```sh
git rev-parse --show-toplevel
git remote -v
git status --short
```

La raíz del repositorio de la versión nueva debe contener package.json, src, public y supabase. Si tu herramienta está usando el Git de la carpeta superior, no pulses sincronizar: selecciona el repositorio miMundo-v2 que configuraste.

## Archivos y protección
.gitignore excluye node_modules, dist, artifacts, assets-source, private-gifts, .env y logs. No uses `git add -f` para esos archivos. Si ya estaban versionados, .gitignore no los elimina del historial.

Antes de confirmar:
```sh
pnpm test
pnpm build
pnpm check:private
```
El último comando comprueba los archivos de código/publicación y el bundle, sin copiar el proyecto.

## Despliegue
Mantén Cloudflare Pages conectado a miMundo-v2. Comando de compilación: pnpm build. Directorio de salida: dist. Node 24.19.0; pnpm 11.19.0. Si package.json está en la raíz de GitHub, deja vacío el directorio raíz de Cloudflare.

Las migraciones no se ejecutan por subir a GitHub. Si ya aplicaste 007 y 008, falta 009_comment_cooldown.sql, añadido por la revisión. No ejecutes de nuevo el SQL privado de asignación para esta actualización.

Después de publicar, verifica Google, guardado y visita desde móvil. La revisión local no publica ni cambia Cloudflare automáticamente.
