import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/useAuth';

export function RutaPrivada() {
  const { usuario } = useAuth();
  const ubicacion = useLocation();
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }
  return <Outlet />;
}

export function RutaAdmin() {
  const { usuario, esAdmin } = useAuth();
  const ubicacion = useLocation();
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }
  if (!esAdmin) {
    return <Navigate to="/encuesta" replace />;
  }
  return <Outlet />;
}

export function RutaInvitado() {
  const { usuario, esAdmin } = useAuth();
  if (usuario) {
    return <Navigate to={esAdmin ? '/admin' : '/encuesta'} replace />;
  }
  return <Outlet />;
}
