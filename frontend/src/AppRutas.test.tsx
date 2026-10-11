import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRutas } from './AppRutas';
import { renderConRutas } from './test/renderConRutas';
import { servidorFalso } from './test/servidorFalso';
import { guardarSesion } from './services/sesion';
import { usuarioDePrueba } from './test/datos';

beforeEach(() => {
  localStorage.clear();
  servidorFalso({ data: { status: 'ok' } });
});

test('la raíz muestra el inicio dentro del layout', async () => {
  renderConRutas(<AppRutas />, '/');

  expect(await screen.findByRole('link', { name: 'Atención' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/atención/i);
});

test('una ruta desconocida muestra la página 404', async () => {
  renderConRutas(<AppRutas />, '/no-existe');

  expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
});

test.each([
  ['/login', 'Ingresar'],
  ['/registro', 'Crear cuenta'],
  ['/verificar-correo', 'Verificación de correo'],
  ['/actualizar-correo', 'Cambiar correo'],
])('%s muestra su pantalla sin sesión', async (ruta, titulo) => {
  renderConRutas(<AppRutas />, ruta);

  expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
});

test('/perfil sin sesión manda al login', async () => {
  renderConRutas(<AppRutas />, '/perfil');

  expect(await screen.findByRole('heading', { level: 1, name: 'Ingresar' })).toBeInTheDocument();
});

test('/perfil con sesión muestra el perfil', async () => {
  guardarSesion('tok', usuarioDePrueba);

  renderConRutas(<AppRutas />, '/perfil');

  expect(await screen.findByRole('heading', { level: 1, name: 'Mi perfil' })).toBeInTheDocument();
});

test('al eliminar la cuenta desde el perfil vuelve al inicio, no al login', async () => {
  guardarSesion('tok', usuarioDePrueba);
  servidorFalso({ data: usuarioDePrueba });
  renderConRutas(<AppRutas />, '/perfil');

  await userEvent.click(await screen.findByRole('button', { name: 'Eliminar mi cuenta' }));
  await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

  expect(await screen.findByRole('link', { name: 'Crear cuenta y empezar' })).toBeInTheDocument();
});

test('al ingresar desde una página privada vuelve a esa página', async () => {
  servidorFalso([{ data: { status: 'ok' } }, { data: { token: 'tok', usuario: usuarioDePrueba } }, { data: usuarioDePrueba }]);
  renderConRutas(<AppRutas />, '/perfil');

  await userEvent.type(await screen.findByLabelText('Correo'), 'ana@test.local');
  await userEvent.type(screen.getByLabelText('Clave'), 'Clave!');
  await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Mi perfil' })).toBeInTheDocument();
});

test('/encuesta sin sesión manda al login', async () => {
  renderConRutas(<AppRutas />, '/encuesta');

  expect(await screen.findByRole('heading', { level: 1, name: 'Ingresar' })).toBeInTheDocument();
});

test('/encuesta/finalizada con sesión consulta el estado', async () => {
  guardarSesion('tok', usuarioDePrueba);
  servidorFalso({ data: { status: 'ok', completada: true } });

  renderConRutas(<AppRutas />, '/encuesta/finalizada');

  expect(await screen.findByRole('heading', { name: '¡Gracias por responder!' })).toBeInTheDocument();
});
