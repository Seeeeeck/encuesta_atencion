import { formatearIndice } from '../../utils/formato';
import './MedidorIndice.css';

interface Props {
  etiqueta: string;
  valor: number;
}

// Escala de 1 a 5 con el 3 (neutro) marcado: la posición dice más que una barra que
// arranca en 0, porque 1 ya es el mínimo posible.
export function MedidorIndice({ etiqueta, valor }: Props) {
  const posicion = ((valor - 1) / 4) * 100;

  return (
    <div
      className="medidor"
      role="meter"
      aria-label={etiqueta}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={valor}
      aria-valuetext={`${formatearIndice(valor)} de 5`}
    >
      <div className="medidor__pista" aria-hidden="true">
        <span className="medidor__neutro" />
        <span className="medidor__marca" data-testid="marca-indice" style={{ left: `${posicion}%` }} />
      </div>
      <div className="medidor__extremos" aria-hidden="true">
        <span>1 · Le cuesta más</span>
        <span>5 · Atención propia</span>
      </div>
    </div>
  );
}
