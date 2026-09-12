# Mi Mundo · El jardín de los ecos

Versión 1.0: [guía vigente de entrega y publicación](docs/ENTREGA-1.0.md). Incluye Google, asignación automática del regalo por correo verificado, música privada y visitas. Las secciones históricas de planificación deben interpretarse junto con esta guía.

> Continuidad del proyecto: [plan, arquitectura y contexto actualizado](docs/PLAN-Y-CONTEXTO.md). Incluye cuentas, sincronización, respaldos y etapas del regalo.

> Cuentas y nube: implementación local disponible. Antes de usarla, ejecutar el SQL y configurar el correo según [Activar Supabase](docs/ACTIVAR-SUPABASE.md). El despliegue y las pruebas en el proyecto real están pendientes.

> Regalos privados: asignación por correo verificado mediante SQL 006; el destinatario se configura solo en el SQL privado. Google ya está implementado. Vista previa local separada y visitas sin contenido privado.

Primera versión jugable de un jardín de fantasía para navegador. Proyecto independiente dentro de `mundo-v2`; el prototipo de la carpeta superior permanece intacto.

## Ejecutar

Requisitos: Node.js 24.19.0 (rama 24) y pnpm 11.19.0, fijados en `package.json` y `.node-version`.

Para publicar sin Git instalado, seguir [la guía de subida manual y Cloudflare Pages](docs/SUBIDA-MANUAL.md).

```sh
pnpm install
pnpm dev
```

Abrir `http://localhost:5174`. Para probar desde un celular en la misma red, usar la dirección de red que muestre Vite y permitir el acceso del servidor en el firewall si Windows lo solicita.

```sh
pnpm test
pnpm build
pnpm preview
```

La versión publicable se genera en `dist/`. No abrir el HTML con doble clic: necesita un servidor HTTP. Las herramientas usan variantes WebAssembly de Rollup y esbuild para evitar incompatibilidades con las dependencias nativas en este Windows. Esa decisión afecta la velocidad de compilación. Por separado, el juego incluye un pequeño decodificador Draco WebAssembly local para sus modelos.

## Qué incluye

- Isla con terreno suave, camino curvo, árbol mágico GLB, estanque, arco y banco. El árbol original se carga con texturas optimizadas; una representación ligera permanece disponible si falla su carga.
- Cielo procedural con nubes, sol, atardecer, estrellas y luna. Su hora se puede ajustar y avanza de forma independiente del crecimiento real.
- Personaje estilizado, cámara orbital, WASD/flechas, clic para caminar y joystick táctil.
- Seis parcelas para plantar y regar flores de luna. Crecen durante seis horas reales; regarlas una vez adelanta tres horas y muestra una nueva etapa. Nunca mueren por ausencia.
- Seis recuerdos con tres escenas breves cada uno, acciones, ilustraciones animadas y álbum de colección. El árbol, buzón, farol, botella, flor y estrella abren historias propias. Se guardan al pulsar el botón final; las animaciones se pueden pausar.
- Guardado IndexedDB, exportación e importación JSON con confirmación. Detección de escrituras de otra pestaña para evitar sobrescrituras silenciosas.
- Acceso por correo y código; guardado por cuenta, cola local persistente, revisiones remotas y resolución explícita de conflictos. Requiere activar las tablas y el envío de correo en Supabase.
- Tres niveles gráficos y reducción de movimiento. Selector de avatar mujer/hombre; la elección forma parte de la copia del jardín y se sincroniza con la cuenta.
- Panel musical con tres instrumentales originales (arpa, celesta y piano sintetizados) y la pista válida del prototipo. Selector, pausa, anterior/siguiente, volumen y continuidad automática. Recuerda pista y volumen; no reproduce automáticamente al abrir el juego.
- Fuentes distribuidas localmente; la escena inicial no solicita contenido externo.

## Controles

| Acción | Control |
| --- | --- |
| Caminar | WASD, flechas, joystick o tocar el suelo |
| Mirar | Arrastrar sobre el mundo |
| Acercar cámara | Rueda o gesto táctil compatible con la cámara |
| Plantar / regar / leer / descansar | Botón contextual o E |
| Volver al camino | Minimapa o nombre Mi Mundo |
| Cerrar panel | Botón de cierre o Escape |

## Organización

```text
src/
  application/             Coordina acciones y confirmación de guardado
  domain/                  Reglas puras de crecimiento y formato de partida
  content/                 Parcelas, historias y catálogo de modelos
  infrastructure/
    persistence/           IndexedDB y detección de conflictos
    assets/                Cargador GLB con caché por zona y limpieza
  presentation/
    engine.ts              Importaciones explícitas de Babylon
    world/                 Paisaje, cielo e integración de escena
    player/                Avatar y controles
    audio/                 Reproductor y secuenciador musical
    memories/              Álbum, lector e ilustraciones animadas
    ui/                    Interfaz, diálogos y estilos
public/
  assets/models/           GLB preparados para distribución
  assets/textures/         Texturas compartidas
  assets/audio/            Pistas de ambiente
  content/memories/        Recursos de recuerdos
tests/                     Reglas y persistencia de acciones
scripts/                   Inspección y pruebas de navegador
docs/                      Decisiones, recursos y siguientes etapas
```

## Cómo ampliar

- **Otra parcela:** añadir un identificador estable y coordenadas a `src/content/garden.ts`. No reutilizar identificadores ya guardados.
- **Otra especie:** ampliar el catálogo, el tipo y la validación del dominio, y las representaciones por etapa. Actualmente hay flor de luna y helecho estelar, asociados a las parcelas de cada isla.
- **Otra acción:** añadir la regla al dominio, coordinar su guardado en `GardenGame` y conectar el botón contextual. Mantener las reglas fuera de las mallas.
- **Mejores modelos:** preparar GLB en `public/assets/models`, cargar con `ModelLibrary` y sustituir la representación correspondiente. El árbol central utiliza el GLB original optimizado. El resto de la escena usa mallas suaves procedurales; la flor GLB también está preparada, pero todavía no se utiliza en las parcelas.
- **Otra zona:** encapsular su creación y liberación siguiendo el ciclo `GardenWorld.dispose()`. El viaje entre jardín y bosque guarda el destino y recarga la página, manteniendo una sola escena activa. Ver `docs/islas.md`.
- **Otra versión de partida:** añadir una migración comprobada antes de cambiar `schemaVersion`. Actualmente solo se acepta la versión 1 y se rechazan versiones desconocidas sin sobrescribirlas.

## Límites de esta entrega

Es una base jugable y una dirección artística estilizada; no es un mundo terminado ni fotorrealista. El avatar y la vegetación secundaria son procedurales y sustituibles. El banco usa una pose de descanso sencilla, no una animación de sentarse con esqueleto. La navegación hacia un punto no calcula rutas alrededor de obstáculos: se detiene si encuentra el estanque o un límite.

Las partidas están en el navegador, no en una cuenta. Pueden perderse si se borra el almacenamiento; exportar una copia. Cambiar el reloj del dispositivo afecta al crecimiento. No incluye sincronización, multijugador, editor visual, recuerdos privados ni protección de fechas en servidor.

El modo ligero reduce resolución, vegetación y partículas. Se verifica también mediante emulación de pantalla/tacto, pero el rendimiento, temperatura y batería deben medirse en el celular físico objetivo antes de prometer 30 FPS.

## Pruebas de navegador

Los scripts usan Playwright con Microsoft Edge instalado. Instalar Playwright en el entorno de desarrollo o indicar `PLAYWRIGHT_MODULE` con la ruta a su `index.mjs`. No se incluye un navegador dentro de la aplicación.

```sh
node scripts/inspect-browser.mjs
node scripts/smoke-browser.mjs
node scripts/stories-browser.mjs
```

Requieren `pnpm dev` activo. Capturas y resultados quedan en `artifacts/`, excluido de Git. Las pruebas usan perfiles temporales y no modifican la partida del navegador personal.

## Gestos y floración

Plantar y regar reproducen un gesto de 1,35 segundos tras confirmar el guardado. Leer orienta al personaje y abre el recuerdo después de un gesto breve. Con movimiento reducido, la apertura es inmediata.

Una planta que pasa a su etapa final durante la sesión genera un aviso y ocho pétalos reutilizables. Las plantas ya florecidas al cargar la partida no repiten la celebración. Los efectos se pausan con las ventanas y no cambian los tiempos de crecimiento ni la partida.

Verificación: `scripts/care-browser.mjs` y `scripts/life-browser.mjs`.

La vida ambiental usa dos mariposas reutilizables (una en calidad ligera), con visitas de 24 segundos por ciclo de 40. Las plantas a menos de 2,5 metros del avatar responden con un balanceo suave. Estos efectos usan el reloj de la escena, se congelan al abrir ventanas y se desactivan con movimiento reducido. No añaden contenido a la partida ni cambian las reglas de crecimiento. Prueba: `scripts/ambient-browser.mjs`.


## Bosque Lunar

El arco se abre al plantar tres flores en el jardín, conseguir una floración y guardar dos recuerdos. La segunda isla, de mayor tamaño, usa modelos provisionales y tiene cuatro parcelas de helecho estelar, un refugio restaurable y una historia. El progreso de ambas islas se conserva al viajar y en las copias JSON. Ver `docs/islas.md` y `assets-source/bosque-lunar/README.md` para funcionamiento y fuentes de modelos.
