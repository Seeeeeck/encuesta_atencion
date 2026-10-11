// Laravel firma la URL con el query ordenado por clave y valida contra el query tal
// como llega, así que hay que mandarlo en ese mismo orden con `signature` al final.
export function consultaFirmada(parametros: URLSearchParams, claves: string[]): string {
  const ordenadas = [...claves].sort();
  const partes = [...ordenadas, 'signature'].map(
    (clave) => `${clave}=${encodeURIComponent(parametros.get(clave) ?? '')}`,
  );
  return partes.join('&');
}
