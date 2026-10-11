import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { AdminUsuarios } from './AdminUsuarios';
import { guardarSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { adminDePrueba } from '../../test/datos';
import { paginaDePrueba } from '../../test/datosAdmin';

function Detalle() {
  const { state } = useLocation();
  return <p>detalle de {(state as { usuario: { nombre: string } }).usuario.nombre}</p>;
}

function renderPagina(ruta = '/admin/usuarios') {
  return renderConRutas(
    <Routes>
      <Route path="/admin/usuarios" element={<AdminUsuarios />} />
      <Route path="/admin/usuarios/:id" element={<Detalle />} />
    </Routes>,
    ruta,
  );
}

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', adminDePrueba);
});

test('lista los usuarios de la primera página', async () => {
  const peticiones = servidorFalso({ data: { usuarios: paginaDePrueba(1) } });

  renderPagina();

  const fila = within(await screen.findByRole('row', { name: /Usuario página 1/ }));
  expect(fila.getByText('p1@test.local')).toBeInTheDocument();
  expect(fila.getByText('Usuario')).toBeInTheDocument();
  expect(peticiones[0].config.params).toEqual({ page: 1 });
  expect(screen.getByText('Página 1 de 3 · 21 usuarios')).toBeInTheDocument();
});

test('lee la página de la URL', async () => {
  const peticiones = servidorFalso({ data: { usuarios: paginaDePrueba(2) } });

  renderPagina('/admin/usuarios?pagina=2');

  expect(await screen.findByText('Usuario página 2')).toBeInTheDocument();
  expect(peticiones[0].config.params).toEqual({ page: 2 });
});

test('pasa de página con Siguiente y Anterior', async () => {
  servidorFalso([{ data: { usuarios: paginaDePrueba(1) } }, { data: { usuarios: paginaDePrueba(2) } }, { data: { usuarios: paginaDePrueba(1) } }]);
  renderPagina();
  await screen.findByText('Usuario página 1');

  expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  expect(await screen.findByText('Usuario página 2')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
  expect(await screen.findByText('Usuario página 1')).toBeInTheDocument();
});

test('en la última página no se puede avanzar', async () => {
  servidorFalso({ data: { usuarios: paginaDePrueba(3) } });

  renderPagina('/admin/usuarios?pagina=3');

  await screen.findByText('Usuario página 3');
  expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
});

test('abre el detalle del usuario con sus datos', async () => {
  servidorFalso({ data: { usuarios: paginaDePrueba(1) } });
  renderPagina();

  await userEvent.click(await screen.findByRole('link', { name: 'Ver Usuario página 1' }));

  expect(screen.getByText('detalle de Usuario página 1')).toBeInTheDocument();
});

test('si falla muestra el error', async () => {
  servidorFalso({ status: 500 });

  renderPagina();

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
});
