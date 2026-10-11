import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { AdminLayout } from './AdminLayout';
import { renderConRutas } from '../../test/renderConRutas';

function renderLayout(ruta: string) {
  return renderConRutas(
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<p>contenido métricas</p>} />
        <Route path="usuarios" element={<p>contenido usuarios</p>} />
      </Route>
    </Routes>,
    ruta,
  );
}

test('ofrece las secciones del panel', () => {
  renderLayout('/admin');

  const navegacion = screen.getByRole('navigation', { name: 'Panel de administración' });
  expect(navegacion).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Métricas' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: 'Usuarios' })).toHaveAttribute('href', '/admin/usuarios');
});

test('marca la sección actual y muestra su contenido', () => {
  renderLayout('/admin/usuarios');

  expect(screen.getByRole('link', { name: 'Usuarios' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Métricas' })).not.toHaveAttribute('aria-current');
  expect(screen.getByText('contenido usuarios')).toBeInTheDocument();
});
