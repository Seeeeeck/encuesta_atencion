import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { Layout } from './Layout';
import { guardarSesion, leerSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { adminDePrueba, usuarioDePrueba } from '../../test/datos';

function renderLayout() {
  return renderConRutas(
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<p>contenido</p>} />
        <Route path="/login" element={<p>pantalla login</p>} />
      </Route>
    </Routes>,
  );
}

beforeEach(() => {
  localStorage.clear();
  servidorFalso({ data: { status: 'ok' } });
});

test('muestra el contenido de la ruta', async () => {
  renderLayout();

  expect(await screen.findByText('contenido')).toBeInTheDocument();
});

test('sin sesión ofrece ingresar y crear cuenta', () => {
  renderLayout();

  expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/login');
  expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro');
  expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument();
});

test('un usuario ve encuesta y perfil, pero no el panel', () => {
  guardarSesion('tok', usuarioDePrueba);

  renderLayout();

  expect(screen.getByRole('link', { name: 'Encuesta' })).toHaveAttribute('href', '/encuesta');
  expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/perfil');
  expect(screen.queryByRole('link', { name: 'Panel' })).not.toBeInTheDocument();
});

test('un admin también ve el panel', () => {
  guardarSesion('tok', adminDePrueba);

  renderLayout();

  expect(screen.getByRole('link', { name: 'Panel' })).toHaveAttribute('href', '/admin');
});

test('Salir cierra la sesión en el backend y vuelve al login', async () => {
  guardarSesion('tok', usuarioDePrueba);
  const peticiones = servidorFalso({ data: { status: 'ok' } });
  renderLayout();

  await userEvent.click(screen.getByRole('button', { name: 'Salir' }));

  expect(await screen.findByText('pantalla login')).toBeInTheDocument();
  expect(peticiones.some((p) => p.metodo === 'POST' && p.url === '/logout')).toBe(true);
  expect(leerSesion()).toBeNull();
});

test('Salir cierra la sesión local aunque el backend falle', async () => {
  guardarSesion('tok', usuarioDePrueba);
  renderLayout();
  servidorFalso({ status: 500 });

  await userEvent.click(screen.getByRole('button', { name: 'Salir' }));

  expect(await screen.findByText('pantalla login')).toBeInTheDocument();
  expect(leerSesion()).toBeNull();
});

test('avisa cuando el servidor no responde', async () => {
  servidorFalso({ status: 500 });

  renderLayout();

  expect(await screen.findByText(/no se pudo conectar con el servidor/i)).toBeInTheDocument();
});

test('no muestra el aviso si el servidor responde', async () => {
  const peticiones = servidorFalso({ data: { status: 'ok' } });

  renderLayout();

  await waitFor(() => expect(peticiones).toHaveLength(1));
  expect(screen.queryByText(/no se pudo conectar con el servidor/i)).not.toBeInTheDocument();
});
