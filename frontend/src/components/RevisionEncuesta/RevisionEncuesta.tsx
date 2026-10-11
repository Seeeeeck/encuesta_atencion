import { useEffect, useRef, useState } from 'react';
import type { RespuestasPorPregunta } from '../../services/encuestaService';
import type { Pregunta } from '../../types/encuesta';
import { plural } from '../../utils/formato';
import { significadoRespuesta } from '../../utils/opciones';
import './RevisionEncuesta.css';

interface Props {
  preguntas: Pregunta[];
  respuestas: RespuestasPorPregunta;
  onCambiar: (indice: number) => void;
  onEnviar: () => void;
  enviando: boolean;
}

export function RevisionEncuesta({ preguntas, respuestas, onCambiar, onEnviar, enviando }: Props) {
  const [faltantes, setFaltantes] = useState(0);
  const refTitulo = useRef<HTMLHeadingElement>(null);

  // Al abrir la revisión el foco va al título: el lector de pantalla anuncia el cambio
  // y la vista arranca desde arriba.
  useEffect(() => {
    refTitulo.current?.focus();
  }, []);

  function enviar() {
    const sinResponder = preguntas.filter((pregunta) => !respuestas[pregunta.id]).length;
    setFaltantes(sinResponder);
    if (sinResponder === 0) {
      onEnviar();
    }
  }

  return (
    <div className="revision">
      <h1 ref={refTitulo} tabIndex={-1}>
        Revisa tus respuestas
      </h1>
      <p className="revision__nota">
        Tómate un momento para mirarlas. Después de enviarla no podrás cambiar tus respuestas.
      </p>
      <ol className="revision__lista">
        {preguntas.map((pregunta, posicion) => {
          const valor = respuestas[pregunta.id];
          const numero = posicion + 1;
          return (
            <li key={pregunta.id} className="revision__fila">
              <span className="revision__numero" aria-hidden="true">
                {numero}
              </span>
              <div className="revision__cuerpo">
                <p className="revision__texto">{pregunta.pregunta_texto}</p>
                <p className={`revision__valor${valor ? '' : ' revision__valor--falta'}`}>
                  {valor ? `${valor} · ${significadoRespuesta[valor]}` : 'Sin responder'}
                </p>
              </div>
              <button
                type="button"
                className="revision__cambiar"
                aria-label={valor ? `Cambiar la respuesta ${numero}` : `Responder la pregunta ${numero}`}
                onClick={() => onCambiar(posicion)}
              >
                {valor ? 'Cambiar' : 'Responder'}
              </button>
            </li>
          );
        })}
      </ol>
      {faltantes > 0 && (
        <p className="revision__alerta" role="alert">
          Te falta responder {plural(faltantes, 'pregunta', 'preguntas')}.
        </p>
      )}
      <div className="revision__acciones">
        <button type="button" className="boton" onClick={enviar} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar encuesta'}
        </button>
      </div>
    </div>
  );
}
