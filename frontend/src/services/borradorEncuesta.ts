import type { ValorRespuesta } from '../types/encuesta';
import type { RespuestasPorPregunta } from './encuestaService';

// Las respuestas se van guardando en el navegador para poder retomar la encuesta;
// al backend se mandan todas juntas al final.
export interface BorradorEncuesta {
  respuestas: RespuestasPorPregunta;
  indice: number;
}

const clave = (idUsuario: number) => `borrador-encuesta-${idUsuario}`;
const vacio = (): BorradorEncuesta => ({ respuestas: {}, indice: 0 });

function esValorValido(valor: unknown): valor is ValorRespuesta {
  return Number.isInteger(valor) && (valor as number) >= 1 && (valor as number) <= 5;
}

export function leerBorrador(idUsuario: number): BorradorEncuesta {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave(idUsuario)) ?? 'null');
    if (!guardado) {
      return vacio();
    }
    const respuestas: RespuestasPorPregunta = {};
    for (const [idPregunta, valor] of Object.entries(guardado.respuestas ?? {})) {
      if (esValorValido(valor)) {
        respuestas[Number(idPregunta)] = valor;
      }
    }
    const indice = Number.isInteger(guardado.indice) && guardado.indice >= 0 ? guardado.indice : 0;
    return { respuestas, indice };
  } catch {
    return vacio();
  }
}

export function guardarBorrador(idUsuario: number, borrador: BorradorEncuesta): void {
  localStorage.setItem(clave(idUsuario), JSON.stringify(borrador));
}

export function borrarBorrador(idUsuario: number): void {
  localStorage.removeItem(clave(idUsuario));
}
