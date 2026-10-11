import { borrarSesion, guardarSesion, leerSesion } from './sesion';
import type { Usuario } from '../types/usuario';

const usuario: Usuario = {
  id: 1,
  nombre: 'Ana',
  correo: 'ana@test.local',
  edad: 30,
  sexo: 'F',
  rol: 'usuario',
  is_verified: true,
};

beforeEach(() => localStorage.clear());

test('sin nada guardado no hay sesión', () => {
  expect(leerSesion()).toBeNull();
});

test('guarda token y usuario y los vuelve a leer', () => {
  guardarSesion('tok-123', usuario);

  expect(leerSesion()).toEqual({ token: 'tok-123', usuario });
});

test('borrarSesion deja sin sesión', () => {
  guardarSesion('tok-123', usuario);

  borrarSesion();

  expect(leerSesion()).toBeNull();
});

test('un usuario guardado corrupto se trata como sin sesión', () => {
  localStorage.setItem('token', 'tok-123');
  localStorage.setItem('usuario', '{no es json');

  expect(leerSesion()).toBeNull();
});
