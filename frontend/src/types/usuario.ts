export type Rol = 'usuario' | 'admin';

export type Sexo = 'M' | 'F' | 'N/R';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  edad: number | null;
  sexo: Sexo | null;
  rol: Rol;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
}
