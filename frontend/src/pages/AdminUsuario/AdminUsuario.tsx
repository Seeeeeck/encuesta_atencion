import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { EditarUsuarioAdmin } from '../../components/EditarUsuarioAdmin/EditarUsuarioAdmin';
import { EliminarUsuarioAdmin } from '../../components/EliminarUsuarioAdmin/EliminarUsuarioAdmin';
import { RespuestasUsuario } from '../../components/RespuestasUsuario/RespuestasUsuario';
import type { Usuario } from '../../types/usuario';
import { textoSexo } from '../../utils/opciones';

// La API no tiene un endpoint para traer un usuario por id: los datos llegan desde
// la lista en el state de la navegación (el navegador lo conserva al recargar).
export function AdminUsuario() {
  const { id } = useParams();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const desdeLista = (ubicacion.state as { usuario?: Usuario } | null)?.usuario;
  const [usuario, setUsuario] = useState<Usuario | undefined>(
    desdeLista && String(desdeLista.id) === id ? desdeLista : undefined,
  );

  if (!usuario) {
    return (
      <section className="tarjeta">
        <p>Abrí el usuario desde la lista de usuarios.</p>
        <Link to="/admin/usuarios" className="boton">
          Ir a la lista
        </Link>
      </section>
    );
  }

  function alGuardar(actualizado: Usuario) {
    setUsuario(actualizado);
    navegar(ubicacion.pathname, { replace: true, state: { usuario: actualizado } });
  }

  return (
    <div className="admin-secciones">
      <section className="tarjeta">
        <p>
          <Link to="/admin/usuarios">← Volver a la lista</Link>
        </p>
        <h1>{usuario.nombre}</h1>
        <dl className="perfil__datos">
          <div>
            <dt>Correo</dt>
            <dd>{usuario.correo}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}</dd>
          </div>
          <div>
            <dt>Edad</dt>
            <dd>{usuario.edad ?? 'Sin dato'}</dd>
          </div>
          <div>
            <dt>Sexo</dt>
            <dd>{usuario.sexo ? textoSexo[usuario.sexo] : 'Sin dato'}</dd>
          </div>
          <div>
            <dt>Correo verificado</dt>
            <dd>{usuario.is_verified ? 'Sí' : 'No'}</dd>
          </div>
        </dl>
      </section>
      <section className="tarjeta formulario">
        <h2>Respuestas</h2>
        <RespuestasUsuario idUsuario={usuario.id} />
      </section>
      <section className="tarjeta">
        <EditarUsuarioAdmin key={usuario.id} usuario={usuario} onGuardado={alGuardar} />
      </section>
      <section className="tarjeta perfil__peligro">
        <EliminarUsuarioAdmin usuario={usuario} />
      </section>
    </div>
  );
}
