import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { Encuesta } from './Encuesta';
import { guardarBorrador, leerBorrador } from '../../services/borradorEncuesta';
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

function renderEncuesta() {
  return renderConRutas(
    <Routes>
      <Route path="/encuesta" element={<Encuesta />} />
      <Route path="/encuesta/finalizada" element={<p>pantalla finalizada</p>} />
    </Routes>,
    '/encuesta',
  );
}

const elegir = (valor: string) => userEvent.click(screen.getByRole('radio', { name: new RegExp(`^${valor}`) }));
const boton = (nombre: string) => screen.getByRole('button', { name: nombre });

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

  expect(await screen.findByText('Primera afirmación')).toBeInTheDocument();
  expect(screen.getByText('0 de 3 respondidas')).toBeInTheDocument();
  expect(peticiones.map((p) => p.url)).toEqual(['/encuesta/estado', '/encuesta/obtener/preguntas']);
});

test('avanza, vuelve atrás y conserva la respuesta anterior', async () => {
  servidorFalso([sinCompletar, conPreguntas]);
  renderEncuesta();
  await screen.findByText('Primera afirmación');

  await elegir('4');
  await userEvent.click(boton('Siguiente'));
  expect(screen.getByText('Segunda afirmación')).toBeInTheDocument();
  expect(screen.getByText('1 de 3 respondidas')).toBeInTheDocument();

  await userEvent.click(boton('Anterior'));
  expect(screen.getByText('Primera afirmación')).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: '4' })).toBeChecked();
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

  expect(await screen.findByText('Tercera afirmación')).toBeInTheDocument();
  expect(screen.getByText('2 de 3 respondidas')).toBeInTheDocument();
});

test('no deja enviar incompleta y permite ir a las que faltan', async () => {
  guardarBorrador(usuarioDePrueba.id, { respuestas: { 11: 5 }, indice: 2 });
  const peticiones = servidorFalso([sinCompletar, conPreguntas]);
  renderEncuesta();
  await screen.findByText('Tercera afirmación');

  await userEvent.click(boton('Enviar encuesta'));

  expect(screen.getByRole('alert')).toHaveTextContent('Te falta responder 2 preguntas.');
  expect(peticiones).toHaveLength(2);

  await userEvent.click(boton('Ir a la pregunta 2'));
  expect(screen.getByText('Segunda afirmación')).toBeInTheDocument();
});

test('con todo respondido envía la encuesta, borra el borrador y muestra el final', async () => {
  guardarBorrador(usuarioDePrueba.id, { respuestas: { 11: 5, 12: 1 }, indice: 2 });
  const peticiones = servidorFalso([sinCompletar, conPreguntas, { data: { message: 'ok' } }]);
  renderEncuesta();
  await screen.findByText('Tercera afirmación');

  await elegir('3');
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
  expect(leerBorrador(usuarioDePrueba.id)).toEqual({ respuestas: {}, indice: 0 });
});

test('si el backend dice que ya la envió (409) va a la pantalla final', async () => {
  guardarBorrador(usuarioDePrueba.id, { respuestas: { 11: 5, 12: 1, 13: 2 }, indice: 2 });
  servidorFalso([sinCompletar, conPreguntas, { status: 409, data: { message: 'La encuesta ya fue enviada.' } }]);
  renderEncuesta();
  await screen.findByText('Tercera afirmación');

  await userEvent.click(boton('Enviar encuesta'));

  expect(await screen.findByText('pantalla finalizada')).toBeInTheDocument();
});

test('si falla el envío muestra el error y conserva las respuestas', async () => {
  guardarBorrador(usuarioDePrueba.id, { respuestas: { 11: 5, 12: 1, 13: 2 }, indice: 2 });
  servidorFalso([sinCompletar, conPreguntas, { status: 500 }]);
  renderEncuesta();
  await screen.findByText('Tercera afirmación');

  await userEvent.click(boton('Enviar encuesta'));

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
  expect(leerBorrador(usuarioDePrueba.id).respuestas).toEqual({ 11: 5, 12: 1, 13: 2 });
});

test('si no puede cargar la encuesta muestra el error', async () => {
  servidorFalso({ status: 500 });

  renderEncuesta();

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
});
