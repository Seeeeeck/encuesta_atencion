import { apiClient } from './apiClient';
import type { Pregunta, RespuestaEnviada, ValorRespuesta } from '../types/encuesta';

export type RespuestasPorPregunta = Record<number, ValorRespuesta>;

export async function obtenerPreguntas(): Promise<Pregunta[]> {
  const { data } = await apiClient.get<{ preguntas: Pregunta[] }>('/encuesta/obtener/preguntas');
  return data.preguntas;
}

export async function enviarEncuesta(respuestas: RespuestasPorPregunta): Promise<void> {
  const cuerpo: RespuestaEnviada[] = Object.entries(respuestas).map(([idPregunta, valor]) => ({
    id_pregunta: Number(idPregunta),
    numero_respuesta: valor,
  }));
  await apiClient.post('/encuesta/enviar', { respuestas: cuerpo });
}
