import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { Encuesta } from './Encuesta';
import { guardarBorrador, leerBorrador } from '../../services/borradorEncuesta';
import { leerResultado } from '../../services/resultadoEncuesta';
import { guardarSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

const preguntas = [
  { id: 11, pregunta_texto: 'Primera afirmación', tipo: 'N' },
  { id: 12, pregunta_texto: 'Segunda afirmación', tipo: 'P' },
  { id: 13, pregunta_texto: 'Tercera afirmación', tipo: 'N' },
];

const sinCompletar = { data: { completada: false } };
const conPreguntas = { data: { preguntas } };

function PantallaFinal() {
  const { state } = useLocation();
  const yaEnviada = (state as { yaEnviada?: boolean } | null)?.yaEnviada;
  return <p>pantalla finalizada{yaEnviada ? ' (ya enviada)' : ''}</p>;
}

function renderEncuesta() {
  return renderConRutas(
    <Routes>
      <Route path="/encuesta" element={<Encuesta />} />
      <Route path="/encuesta/finalizada" element={<PantallaFinal />} />
    </Routes>,
    '/encuesta',
  );
}

const elegir = (valor: string) => userEvent.click(screen.getByRole('radio', { name: new RegExp(`^${valor} `) }));
const boton = (nombre: string) => screen.getByRole('button', { name: nombre });
const titulo = () => screen.getByRole('heading', { level: 1 });

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', usuarioDePrueba);
});

test('si ya respondió la encuesta va a la pantalla de finalizada', async () => {
  servidorFalso({ data: { completada: true } });

  renderEncuesta();

  expect(await screen.findByText('pantalla finalizada')).toBeInTheDocument();
});

test('carga las preguntas y empieza por la primera', async () => {
  const peticiones = servidorFalso([sinCompletar, conPreguntas]);

  renderEncuesta();

  expect(await screen.findByRole('heading', { level: 1, name: 'Primera afirmación' })).toBeInTheDocument();
  expect(screen.getByText('Pregunta 1 de 3')).toBeInTheDocument();
  expect(screen.getByText('0 respondidas')).toBeInTheDocument();
  expect(peticiones.map((p) => p.url)).toEqual(['/encuesta/estado', '/encuesta/obtener/preguntas']);
});

test('avanza, vuelve atrás y conserva la respuesta anterior', async () => {
  servidorFalso([sinCompletar, conPreguntas]);
  renderEncuesta();
  await screen.findByText('Primera afirmación');

  await elegir('4');
  await userEvent.click(boton('Siguiente'));
  expect(titulo()).toHaveTextContent('Segunda afirmación');
  expect(screen.getByText('1 respondida')).toBeInTheDocument();

  await userEvent.click(boton('Anterior'));
  expect(titulo()).toHaveTextContent('Primera afirmación');
  expect(screen.getByRole('radio', { name: '4 De acuerdo' })).toBeChecked();
});

test('al cambiar de pregunta el foco va al texto nuevo', async () => {
  servidorFalso([sinCompletar, conPreguntas]);
  renderEncuesta();
  await screen.findByText('Primera afirmación');

  await userEvent.click(boton('Siguiente'));

  expect(titulo()).toHaveFocus();
});

test('en la primera pregunta no se puede ir atrás', async () => {
  servidorFalso([sinCompletar, conPreguntas]);
  renderEncuesta();
  await screen.findByText('Primera afirmación');

  expect(boton('Anterior')).toBeDisabled();
});

test('guarda el avance para retomarlo después', async () => {
  servidorFalso([sinCompletar, conPreguntas]);
  renderEncuesta();
  await screen.findByText('Primera afirmación');

  await elegir('2');
  await userEvent.click(boton('Siguiente'));

  expect(leerBorrador(usuarioDePrueba.id)).toEqual({ respuestas: { 11: 2 }, indice: 1 });
});

test('retoma un borrador guardado', async () => {
  guardarBorrador(usuarioDePrueba.id, { respuestas: { 11: 5, 12: 1 }, indice: 2 });
  servidorFalso([sinCompletar, conPreguntas]);

  renderEncuesta();

  expect(await screen.findByRole('heading', { level: 1, name: 'Tercera afirmación' })).toBeInTheDocument();
  expect(screen.getByText('2 respondidas')).toBeInTheDocument();
});

test('después de la última pregunta muestra la revisión en vez de enviar directo', async () => {
  guardarBorrador(usuarioDePrueba.id, { respuestas: { 11: 5, 12: 1 }, indice: 2 });
  const peticiones = servidorFalso([sinCompletar, conPreguntas]);
  renderEncuesta();
  await screen.findByText('Tercera afirmación');

  await elegir('3');
  await userEvent.click(boton('Revisar respuestas'));

  expect(titulo()).toHaveTextContent('Revisa tus respuestas');
  expect(peticiones).toHaveLength(2);
});

test('desde la revisión se puede cambiar una respuesta y volver a la revisión', async () => {
  guardarBorrador(usuarioDePrueba.id, { respuestas: { 11: 5, 12: 1, 13: 3 }, indice: 2 });
  servidorFalso([sinCompletar, conPreguntas]);
  renderEncuesta();
  await screen.findByText('Tercera afirmación');
  await userEvent.click(boton('Revisar respuestas'));

  await userEvent.click(boton('Cambiar la respuesta 2'));
  expect(titulo()).toHaveTextContent('Segunda afirmación');
  await elegir('5');
  await userEvent.click(boton('Volver a la revisión'));

  expect(titulo()).toHaveTextContent('Revisa tus respuestas');
  expect(within(screen.getAllByRole('listitem')[1]).getByText('5 · Totalmente de acuerdo')).toBeInTheDocument();
});

test('al enviar desde la revisión guarda el resultado, borra el borrador y muestra el final', async () => {
  guardarBorrador(usuarioDePrueba.id, { respuestas: { 11: 5, 12: 1, 13: 3 }, indice: 2 });
  const peticiones = servidorFalso([sinCompletar, conPreguntas, { data: { message: 'ok' } }]);
  renderEncuesta();
  await screen.findByText('Tercera afirmación');
  await userEvent.click(boton('Revisar respuestas'));

  await userEvent.click(boton('Enviar encuesta'));

  expect(await screen.findByText('pantalla finalizada')).toBeInTheDocument();
  expect(peticiones[2]).toMatchObject({
    metodo: 'POST',
    url: '/encuesta/enviar',
    cuerpo: {
      respuestas: [
        { id_pregunta: 11, numero_respuesta: 5 },
        { id_pregunta: 12, numero_respuesta: 1 },
        { id_pregunta: 13, numero_respuesta: 3 },
      ],
    },
  });
  // ajustados: 6-5=1, 1, 6-3=3 -> 1.67
  expect(leerResultado(usuarioDePrueba.id)?.indice).toBe(1.67);
  expect(leerBorrador(usuarioDePrueba.id)).toEqual({ respuestas: {}, indice: 0 });
});

test('si el backend dice que ya la envió (409) lo explica en la pantalla final', async () => {
  guardarBorrador(usuarioDePrueba.id, { respuestas: { 11: 5, 12: 1, 13: 2 }, indice: 2 });
  servidorFalso([sinCompletar, conPreguntas, { status: 409, data: { message: 'La encuesta ya fue enviada.' } }]);
  renderEncuesta();
  await screen.findByText('Tercera afirmación');
  await userEvent.click(boton('Revisar respuestas'));

  await userEvent.click(boton('Enviar encuesta'));

  expect(await screen.findByText('pantalla finalizada (ya enviada)')).toBeInTheDocument();
});

test('si falla el envío muestra el error y conserva las respuestas', async () => {
  guardarBorrador(usuarioDePrueba.id, { respuestas: { 11: 5, 12: 1, 13: 2 }, indice: 2 });
  servidorFalso([sinCompletar, conPreguntas, { status: 500 }]);
  renderEncuesta();
  await screen.findByText('Tercera afirmación');
  await userEvent.click(boton('Revisar respuestas'));

  await userEvent.click(boton('Enviar encuesta'));

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
  expect(leerBorrador(usuarioDePrueba.id).respuestas).toEqual({ 11: 5, 12: 1, 13: 2 });
});

test('si no puede cargar la encuesta muestra el error', async () => {
  servidorFalso({ status: 500 });

  renderEncuesta();

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
});
