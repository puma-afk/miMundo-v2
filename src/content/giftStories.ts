import type { PrivateGift } from '../domain/privateGift.ts';
import { giftStops } from '../domain/privateGift.ts';
import type { GardenStory } from './stories.ts';

export function personalizeStory(story: GardenStory, gift: PrivateGift, completed: number): { story: GardenStory; step: number | null } {
  const step = giftStops.findIndex(id => id === story.id);
  if (step < 0) return { story, step: null };
  if (step > completed) {
    const hints = ['Busca el buzón al comienzo del camino.', 'Busca el farol del regreso.', 'Busca la flor especial entre el árbol y las parcelas de la izquierda.'];
    const hint = hints[Math.min(completed, 2)];
    return { story: { ...story, title: 'Todavía falta una pista', actions: ['Ver la pista pendiente →', 'Recordar dónde buscar →'], pages: [
      { heading: 'Un secreto a su tiempo', text: hint, line: 'Termina de leer allí para continuar el recorrido.' },
      { heading: 'Tu siguiente paso', text: hint, line: 'Esta carta te esperará aquí.' },
      { heading: 'Vuelve cuando quieras', text: hint, line: 'No necesitas empezar de nuevo.' },
    ] }, step: null };
  }
  const result: GardenStory = { ...story, dedication: gift.dedication };
  if (step === 0) {
    result.title = 'Una carta cayó del cielo';
    result.actions = ['Abrir mi carta ♡', 'Pedir un deseo ✧'];
    result.pages = [
      { heading: 'Una entrega entre las nubes', text: `Una mensajera de estrellas llegó con una carta: «Para ${gift.firstName}».`, line: 'Entre tantos cielos, quería regalarte uno.' },
      { heading: `${gift.age} vueltas al sol`, text: 'Hoy las estrellas son velitas. Cierra los ojos un instante y pide un deseo.', line: 'Que este nuevo año te encuentre sonriendo y sintiéndote querida.' },
      { heading: `Feliz cumpleaños, ${gift.firstName}`, text: 'Este jardín es para ti. Pero hay algo más que quería contarte…', line: 'Siguiente pista: el farol del regreso, junto al borde izquierdo de la isla, cerca del inicio del camino.' },
    ];
  } else if (step === 1) {
    result.title = 'Shhh… la luz sabe algo'; result.actions = ['Desdoblar el papel', 'Seguir el pétalo'];
    result.pages = [
      { heading: 'Una luz para ti', text: 'El farol reconoce tus pasos. Dentro hay un papel doblado.', line: 'Hay personas que hacen que cualquier lugar se sienta como casa.' },
      { heading: 'Un poquito de calma', text: 'El papel dice: «Mi lugar favorito no estaba en un mapa».', line: 'A veces, un lugar también puede ser alguien.' },
      { heading: 'La siguiente pista', text: 'Una chispa se convierte en un pétalo.', line: 'Siguiente pista: la flor rosa grande que crece sola, a la izquierda del árbol central. No es una de tus flores plantadas.' },
    ];
  } else if (step === 2) {
    result.title = 'No era una flor cualquiera'; result.actions = ['Mirar entre los pétalos', 'Despertar la estrella'];
    result.pages = [
      { heading: 'A nuestro ritmo', text: 'La flor se abre despacito, como las cosas bonitas que se construyen día a día.', line: 'Sin correr. Sin dejar de cuidarnos.' },
      { heading: 'Entre los pétalos', text: 'Dentro descansa una pequeña estrella.', line: 'Todavía queda algo por decir.' },
      { heading: 'Un rincón entre las nubes', text: 'La estrella señala el arco de piedra.', line: 'Última pista: el pequeño pedestal dorado delante del arco de piedra, al fondo de la isla. Acércate al pedestal para abrir la carta.' },
    ];
  } else {
    result.title = 'Un lugar a tu lado'; result.actions = ['Leer la carta ♡', 'Hay algo más…'];
    result.pages = [
      { heading: 'Cuando tú quieras', text: 'Hay algo que quiero decirte. Este rincón lo guardó hasta que llegaras.', line: 'Puedes quedarte un momento, leerlo a tu ritmo o volver después.' },
      { heading: 'Para ti', text: gift.message, line: '' },
      { heading: 'Nuestra siguiente página', text: '¿Aceptas?', line: '' },
    ];
  }
  return { story: result, step };
}
