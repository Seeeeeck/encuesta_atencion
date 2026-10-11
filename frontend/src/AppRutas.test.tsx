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

test('/admin con un usuario normal vuelve a la encuesta', async () => {
  guardarSesion('tok', usuarioDePrueba);
  servidorFalso([{ data: { status: 'ok' } }, { data: { completada: false } }, { data: { preguntas: [] } }]);

  renderConRutas(<AppRutas />, '/admin');

  expect(await screen.findByText('Cargando la encuesta…')).toBeInTheDocument();
});

test('/admin con un admin muestra las métricas dentro del panel', async () => {
  guardarSesion('tok', { ...usuarioDePrueba, rol: 'admin' });
  servidorFalso({
    data: {
      status: 'ok',
      metricas: {
        resumen: { total_usuarios: 0, total_encuestas: 0, encuestas_completadas: 0, indice_atencion_general: null },
        por_pregunta: [],
        por_edad: [],
        por_sexo: [],
      },
    },
  });

  renderConRutas(<AppRutas />, '/admin');

  expect(await screen.findByRole('navigation', { name: 'Panel de administración' })).toBeInTheDocument();
  expect(await screen.findByRole('group', { name: 'Usuarios' })).toBeInTheDocument();
});

test('/admin/usuarios con un admin muestra la lista', async () => {
  guardarSesion('tok', { ...usuarioDePrueba, rol: 'admin' });
  servidorFalso({ data: { status: 'ok', usuarios: { current_page: 1, last_page: 1, per_page: 10, total: 0, data: [] } } });

  renderConRutas(<AppRutas />, '/admin/usuarios');

  expect(await screen.findByRole('heading', { level: 1, name: 'Usuarios' })).toBeInTheDocument();
});

test('un admin que ingresa desde /login va al panel', async () => {
  const admin = { ...usuarioDePrueba, rol: 'admin' as const };
  const metricas = {
    resumen: { total_usuarios: 0, total_encuestas: 0, encuestas_completadas: 0, indice_atencion_general: null },
    por_pregunta: [],
    por_edad: [],
    por_sexo: [],
  };
  servidorFalso([{ data: { status: 'ok' } }, { data: { token: 'tok', usuario: admin } }, { data: { metricas } }]);
  renderConRutas(<AppRutas />, '/login');

  await userEvent.type(await screen.findByLabelText('Correo'), 'admin@test.local');
  await userEvent.type(screen.getByLabelText('Clave'), 'Clave!');
  await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

  expect(await screen.findByRole('navigation', { name: 'Panel de administración' })).toBeInTheDocument();
});
