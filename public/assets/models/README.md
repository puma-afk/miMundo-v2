# Modelos listos para el juego

Colocar aquí únicamente GLB preparados para distribución. Los originales se conservan fuera de esta carpeta.

1. Revisar licencia, escala en metros, pivote, orientación y animaciones.
2. Reducir texturas y comprobar transparencias y materiales en el motor.
3. Registrar el modelo en `src/content/garden.ts`.
4. Cargar mediante `ModelLibrary` al entrar en la zona; reutilizar su contenedor y liberar instancias al salir.
5. Medir apariencia, descarga y memoria en celular.

La primera escena incorpora `arbol-mobile.glb`, una copia del árbol original con texturas de hasta 384 px y sin su plano de presentación. `flor-mobile.glb`, con texturas de hasta 512 px, está preparado para su integración posterior. Los GLB originales se conservan intactos.

`scripts/prepare-models.mjs` reproduce la preparación usando Sharp. Draco se decodifica mediante los archivos locales de `../decoders/`; no se depende del CDN al jugar.
