# Sprints 1.2 — cuenta, identidad, visitas y avatar

Implementación local del plan aprobado. No se publicó ni se cambió el Supabase real.

## Sprint 1: entrada y cuenta — implementado
- Aviso junto a la nube para invitados, con Conectar/Después. Se recuerda al descartarlo en este navegador; borrar los datos del sitio permite que vuelva a aparecer.
- Un solo resumen del guardado, conservando fechas local/nube. Se retiró el bloque duplicado.
- Cerrar sesión visible; conserva el comportamiento anterior de dejar pendientes en el dispositivo.
- Mundo de <nombre>: propone el primer nombre de Google, nunca el correo. El usuario puede guardar un nombre de hasta 24 caracteres dentro de su partida, sincronizable.

## Sprint 2: invitaciones — implementado
- Secciones Visitar/Invitar y textos cortos. Errores dentro del recuadro y enlace a Mi cuenta.
- Sin cuenta, crear/desactivar no llama al RPC de publicación. Supabase sigue exigiendo sesión por su parte.
- Se valida la invitación antes de navegar; los errores de formato, enlace desactivado y conexión se muestran en el formulario.
- Copiar enlace/código y abrir WhatsApp con texto preparado. El usuario decide enviar; la app no manda mensajes automáticamente.
- La migración nueva 010_shared_world_name.sql permite que la visita también muestre el nombre elegido. Aplicar después de las anteriores. No necesita volver a ejecutar asignación del regalo.
- Actualizar la invitación después de guardar el nombre en la nube para que aparezca en la copia compartida.

## Sprint 3: noche y calendario — implementado
- Menor luz solar/ambiental nocturna y nubes/horizonte más oscuros en los tres ambientes.
- El avatar conserva una leve luminosidad en piel y ropa sin añadir luces dinámicas.
- Año de 360 días virtuales: 7,5 días reales con el ciclo actual. Fecha real y antigüedad real siguen separadas. Cumpleaños y plantas no se aceleran.

## Sprint 4: avatar — implementado
- Rostro sencillo con ojos, nariz y sonrisa, broche de capa y movimiento suave de capa/brazos.
- Opciones de piel, ropa y cabello independientes, vista previa y botón Guardar apariencia. Cerrar sin confirmar conserva la apariencia anterior.
- Saludo breve en el mundo. Movimiento reducido elimina animaciones adicionales.
- Se aprovecha el avatar procedural actual, sin nuevos modelos/texturas pesados. Sustituirlo por un modelo con esqueleto sigue siendo una etapa futura.

## Comprobación
Pruebas locales de guardado y validación de apariencia/nombre, calendario y SQL para nombre público. Navegador 390 y 1440 px para aviso inicial, invitaciones de invitado, vista previa, confirmación y persistencia del avatar. También se verificaron cuentas/conflictos, Google simulado, visitantes y cielo.

Pendiente externo: aplicar SQL 010, subir los cambios desde mundo-v2 y comprobar la versión desplegada con cuentas reales. No se crearon carpetas de entrega.

Validación final 1.2: 35 pruebas de dominio/SQL correctas; comprobaciones polish-browser, sharing-polish-browser, accounts-browser, sky-browser, google-visits-browser y visits-v2-browser correctas. Google, compartir y comentarios se simularon en las pruebas de navegador; no se enviaron mensajes ni se alteraron cuentas reales. Nombre predeterminado de Google comprobado con una cuenta sintética; WhatsApp verificado inspeccionando el texto del enlace, sin abrir ni enviar.
