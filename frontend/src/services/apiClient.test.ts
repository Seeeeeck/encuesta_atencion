import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { apiClient, alExpirarSesion } from './apiClient';
import { guardarSesion, leerSesion } from './sesion';
import type { Usuario } from '../types/usuario';

const usuario: Usuario = {
  id: 1,
  nombre: 'Ana',
  correo: 'ana@test.local',
  edad: null,
  sexo: null,
  rol: 'usuario',
  is_verified: true,
};

let ultimaConfig: InternalAxiosRequestConfig | null = null;

function responderCon(status: number, data: unknown = {}): AxiosAdapter {
  return async (config) => {
    ultimaConfig = config;
    const respuesta = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      const error = Object.assign(new Error(`HTTP ${status}`), {
        isAxiosError: true,
        config,
        response: respuesta,
      });
      throw error;
    }
    return respuesta;
  };
}

beforeEach(() => {
  localStorage.clear();
  ultimaConfig = null;
  alExpirarSesion(() => {});
});

test('usa la URL de la API de la configuración', async () => {
  apiClient.defaults.adapter = responderCon(200);

  await apiClient.get('/health');

  expect(ultimaConfig?.baseURL).toBe('http://api.test/api');
});

test('pide JSON al backend', async () => {
  apiClient.defaults.adapter = responderCon(200);

  await apiClient.get('/health');

  expect(ultimaConfig?.headers.Accept).toBe('application/json');
});

test('adjunta el token de la sesión como Bearer', async () => {
  guardarSesion('tok-123', usuario);
  apiClient.defaults.adapter = responderCon(200);

  await apiClient.get('/me');

  expect(ultimaConfig?.headers.Authorization).toBe('Bearer tok-123');
});

test('sin sesión no manda Authorization', async () => {
  apiClient.defaults.adapter = responderCon(200);

  await apiClient.get('/health');

  expect(ultimaConfig?.headers.Authorization).toBeUndefined();
});

test('un 401 con token borra la sesión y avisa que expiró', async () => {
  guardarSesion('tok-123', usuario);
  const avisar = jest.fn();
  alExpirarSesion(avisar);
  apiClient.defaults.adapter = responderCon(401, { message: 'No autenticado.' });

  await expect(apiClient.get('/me')).rejects.toBeTruthy();

  expect(leerSesion()).toBeNull();
  expect(avisar).toHaveBeenCalledTimes(1);
});

test('un 401 sin token (login fallido) no toca la sesión', async () => {
  const avisar = jest.fn();
  alExpirarSesion(avisar);
  apiClient.defaults.adapter = responderCon(401, { message: 'Credenciales inválidas.' });

  await expect(apiClient.post('/login', {})).rejects.toBeTruthy();

  expect(avisar).not.toHaveBeenCalled();
});

test('un 401 de una request marcada con sinCierreDeSesion no cierra la sesión', async () => {
  guardarSesion('tok-123', usuario);
  const avisar = jest.fn();
  alExpirarSesion(avisar);
  apiClient.defaults.adapter = responderCon(401, { message: 'La clave actual no corresponde al usuario' });

  await expect(apiClient.put('/me/actualizar/clave', {}, { sinCierreDeSesion: true })).rejects.toBeTruthy();

  expect(leerSesion()).not.toBeNull();
  expect(avisar).not.toHaveBeenCalled();
});
