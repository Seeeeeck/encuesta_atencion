import type { Usuario } from '../types/usuario';

export interface Sesion {
  token: string;
  usuario: Usuario;
}

const claveToken = 'token';
const claveUsuario = 'usuario';

export function leerSesion(): Sesion | null {
  const token = localStorage.getItem(claveToken);
  const usuarioGuardado = localStorage.getItem(claveUsuario);
  if (!token || !usuarioGuardado) {
    return null;
  }
  try {
    return { token, usuario: JSON.parse(usuarioGuardado) as Usuario };
  } catch {
    return null;
  }
}

export function guardarSesion(token: string, usuario: Usuario): void {
  localStorage.setItem(claveToken, token);
  localStorage.setItem(claveUsuario, JSON.stringify(usuario));
}

export function borrarSesion(): void {
  localStorage.removeItem(claveToken);
  localStorage.removeItem(claveUsuario);
}
