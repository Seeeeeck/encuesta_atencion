import { isAxiosError } from 'axios';

export interface ErrorApi {
  mensaje: string;
  campos: Record<string, string>;
}

interface CuerpoError {
  message?: string;
  errors?: Record<string, string[]>;
}

export function extraerError(error: unknown): ErrorApi {
  if (!isAxiosError<CuerpoError>(error)) {
    return { mensaje: 'Ocurrió un error inesperado.', campos: {} };
  }
  if (!error.response) {
    return { mensaje: 'No se pudo conectar con el servidor.', campos: {} };
  }

  const { status, data } = error.response;
  if (status === 429) {
    return { mensaje: 'Demasiados intentos. Esperá un minuto y volvé a probar.', campos: {} };
  }
  if (status >= 500) {
    return { mensaje: 'Ocurrió un error en el servidor. Intentá de nuevo más tarde.', campos: {} };
  }

  const campos: Record<string, string> = {};
  for (const [campo, mensajes] of Object.entries(data?.errors ?? {})) {
    campos[campo] = mensajes[0];
  }
  return { mensaje: data?.message ?? 'Ocurrió un error inesperado.', campos };
}
