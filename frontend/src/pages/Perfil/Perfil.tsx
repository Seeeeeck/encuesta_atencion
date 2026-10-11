import { useEffect } from 'react';
import { CambiarClave } from '../../components/CambiarClave/CambiarClave';
import { EditarNombre } from '../../components/EditarNombre/EditarNombre';
import { EliminarCuenta } from '../../components/EliminarCuenta/EliminarCuenta';
import { SolicitarCambioCorreo } from '../../components/SolicitarCambioCorreo/SolicitarCambioCorreo';
import { useAuth } from '../../context/useAuth';
import { obtenerPerfil } from '../../services/authService';
import { textoSexo } from '../../utils/opciones';
import './Perfil.css';

export function Perfil() {
  const { usuario, actualizarUsuario } = useAuth();

  useEffect(() => {
    obtenerPerfil().then(actualizarUsuario, () => {});
  }, [actualizarUsuario]);

  if (!usuario) {
    return null;
  }

  return (
    <div className="perfil">
      <section className="tarjeta">
        <h1>Mi perfil</h1>
        <dl className="perfil__datos">
          <div>
            <dt>Correo</dt>
            <dd>{usuario.correo}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>
              <span className={`etiqueta${usuario.is_verified ? ' etiqueta--ok' : ' etiqueta--aviso'}`}>
                {usuario.is_verified ? 'Verificado' : 'Sin verificar'}
              </span>
            </dd>
          </div>
          <div>
            <dt>Edad</dt>
            <dd>{usuario.edad ?? 'Sin dato'}</dd>
          </div>
          <div>
            <dt>Sexo</dt>
            <dd>{usuario.sexo ? textoSexo[usuario.sexo] : 'Sin dato'}</dd>
          </div>
        </dl>
      </section>
      <section className="tarjeta">
        <EditarNombre />
      </section>
      <section className="tarjeta">
        <CambiarClave />
      </section>
      <section className="tarjeta">
        <SolicitarCambioCorreo />
      </section>
      <section className="tarjeta perfil__peligro">
        <EliminarCuenta />
      </section>
    </div>
  );
}
