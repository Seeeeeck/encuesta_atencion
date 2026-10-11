import { useEffect, useState } from 'react';
import { BarrasIndice } from '../../components/BarrasIndice/BarrasIndice';
import { Cargando } from '../../components/Cargando/Cargando';
import { DistribucionRespuestas } from '../../components/DistribucionRespuestas/DistribucionRespuestas';
import { MensajeError } from '../../components/MensajeError/MensajeError';
import { ResumenMetricas } from '../../components/ResumenMetricas/ResumenMetricas';
import { obtenerMetricas } from '../../services/adminService';
import { extraerError } from '../../services/errores';
import type { Metricas } from '../../types/admin';
import { plural } from '../../utils/formato';
import { textoSexo } from '../../utils/opciones';

const notaIndice = 'Escala de 1 a 5, donde 5 es mejor atención. Las afirmaciones negativas se invierten (6 − respuesta).';

export function AdminMetricas() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerMetricas()
      .then((datos) => activo && setMetricas(datos))
      .catch((errorApi: unknown) => activo && setError(extraerError(errorApi).mensaje));
    return () => {
      activo = false;
    };
  }, []);

  if (error) {
    return <MensajeError mensaje={error} />;
  }
  if (!metricas) {
    return <Cargando texto="Cargando métricas…" />;
  }

  const encuestas = (cantidad: number) => plural(cantidad, 'encuesta', 'encuestas');

  return (
    <div className="admin-secciones">
      <ResumenMetricas resumen={metricas.resumen} />
      <section className="tarjeta">
        <BarrasIndice
          titulo="Índice de atención por pregunta"
          nota={notaIndice}
          filas={metricas.por_pregunta.map((pregunta, posicion) => ({
            etiqueta: `P${posicion + 1}`,
            valor: pregunta.promedio_ajustado,
            detalle: plural(pregunta.total_respuestas, 'respuesta', 'respuestas'),
          }))}
        />
      </section>
      <section className="tarjeta">
        <DistribucionRespuestas preguntas={metricas.por_pregunta} />
      </section>
      <div className="admin-columnas">
        <section className="tarjeta">
          <BarrasIndice
            titulo="Índice por edad"
            filas={metricas.por_edad.map((grupo) => ({
              etiqueta: grupo.rango,
              valor: grupo.indice_atencion,
              detalle: encuestas(grupo.encuestas),
            }))}
          />
        </section>
        <section className="tarjeta">
          <BarrasIndice
            titulo="Índice por sexo"
            filas={metricas.por_sexo.map((grupo) => ({
              etiqueta: textoSexo[grupo.sexo] ?? grupo.sexo,
              valor: grupo.indice_atencion,
              detalle: encuestas(grupo.encuestas),
            }))}
          />
        </section>
      </div>
    </div>
  );
}
