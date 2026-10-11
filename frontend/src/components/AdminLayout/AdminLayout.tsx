import { NavLink, Outlet } from 'react-router';
import './AdminLayout.css';

export function AdminLayout() {
  return (
    <div className="admin">
      <nav className="admin__pestanas" aria-label="Panel de administración">
        <NavLink to="/admin" end>
          Métricas
        </NavLink>
        <NavLink to="/admin/usuarios">Usuarios</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
