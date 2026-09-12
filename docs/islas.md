# Viaje entre islas

El Jardín de los Ecos sigue siendo la entrada por defecto para partidas anteriores. El arco al fondo permite viajar cuando hay tres flores plantadas en el jardín, al menos una florecida y dos recuerdos del catálogo guardados. Los logros se calculan con el tiempo real; no se usa la hora del cielo.

Al cruzar por primera vez se guarda `forestUnlocked: true`, de modo que el acceso ya no dependa del reloj. `currentIsland` registra el destino. La navegación recarga la página después de confirmar IndexedDB: el navegador libera la escena anterior y reconstruye solamente el destino. Si falla el guardado, el viaje no ocurre. En esta versión la música se pausa al viajar y hay que pulsar Entrar al jardín nuevamente.

El Bosque Lunar tiene radio 19 frente a 15 del jardín, cuatro parcelas de helecho estelar, una piedra con historia y un refugio cuya luz se restaura después de plantar dos helechos. Usa geometría provisional, sin modelos externos nuevos ni sombras dinámicas adicionales. Los helechos comparten los tiempos de crecimiento de las flores.

La partida conserva la versión 1 con campos opcionales: `currentIsland`, `forestUnlocked`, `forestRefuge` y `forestStory`. Las parcelas bosque-* usan la especie `starfern`. Importación y exportación incluyen ambas islas, dedicatorias y logros. Las partidas antiguas siguen siendo válidas. Importar una copia cambia también la isla; si corresponde, la página recarga.

Límites: no hay multijugador, construcción libre ni desbloqueos verificados por servidor. La colisión del bosque delimita su borde; los árboles provisionales no tienen colisión individual. La historia del bosque se guarda como encuentro propio, separada de los seis recuerdos del jardín.

Pruebas: `tests/islands.test.ts` y `scripts/islands-browser.mjs`. Los ensayos de viaje se ejecutan con perfiles de navegador temporales.
