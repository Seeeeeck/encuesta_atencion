import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SolicitarCambioCorreo } from './SolicitarCambioCorreo';
import { guardarSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', usuarioDePrueba);
});

const pedirLink = () => userEvent.click(screen.getByRole('button', { name: 'Enviarme el link' }));

test('explica que el link llega al correo actual', () => {
  renderConRutas(<SolicitarCambioCorreo />);

  expect(screen.getByText(/ana@test\.local/)).toBeInTheDocument();
});

test('pide el link y muestra la confirmación', async () => {
  const peticiones = servidorFalso({ data: { message: 'Solicitud de cambio de correo enviada a ana@test.local' } });
  renderConRutas(<SolicitarCambioCorreo />);

  await pedirLink();

  expect(await screen.findByText(/Te enviamos un link a ana@test\.local/)).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/me/actualizar/correo/verificacion' });
});

test('si falla muestra el error', async () => {
  servidorFalso({ status: 500 });
  renderConRutas(<SolicitarCambioCorreo />);

  await pedirLink();

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
});
