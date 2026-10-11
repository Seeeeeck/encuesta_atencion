import type { MetricaPregunta } from '../../types/admin';
import { formatearPorcentaje } from '../../utils/formato';
import { significadoRespuesta as significado } from '../../utils/opciones';
import './DistribucionRespuestas.css';

const valores = ['1', '2', '3', '4', '5'] as const;


// Barra divergente centrada en el valor neutro (3): el desacuerdo crece hacia la
// izquierda y el acuerdo hacia la derecha. Cada barra usa media escala para que
// ningún lado se salga aunque todas las respuestas estén de un mismo lado.
function BarraDivergente({ pregunta, numero }: { pregunta: MetricaPregunta; numero: number }) {
  const total = pregunta.total_respuestas;
  if (total === 0) {
    return <p className="distribucion__vacia">Sin respuestas todavía</p>;
  }
  const porcentaje = (valor: (typeof valores)[number]) => (pregunta.distribucion[valor] / total) * 100;
  const haciaLaIzquierda = porcentaje('1') + porcentaje('2') + porcentaje('3') / 2;

  return (
    <div className="distribucion__pista">
      <span className="distribucion__centro" aria-hidden="true" />
      <div className="distribucion__barra" style={{ left: `${50 - haciaLaIzquierda / 2}%` }}>
        {valores
          .filter((valor) => pregunta.distribucion[valor] > 0)
          .map((valor) => {
            const cantidad = pregunta.distribucion[valor];
            const descripcion = `Pregunta ${numero}, respuesta ${valor}: ${cantidad} de ${total} (${formatearPorcentaje(cantidad, total)})`;
            return (
              <span
                key={valor}
                role="img"
                tabIndex={0}
                aria-label={descripcion}
                data-tooltip={`${valor} · ${significado[valor]}: ${cantidad} (${formatearPorcentaje(cantidad, total)})`}
                className={`distribucion__segmento distribucion__segmento--${valor}`}
                style={{ width: `${porcentaje(valor) / 2}%` }}
              />
            );
          })}
      </div>
    </div>
  );
}

export function DistribucionRespuestas({ preguntas }: { preguntas: MetricaPregunta[] }) {
  return (
    <figure className="distribucion" aria-labelledby="titulo-distribucion">
      <figcaption id="titulo-distribucion" className="barras-indice__titulo">
        Distribución de respuestas por pregunta
      </figcaption>
      <ul className="distribucion__leyenda" aria-label="Leyenda">
        {valores.map((valor) => (
          <li key={valor}>
            <span className={`distribucion__muestra distribucion__segmento--${valor}`} aria-hidden="true" />
            {valor} · {significado[valor]}
          </li>
        ))}
      </ul>
      <ol className="distribucion__preguntas">
        {preguntas.map((pregunta, posicion) => (
          <li key={pregunta.id_pregunta} className="distribucion__fila">
            <p className="distribucion__texto">
              <strong>P{posicion + 1}</strong> {pregunta.pregunta_texto}
              <span className="distribucion__total"> · {pregunta.total_respuestas} respuestas</span>
            </p>
            <BarraDivergente pregunta={pregunta} numero={posicion + 1} />
          </li>
        ))}
      </ol>
      <details className="distribucion__tabla">
        <summary>Ver como tabla</summary>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Pregunta</th>
                {valores.map((valor) => (
                  <th key={valor} scope="col">
                    {valor}
                  </th>
                ))}
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {preguntas.map((pregunta, posicion) => (
                <tr key={pregunta.id_pregunta}>
                  <th scope="row">P{posicion + 1}</th>
                  {valores.map((valor) => (
                    <td key={valor}>{pregunta.distribucion[valor]}</td>
                  ))}
                  <td>{pregunta.total_respuestas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
