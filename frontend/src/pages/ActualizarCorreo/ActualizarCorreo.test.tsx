import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { ActualizarCorreo } from './ActualizarCorreo';
import { guardarSesion, leerSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

const verificacion = encodeURIComponent(
  'http://localhost:8000/api/me/actualizar/correo/verificacion/firma?expires=999&hash=abc&id=1&signature=f1',
);
const linkValido = `/actualizar-correo?verificacion=${verificacion}&id=1&hash=abc&expires=999&signature=f2`;

function renderPagina(ruta = linkValido) {
  return renderConRutas(
    <Routes>
      <Route path="/actualizar-correo" element={<ActualizarCorreo />} />
    </Routes>,
    ruta,
  );
}

async function cambiarA(correo: string) {
  const campo = await screen.findByLabelText('Nuevo correo');
  await userEvent.type(campo, correo);
  await userEvent.click(screen.getByRole('button', { name: 'Cambiar correo' }));
}

beforeEach(() => localStorage.clear());

test('comprueba la firma del link antes de mostrar el formulario', async () => {
  const peticiones = servidorFalso({ status: 200 });
  renderPagina();

  expect(await screen.findByLabelText('Nuevo correo')).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({
    metodo: 'GET',
    url: '/me/actualizar/correo/verificacion/firma?expires=999&hash=abc&id=1&signature=f1',
  });
});

test('un link vencido no muestra el formulario', async () => {
  servidorFalso({ status: 403, data: { message: 'Invalid signature.' } });
  renderPagina();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'El link para cambiar el correo venció o ya no es válido.',
  );
  expect(screen.queryByLabelText('Nuevo correo')).not.toBeInTheDocument();
});

test('un link incompleto no llama a la API', () => {
  const peticiones = servidorFalso();
  renderPagina('/actualizar-correo?id=1');

  expect(screen.getByRole('alert')).toHaveTextContent('El link para cambiar el correo está incompleto.');
  expect(peticiones).toHaveLength(0);
});

test('valida el correo nuevo antes de enviarlo', async () => {
  const peticiones = servidorFalso({ status: 200 });
  renderPagina();

  await cambiarA('no-es-correo');

  expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();
  expect(peticiones).toHaveLength(1);
});

test('cambia el correo y actualiza la sesión si es el mismo usuario', async () => {
  guardarSesion('tok', usuarioDePrueba);
  const actualizado = { ...usuarioDePrueba, correo: 'nuevo@test.local' };
  const peticiones = servidorFalso([{ status: 200 }, { data: { message: 'ok', usuario: actualizado } }]);
  renderPagina();

  await cambiarA('nuevo@test.local');

  expect(await screen.findByText('Listo. Tu correo ahora es nuevo@test.local.')).toBeInTheDocument();
  expect(peticiones[1]).toMatchObject({
    metodo: 'PUT',
    url: '/me/actualizar/correo?expires=999&hash=abc&id=1&signature=f2',
    cuerpo: { correo: 'nuevo@test.local' },
  });
  expect(leerSesion()?.usuario.correo).toBe('nuevo@test.local');
});

test('un correo ocupado se marca en el campo', async () => {
  servidorFalso([
    { status: 200 },
    { status: 422, data: { message: 'x', errors: { correo: ['El correo ya está en uso.'] } } },
  ]);
  renderPagina();

  await cambiarA('ocupado@test.local');

  expect(await screen.findByText('El correo ya está en uso.')).toBeInTheDocument();
});

test('un link ya usado avisa que no es válido', async () => {
  servidorFalso([
    { status: 200 },
    { status: 403, data: { message: 'El link de cambio de correo ya no es válido' } },
  ]);
  renderPagina();

  await cambiarA('nuevo@test.local');

  expect(await screen.findByRole('alert')).toHaveTextContent('El link de cambio de correo ya no es válido');
});
