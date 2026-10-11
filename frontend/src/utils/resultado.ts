import type { Pregunta } from '../types/encuesta';
import type { RespuestasPorPregunta } from '../services/encuestaService';
import { significadoRespuesta } from './opciones';

export interface ResultadoEncuesta {
  indice: number;
  aMejorar: { texto: string; idea: string; respuesta: string }[];
  // Se guarda también lo que respondió: en una afirmación negativa lo bueno es estar
  // en desacuerdo, y la afirmación sola se leería al revés.
  fortaleza: { texto: string; respuesta: string } | null;
}

// Una idea concreta por afirmación, en el orden de docs/preguntas.json.
const ideas = [
  'Desactiva las notificaciones que no vengan de personas: revisar el celular pasará a ser una decisión tuya.',
  'Antes de abrir el celular, anota en una línea en qué estabas. Volver a la tarea te costará menos.',
  'Las rachas existen para traerte de vuelta. Prueba perder una a propósito y observa qué cambia.',
  'Prueba un bloque de una hora sin redes y fíjate cómo te sientes al terminar.',
  'Antes de abrir una app, decide cuánto tiempo vas a usarla y pon un temporizador.',
  'Reduce de a poco: un cambio pequeño y sostenido funciona mejor que un corte drástico.',
  'Activa el aviso de tiempo de uso o quita de tu pantalla de inicio las apps con scroll infinito.',
  'Deja el celular en otra habitación mientras estudias o trabajas, aunque sea 25 minutos.',
  'Prueba ratos cortos sin el celular, como una comida o una caminata, para que la inquietud baje.',
  'Durante una semana, cuenta cuántas veces interrumpes una tarea para mirar el celular. El dato suele sorprender.',
];

const umbralMejorar = 2;
const umbralFortaleza = 4;

// Misma regla que el panel: en las afirmaciones negativas se invierte la escala,
// así 5 siempre significa mejor atención.
function valorAjustado(pregunta: Pregunta, respuesta: number): number {
  return pregunta.tipo === 'N' ? 6 - respuesta : respuesta;
}

export function calcularResultado(preguntas: Pregunta[], respuestas: RespuestasPorPregunta): ResultadoEncuesta {
  const ajustadas = preguntas
    .map((pregunta, posicion) => ({
      texto: pregunta.pregunta_texto,
      idea: ideas[posicion] ?? '',
      respuesta: significadoRespuesta[respuestas[pregunta.id]] ?? '',
      valor: valorAjustado(pregunta, respuestas[pregunta.id]),
    }))
    .filter((item) => Number.isFinite(item.valor));

  const suma = ajustadas.reduce((total, item) => total + item.valor, 0);
  const indice = ajustadas.length > 0 ? Math.round((suma / ajustadas.length) * 100) / 100 : 0;
  const ordenadas = [...ajustadas].sort((a, b) => a.valor - b.valor);
  const mejor = ordenadas.at(-1);

  return {
    indice,
    aMejorar: ordenadas
      .filter((item) => item.valor <= umbralMejorar)
      .slice(0, 2)
      .map(({ texto, idea, respuesta }) => ({ texto, idea, respuesta })),
    fortaleza: mejor && mejor.valor >= umbralFortaleza ? { texto: mejor.texto, respuesta: mejor.respuesta } : null,
  };
}

export function mensajeSegunIndice(indice: number): string {
  if (indice >= 3.7) {
    return 'Tu atención se mantiene bastante en tus manos. Las apps compiten por ella, pero sueles decidir tú.';
  }
  if (indice >= 2.5) {
    return 'Hay momentos en que las apps deciden por ti, y otros en que decides tú. Pequeños ajustes pueden inclinar la balanza.';
  }
  return 'Las recompensas de las apps están tirando fuerte de tu atención. No es falta de voluntad: están diseñadas justamente para eso.';
}
