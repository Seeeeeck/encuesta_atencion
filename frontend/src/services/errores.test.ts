import { AxiosError, AxiosHeaders } from 'axios';
import { extraerError } from './errores';

function errorHttp(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('fallo', 'ERR', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  });
}

test('un 422 devuelve el primer mensaje de cada campo', () => {
  const error = errorHttp(422, {
    message: 'Datos inválidos.',
    errors: { correo: ['El correo ya está registrado.', 'otro'], clave: ['Muy corta.'] },
  });

  expect(extraerError(error)).toEqual({
    mensaje: 'Datos inválidos.',
    campos: { correo: 'El correo ya está registrado.', clave: 'Muy corta.' },
  });
});

test('un 401 o 403 muestra el mensaje del backend', () => {
  expect(extraerError(errorHttp(401, { message: 'Credenciales inválidas.' }))).toEqual({
    mensaje: 'Credenciales inválidas.',
    campos: {},
  });
});

test('un 429 pide esperar', () => {
  expect(extraerError(errorHttp(429, { message: 'Too Many Attempts.' })).mensaje).toBe(
    'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
  );
});

test('un 500 no muestra el detalle interno', () => {
  expect(extraerError(errorHttp(500, { message: 'Err:Error al enviar encuesta' })).mensaje).toBe(
    'Ocurrió un error en el servidor. Intenta de nuevo más tarde.',
  );
});

test('sin respuesta del servidor avisa que no hay conexión', () => {
  const error = new AxiosError('Network Error', 'ERR_NETWORK');

  expect(extraerError(error).mensaje).toBe('No se pudo conectar con el servidor.');
});

test('un error que no es de axios da un mensaje genérico', () => {
  expect(extraerError(new Error('x')).mensaje).toBe('Ocurrió un error inesperado.');
});
