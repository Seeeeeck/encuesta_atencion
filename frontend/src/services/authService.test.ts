import {
  actualizarClave,
  actualizarNombre,
  cambiarCorreo,
  cerrarSesion,
  eliminarCuenta,
  iniciarSesion,
  obtenerPerfil,
  pedirCambioCorreo,
  registrar,
  verificarCorreo,
  verificarLinkCambioCorreo,
} from './authService';
import { servidorFalso } from '../test/servidorFalso';
import { usuarioDePrueba } from '../test/datos';

beforeEach(() => localStorage.clear());

test('registrar manda los datos a POST /register y devuelve token y usuario', async () => {
  const peticiones = servidorFalso({ status: 201, data: { token: 't1', usuario: usuarioDePrueba } });
  const datos = { nombre: 'Ana', correo: 'ana@test.local', clave: 'Clave!', edad: 30, sexo: 'F' as const };

  const resultado = await registrar(datos);

  expect(peticiones[0]).toMatchObject({ metodo: 'POST', url: '/register', cuerpo: datos });
  expect(resultado).toEqual({ token: 't1', usuario: usuarioDePrueba });
});

test('iniciarSesion manda correo y clave a POST /login', async () => {
  const peticiones = servidorFalso({ data: { token: 't2', usuario: usuarioDePrueba } });

  const resultado = await iniciarSesion('ana@test.local', 'Clave!');

  expect(peticiones[0]).toMatchObject({
    metodo: 'POST',
    url: '/login',
    cuerpo: { correo: 'ana@test.local', clave: 'Clave!' },
  });
  expect(resultado.token).toBe('t2');
});

test('cerrarSesion llama a POST /logout', async () => {
  const peticiones = servidorFalso();

  await cerrarSesion();

  expect(peticiones[0]).toMatchObject({ metodo: 'POST', url: '/logout' });
});

test('obtenerPerfil devuelve el usuario de GET /me', async () => {
  const peticiones = servidorFalso({ data: usuarioDePrueba });

  expect(await obtenerPerfil()).toEqual(usuarioDePrueba);
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/me' });
});

test('actualizarNombre usa PUT /me/actualizar/nombre y devuelve el usuario', async () => {
  const actualizado = { ...usuarioDePrueba, nombre: 'Ana María' };
  const peticiones = servidorFalso({ data: { message: 'ok', usuario: actualizado } });

  expect(await actualizarNombre('Ana María')).toEqual(actualizado);
  expect(peticiones[0]).toMatchObject({
    metodo: 'PUT',
    url: '/me/actualizar/nombre',
    cuerpo: { nombre: 'Ana María' },
  });
});

test('actualizarClave manda la clave actual y la nueva', async () => {
  const peticiones = servidorFalso({ data: { message: 'ok', usuario: usuarioDePrueba } });

  await actualizarClave('Vieja!', 'Nueva!');

  expect(peticiones[0]).toMatchObject({
    metodo: 'PUT',
    url: '/me/actualizar/clave',
    cuerpo: { clave_actual: 'Vieja!', clave_nueva: 'Nueva!' },
  });
});

test('pedirCambioCorreo devuelve el mensaje del backend', async () => {
  const peticiones = servidorFalso({ data: { message: 'Solicitud enviada a ana@test.local' } });

  expect(await pedirCambioCorreo()).toBe('Solicitud enviada a ana@test.local');
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/me/actualizar/correo/verificacion' });
});

test('eliminarCuenta usa DELETE /me/eliminar/usuario', async () => {
  const peticiones = servidorFalso();

  await eliminarCuenta();

  expect(peticiones[0]).toMatchObject({ metodo: 'DELETE', url: '/me/eliminar/usuario' });
});

test('verificarCorreo arma la ruta firmada con id y hash en el path', async () => {
  const peticiones = servidorFalso({ data: { is_verified: true } });
  const link = new URLSearchParams('id=5&hash=abc&expires=999&signature=firma');

  await verificarCorreo(link);

  expect(peticiones[0]).toMatchObject({
    metodo: 'GET',
    url: '/email/verificar/5/abc?expires=999&signature=firma',
  });
});

test('verificarLinkCambioCorreo usa solo la firma del link, contra nuestra API', async () => {
  const peticiones = servidorFalso();
  const verificacion =
    'https://otro-dominio.com/api/me/actualizar/correo/verificacion/firma?expires=999&hash=abc&id=5&signature=firma';

  await verificarLinkCambioCorreo(verificacion);

  expect(peticiones[0]).toMatchObject({
    metodo: 'GET',
    url: '/me/actualizar/correo/verificacion/firma?expires=999&hash=abc&id=5&signature=firma',
  });
});

test('cambiarCorreo ordena el query como lo firmó Laravel y manda el correo en el cuerpo', async () => {
  const peticiones = servidorFalso({ data: { message: 'ok', usuario: usuarioDePrueba } });
  const link = new URLSearchParams('verificacion=x&id=5&hash=abc&expires=999&signature=firma');

  await cambiarCorreo(link, 'nuevo@test.local');

  expect(peticiones[0]).toMatchObject({
    metodo: 'PUT',
    url: '/me/actualizar/correo?expires=999&hash=abc&id=5&signature=firma',
    cuerpo: { correo: 'nuevo@test.local' },
  });
});

test('una clave actual incorrecta (401) no cierra la sesión', async () => {
  const peticiones = servidorFalso({ status: 401, data: { message: 'La clave actual no correspode al usuario' } });

  await expect(actualizarClave('Mala!', 'Nueva!')).rejects.toBeTruthy();

  expect(peticiones[0].config.sinCierreDeSesion).toBe(true);
});
