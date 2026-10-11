import { useState } from 'react';
import { MensajeError } from '../MensajeError/MensajeError';
import { useAuth } from '../../context/useAuth';
import { pedirCambioCorreo } from '../../services/authService';
import { extraerError } from '../../services/errores';

export function SolicitarCambioCorreo() {
  const { usuario } = useAuth();
  const [enviado, setEnviado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function pedir() {
    setMensaje('');
    setEnviando(true);
    try {
      await pedirCambioCorreo();
      setEnviado(true);
    } catch (error) {
      setMensaje(extraerError(error).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="formulario">
      <h2>Correo</h2>
      <p>
        Tu correo es <strong>{usuario?.correo}</strong>. Para cambiarlo te mandamos un link a ese
        correo; el link vence en 60 minutos.
      </p>
      <MensajeError mensaje={mensaje} />
      {enviado ? (
        <p className="mensaje-exito">
          Te mandamos un link a {usuario?.correo}. Abrilo para elegir tu nuevo correo.
        </p>
      ) : (
        <button type="button" className="boton boton--secundario" onClick={pedir} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviarme el link'}
        </button>
      )}
    </div>
  );
}
