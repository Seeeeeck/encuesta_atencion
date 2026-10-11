import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { alExpirarSesion } from '../services/apiClient';
import { borrarSesion, guardarSesion, leerSesion } from '../services/sesion';
import type { Sesion } from '../services/sesion';
import type { Usuario } from '../types/usuario';
import { AuthContext } from './authContexto';
import type { ValorAuth } from './authContexto';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion);

  useEffect(() => {
    alExpirarSesion(() => setSesion(null));
    return () => alExpirarSesion(() => {});
  }, []);

  const iniciarSesion = useCallback((token: string, usuario: Usuario) => {
    guardarSesion(token, usuario);
    setSesion({ token, usuario });
  }, []);

  const actualizarUsuario = useCallback((usuario: Usuario) => {
    setSesion((actual) => {
      if (!actual) {
        return actual;
      }
      guardarSesion(actual.token, usuario);
      return { ...actual, usuario };
    });
  }, []);

  const cerrarSesion = useCallback(() => {
    borrarSesion();
    setSesion(null);
  }, []);

  const valor = useMemo<ValorAuth>(
    () => ({
      usuario: sesion?.usuario ?? null,
      esAdmin: sesion?.usuario.rol === 'admin',
      iniciarSesion,
      actualizarUsuario,
      cerrarSesion,
    }),
    [sesion, iniciarSesion, actualizarUsuario, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
