import { screen } from '@testing-library/react';
import { Perfil } from './Perfil';
import { guardarSesion, leerSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', usuarioDePrueba);
});

test('refresca los datos del usuario con GET /me', async () => {
  const actualizado = { ...usuarioDePrueba, edad: 31 };
  const peticiones = servidorFalso({ data: actualizado });

  renderConRutas(<Perfil />);

  expect(await screen.findByText('31')).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/me' });
  expect(leerSesion()?.usuario.edad).toBe(31);
});

test('muestra los datos de la cuenta', async () => {
  servidorFalso({ data: usuarioDePrueba });

  renderConRutas(<Perfil />);

  expect(await screen.findByText('Femenino')).toBeInTheDocument();
  expect(screen.getByText('Verificado')).toBeInTheDocument();
});

test('marca el correo sin verificar', async () => {
  const sinVerificar = { ...usuarioDePrueba, is_verified: false };
  guardarSesion('tok', sinVerificar);
  servidorFalso({ data: sinVerificar });

  renderConRutas(<Perfil />);

  expect(await screen.findByText('Sin verificar')).toBeInTheDocument();
});

test('incluye las secciones para editar la cuenta', () => {
  servidorFalso({ data: usuarioDePrueba });

  renderConRutas(<Perfil />);

  for (const titulo of ['Nombre', 'Clave', 'Correo', 'Eliminar cuenta']) {
    expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument();
  }
});
