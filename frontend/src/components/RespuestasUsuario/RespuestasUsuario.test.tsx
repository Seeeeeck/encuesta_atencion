import { screen } from '@testing-library/react';
import { RespuestasUsuario } from './RespuestasUsuario';
import { guardarSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { adminDePrueba } from '../../test/datos';

const preguntas = [
  { id: 1, pregunta_texto: 'Primera afirmación', tipo: 'N' },
  { id: 2, pregunta_texto: 'Segunda afirmación', tipo: 'P' },
];
const respuestas = [
  { id: 30, id_encuesta: 4, id_pregunta: 2, respuesta: 5 },
  { id: 31, id_encuesta: 4, id_pregunta: 1, respuesta: 2 },
];

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', adminDePrueba);
});

test('muestra cada respuesta junto al texto de su pregunta, en orden', async () => {
  const peticiones = servidorFalso([{ data: { preguntas } }, { data: { respuestas } }]);

  renderConRutas(<RespuestasUsuario idUsuario={8} />);

  const items = await screen.findAllByRole('listitem');
  expect(items.map((item) => item.textContent)).toEqual([
    'P1Primera afirmación2 · En desacuerdo',
    'P2Segunda afirmación5 · Totalmente de acuerdo',
  ]);
  expect(peticiones.map((p) => p.url).sort()).toEqual(['/admin/usuarios/8/respuestas', '/encuesta/obtener/preguntas']);
});

test('si todavía no respondió lo informa sin mostrarlo como error', async () => {
  servidorFalso([{ data: { preguntas } }, { status: 404, data: { message: 'El usuario aún no realiza la encuesta' } }]);

  renderConRutas(<RespuestasUsuario idUsuario={8} />);

  expect(await screen.findByText('El usuario aún no realiza la encuesta')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('otros errores se muestran como error', async () => {
  servidorFalso([{ data: { preguntas } }, { status: 500 }]);

  renderConRutas(<RespuestasUsuario idUsuario={8} />);

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
});
