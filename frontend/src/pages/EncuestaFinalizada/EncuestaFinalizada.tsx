import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Cargando } from '../../components/Cargando/Cargando';
import { CompartirLink } from '../../components/CompartirLink/CompartirLink';
import { MensajeError } from '../../components/MensajeError/MensajeError';
import { obtenerEstado } from '../../services/encuestaService';
import { extraerError } from '../../services/errores';

export function EncuestaFinalizada() {
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
      <section className="pagina-angosta tarjeta">
        <p>Todavía no completaste la encuesta.</p>
        <Link to="/encuesta" className="boton">
          Responder la encuesta
        </Link>
      </section>
    );
  }

  return (
    <section className="pagina-angosta tarjeta formulario">
      <h1>¡Gracias por responder!</h1>
      <p>
        Tus respuestas quedaron guardadas. Si conocés a alguien a quien le pueda interesar, compartile
        la encuesta: cuantas más respuestas, mejores conclusiones.
      </p>
      <CompartirLink url={`${window.location.origin}/`} />
    </section>
  );
}
