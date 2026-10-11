const decimales = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const enteros = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

export function formatearIndice(valor: number): string {
  return decimales.format(valor);
}

export function formatearPorcentaje(parte: number, total: number): string {
  return `${enteros.format(total > 0 ? (parte / total) * 100 : 0)} %`;
}

export function plural(cantidad: number, singular: string, pluralTexto: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}
