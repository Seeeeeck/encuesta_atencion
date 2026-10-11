import type { ReactNode } from 'react';
import type { Metricas } from '../../types/admin';
import { formatearIndice, formatearPorcentaje } from '../../utils/formato';
import './ResumenMetricas.css';

function Indicador({ titulo, valor, detalle }: { titulo: string; valor: ReactNode; detalle?: string }) {
  return (
    <div className="indicador tarjeta" role="group" aria-label={titulo}>
      <p className="indicador__titulo">{titulo}</p>
      <p className="indicador__valor">{valor}</p>
      {detalle && <p className="indicador__detalle">{detalle}</p>}
    </div>
  );
}

export function ResumenMetricas({ resumen }: { resumen: Metricas['resumen'] }) {
  const indice = resumen.indice_atencion_general;

  return (
    <div className="resumen-metricas">
      <Indicador titulo="Usuarios" valor={resumen.total_usuarios} detalle="registrados" />
      <Indicador
        titulo="Encuestas completadas"
        valor={resumen.encuestas_completadas}
        detalle={`${formatearPorcentaje(resumen.encuestas_completadas, resumen.total_usuarios)} de los usuarios`}
      />
      <Indicador
        titulo="Índice de atención"
        valor={indice === null ? 'Sin datos' : formatearIndice(indice)}
        detalle={indice === null ? undefined : 'de 5'}
      />
    </div>
  );
}
