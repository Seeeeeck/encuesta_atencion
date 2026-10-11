import './ProgresoEncuesta.css';

export function ProgresoEncuesta({ respondidas, total }: { respondidas: number; total: number }) {
  const porcentaje = total > 0 ? Math.round((respondidas / total) * 100) : 0;

  return (
    <div className="progreso">
      <div
        className="progreso__barra"
        role="progressbar"
        aria-label="Progreso de la encuesta"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={respondidas}
      >
        <div className="progreso__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="progreso__texto">
        {respondidas} de {total} respondidas
      </p>
    </div>
  );
}
