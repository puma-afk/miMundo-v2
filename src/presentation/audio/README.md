# Música

`GardenMusic` administra selección, reproducción, volumen y preferencias. Pausa la salida al ocultar la pestaña; nunca inicia música automáticamente al abrir el juego.

`ScorePlayer` interpreta partituras originales del catálogo en `src/content/music.ts`. Programa pequeños bloques de audio con Web Audio, independientemente del bucle gráfico. No renderiza archivos completos ni mantiene canciones descargadas en memoria. Al cambiar de pista libera osciladores y efectos.

Para incorporar un MP3, añadir una entrada `kind: 'file'` al catálogo y copiar el audio válido en `public/assets/audio`. El reproductor utiliza `preload=none` y solo asigna el archivo cuando se solicita reproducirlo.
