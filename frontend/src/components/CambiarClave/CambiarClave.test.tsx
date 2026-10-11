import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CambiarClave } from './CambiarClave';
import { guardarSesion, leerSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', usuarioDePrueba);
});

async function completar(actual: string, nueva: string, repetida: string) {
  if (actual) await userEvent.type(screen.getByLabelText('Clave actual'), actual);
  if (nueva) await userEvent.type(screen.getByLabelText('Clave nueva'), nueva);
  if (repetida) await userEvent.type(screen.getByLabelText('Repite la clave nueva'), repetida);
  await userEvent.click(screen.getByRole('button', { name: 'Cambiar clave' }));
}

test('valida los tres campos antes de enviar', async () => {
  const peticiones = servidorFalso();
  renderConRutas(<CambiarClave />);

  await completar('', 'abc', 'abd');

  expect(screen.getByText('Ingresa tu clave actual.')).toBeInTheDocument();
  expect(screen.getByText('La clave debe tener al menos 5 caracteres.')).toBeInTheDocument();
  expect(screen.getByText('Las claves no coinciden.')).toBeInTheDocument();
  expect(peticiones).toHaveLength(0);
});

test('cambia la clave y limpia el formulario', async () => {
  const peticiones = servidorFalso({ data: { message: 'Se cambió la clave' } });
  renderConRutas(<CambiarClave />);

  await completar('Vieja!', 'Nueva!', 'Nueva!');

  expect(await screen.findByText('Clave actualizada.')).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({
    metodo: 'PUT',
    url: '/me/actualizar/clave',
    cuerpo: { clave_actual: 'Vieja!', clave_nueva: 'Nueva!' },
  });
  expect(screen.getByLabelText('Clave actual')).toHaveValue('');
});

test('una clave actual incorrecta se marca en su campo y no cierra la sesión', async () => {
  servidorFalso({ status: 401, data: { message: 'La clave actual no correspode al usuario' } });
  renderConRutas(<CambiarClave />);

  await completar('Mala!', 'Nueva!', 'Nueva!');

  expect(await screen.findByText('La clave actual no es correcta.')).toBeInTheDocument();
  expect(leerSesion()).not.toBeNull();
});
