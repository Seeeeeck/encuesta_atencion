import {
  editarUsuario,
  eliminarUsuario,
  listarUsuarios,
  obtenerMetricas,
  obtenerRespuestasDeUsuario,
} from './adminService';
import { servidorFalso } from '../test/servidorFalso';
import { usuarioDePrueba } from '../test/datos';

test('listarUsuarios pide la página indicada y devuelve el paginado', async () => {
  const pagina = { current_page: 2, last_page: 3, per_page: 10, total: 21, data: [usuarioDePrueba] };
  const peticiones = servidorFalso({ data: { message: 'ok', usuarios: pagina } });

  expect(await listarUsuarios(2)).toEqual(pagina);
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/admin/usuarios' });
  expect(peticiones[0].config.params).toEqual({ page: 2 });
});

test('obtenerRespuestasDeUsuario usa el id en la ruta', async () => {
  const respuestas = [{ id: 1, id_encuesta: 4, id_pregunta: 1, respuesta: 3 }];
  const peticiones = servidorFalso({ data: { message: 'ok', respuestas } });

  expect(await obtenerRespuestasDeUsuario(8)).toEqual(respuestas);
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/admin/usuarios/8/respuestas' });
});

test('editarUsuario manda el id y solo los campos cambiados', async () => {
  const peticiones = servidorFalso({ data: { message: 'ok', usuario: usuarioDePrueba } });

  expect(await editarUsuario(8, { nombre: 'Nuevo', rol: 'admin' })).toEqual(usuarioDePrueba);
  expect(peticiones[0]).toMatchObject({
    metodo: 'PUT',
    url: '/admin/usuario/editar',
    cuerpo: { id: 8, nombre: 'Nuevo', rol: 'admin' },
  });
});

test('eliminarUsuario manda el id en el cuerpo del DELETE', async () => {
  const peticiones = servidorFalso({ data: { message: 'ok' } });

  await eliminarUsuario(8);

  expect(peticiones[0]).toMatchObject({ metodo: 'DELETE', url: '/admin/usuario/eliminar', cuerpo: { id: 8 } });
});

test('obtenerMetricas devuelve el objeto metricas', async () => {
  const metricas = {
    resumen: { total_usuarios: 1, total_encuestas: 1, encuestas_completadas: 1, indice_atencion_general: 3 },
    por_pregunta: [],
    por_edad: [],
    por_sexo: [],
  };
  const peticiones = servidorFalso({ data: { message: 'ok', metricas } });

  expect(await obtenerMetricas()).toEqual(metricas);
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/admin/metricas' });
});
