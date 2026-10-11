import { apiDisponible } from './saludService';
import { servidorFalso } from '../test/servidorFalso';

test('la API está disponible si /health responde ok', async () => {
  const peticiones = servidorFalso({ data: { status: 'ok' } });

  expect(await apiDisponible()).toBe(true);
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/health' });
});

test('la API no está disponible si /health falla', async () => {
  servidorFalso({ status: 500 });

  expect(await apiDisponible()).toBe(false);
});
