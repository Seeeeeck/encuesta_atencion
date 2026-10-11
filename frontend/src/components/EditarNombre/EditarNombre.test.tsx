import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditarNombre } from './EditarNombre';
import { guardarSesion, leerSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', usuarioDePrueba);
});

const campo = () => screen.getByLabelText('Nombre');
const guardar = () => userEvent.click(screen.getByRole('button', { name: 'Guardar nombre' }));

test('arranca con el nombre actual', () => {
  renderConRutas(<EditarNombre />);

  expect(campo()).toHaveValue('Ana');
});

test('valida el nombre antes de enviarlo', async () => {
  const peticiones = servidorFalso();
  renderConRutas(<EditarNombre />);

  await userEvent.clear(campo());
  await userEvent.type(campo(), 'Al');
  await guardar();

  expect(screen.getByText('El nombre debe tener al menos 3 caracteres.')).toBeInTheDocument();
  expect(peticiones).toHaveLength(0);
});

test('guarda el nombre y actualiza la sesión', async () => {
  const actualizado = { ...usuarioDePrueba, nombre: 'Ana María' };
  const peticiones = servidorFalso({ data: { message: 'ok', usuario: actualizado } });
  renderConRutas(<EditarNombre />);

  await userEvent.clear(campo());
  await userEvent.type(campo(), 'Ana María');
  await guardar();

  expect(await screen.findByText('Nombre actualizado.')).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({
    metodo: 'PUT',
    url: '/me/actualizar/nombre',
    cuerpo: { nombre: 'Ana María' },
  });
  expect(leerSesion()?.usuario.nombre).toBe('Ana María');
});

test('muestra los errores del backend en el campo', async () => {
  servidorFalso({ status: 422, data: { message: 'x', errors: { nombre: ['Nombre inválido para el servidor.'] } } });
  renderConRutas(<EditarNombre />);

  await userEvent.clear(campo());
  await userEvent.type(campo(), 'Ana María');
  await guardar();

  expect(await screen.findByText('Nombre inválido para el servidor.')).toBeInTheDocument();
});
