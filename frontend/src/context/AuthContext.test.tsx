import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import { guardarSesion, leerSesion } from '../services/sesion';
import { apiClient } from '../services/apiClient';
import { servidorFalso } from '../test/servidorFalso';
import { adminDePrueba, usuarioDePrueba } from '../test/datos';

function Consumidor() {
  const { usuario, esAdmin, iniciarSesion, cerrarSesion, actualizarUsuario } = useAuth();
  return (
    <div>
      <p>usuario: {usuario?.nombre ?? 'ninguno'}</p>
      <p>admin: {esAdmin ? 'sí' : 'no'}</p>
      <button onClick={() => iniciarSesion('tok', usuarioDePrueba)}>entrar</button>
      <button onClick={() => iniciarSesion('tok', adminDePrueba)}>entrar admin</button>
      <button onClick={() => actualizarUsuario({ ...usuarioDePrueba, nombre: 'Ana María' })}>renombrar</button>
      <button onClick={cerrarSesion}>salir</button>
    </div>
  );
}

function renderizar() {
  return render(
    <AuthProvider>
      <Consumidor />
    </AuthProvider>,
  );
}

beforeEach(() => localStorage.clear());

test('arranca con la sesión guardada', () => {
  guardarSesion('tok', usuarioDePrueba);

  renderizar();

  expect(screen.getByText('usuario: Ana')).toBeInTheDocument();
});

test('sin sesión guardada no hay usuario', () => {
  renderizar();

  expect(screen.getByText('usuario: ninguno')).toBeInTheDocument();
});

test('iniciarSesion expone el usuario y lo guarda', async () => {
  renderizar();

  await userEvent.click(screen.getByText('entrar'));

  expect(screen.getByText('usuario: Ana')).toBeInTheDocument();
  expect(leerSesion()?.token).toBe('tok');
});

test('esAdmin solo es verdadero para rol admin', async () => {
  renderizar();

  await userEvent.click(screen.getByText('entrar'));
  expect(screen.getByText('admin: no')).toBeInTheDocument();

  await userEvent.click(screen.getByText('entrar admin'));
  expect(screen.getByText('admin: sí')).toBeInTheDocument();
});

test('actualizarUsuario cambia el usuario en pantalla y en el almacenamiento', async () => {
  guardarSesion('tok', usuarioDePrueba);
  renderizar();

  await userEvent.click(screen.getByText('renombrar'));

  expect(screen.getByText('usuario: Ana María')).toBeInTheDocument();
  expect(leerSesion()?.usuario.nombre).toBe('Ana María');
});

test('cerrarSesion borra el usuario', async () => {
  guardarSesion('tok', usuarioDePrueba);
  renderizar();

  await userEvent.click(screen.getByText('salir'));

  expect(screen.getByText('usuario: ninguno')).toBeInTheDocument();
  expect(leerSesion()).toBeNull();
});

test('si la API responde 401 con token, la sesión se cierra', async () => {
  guardarSesion('tok', usuarioDePrueba);
  renderizar();
  servidorFalso({ status: 401, data: { message: 'No autenticado.' } });

  await act(async () => {
    await apiClient.get('/me').catch(() => {});
  });

  expect(screen.getByText('usuario: ninguno')).toBeInTheDocument();
});

test('useAuth fuera del provider avisa del error', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});

  expect(() => render(<Consumidor />)).toThrow('useAuth debe usarse dentro de <AuthProvider>');
});
