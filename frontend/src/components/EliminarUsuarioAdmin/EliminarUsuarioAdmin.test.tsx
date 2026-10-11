import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { EliminarUsuarioAdmin } from './EliminarUsuarioAdmin';
import { guardarSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { adminDePrueba, usuarioDePrueba } from '../../test/datos';

const otro = { ...usuarioDePrueba, id: 8, nombre: 'Bruno' };

function renderComponente(usuario = otro) {
  return renderConRutas(
    <Routes>
      <Route path="/admin/usuarios/:id" element={<EliminarUsuarioAdmin usuario={usuario} />} />
      <Route path="/admin/usuarios" element={<p>lista de usuarios</p>} />
    </Routes>,
    `/admin/usuarios/${usuario.id}`,
  );
}

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', adminDePrueba);
});

test('pide confirmación nombrando al usuario', async () => {
  const peticiones = servidorFalso();
  renderComponente();

  await userEvent.click(screen.getByRole('button', { name: 'Eliminar usuario' }));

  expect(screen.getByText(/¿Eliminar a Bruno\?/)).toBeInTheDocument();
  expect(peticiones).toHaveLength(0);
});

test('al confirmar lo elimina y vuelve a la lista', async () => {
  const peticiones = servidorFalso({ data: { message: 'ok' } });
  renderComponente();

  await userEvent.click(screen.getByRole('button', { name: 'Eliminar usuario' }));
  await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

  expect(await screen.findByText('lista de usuarios')).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({ metodo: 'DELETE', url: '/admin/usuario/eliminar', cuerpo: { id: 8 } });
});

test('cancelar no elimina', async () => {
  const peticiones = servidorFalso();
  renderComponente();

  await userEvent.click(screen.getByRole('button', { name: 'Eliminar usuario' }));
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

  expect(screen.getByRole('button', { name: 'Eliminar usuario' })).toBeInTheDocument();
  expect(peticiones).toHaveLength(0);
});

test('si falla muestra el error', async () => {
  servidorFalso({ status: 500 });
  renderComponente();

  await userEvent.click(screen.getByRole('button', { name: 'Eliminar usuario' }));
  await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
});

test('un admin no puede eliminarse a sí mismo desde el panel', () => {
  renderComponente(adminDePrueba);

  expect(screen.queryByRole('button', { name: 'Eliminar usuario' })).not.toBeInTheDocument();
  expect(screen.getByText(/Para eliminar tu propia cuenta usa tu perfil/)).toBeInTheDocument();
});
