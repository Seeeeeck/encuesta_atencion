import type { Usuario } from '../types/usuario';

export const usuarioDePrueba: Usuario = {
  id: 1,
  nombre: 'Ana',
  correo: 'ana@test.local',
  edad: 30,
  sexo: 'F',
  rol: 'usuario',
  is_verified: true,
};

export const adminDePrueba: Usuario = { ...usuarioDePrueba, id: 2, nombre: 'Admin', rol: 'admin' };
