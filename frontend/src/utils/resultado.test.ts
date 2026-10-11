import { calcularResultado, mensajeSegunIndice } from './resultado';
import type { Pregunta } from '../types/encuesta';

const preguntas: Pregunta[] = [
  { id: 11, pregunta_texto: 'Reviso sin decidirlo.', tipo: 'N' },
  { id: 12, pregunta_texto: 'Retomo la concentración.', tipo: 'P' },
  { id: 13, pregunta_texto: 'Mantengo rachas.', tipo: 'N' },
];

test('el índice promedia las respuestas invirtiendo las afirmaciones negativas', () => {
  // ajustados: 6-5=1, 4, 6-2=4  -> promedio 3
  const resultado = calcularResultado(preguntas, { 11: 5, 12: 4, 13: 2 });

  expect(resultado.indice).toBe(3);
});

test('redondea el índice a dos decimales', () => {
  // ajustados: 6-4=2, 5, 6-4=2 -> 3
  expect(calcularResultado(preguntas, { 11: 4, 12: 5, 13: 4 }).indice).toBe(3);
  // ajustados: 1, 2, 2 -> 1.666…
  expect(calcularResultado(preguntas, { 11: 5, 12: 2, 13: 4 }).indice).toBe(1.67);
});

test('propone mejorar las dos afirmaciones con peor resultado, con una idea concreta', () => {
  const resultado = calcularResultado(preguntas, { 11: 5, 12: 2, 13: 1 });

  expect(resultado.aMejorar.map((item) => item.texto)).toEqual(['Reviso sin decidirlo.', 'Retomo la concentración.']);
  expect(resultado.aMejorar[0].idea).toMatch(/notificaciones/i);
});

test('no propone mejorar lo que ya está bien', () => {
  const resultado = calcularResultado(preguntas, { 11: 1, 12: 5, 13: 2 });

  expect(resultado.aMejorar).toEqual([]);
});

test('reconoce la afirmación con mejor resultado como fortaleza, con lo que respondió', () => {
  const resultado = calcularResultado(preguntas, { 11: 3, 12: 5, 13: 3 });

  expect(resultado.fortaleza).toEqual({ texto: 'Retomo la concentración.', respuesta: 'Totalmente de acuerdo' });
});

test('en una afirmación negativa, estar en desacuerdo cuenta como fortaleza', () => {
  const resultado = calcularResultado(preguntas, { 11: 3, 12: 3, 13: 1 });

  expect(resultado.fortaleza).toEqual({ texto: 'Mantengo rachas.', respuesta: 'Totalmente en desacuerdo' });
});

test('cada punto a mejorar incluye lo que respondió', () => {
  const resultado = calcularResultado(preguntas, { 11: 5, 12: 2, 13: 1 });

  expect(resultado.aMejorar[0].respuesta).toBe('Totalmente de acuerdo');
});

test('sin una respuesta claramente buena no inventa fortalezas', () => {
  expect(calcularResultado(preguntas, { 11: 3, 12: 3, 13: 3 }).fortaleza).toBeNull();
});

test('el mensaje cambia según el índice', () => {
  expect(mensajeSegunIndice(4.2)).toMatch(/en tus manos/);
  expect(mensajeSegunIndice(3)).toMatch(/otros en que decides tú/);
  expect(mensajeSegunIndice(1.8)).toMatch(/no es falta de voluntad/i);
});
