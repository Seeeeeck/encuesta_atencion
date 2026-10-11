import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { EliminarCuenta } from './EliminarCuenta';
import { guardarSesion, leerSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

function renderComponente() {
  return renderConRutas(
    <Routes>
      <Route path="/perfil" element={<EliminarCuenta />} />
      <Route path="/" element={<p>pantalla inicio</p>} />
    </Routes>,
    '/perfil',
  );
}

const eliminar = () => userEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));
const confirmar = () => userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', usuarioDePrueba);
});

test('pide confirmación antes de eliminar', async () => {
  const peticiones = servidorFalso();
  renderComponente();

  await eliminar();

  expect(screen.getByText(/se borran tu cuenta y tus respuestas/i)).toBeInTheDocument();
  expect(peticiones).toHaveLength(0);
});

test('cancelar no elimina nada', async () => {
  const peticiones = servidorFalso();
  renderComponente();

  await eliminar();
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

  expect(screen.getByRole('button', { name: 'Eliminar mi cuenta' })).toBeInTheDocument();
  expect(peticiones).toHaveLength(0);
});

test('al confirmar elimina la cuenta, cierra la sesión y vuelve al inicio', async () => {
  const peticiones = servidorFalso({ data: { message: 'Cuenta eliminada correctamente.' } });
  renderComponente();

  await eliminar();
  await confirmar();

  expect(await screen.findByText('pantalla inicio')).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({ metodo: 'DELETE', url: '/me/eliminar/usuario' });
  expect(leerSesion()).toBeNull();
});

test('si falla muestra el error y mantiene la sesión', async () => {
  servidorFalso({ status: 500 });
  renderComponente();

  await eliminar();
  await confirmar();

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
  expect(leerSesion()).not.toBeNull();
});
