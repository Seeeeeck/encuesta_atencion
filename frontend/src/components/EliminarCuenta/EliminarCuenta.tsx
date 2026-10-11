import { startTransition, useState } from 'react';
import { useNavigate } from 'react-router';
import { MensajeError } from '../MensajeError/MensajeError';
import { useAuth } from '../../context/useAuth';
import { eliminarCuenta } from '../../services/authService';
import { extraerError } from '../../services/errores';

export function EliminarCuenta() {
  const { cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function eliminar() {
    setMensaje('');
    setEnviando(true);
    try {
      await eliminarCuenta();
      // react-router navega dentro de una transición: si la sesión se cerrara por fuera,
      // el guard de /perfil llegaría antes y mandaría al login en vez de al inicio.
      startTransition(() => {
        navegar('/', { replace: true });
        cerrarSesion();
      });
    } catch (error) {
      setMensaje(extraerError(error).mensaje);
      setEnviando(false);
    }
  }

  return (
    <div className="formulario">
      <h2>Eliminar cuenta</h2>
      <MensajeError mensaje={mensaje} />
      {confirmando ? (
        <div className="formulario" role="group" aria-label="Confirmar eliminación">
          <p>¿Seguro? Se borran tu cuenta y tus respuestas de la encuesta. No se puede deshacer.</p>
          <div className="acciones">
            <button type="button" className="boton boton--peligro" onClick={eliminar} disabled={enviando}>
              {enviando ? 'Eliminando…' : 'Sí, eliminar'}
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="boton boton--peligro" onClick={() => setConfirmando(true)}>
          Eliminar mi cuenta
        </button>
      )}
    </div>
  );
}
