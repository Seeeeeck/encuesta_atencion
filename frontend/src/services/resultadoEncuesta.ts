import type { ResultadoEncuesta } from '../utils/resultado';

// El resultado se calcula en el navegador al enviar la encuesta y se guarda acá
// para mostrarlo en la pantalla final (la API no devuelve el resultado personal).
const clave = (idUsuario: number) => `resultado-encuesta-${idUsuario}`;

function esResultadoValido(valor: unknown): valor is ResultadoEncuesta {
  const resultado = valor as ResultadoEncuesta | null;
  const fortalezaValida =
    resultado?.fortaleza === null || (typeof resultado?.fortaleza === 'object' && 'respuesta' in resultado.fortaleza);
  return (
    typeof resultado?.indice === 'number' &&
    Array.isArray(resultado.aMejorar) &&
    resultado.aMejorar.every((item) => typeof item.respuesta === 'string') &&
    fortalezaValida
  );
}

export function guardarResultado(idUsuario: number, resultado: ResultadoEncuesta): void {
  localStorage.setItem(clave(idUsuario), JSON.stringify(resultado));
}

export function leerResultado(idUsuario: number): ResultadoEncuesta | null {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave(idUsuario)) ?? 'null');
    return esResultadoValido(guardado) ? guardado : null;
  } catch {
    return null;
  }
}
