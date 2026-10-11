import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../../context/useAuth';
import { cerrarSesion as cerrarSesionApi } from '../../services/authService';
import { apiDisponible } from '../../services/saludService';
import './Layout.css';

export function Layout() {
  const { usuario, esAdmin, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const [sinServidor, setSinServidor] = useState(false);

  useEffect(() => {
    let activo = true;
    apiDisponible().then((disponible) => {
      if (activo) {
        setSinServidor(!disponible);
      }
    });
    return () => {
      activo = false;
    };
  }, []);

  async function salir() {
    try {
      await cerrarSesionApi();
    } catch {
      // Aunque el backend falle, la sesión local se cierra igual.
    }
    cerrarSesion();
    navegar('/login');
  }

  return (
    <div className="layout">
      <header className="layout__encabezado">
        <Link to="/" className="layout__marca">
          Atención
        </Link>
        <nav className="layout__nav" aria-label="Principal">
          {usuario ? (
            <>
              <NavLink to="/encuesta">Encuesta</NavLink>
              <NavLink to="/perfil">Perfil</NavLink>
              {esAdmin && <NavLink to="/admin">Panel</NavLink>}
              <button type="button" className="boton boton--secundario" onClick={salir}>
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Ingresar</NavLink>
              <NavLink to="/registro">Crear cuenta</NavLink>
            </>
          )}
        </nav>
      </header>
      {sinServidor && (
        <p className="layout__aviso" role="alert">
          No se pudo conectar con el servidor. Algunas acciones pueden fallar.
        </p>
      )}
      <main className="layout__contenido">
        <Outlet />
      </main>
    </div>
  );
}
