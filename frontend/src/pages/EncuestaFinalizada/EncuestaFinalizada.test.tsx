import { screen } from '@testing-library/react';
import { EncuestaFinalizada } from './EncuestaFinalizada';
import { guardarSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', usuarioDePrueba);
});

test('con la encuesta completa agradece y ofrece compartirla', async () => {
  const peticiones = servidorFalso({ data: { completada: true } });

  renderConRutas(<EncuestaFinalizada />);

  expect(await screen.findByRole('heading', { name: '¡Gracias por responder!' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Compartir la encuesta' })).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/encuesta/estado' });
});

test('sin la encuesta completa invita a responderla', async () => {
  servidorFalso({ data: { completada: false } });

  renderConRutas(<EncuestaFinalizada />);

  expect(await screen.findByText('Todavía no completaste la encuesta.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Responder la encuesta' })).toHaveAttribute('href', '/encuesta');
});

test('si no puede consultar el estado muestra el error', async () => {
  servidorFalso({ status: 500 });

  renderConRutas(<EncuestaFinalizada />);

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
});
