import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { AdminUsuario } from './AdminUsuario';
import { guardarSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { adminDePrueba, usuarioDePrueba } from '../../test/datos';

const otro = { ...usuarioDePrueba, id: 8, nombre: 'Bruno', correo: 'bruno@test.local' };

function renderPagina(estado?: unknown) {
  return renderConRutas(
    <Routes>
      <Route path="/admin/usuarios/:id" element={<AdminUsuario />} />
    </Routes>,
    { pathname: '/admin/usuarios/8', state: estado },
  );
}

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', adminDePrueba);
});

test('muestra los datos del usuario que llegan desde la lista', () => {
  servidorFalso([{ data: { preguntas: [] } }, { data: { respuestas: [] } }]);

  renderPagina({ usuario: otro });

  expect(screen.getByRole('heading', { level: 1, name: 'Bruno' })).toBeInTheDocument();
  expect(screen.getByText('bruno@test.local')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Respuestas' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Editar datos' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Eliminar usuario' })).toBeInTheDocument();
});

test('sin datos del usuario pide abrirlo desde la lista', () => {
  renderPagina();

  expect(screen.getByText('Abre el usuario desde la lista de usuarios.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ir a la lista' })).toHaveAttribute('href', '/admin/usuarios');
});

test('si el id de la URL no coincide con los datos, también pide abrirlo desde la lista', () => {
  renderPagina({ usuario: { ...otro, id: 99 } });

  expect(screen.getByText('Abre el usuario desde la lista de usuarios.')).toBeInTheDocument();
});

test('después de editar muestra los datos nuevos', async () => {
  servidorFalso([
    { data: { preguntas: [] } },
    { data: { respuestas: [] } },
    { data: { message: 'ok', usuario: { ...otro, nombre: 'Bruno Díaz' } } },
  ]);
  renderPagina({ usuario: otro });

  await userEvent.clear(screen.getByLabelText('Nombre'));
  await userEvent.type(screen.getByLabelText('Nombre'), 'Bruno Díaz');
  await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Bruno Díaz' })).toBeInTheDocument();
});
