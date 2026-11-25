# Reglas del proyecto

## Cómo trabajamos (común a todos los proyectos)
- Al empezar: leer docs/ESTADO.md y docs/DECISIONES.md, revisar `git status`, la rama y `git log -n 10`. Resumir en 10 líneas qué funciona, qué está en proceso y qué sigue. No modificar nada hasta que el usuario confirme.
- Proponer un plan antes de cambios grandes y esperar confirmación.
- Cambios pequeños y verificables; un commit por tarea terminada.
- No crear archivos ni carpetas fuera de `salidas/` sin preguntar.
- No modificar `docs/` salvo al cerrar la sesión o si se pide.
- Nunca subir secretos: `.env`, claves, tokens o contraseñas reales.
- Si algo no está claro en el contexto, preguntar; no inventar.
- Al terminar: actualizar docs/ESTADO.md (completado, a medias con archivo exacto, siguiente paso), registrar decisiones nuevas en docs/DECISIONES.md y hacer commit.

## Delegación entre agentes
- Claude: diseña, divide en tareas y revisa. Codex: implementa tareas bien definidas. Gemini: lee y analiza material grande.
- Cada tarea delegada tiene un brief en `docs/tareas/T-NNN.md` (objetivo, archivos a tocar, qué no tocar, criterios de aceptación, entregable).
- Una tarea, un agente, una rama `tarea/T-NNN`. Nada se integra sin revisar el diff y pasar las pruebas.

## Este proyecto: Mi Mundo · Jardín de los Ecos (v2)
- Qué es: juego/jardín 3D personal con recuerdos, cartas, invitaciones y comentarios. Versión 1.2.
- Stack: TypeScript + Vite, Supabase (Auth, RLS, migraciones en supabase/), Cloudflare Pages (publica `dist`). Node 24.19.0, pnpm 11.19.0.
- Comandos: `pnpm install --frozen-lockfile`, `pnpm dev` (http://localhost:5174), `pnpm test`, `pnpm build`, `pnpm check:private`.
- Documentación: README.md y docs/ (empezar por docs/PLAN-Y-CONTEXTO.md y docs/SPRINTS-1.2.md).
- Prohibido:
  - Subir `.env`, claves administrativas o `private-gifts/` (datos personales y música privada).
  - Ejecutar `pnpm check:private` antes de cada push.
- El repo antiguo `puma-afk/miMundo` (carpeta `miMundo/`) es la versión 1, ya no se usa.
