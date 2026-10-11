import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditarUsuarioAdmin } from './EditarUsuarioAdmin';
import { guardarSesion, leerSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { adminDePrueba, usuarioDePrueba } from '../../test/datos';

const otro = { ...usuarioDePrueba, id: 8, nombre: 'Bruno', correo: 'bruno@test.local', edad: 40, sexo: 'M' as const };

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', adminDePrueba);
});

const guardar = () => userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

test('arranca con los datos actuales del usuario', () => {
  renderConRutas(<EditarUsuarioAdmin usuario={otro} onGuardado={() => {}} />);

  expect(screen.getByLabelText('Nombre')).toHaveValue('Bruno');
  expect(screen.getByLabelText('Correo')).toHaveValue('bruno@test.local');
  expect(screen.getByLabelText(/Edad/)).toHaveValue(40);
  expect(screen.getByLabelText(/Sexo/)).toHaveValue('M');
  expect(screen.getByLabelText('Rol')).toHaveValue('usuario');
  expect(screen.getByLabelText(/Clave nueva/)).toHaveValue('');
});

test('sin cambios no llama a la API', async () => {
  const peticiones = servidorFalso();
  renderConRutas(<EditarUsuarioAdmin usuario={otro} onGuardado={() => {}} />);

  await guardar();

  expect(screen.getByRole('status')).toHaveTextContent('No hay cambios para guardar.');
  expect(peticiones).toHaveLength(0);
});

test('manda solo los campos que cambiaron y avisa el resultado', async () => {
  const actualizado = { ...otro, nombre: 'Bruno Díaz', rol: 'admin' as const };
  const peticiones = servidorFalso({ data: { message: 'ok', usuario: actualizado } });
  const alGuardar = jest.fn();
  renderConRutas(<EditarUsuarioAdmin usuario={otro} onGuardado={alGuardar} />);

  await userEvent.clear(screen.getByLabelText('Nombre'));
  await userEvent.type(screen.getByLabelText('Nombre'), 'Bruno Díaz');
  await userEvent.selectOptions(screen.getByLabelText('Rol'), 'admin');
  await guardar();

  expect(await screen.findByText('Usuario actualizado.')).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({
    metodo: 'PUT',
    url: '/admin/usuario/editar',
    cuerpo: { id: 8, nombre: 'Bruno Díaz', rol: 'admin' },
  });
  expect(alGuardar).toHaveBeenCalledWith(actualizado);
});

test('la clave solo se manda si se escribe una nueva válida', async () => {
  const peticiones = servidorFalso({ data: { message: 'ok', usuario: otro } });
  renderConRutas(<EditarUsuarioAdmin usuario={otro} onGuardado={() => {}} />);

  await userEvent.type(screen.getByLabelText(/Clave nueva/), 'abc');
  await guardar();
  expect(screen.getByText('La clave debe tener al menos 5 caracteres.')).toBeInTheDocument();
  expect(peticiones).toHaveLength(0);

  await userEvent.clear(screen.getByLabelText(/Clave nueva/));
  await userEvent.type(screen.getByLabelText(/Clave nueva/), 'Nueva!');
  await guardar();
  expect(await screen.findByText('Usuario actualizado.')).toBeInTheDocument();
  expect(peticiones[0].cuerpo).toEqual({ id: 8, clave: 'Nueva!' });
});

test('valida los datos antes de enviar', async () => {
  const peticiones = servidorFalso();
  renderConRutas(<EditarUsuarioAdmin usuario={otro} onGuardado={() => {}} />);

  await userEvent.clear(screen.getByLabelText('Correo'));
  await userEvent.type(screen.getByLabelText('Correo'), 'no-es-correo');
  await guardar();

  expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();
  expect(peticiones).toHaveLength(0);
});

test('muestra los errores del backend en cada campo', async () => {
  servidorFalso({ status: 422, data: { message: 'x', errors: { correo: ['El correo ya está en uso.'] } } });
  renderConRutas(<EditarUsuarioAdmin usuario={otro} onGuardado={() => {}} />);

  await userEvent.clear(screen.getByLabelText('Correo'));
  await userEvent.type(screen.getByLabelText('Correo'), 'ocupado@test.local');
  await guardar();

  expect(await screen.findByText('El correo ya está en uso.')).toBeInTheDocument();
});

test('un admin no puede cambiarse su propio rol', () => {
  renderConRutas(<EditarUsuarioAdmin usuario={adminDePrueba} onGuardado={() => {}} />);

  expect(screen.getByLabelText('Rol')).toBeDisabled();
});

test('si se edita a sí mismo actualiza la sesión', async () => {
  const actualizado = { ...adminDePrueba, nombre: 'Admin Nuevo' };
  servidorFalso({ data: { message: 'ok', usuario: actualizado } });
  renderConRutas(<EditarUsuarioAdmin usuario={adminDePrueba} onGuardado={() => {}} />);

  await userEvent.clear(screen.getByLabelText('Nombre'));
  await userEvent.type(screen.getByLabelText('Nombre'), 'Admin Nuevo');
  await guardar();

  await screen.findByText('Usuario actualizado.');
  expect(leerSesion()?.usuario.nombre).toBe('Admin Nuevo');
});
