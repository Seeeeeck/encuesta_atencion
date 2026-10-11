import { apiClient } from './apiClient';
import type { CambiosUsuario, Metricas, PaginaUsuarios, RespuestaDeUsuario } from '../types/admin';
import type { Usuario } from '../types/usuario';

export async function listarUsuarios(pagina: number): Promise<PaginaUsuarios> {
  const { data } = await apiClient.get<{ usuarios: PaginaUsuarios }>('/admin/usuarios', {
    params: { page: pagina },
  });
  return data.usuarios;
}

export async function obtenerRespuestasDeUsuario(idUsuario: number): Promise<RespuestaDeUsuario[]> {
  const { data } = await apiClient.get<{ respuestas: RespuestaDeUsuario[] }>(
    `/admin/usuarios/${idUsuario}/respuestas`,
  );
  return data.respuestas;
}

export async function editarUsuario(idUsuario: number, cambios: CambiosUsuario): Promise<Usuario> {
  const { data } = await apiClient.put<{ usuario: Usuario }>('/admin/usuario/editar', {
    id: idUsuario,
    ...cambios,
  });
  return data.usuario;
}

export async function eliminarUsuario(idUsuario: number): Promise<void> {
  await apiClient.delete('/admin/usuario/eliminar', { data: { id: idUsuario } });
}

export async function obtenerMetricas(): Promise<Metricas> {
  const { data } = await apiClient.get<{ metricas: Metricas }>('/admin/metricas');
  return data.metricas;
}
