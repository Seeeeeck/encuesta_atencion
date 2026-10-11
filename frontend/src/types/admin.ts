import type { Rol, Sexo, Usuario } from './usuario';

export interface PaginaUsuarios {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: Usuario[];
}

export interface RespuestaDeUsuario {
  id: number;
  id_encuesta: number;
  id_pregunta: number;
  respuesta: number;
}

export interface CambiosUsuario {
  nombre?: string;
  correo?: string;
  clave?: string;
  edad?: number | null;
  sexo?: Sexo | null;
  rol?: Rol;
}

export interface MetricaPregunta {
  id_pregunta: number;
  pregunta_texto: string;
  tipo: 'P' | 'N';
  total_respuestas: number;
  promedio: number | null;
  promedio_ajustado: number | null;
  distribucion: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface MetricaGrupo {
  encuestas: number;
  indice_atencion: number | null;
}

export interface Metricas {
  resumen: {
    total_usuarios: number;
    total_encuestas: number;
    encuestas_completadas: number;
    indice_atencion_general: number | null;
  };
  por_pregunta: MetricaPregunta[];
  por_edad: (MetricaGrupo & { rango: string })[];
  por_sexo: (MetricaGrupo & { sexo: string })[];
}
