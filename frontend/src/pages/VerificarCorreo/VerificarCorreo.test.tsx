import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { VerificarCorreo } from './VerificarCorreo';
import { guardarSesion, leerSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

const linkValido = '/verificar-correo?id=5&hash=abc&expires=999&signature=firma';

function renderPagina(ruta = linkValido) {
  return renderConRutas(
    <Routes>
      <Route path="/verificar-correo" element={<VerificarCorreo />} />
    </Routes>,
    ruta,
  );
}

beforeEach(() => localStorage.clear());

test('verifica el correo con la firma del link', async () => {
  const peticiones = servidorFalso({ data: { is_verified: true } });
  renderPagina();

  expect(screen.getByRole('status')).toHaveTextContent('Verificando tu correo…');
  expect(await screen.findByText('¡Listo! Tu correo quedó verificado.')).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({
    metodo: 'GET',
    url: '/email/verificar/5/abc?expires=999&signature=firma',
  });
});

test('sin sesión ofrece ingresar', async () => {
  servidorFalso({ data: { is_verified: true } });
  renderPagina();

  expect(await screen.findByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/login');
});

test('con sesión actualiza el usuario guardado y ofrece ir a la encuesta', async () => {
  guardarSesion('tok', { ...usuarioDePrueba, is_verified: false });
  servidorFalso([{ data: { is_verified: true } }, { data: { ...usuarioDePrueba, is_verified: true } }]);
  renderPagina();

  expect(await screen.findByRole('link', { name: 'Ir a la encuesta' })).toHaveAttribute('href', '/encuesta');
  expect(leerSesion()?.usuario.is_verified).toBe(true);
});

test('un link vencido o alterado avisa que no es válido', async () => {
  servidorFalso({ status: 403, data: { message: 'Invalid signature.' } });
  renderPagina();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'El link de verificación venció o ya no es válido.',
  );
});

test('un link incompleto no llama a la API', () => {
  const peticiones = servidorFalso();
  renderPagina('/verificar-correo?id=5');

  expect(screen.getByRole('alert')).toHaveTextContent('El link de verificación está incompleto.');
  expect(peticiones).toHaveLength(0);
});

test('si falla refrescar el perfil igual informa que se verificó', async () => {
  guardarSesion('tok', { ...usuarioDePrueba, is_verified: false });
  servidorFalso([{ data: { is_verified: true } }, { status: 500 }]);
  renderPagina();

  expect(await screen.findByText('¡Listo! Tu correo quedó verificado.')).toBeInTheDocument();
});
