import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '../services/apiClient';

export interface PeticionHecha {
  metodo: string;
  url: string;
  cuerpo: unknown;
  config: InternalAxiosRequestConfig;
}

export interface RespuestaFalsa {
  status?: number;
  data?: unknown;
}

// Reemplaza la red de apiClient: guarda cada petición y responde con lo indicado.
export function servidorFalso(respuestas: RespuestaFalsa | RespuestaFalsa[] = {}) {
  const peticiones: PeticionHecha[] = [];
  const cola = Array.isArray(respuestas) ? [...respuestas] : null;

  const adaptador: AxiosAdapter = async (config) => {
    peticiones.push({
      metodo: (config.method ?? 'get').toUpperCase(),
      url: config.url ?? '',
      cuerpo: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
      config,
    });
    const { status = 200, data = {} } = (cola ? cola.shift() : (respuestas as RespuestaFalsa)) ?? {};
    const respuesta = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      throw Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, config, response: respuesta });
    }
    return respuesta;
  };

  apiClient.defaults.adapter = adaptador;
  return peticiones;
}
