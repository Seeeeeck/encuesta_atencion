import { createContext } from 'react';
import type { Usuario } from '../types/usuario';

export interface ValorAuth {
  usuario: Usuario | null;
  esAdmin: boolean;
  iniciarSesion: (token: string, usuario: Usuario) => void;
  actualizarUsuario: (usuario: Usuario) => void;
  cerrarSesion: () => void;
}

export const AuthContext = createContext<ValorAuth | null>(null);
