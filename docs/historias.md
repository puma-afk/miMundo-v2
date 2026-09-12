# Historias del jardín

El catálogo `src/content/stories.ts` contiene seis historias de tres páginas. Cada entrada define un identificador estable, título, objeto, ubicación, tema visual, posición y dedicatoria. Los textos se insertan con `textContent`.

Para añadir una historia:

1. Crear una entrada con un identificador nuevo y tres páginas breves. No cambiar los identificadores existentes: las partidas los usan para recordar lo guardado.
2. Colocar su posición en terreno accesible, lejos del estanque y de otras interacciones.
3. Añadir su objeto en `src/presentation/world/memoryObjects.ts`. Los objetivos de interacción se generan desde el catálogo.
4. Reutilizar uno de los seis temas o ampliar `StoryTheme`, `storyArt.ts` y `memories.css` juntos.
5. Comprobar lectura, cierre, guardado, recarga y pantalla estrecha con `scripts/stories-browser.mjs`.

El álbum solo muestra la colección y las ubicaciones. Cada historia se abre interactuando con su objeto en la isla; el lector vuelve al jardín, sin enlaces a otras historias. Abrir o cerrar una historia no la marca como guardada: se guarda mediante el botón de la última página. El estado se conserva en IndexedDB y forma parte de la exportación de partida existente. Los identificadores antiguos desconocidos se conservan, pero no se cuentan como historias actuales.

Las ilustraciones son SVG locales. Las animaciones se detienen al cerrar el lector y respetan la reducción de movimiento. Los objetos comparten materiales y no añaden luces dinámicas. El rendimiento definitivo debe comprobarse en dispositivos físicos.
