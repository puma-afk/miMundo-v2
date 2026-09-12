# Regalos privados y búsqueda de pistas

Actualización: 10 de septiembre de 2026.

## Qué está implementado

El juego público vuelve a tener bienvenida y cartas genéricas. Los datos personales y la carta completa están solamente en private-gifts/gift.json, excluido de Git y de la entrega pública. No copiar esa carpeta a public ni a GitHub. La configuración pública no contiene un destinatario por defecto.

El regalo se obtiene de world_gifts usando el UUID del propietario autenticado. RLS solo permite leer la fila propia; los clientes no pueden crear ni modificar asignaciones. Si falta autorización, configuración o conexión, se muestra el mundo normal sin contenido privado. Esta consulta no guarda el texto privado en IndexedDB ni en las exportaciones de partida.

La búsqueda tiene cuatro etapas: buzón, farol, flor especial y estrella bajo el arco. Cada pista se guarda al pulsar Guardar pista y seguir. Los objetos posteriores mantienen su historia normal hasta completar las pistas anteriores. La última carta muestra íntegro el mensaje proporcionado y termina con una pregunta que no exige respuesta. No hay botón Sí obligatorio, cuenta regresiva ni premio condicionado a aceptar.

El progreso giftProgress se sincroniza con la partida. Guarda únicamente un identificador de regalo y la cantidad de etapas completadas, nunca el contenido privado. Importar ese progreso no otorga acceso a un regalo: sigue dependiendo de Auth/RLS. Las escenas anime/chibi siguen siendo SVG/CSS, montadas solo dentro de la historia.

## Vista previa privada local

Abrir http://localhost:5174/?gift-preview=1 sin sesión de usuario. Es una vista de desarrollo con una partida separada (clave gift-preview), que no sustituye el jardín sin cuenta.

El endpoint de vista previa existe únicamente en el servidor Vite de desarrollo y responde solo a conexiones loopback. La lectura directa de private-gifts está bloqueada por server.fs.deny, incluso usando ?raw. No existe endpoint privado en dist ni en producción. La vista previa no funciona desde el celular por LAN deliberadamente; en el celular se probará con la cuenta destinataria y los permisos reales.

## Activación posterior en Supabase

1. Ejecutar supabase/migrations/002_private_gifts.sql en SQL Editor.
2. Conectar Google cuando corresponda y crear la cuenta destinataria.
3. Obtener su UUID desde Authentication > Users. El correo o el nombre visible no sustituyen ese identificador.
4. Ejecutar localmente: node scripts/prepare-private-gift.mjs UUID_DE_LA_CUENTA
5. El script genera private-gifts/assign-gift.sql y NO ejecuta nada. Revisarlo y pegarlo en SQL Editor con la sesión administrativa del propietario del proyecto. No subirlo a GitHub.
6. Probar con esa cuenta y con otra: solo la destinataria debe recibir la bienvenida y la búsqueda. Una futura vista de visitas deberá consultar regalos solo para el propietario del mundo, nunca heredar los del visitante.

La asignación todavía no está realizada porque falta el UUID de la cuenta. Las pruebas de RLS ejecutan PostgreSQL local con dos identidades simuladas; no sustituyen la prueba de dos cuentas reales en Supabase.

## Música

Las dos canciones elegidas están anotadas en el archivo privado como metadatos. No se descargaron grabaciones, no se incluyeron letras y no hay reproducción nueva implementada todavía. Falta recibir archivos que el propietario pueda usar y decidir la reproducción durante la carta. No publicar los audios ni sus URLs bajo public si se quiere mantenerlos exclusivos; usar un bucket privado con permisos y acceso temporal para la destinataria. La música general existente del jardín permanece disponible.

## Validación

- 27 pruebas de lógica y PostgreSQL: incluye orden de pistas, fallos de guardado, JSON exportado sin carta, lectura privada por propietario y rechazo de asignaciones por otros usuarios.
- scripts/birthday-browser.mjs usa datos sintéticos y verifica mundo normal, preview, las cuatro pistas, mensaje íntegro, persistencia y separación del jardín normal, en móvil y escritorio.
- Compilación TypeScript/Vite correcta. Búsqueda en src, public y dist sin nombre real ni texto privado.
- La entrega antigua sigue desactualizada. Regenerar con una lista explícita de carpetas permitidas, excluyendo private-gifts, artifacts, node_modules y archivos .env. Nunca publicar toda la carpeta raíz sin revisar.
