import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import type { InitialEntry } from 'react-router';
import { Login } from './Login';
import { leerSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { adminDePrueba, usuarioDePrueba } from '../../test/datos';

function renderLogin(entrada: InitialEntry = '/login') {
  return renderConRutas(
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/encuesta" element={<p>pantalla encuesta</p>} />
      <Route path="/admin" element={<p>pantalla admin</p>} />
      <Route path="/perfil" element={<p>pantalla perfil</p>} />
    </Routes>,
    entrada,
  );
}

async function completar(correo: string, clave: string) {
  if (correo) await userEvent.type(screen.getByLabelText('Correo'), correo);
  if (clave) await userEvent.type(screen.getByLabelText('Clave'), clave);
  await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
}

beforeEach(() => localStorage.clear());

test('sin datos muestra los errores y no llama a la API', async () => {
  const peticiones = servidorFalso();
  renderLogin();

  await completar('', '');

  expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument();
  expect(screen.getByText('Ingresa tu clave.')).toBeInTheDocument();
  expect(peticiones).toHaveLength(0);
});

test('con datos válidos inicia sesión y va a la encuesta', async () => {
  const peticiones = servidorFalso({ data: { token: 'tok', usuario: usuarioDePrueba } });
  renderLogin();

  await completar('ana@test.local', 'Clave!');

  expect(await screen.findByText('pantalla encuesta')).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({ url: '/login', cuerpo: { correo: 'ana@test.local', clave: 'Clave!' } });
  expect(leerSesion()?.token).toBe('tok');
});

test('un admin va al panel', async () => {
  servidorFalso({ data: { token: 'tok', usuario: adminDePrueba } });
  renderLogin();

  await completar('admin@test.local', 'Clave!');

  expect(await screen.findByText('pantalla admin')).toBeInTheDocument();
});

test('vuelve a la página privada que intentaba abrir', async () => {
  servidorFalso({ data: { token: 'tok', usuario: usuarioDePrueba } });
  renderLogin({ pathname: '/login', state: { desde: '/perfil' } });

  await completar('ana@test.local', 'Clave!');

  expect(await screen.findByText('pantalla perfil')).toBeInTheDocument();
});

test('con credenciales incorrectas muestra el mensaje del backend', async () => {
  servidorFalso({ status: 401, data: { message: 'Credenciales inválidas.' } });
  renderLogin();

  await completar('ana@test.local', 'Mala!');

  expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas.');
  expect(leerSesion()).toBeNull();
});

test('muestra en cada campo los errores de validación del backend', async () => {
  servidorFalso({
    status: 422,
    data: { message: 'Datos inválidos.', errors: { correo: ['El correo no es válido para el servidor.'] } },
  });
  renderLogin();

  await completar('ana@test.local', 'Clave!');

  expect(await screen.findByText('El correo no es válido para el servidor.')).toBeInTheDocument();
});

test('ofrece crear una cuenta', () => {
  renderLogin();

  expect(screen.getByRole('link', { name: 'Crea una' })).toHaveAttribute('href', '/registro');
});

test('al enviar con errores el foco va al primer campo inválido', async () => {
  servidorFalso();
  renderLogin();

  await completar('', '');

  expect(screen.getByLabelText('Correo')).toHaveFocus();
});
