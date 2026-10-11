import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { isAxiosError } from 'axios';
import { Cargando } from '../../components/Cargando/Cargando';
import { MensajeError } from '../../components/MensajeError/MensajeError';
import { Pregunta } from '../../components/Pregunta/Pregunta';
import { ProgresoEncuesta } from '../../components/ProgresoEncuesta/ProgresoEncuesta';
import { RevisionEncuesta } from '../../components/RevisionEncuesta/RevisionEncuesta';
import { useAuth } from '../../context/useAuth';
import { borrarBorrador, guardarBorrador, leerBorrador } from '../../services/borradorEncuesta';
import { enviarEncuesta, obtenerEstado, obtenerPreguntas } from '../../services/encuestaService';
import type { RespuestasPorPregunta } from '../../services/encuestaService';
import { extraerError } from '../../services/errores';
import { guardarResultado } from '../../services/resultadoEncuesta';
import type { Pregunta as TipoPregunta, ValorRespuesta } from '../../types/encuesta';
import { calcularResultado } from '../../utils/resultado';
import './Encuesta.css';

const rutaFinalizada = '/encuesta/finalizada';

export function Encuesta() {
  const { usuario } = useAuth();
  const idUsuario = usuario?.id ?? 0;
  const navegar = useNavigate();
  const [preguntas, setPreguntas] = useState<TipoPregunta[] | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestasPorPregunta>({});
  const [indice, setIndice] = useState(0);
  const [revisando, setRevisando] = useState(false);
  const [desdeRevision, setDesdeRevision] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const refTitulo = useRef<HTMLHeadingElement>(null);
  const yaMostroPrimera = useRef(false);

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

  // Al pasar de pregunta el foco va al texto nuevo para que el lector de pantalla lo
  // anuncie. En la primera carga no se mueve el foco.
  useEffect(() => {
    if (!preguntas || revisando) return;
    if (!yaMostroPrimera.current) {
      yaMostroPrimera.current = true;
      return;
    }
    refTitulo.current?.focus();
  }, [indice, revisando, preguntas]);

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
  }

  function irAPregunta(nuevoIndice: number, volverALaRevision = false) {
    setIndice(nuevoIndice);
    setDesdeRevision(volverALaRevision);
    setRevisando(false);
  }

  function abrirRevision() {
    setDesdeRevision(false);
    setRevisando(true);
  }

  async function enviar() {
    if (!preguntas) return;
    setError('');
    setEnviando(true);
    try {
      await enviarEncuesta(respuestas);
      guardarResultado(idUsuario, calcularResultado(preguntas, respuestas));
      borrarBorrador(idUsuario);
      navegar(rutaFinalizada, { replace: true });
    } catch (errorApi) {
      if (isAxiosError(errorApi) && errorApi.response?.status === 409) {
        borrarBorrador(idUsuario);
        navegar(rutaFinalizada, { replace: true, state: { yaEnviada: true } });
        return;
      }
      setError(extraerError(errorApi).mensaje);
      setEnviando(false);
    }
  }

  if (revisando) {
    return (
      <section className="encuesta tarjeta">
        <RevisionEncuesta
          preguntas={preguntas}
          respuestas={respuestas}
          onCambiar={(posicion) => irAPregunta(posicion, true)}
          onEnviar={enviar}
          enviando={enviando}
        />
        <MensajeError mensaje={error} />
      </section>
    );
  }

  return (
    <section className="encuesta tarjeta">
      <ProgresoEncuesta posicion={indice + 1} respondidas={respondidas} total={preguntas.length} />
      <Pregunta
        key={actual.id}
        ref={refTitulo}
        pregunta={actual}
        valor={respuestas[actual.id]}
        onResponder={responder}
      />
      <div className="encuesta__navegacion">
        <button
          type="button"
          className="boton boton--secundario"
          onClick={() => irAPregunta(indice - 1)}
          disabled={indice === 0}
        >
          Anterior
        </button>
        {desdeRevision ? (
          <button type="button" className="boton" onClick={abrirRevision}>
            Volver a la revisión
          </button>
        ) : esUltima ? (
          <button type="button" className="boton" onClick={abrirRevision}>
            Revisar respuestas
          </button>
        ) : (
          <button type="button" className="boton" onClick={() => irAPregunta(indice + 1)}>
            Siguiente
          </button>
        )}
      </div>
    </section>
  );
}
