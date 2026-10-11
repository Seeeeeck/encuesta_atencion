import { apiClient } from './apiClient';
import { consultaFirmada } from './firmas';
import type { Sexo, Usuario } from '../types/usuario';

export interface DatosRegistro {
  nombre: string;
  correo: string;
  clave: string;
  edad?: number | null;
  sexo?: Sexo | null;
}

export interface RespuestaSesion {
  token: string;
  usuario: Usuario;
}

interface RespuestaUsuario {
  message: string;
  usuario: Usuario;
}

export async function registrar(datos: DatosRegistro): Promise<RespuestaSesion> {
  const { data } = await apiClient.post<RespuestaSesion>('/register', datos);
  return data;
}

export async function iniciarSesion(correo: string, clave: string): Promise<RespuestaSesion> {
  const { data } = await apiClient.post<RespuestaSesion>('/login', { correo, clave });
  return data;
}

export async function cerrarSesion(): Promise<void> {
  await apiClient.post('/logout');
}

export async function obtenerPerfil(): Promise<Usuario> {
  const { data } = await apiClient.get<Usuario>('/me');
  return data;
}

export async function actualizarNombre(nombre: string): Promise<Usuario> {
  const { data } = await apiClient.put<RespuestaUsuario>('/me/actualizar/nombre', { nombre });
  return data.usuario;
}

export async function actualizarClave(claveActual: string, claveNueva: string): Promise<void> {
  await apiClient.put(
    '/me/actualizar/clave',
    { clave_actual: claveActual, clave_nueva: claveNueva },
    { sinCierreDeSesion: true },
  );
}

export async function pedirCambioCorreo(): Promise<string> {
  const { data } = await apiClient.get<{ message: string }>('/me/actualizar/correo/verificacion');
  return data.message;
}

export async function eliminarCuenta(): Promise<void> {
  await apiClient.delete('/me/eliminar/usuario');
}

export async function verificarCorreo(link: URLSearchParams): Promise<void> {
  const id = encodeURIComponent(link.get('id') ?? '');
  const hash = encodeURIComponent(link.get('hash') ?? '');
  await apiClient.get(`/email/verificar/${id}/${hash}?${consultaFirmada(link, ['expires'])}`);
}

// `verificacion` es una URL absoluta que viene en el mail: solo se usa su firma,
// nunca su dominio, para no mandar el token a otro sitio.
export async function verificarLinkCambioCorreo(verificacion: string): Promise<void> {
  const firma = new URL(verificacion).searchParams;
  const consulta = consultaFirmada(firma, ['expires', 'hash', 'id']);
  await apiClient.get(`/me/actualizar/correo/verificacion/firma?${consulta}`);
}

export async function cambiarCorreo(link: URLSearchParams, correo: string): Promise<Usuario> {
  const consulta = consultaFirmada(link, ['expires', 'hash', 'id']);
  const { data } = await apiClient.put<RespuestaUsuario>(`/me/actualizar/correo?${consulta}`, { correo });
  return data.usuario;
}
