# Mi Mundo · Jardín de los Ecos

Versión 1.2. Proyecto principal: esta carpeta **mundo-v2**. Se trabaja y publica desde aquí; ya no se generan carpetas de entrega.

## Ejecutar y comprobar

Requisitos: Node 24.19.0 y pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
```

Juego local: http://localhost:5174/. Cloudflare compila con `pnpm build` y publica `dist`.

## Funciones actuales

- Jardín 3D, plantas con crecimiento real, avatar y bosque desbloqueable.
- Álbum sin revelar recuerdos pendientes, tarjetas adaptadas a celular.
- Tres ambientes y ciclo de cielo de 30 minutos, con hora virtual y fecha real separadas.
- Guardado local automático, cuenta Google, nube, conflictos y copias de recuperación.
- Evento asignado por correo verificado, cartas secuenciales y música privada.
- Invitaciones por enlace/código: contenido compartido de solo lectura y comentarios por tarjeta con cuenta propia.

Plan y detalles de esta actualización: [sprints 1.2](docs/SPRINTS-1.2.md). Incluye aviso de cuenta, nombre del mundo, invitaciones con WhatsApp, noche más oscura, año virtual y avatar personalizable.

## Antes de publicar

1. Lee [GitHub y despliegue](docs/GITHUB-Y-DESPLIEGUE.md).
2. Ejecuta las migraciones pendientes de Supabase. Esta actualización añade **010_shared_world_name.sql** para mostrar el nombre elegido en visitas. La revisión añadió **009_comment_cooldown.sql**: corrige un bypass del límite de envío al borrar comentarios.
3. Consulta [la revisión de seguridad](docs/REVISION-SEGURIDAD-1.1.md) y [activación de visitas](docs/ACTIVAR-VISITAS-1.1.md).
4. Prueba el retorno real de Google y una visita tras desplegar. Las pruebas de navegador automatizadas no usan las cuentas personales.

## Organización

- `src/`: juego, UI, dominio, guardado y acceso a Supabase.
- `public/`: recursos públicos y cabeceras de Cloudflare.
- `supabase/migrations/`: SQL versionado, sin destinatarios personales.
- `tests/`: pruebas de dominio, sincronización y permisos de PostgreSQL simulado.
- `scripts/`: comprobaciones y utilidades. Los scripts antiguos de diseño pueden referirse a versiones anteriores; los vigentes constan en la revisión.
- `docs/`: plan, activación y revisión. Las guías de entrega 1.0 son históricas.
- `private-gifts/`: datos personales y música privada local; **ignorado por Git**.
- `artifacts/`, `dist/`, `node_modules/`, `assets-source/`: archivos locales/generados; **ignorados por Git**.

No subir archivos `.env`, claves administrativas ni `private-gifts`. La clave `publishable` del cliente es pública; la protección real se aplica mediante Auth, RLS y funciones SQL.
