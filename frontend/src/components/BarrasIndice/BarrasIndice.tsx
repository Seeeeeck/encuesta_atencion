import { useId } from 'react';
import { formatearIndice } from '../../utils/formato';
import './BarrasIndice.css';

export interface FilaIndice {
  etiqueta: string;
  valor: number | null;
  detalle: string;
}

const maximo = 5;

export function BarrasIndice({ titulo, filas, nota }: { titulo: string; filas: FilaIndice[]; nota?: string }) {
  const idTitulo = useId();

  return (
    <figure className="barras-indice" aria-labelledby={idTitulo}>
      <figcaption id={idTitulo} className="barras-indice__titulo">
        {titulo}
      </figcaption>
      {nota && <p className="barras-indice__nota">{nota}</p>}
      <ul className="barras-indice__lista">
        {filas.map((fila) => {
          const valorTexto = fila.valor === null ? 'sin datos' : `${formatearIndice(fila.valor)} de 5`;
          return (
            <li
              key={fila.etiqueta}
              className="barras-indice__fila"
              aria-label={`${fila.etiqueta}: ${valorTexto}, ${fila.detalle}`}
            >
              <span className="barras-indice__etiqueta" aria-hidden="true">
                {fila.etiqueta}
              </span>
              <span className="barras-indice__pista" aria-hidden="true">
                {fila.valor !== null && (
                  <span
                    className="barras-indice__barra"
                    data-testid={`barra-${fila.etiqueta}`}
                    style={{ width: `${(fila.valor / maximo) * 100}%` }}
                  />
                )}
                <span className="barras-indice__valor">
                  {fila.valor === null ? 'Sin datos' : formatearIndice(fila.valor)}
                </span>
              </span>
              <span className="barras-indice__detalle" aria-hidden="true">
                {fila.detalle}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
