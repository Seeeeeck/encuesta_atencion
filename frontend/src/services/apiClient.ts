import axios from 'axios';
import { apiUrl } from '../entorno';
import { borrarSesion, leerSesion } from './sesion';

export const apiClient = axios.create({
  baseURL: apiUrl,
  headers: { Accept: 'application/json' },
});

let avisarSesionExpirada: () => void = () => {};

export function alExpirarSesion(callback: () => void): void {
  avisarSesionExpirada = callback;
}

apiClient.interceptors.request.use((config) => {
  const sesion = leerSesion();
  if (sesion) {
    config.headers.Authorization = `Bearer ${sesion.token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const mandabaToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && mandabaToken) {
      borrarSesion();
      avisarSesionExpirada();
    }
    return Promise.reject(error);
  },
);
