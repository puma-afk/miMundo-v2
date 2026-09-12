# Audio

`pista1.mp3` es una copia del audio válido del proyecto original. Se carga solo cuando el usuario solicita reproducirlo. Los archivos originales `cancion1.mp3` y `cancion2.mp3` contienen HTML y no se incorporan al reproductor.

Las otras tres melodías —Luz entre hojas, Danza de luciérnagas y Camino de nubes— son composiciones instrumentales originales definidas en `src/content/music.ts` y sintetizadas por `ScorePlayer`. No necesitan archivos de música ni descargas adicionales.

El panel de música permite elegir pista, pausar, avanzar, retroceder y ajustar volumen. Se pasa automáticamente a la siguiente canción al terminar. Preferencias en `localStorage`, separadas de la partida; la reproducción siempre comienza por decisión del usuario.
