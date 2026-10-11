import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Cargando } from '../Cargando/Cargando';
import { MensajeError } from '../MensajeError/MensajeError';
import { obtenerRespuestasDeUsuario } from '../../services/adminService';
import { obtenerPreguntas } from '../../services/encuestaService';
import { extraerError } from '../../services/errores';
import type { Pregunta } from '../../types/encuesta';
import type { RespuestaDeUsuario } from '../../types/admin';
import { significadoRespuesta } from '../../utils/opciones';
import './RespuestasUsuario.css';

interface Datos {
  preguntas: Pregunta[];
  respuestas: RespuestaDeUsuario[];
}

export function RespuestasUsuario({ idUsuario }: { idUsuario: number }) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    Promise.all([obtenerPreguntas(), obtenerRespuestasDeUsuario(idUsuario)])
      .then(([preguntas, respuestas]) => activo && setDatos({ preguntas, respuestas }))
      .catch((errorApi: unknown) => {
        if (!activo) return;
        // El backend responde 404 cuando el usuario todavía no respondió: no es un error.
        if (isAxiosError(errorApi) && errorApi.response?.status === 404) {
          setAviso(extraerError(errorApi).mensaje);
        } else {
          setError(extraerError(errorApi).mensaje);
        }
      });
    return () => {
      activo = false;
    };
  }, [idUsuario]);

  if (error) return <MensajeError mensaje={error} />;
  if (aviso) return <p className="respuestas-usuario__aviso">{aviso}</p>;
  if (!datos) return <Cargando texto="Cargando respuestas…" />;

  const valorDe = (idPregunta: number) => datos.respuestas.find((r) => r.id_pregunta === idPregunta)?.respuesta;

  return (
    <ol className="respuestas-usuario">
      {datos.preguntas.map((pregunta, posicion) => {
        const valor = valorDe(pregunta.id);
        return (
          <li key={pregunta.id} className="respuestas-usuario__fila">
            <span className="respuestas-usuario__numero">P{posicion + 1}</span>
            <span>{pregunta.pregunta_texto}</span>
            <span className="respuestas-usuario__valor">
              {valor === undefined ? 'Sin respuesta' : `${valor} · ${significadoRespuesta[valor]}`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
