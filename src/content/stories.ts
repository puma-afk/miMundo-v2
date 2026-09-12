export type StoryTheme = 'seed' | 'letter' | 'lantern' | 'bottle' | 'flower' | 'star';
export type StoryPage = { heading: string; text: string; line: string };
export type GardenStory = {
  id: string;
  title: string;
  object: string;
  location: string;
  theme: StoryTheme;
  dedication: string;
  actions: readonly [string, string];
  position: { x: number; z: number };
  pages: readonly [StoryPage, StoryPage, StoryPage];
};

/** Stable IDs preserve existing saved memories. Content contains no executable HTML. */
export const stories: readonly GardenStory[] = [
  {
    id: 'welcome', title: 'Todo empieza con una semilla', object: 'El árbol de los ecos', location: 'Bajo el árbol del centro', theme: 'seed',
    position: { x: -1.4, z: -0.5 }, dedication: 'Que este sea el primero de muchos.',
    actions: ["Plantar la semilla ✦","Darle una gotita ♧"],
    pages: [
      { heading: 'Un lugar que no estaba en el mapa', text: 'Una semilla duerme entre tus manos.', line: 'A veces, empezar es una forma de cuidar.' },
      { heading: 'Un poquito de nosotros', text: 'Una gota… y algo empieza a moverse.', line: 'Lo pequeño también puede echar raíces profundas.' },
      { heading: 'Y entonces hubo un jardín', text: '¡Mira! Tu pequeño comienzo ya tiene raíces.', line: 'Aquí, el tiempo también sabe esperar.' },
    ],
  },
  {
    id: 'letter-home', title: 'Una carta para cuando vuelvas', object: 'El buzón de las pequeñas cosas', location: 'Al comienzo del camino', theme: 'letter',
    position: { x: 2.8, z: 9.5 }, dedication: 'Con cariño, de este pequeño mundo para ti.',
    actions: ['Abrir el sobre ✉', 'Guardar sus palabras ♡'],
    pages: [
      { heading: 'No tenía una fecha', text: 'Hay una carta esperando. ¿La abrimos?', line: 'Las cosas bonitas también pueden esperar por ti.' },
      { heading: 'Decía algo muy sencillo', text: 'Dentro solo dice: «Me alegra que estés aquí».', line: 'No hace falta un día perfecto para guardar un instante bueno.' },
      { heading: 'Había espacio al final', text: 'Guárdala cerca. Era para ti.', line: 'Qué bonito que hayas vuelto.' },
    ],
  },
  {
    id: 'little-light', title: 'La luz que se quedó', object: 'El farol del regreso', location: 'En el borde izquierdo del jardín', theme: 'lantern',
    position: { x: -8.8, z: 7.0 }, dedication: 'Que siempre encuentres un poco de luz en el camino.',
    actions: ["Acercar la chispa ✦","Encender el camino ☀"],
    pages: [
      { heading: 'Una noche de mucha niebla', text: 'El farol está apagado. Una chispa te sigue.', line: 'Una luz pequeña sigue siendo una luz.' },
      { heading: 'Un lugar para orientarse', text: 'La chispa salta dentro. ¡Ya se ve el camino!', line: 'No tienes que ver todo el camino para seguir.' },
      { heading: 'Por si alguien regresaba', text: 'Esta luz se queda encendida para tu regreso.', line: 'Hay luces que se quedan para recibirnos.' },
    ],
  },
  {
    id: 'cloud-message', title: 'Lo que trajeron las nubes', object: 'La botella del estanque', location: 'A la derecha del estanque', theme: 'bottle',
    position: { x: 8.8, z: -1.3 }, dedication: 'Para los mensajes que siempre encuentran su orilla.',
    actions: ["Destapar la botella ◇","Desenrollar el mensaje ✉"],
    pages: [
      { heading: 'Un viaje sin dirección', text: 'Algo brilla junto al agua… ¡Una botella!', line: 'Algunas cosas llegan cuando menos las esperas.' },
      { heading: 'La distancia no lo borró', text: 'El papel trae un pétalo y tres palabras: «Pensé en ti».', line: 'Pensar en alguien también es una manera de acercarse.' },
      { heading: 'Una nueva orilla', text: 'El mensaje cruzó las nubes para encontrarte.', line: 'Lo que se escribe con cariño encuentra dónde quedarse.' },
    ],
  },
  {
    id: 'your-pace', title: 'A tu propio ritmo', object: 'La flor de los días tranquilos', location: 'Entre el árbol y las parcelas de la izquierda', theme: 'flower',
    position: { x: -8, z: -1.5 }, dedication: 'Para recordarte que crecer también puede ser despacio.',
    actions: ["Regar el brote ♧","Verla florecer ✿"],
    pages: [
      { heading: 'La última en florecer', text: 'Este brote aún tiene los pétalos cerrados.', line: 'Cada semilla guarda su propio calendario.' },
      { heading: 'Lo que nadie veía', text: 'Le das una gotita. Se despereza…', line: 'También avanzas cuando todavía no se nota.' },
      { heading: 'Su mañana llegó', text: '¡Floreció! Justo cuando estaba lista.', line: 'No necesitas florecer al ritmo de los demás.' },
    ],
  },
  {
    id: 'tomorrow-door', title: 'Lo bonito que aún no conocemos', object: 'La estrella del arco', location: 'Bajo el arco de piedra', theme: 'star',
    position: { x: 5.2, z: -7.7 }, dedication: 'Por todos los lugares que todavía nos esperan.',
    actions: ["Tocar la estrella ✦","Mirar más allá ◇"],
    pages: [
      { heading: 'Una puerta sin llave', text: 'Una estrella espera bajo el arco.', line: 'A veces, una pregunta es el comienzo de un viaje.' },
      { heading: 'Una pequeña promesa', text: 'Al tocarla, aparecen destellos de lugares lejanos.', line: 'Todavía quedan primeras veces por vivir.' },
      { heading: 'Mientras llega ese día', text: 'Todavía quedan cielos por descubrir juntos.', line: 'Nuestro mundo todavía tiene mucho por crecer.' },
    ],
  },
];

export function findStory(id: string): GardenStory | undefined { return stories.find(story => story.id === id); }
export function savedStoryCount(ids: readonly string[]): number { return stories.filter(story => ids.includes(story.id)).length; }
