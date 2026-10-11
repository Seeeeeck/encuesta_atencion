import { screen } from '@testing-library/react';
import type { InitialEntry } from 'react-router';
import { EncuestaFinalizada } from './EncuestaFinalizada';
import { guardarResultado } from '../../services/resultadoEncuesta';
import { guardarSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

const resultado = {
  indice: 2.4,
  aMejorar: [
    {
      texto: 'Suelo revisar mis redes sin decidirlo.',
      idea: 'Desactiva las notificaciones que no vengan de personas.',
      respuesta: 'De acuerdo',
    },
  ],
  fortaleza: { texto: 'Puedo concentrarme en actividades largas.', respuesta: 'Totalmente de acuerdo' },
};

function renderFinal(entrada: InitialEntry = '/encuesta/finalizada') {
  return renderConRutas(<EncuestaFinalizada />, entrada);
}

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', usuarioDePrueba);
});

test('con la encuesta completa y el resultado guardado muestra el índice personal', async () => {
  guardarResultado(usuarioDePrueba.id, resultado);
  const peticiones = servidorFalso({ data: { completada: true } });

  renderFinal();

  expect(await screen.findByRole('heading', { level: 1, name: 'Gracias por tomarte este momento' })).toBeInTheDocument();
  expect(screen.getByRole('meter', { name: 'Tu índice de atención' })).toHaveAttribute('aria-valuenow', '2.4');
  expect(screen.getByText('2.40')).toBeInTheDocument();
  expect(screen.getByText(/no es falta de voluntad/i)).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/encuesta/estado' });
});

test('propone ideas concretas para lo que más cuesta y reconoce lo que va bien', async () => {
  guardarResultado(usuarioDePrueba.id, resultado);
  servidorFalso({ data: { completada: true } });

  renderFinal();

  expect(await screen.findByText('Suelo revisar mis redes sin decidirlo.')).toBeInTheDocument();
  expect(screen.getByText('Desactiva las notificaciones que no vengan de personas.')).toBeInTheDocument();
  expect(screen.getByText('Puedo concentrarme en actividades largas.')).toBeInTheDocument();
  expect(screen.getByText('Respondiste «De acuerdo»')).toBeInTheDocument();
  expect(screen.getByText('Respondiste «Totalmente de acuerdo»')).toBeInTheDocument();
  expect(screen.getByText(/orientativo/i)).toBeInTheDocument();
});

test('compartir queda como acción secundaria', async () => {
  guardarResultado(usuarioDePrueba.id, resultado);
  servidorFalso({ data: { completada: true } });

  renderFinal();

  expect(await screen.findByRole('button', { name: 'Compartir la encuesta' })).toHaveClass('boton--secundario');
});

test('sin el resultado en este dispositivo agradece y explica por qué no lo ve', async () => {
  servidorFalso({ data: { completada: true } });

  renderFinal();

  expect(await screen.findByRole('heading', { level: 1, name: '¡Gracias por responder!' })).toBeInTheDocument();
  expect(screen.getByText(/en el dispositivo donde respondiste/i)).toBeInTheDocument();
});

test('si ya la había enviado antes lo aclara', async () => {
  servidorFalso({ data: { completada: true } });

  renderFinal({ pathname: '/encuesta/finalizada', state: { yaEnviada: true } });

  expect(await screen.findByText(/ya habías enviado esta encuesta/i)).toBeInTheDocument();
});

test('sin la encuesta completa invita a responderla', async () => {
  servidorFalso({ data: { completada: false } });

  renderFinal();

  expect(await screen.findByRole('heading', { level: 1, name: 'Todavía no respondes la encuesta' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Responder la encuesta' })).toHaveAttribute('href', '/encuesta');
});

test('si no puede consultar el estado muestra el error', async () => {
  servidorFalso({ status: 500 });

  renderFinal();

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
});
