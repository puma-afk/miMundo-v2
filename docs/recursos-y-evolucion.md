# Recursos y siguientes etapas

## Inspección de los modelos originales

Inspección estructural de los GLB realizada el 6 de septiembre de 2026. Los originales no se han modificado.

| Original | Tamaño | Triángulos aproximados | Mallas | Materiales | Entradas de textura |
| --- | --- | --- | --- | --- | --- |
| `../arbol.glb` | 9.467.584 bytes | 8.022 | 7 | 7 | 20 |
| `../flor.glb` | 11.314.816 bytes | 7.640 | 67 | 1 | 3 |

Las entradas de textura no equivalen necesariamente a imágenes únicas. Ambos archivos utilizan Draco. Se prepararon copias que conservan la geometría comprimida y reducen las texturas:

| Copia preparada | Tamaño | Reducción |
| --- | --- | --- |
| `arbol-mobile.glb` | 1.802.704 bytes | 81 % |
| `flor-mobile.glb` | 1.172.052 bytes | 90 % |

El árbol incluía un plano de presentación (`Plane.007_drop_0`) que generaba un rectángulo visible en el terreno; se desvinculó de la escena en la copia. El árbol se incorpora como elemento central. La flor queda preparada, sin cargarse todavía. El decodificador Draco se sirve localmente. Se ha comprobado la carga del árbol en navegador; la calidad de la flor y el rendimiento en celular físico requieren su propia validación.

## Criterios para la siguiente entrega

1. Integrar la flor GLB preparada y comparar calidad y memoria frente a su representación procedural.
2. Mejorar el personaje con un modelo riggeado y animaciones de caminar, regar y descansar.
3. Añadir una segunda especie mediante definiciones y una migración de partida comprobada.
4. Extraer una segunda zona y demostrar descarga de recursos al cambiar de lugar.
5. Incorporar historias originales mediante contenido validado, con estados de error y vacío explícitos.
6. Diseñar un editor de recuerdos reutilizando las mismas validaciones del juego.

Cada etapa se prueba en el celular elegido antes de añadir más decoración. Una mayor fidelidad visual no debe introducir más luces por recuerdo ni cargar todas las zonas a la vez.

## Decisiones ya aplicadas

- Motor, entrada, reglas y almacenamiento separados.
- Vegetación estática agrupada en mallas y materiales compartidos.
- Crecimiento calculado por fecha, sin bucles en segundo plano por planta.
- Sin dependencias de red para fuentes, modelos o música al abrir la primera zona.
- Cargador de GLB separado y asíncrono. La zona inicial lo utiliza para el árbol; la escena base puede mostrarse mientras se carga.
- Las configuraciones visuales se mantienen durante la sesión; su persistencia entre sesiones queda pendiente.
- Permisos y sincronización en nube se mantienen fuera del alcance de la primera versión.
