export type TipoPregunta = 'P' | 'N';

export interface Pregunta {
  id: number;
  pregunta_texto: string;
  tipo: TipoPregunta;
}

export type ValorRespuesta = 1 | 2 | 3 | 4 | 5;

export interface RespuestaEnviada {
  id_pregunta: number;
  numero_respuesta: ValorRespuesta;
}
