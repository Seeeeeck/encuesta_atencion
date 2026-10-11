import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { isAxiosError } from 'axios';
import { Cargando } from '../../components/Cargando/Cargando';
import { MensajeError } from '../../components/MensajeError/MensajeError';
import { Pregunta } from '../../components/Pregunta/Pregunta';
import { ProgresoEncuesta } from '../../components/ProgresoEncuesta/ProgresoEncuesta';
import { useAuth } from '../../context/useAuth';
import { borrarBorrador, guardarBorrador, leerBorrador } from '../../services/borradorEncuesta';
import { enviarEncuesta, obtenerEstado, obtenerPreguntas } from '../../services/encuestaService';
import type { RespuestasPorPregunta } from '../../services/encuestaService';
import { extraerError } from '../../services/errores';
import type { Pregunta as TipoPregunta, ValorRespuesta } from '../../types/encuesta';
import './Encuesta.css';

const rutaFinalizada = '/encuesta/finalizada';

export function Encuesta() {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id ?? 0;
  const navegar = useNavigate();
  const [preguntas, setPreguntas] = useState<TipoPregunta[] | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestasPorPregunta>({});
  const [indice, setIndice] = useState(0);
  const [error, setError] = useState('');
  const [faltantes, setFaltantes] = useState<number[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        if (await obtenerEstado()) {
          navegar(rutaFinalizada, { replace: true });
          return;
        }
        const lista = await obtenerPreguntas();
        if (!activo) return;
        const borrador = leerBorrador(idUsuario);
        setRespuestas(borrador.respuestas);
        setIndice(Math.min(borrador.indice, Math.max(lista.length - 1, 0)));
        setPreguntas(lista);
      } catch (errorApi) {
        if (activo) setError(extraerError(errorApi).mensaje);
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [idUsuario, navegar]);

  useEffect(() => {
    if (preguntas) {
      guardarBorrador(idUsuario, { respuestas, indice });
    }
  }, [preguntas, respuestas, indice, idUsuario]);

  if (error && !preguntas) {
    return <MensajeError mensaje={error} />;
  }
  if (!preguntas) {
    return <Cargando texto="Cargando la encuesta…" />;
  }

  const actual = preguntas[indice];
  const esUltima = indice === preguntas.length - 1;
  const respondidas = preguntas.filter((pregunta) => respuestas[pregunta.id]).length;

  function responder(valor: ValorRespuesta) {
    setRespuestas((anteriores) => ({ ...anteriores, [actual.id]: valor }));
    setFaltantes((anteriores) => anteriores.filter((numero) => numero !== indice + 1));
  }

  function irA(nuevoIndice: number) {
    setIndice(nuevoIndice);
  }

  async function enviar() {
    if (!preguntas) return;
    setError('');
    const sinResponder = preguntas
      .map((pregunta, posicion) => (respuestas[pregunta.id] ? null : posicion + 1))
      .filter((numero): numero is number => numero !== null);
    setFaltantes(sinResponder);
    if (sinResponder.length > 0) {
      return;
    }

    setEnviando(true);
    try {
      await enviarEncuesta(respuestas);
      borrarBorrador(idUsuario);
      navegar(rutaFinalizada, { replace: true });
    } catch (errorApi) {
      if (isAxiosError(errorApi) && errorApi.response?.status === 409) {
        borrarBorrador(idUsuario);
        navegar(rutaFinalizada, { replace: true });
        return;
      }
      setError(extraerError(errorApi).mensaje);
      setEnviando(false);
    }
  }

  return (
    <section className="encuesta tarjeta">
      <ProgresoEncuesta respondidas={respondidas} total={preguntas.length} />
      <Pregunta
        key={actual.id}
        pregunta={actual}
        numero={indice + 1}
        total={preguntas.length}
        valor={respuestas[actual.id]}
        onResponder={responder}
      />
      {faltantes.length > 0 && (
        <div className="encuesta__faltantes" role="alert">
          <p>
            Te falta responder {faltantes.length} {faltantes.length === 1 ? 'pregunta' : 'preguntas'}.
          </p>
          <div className="acciones">
            {faltantes.map((numero) => (
              <button key={numero} type="button" className="boton boton--secundario" onClick={() => irA(numero - 1)}>
                Ir a la pregunta {numero}
              </button>
            ))}
          </div>
        </div>
      )}
      <MensajeError mensaje={error} />
      <div className="encuesta__navegacion">
        <button type="button" className="boton boton--secundario" onClick={() => irA(indice - 1)} disabled={indice === 0}>
          Anterior
        </button>
        {esUltima ? (
          <button type="button" className="boton" onClick={enviar} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar encuesta'}
          </button>
        ) : (
          <button type="button" className="boton" onClick={() => irA(indice + 1)}>
            Siguiente
          </button>
        )}
      </div>
    </section>
  );
}
