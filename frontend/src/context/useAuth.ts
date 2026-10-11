import { useContext } from 'react';
import { AuthContext } from './authContexto';
import type { ValorAuth } from './authContexto';

export function useAuth(): ValorAuth {
  const valor = useContext(AuthContext);
  if (!valor) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return valor;
}
