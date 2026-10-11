import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MensajeError } from '../MensajeError/MensajeError';
import { useAuth } from '../../context/useAuth';
import { eliminarUsuario } from '../../services/adminService';
import { extraerError } from '../../services/errores';
import type { Usuario } from '../../types/usuario';

export function EliminarUsuarioAdmin({ usuario }: { usuario: Usuario }) {
  const { usuario: sesion } = useAuth();
  const navegar = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (sesion?.id === usuario.id) {
    return (
      <div className="formulario">
        <h2>Eliminar usuario</h2>
        <p>Para eliminar tu propia cuenta usa tu perfil.</p>
      </div>
    );
  }

  async function eliminar() {
    setMensaje('');
    setEnviando(true);
    try {
      await eliminarUsuario(usuario.id);
      navegar('/admin/usuarios', { replace: true });
    } catch (error) {
      setMensaje(extraerError(error).mensaje);
      setEnviando(false);
    }
  }

  return (
    <div className="formulario">
      <h2>Eliminar usuario</h2>
      <MensajeError mensaje={mensaje} />
      {confirmando ? (
        <div className="formulario" role="group" aria-label="Confirmar eliminación">
          <p>¿Eliminar a {usuario.nombre}? Se borran su cuenta y sus respuestas. No se puede deshacer.</p>
          <div className="acciones">
            <button type="button" className="boton boton--peligro-confirmar" onClick={eliminar} disabled={enviando}>
              {enviando ? 'Eliminando…' : 'Sí, eliminar'}
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="boton boton--peligro" onClick={() => setConfirmando(true)}>
          Eliminar usuario
        </button>
      )}
    </div>
  );
}
