import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Cargando } from '../../components/Cargando/Cargando';
import { MensajeError } from '../../components/MensajeError/MensajeError';
import { listarUsuarios } from '../../services/adminService';
import { extraerError } from '../../services/errores';
import type { PaginaUsuarios } from '../../types/admin';
import { textoSexo } from '../../utils/opciones';

export function AdminUsuarios() {
  const [parametros, setParametros] = useSearchParams();
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1);
  const [datos, setDatos] = useState<PaginaUsuarios | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    setError('');
    listarUsuarios(pagina)
      .then((respuesta) => activo && setDatos(respuesta))
      .catch((errorApi: unknown) => activo && setError(extraerError(errorApi).mensaje));
    return () => {
      activo = false;
    };
  }, [pagina]);

  const irAPagina = (nueva: number) => setParametros({ pagina: String(nueva) });

  if (error) {
    return <MensajeError mensaje={error} />;
  }
  if (!datos) {
    return <Cargando texto="Cargando usuarios…" />;
  }

  return (
    <section className="tarjeta">
      <h1>Usuarios</h1>
      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Correo</th>
              <th scope="col">Edad</th>
              <th scope="col">Sexo</th>
              <th scope="col">Rol</th>
              <th scope="col">Verificado</th>
              <th scope="col">
                <span className="visualmente-oculto">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {datos.data.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.correo}</td>
                <td>{usuario.edad ?? '—'}</td>
                <td>{usuario.sexo ? textoSexo[usuario.sexo] : '—'}</td>
                <td>{usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}</td>
                <td>{usuario.is_verified ? 'Sí' : 'No'}</td>
                <td>
                  <Link to={`/admin/usuarios/${usuario.id}`} state={{ usuario }} aria-label={`Ver ${usuario.nombre}`}>
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav className="paginacion" aria-label="Paginación">
        <button type="button" className="boton boton--secundario" onClick={() => irAPagina(pagina - 1)} disabled={pagina <= 1}>
          Anterior
        </button>
        <span>
          Página {datos.current_page} de {datos.last_page} · {datos.total} usuarios
        </span>
        <button
          type="button"
          className="boton boton--secundario"
          onClick={() => irAPagina(pagina + 1)}
          disabled={pagina >= datos.last_page}
        >
          Siguiente
        </button>
      </nav>
    </section>
  );
}
