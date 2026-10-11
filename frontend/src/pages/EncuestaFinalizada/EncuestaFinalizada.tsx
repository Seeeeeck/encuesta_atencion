import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Cargando } from '../../components/Cargando/Cargando';
import { CompartirLink } from '../../components/CompartirLink/CompartirLink';
import { MedidorIndice } from '../../components/MedidorIndice/MedidorIndice';
import { MensajeError } from '../../components/MensajeError/MensajeError';
import { useAuth } from '../../context/useAuth';
import { obtenerEstado } from '../../services/encuestaService';
import { extraerError } from '../../services/errores';
import { leerResultado } from '../../services/resultadoEncuesta';
import { formatearIndice } from '../../utils/formato';
import { mensajeSegunIndice } from '../../utils/resultado';
import './EncuestaFinalizada.css';

export function EncuestaFinalizada() {
  const { usuario } = useAuth();
  const { state } = useLocation();
  const yaEnviada = Boolean((state as { yaEnviada?: boolean } | null)?.yaEnviada);
  const [completada, setCompletada] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerEstado()
      .then((estado) => activo && setCompletada(estado))
      .catch((errorApi: unknown) => activo && setError(extraerError(errorApi).mensaje));
    return () => {
      activo = false;
    };
  }, []);

  if (error) {
    return <MensajeError mensaje={error} />;
  }
  if (completada === null) {
    return <Cargando />;
  }
  if (!completada) {
    return (
      <section className="pagina-angosta tarjeta formulario">
        <h1>Todavía no respondes la encuesta</h1>
        <p>Son 10 afirmaciones y te toma menos de 3 minutos. Al final verás tu propio resultado.</p>
        <Link to="/encuesta" className="boton">
          Responder la encuesta
        </Link>
      </section>
    );
  }

  const resultado = usuario ? leerResultado(usuario.id) : null;
  const compartir = (
    <div className="final__compartir">
      <p>¿Conoces a alguien a quien le pueda servir mirarse un momento? Puedes compartirle la encuesta.</p>
      <CompartirLink url={`${window.location.origin}/`} secundario />
    </div>
  );

  if (!resultado) {
    return (
      <section className="final tarjeta">
        <h1>¡Gracias por responder!</h1>
        {yaEnviada && <p className="final__aviso">Ya habías enviado esta encuesta antes; tus respuestas no cambiaron.</p>}
        <p>
          Tus respuestas quedaron guardadas. Tu resultado personal se muestra en el dispositivo donde respondiste
          la encuesta.
        </p>
        {compartir}
      </section>
    );
  }

  return (
    <section className="final tarjeta">
      <h1>Gracias por tomarte este momento</h1>
      {yaEnviada && <p className="final__aviso">Ya habías enviado esta encuesta antes; tus respuestas no cambiaron.</p>}

      <div className="final__indice">
        <p className="final__etiqueta">Tu índice de atención</p>
        <p className="final__valor">
          {formatearIndice(resultado.indice)}
          <span> de 5</span>
        </p>
        <MedidorIndice etiqueta="Tu índice de atención" valor={resultado.indice} />
        <p className="final__mensaje">{mensajeSegunIndice(resultado.indice)}</p>
      </div>

      {resultado.aMejorar.length > 0 && (
        <div className="final__bloque">
          <h2>Dónde más te cuesta</h2>
          <ul className="final__ideas">
            {resultado.aMejorar.map((item) => (
              <li key={item.texto}>
                <p className="final__afirmacion">{item.texto}</p>
                <p className="final__respuesta">Respondiste «{item.respuesta}»</p>
                <p>{item.idea}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {resultado.fortaleza && (
        <div className="final__bloque">
          <h2>Lo que ya haces bien</h2>
          <p className="final__afirmacion">{resultado.fortaleza.texto}</p>
          <p className="final__respuesta">Respondiste «{resultado.fortaleza.respuesta}»</p>
        </div>
      )}

      <p className="final__nota">
        Este resultado es orientativo, no un diagnóstico: resume cómo respondiste hoy las 10 afirmaciones.
      </p>
      {compartir}
    </section>
  );
}
