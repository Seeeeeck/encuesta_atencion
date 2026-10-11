import { borrarBorrador, guardarBorrador, leerBorrador } from './borradorEncuesta';

beforeEach(() => localStorage.clear());

test('sin borrador arranca vacío en la primera pregunta', () => {
  expect(leerBorrador(1)).toEqual({ respuestas: {}, indice: 0 });
});

test('guarda y recupera el borrador del usuario', () => {
  guardarBorrador(1, { respuestas: { 3: 4 }, indice: 2 });

  expect(leerBorrador(1)).toEqual({ respuestas: { 3: 4 }, indice: 2 });
});

test('cada usuario tiene su propio borrador', () => {
  guardarBorrador(1, { respuestas: { 3: 4 }, indice: 2 });

  expect(leerBorrador(2)).toEqual({ respuestas: {}, indice: 0 });
});

test('borrarBorrador lo elimina', () => {
  guardarBorrador(1, { respuestas: { 3: 4 }, indice: 2 });

  borrarBorrador(1);

  expect(leerBorrador(1)).toEqual({ respuestas: {}, indice: 0 });
});

test('descarta valores fuera de la escala o datos corruptos', () => {
  localStorage.setItem('borrador-encuesta-1', JSON.stringify({ respuestas: { 1: 9, 2: 3, 3: 'x' }, indice: 1 }));
  expect(leerBorrador(1)).toEqual({ respuestas: { 2: 3 }, indice: 1 });

  localStorage.setItem('borrador-encuesta-1', '{roto');
  expect(leerBorrador(1)).toEqual({ respuestas: {}, indice: 0 });
});
