import { guardarResultado, leerResultado } from './resultadoEncuesta';

const resultado = { indice: 3.2, aMejorar: [{ texto: 'A', idea: 'B', respuesta: 'Neutral' }], fortaleza: null };

beforeEach(() => localStorage.clear());

test('guarda y recupera el resultado de cada usuario', () => {
  guardarResultado(1, resultado);

  expect(leerResultado(1)).toEqual(resultado);
  expect(leerResultado(2)).toBeNull();
});

test('un valor corrupto se trata como sin resultado', () => {
  localStorage.setItem('resultado-encuesta-1', '{roto');
  expect(leerResultado(1)).toBeNull();

  localStorage.setItem('resultado-encuesta-1', JSON.stringify({ indice: 'x' }));
  expect(leerResultado(1)).toBeNull();
});

test('un resultado con un formato que no reconoce se trata como sin resultado', () => {
  localStorage.setItem(
    'resultado-encuesta-1',
    JSON.stringify({ indice: 2, aMejorar: [{ texto: 'A', idea: 'B' }], fortaleza: 'texto suelto' }),
  );

  expect(leerResultado(1)).toBeNull();
});
