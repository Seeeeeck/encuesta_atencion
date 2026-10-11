import { plural } from '../../utils/formato';
import './ProgresoEncuesta.css';

interface Props {
  posicion: number;
  respondidas: number;
  total: number;
}

export function ProgresoEncuesta({ posicion, respondidas, total }: Props) {
  const porcentaje = total > 0 ? Math.round((posicion / total) * 100) : 0;

  return (
    <div className="progreso">
      <div className="progreso__textos">
        <span className="progreso__posicion">
          Pregunta {posicion} de {total}
        </span>
        <span>{plural(respondidas, 'respondida', 'respondidas')}</span>
      </div>
      <div
        className="progreso__barra"
        role="progressbar"
        aria-label="Progreso de la encuesta"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={posicion}
      >
        <div className="progreso__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}
