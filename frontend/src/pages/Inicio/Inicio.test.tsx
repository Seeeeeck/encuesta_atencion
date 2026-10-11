import { screen } from '@testing-library/react';
import { Inicio } from './Inicio';
import { guardarSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { usuarioDePrueba } from '../../test/datos';

beforeEach(() => localStorage.clear());

test('presenta la encuesta', () => {
  renderConRutas(<Inicio />);

  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/atención/i);
});

test('sin sesión invita a crear una cuenta', () => {
  renderConRutas(<Inicio />);

  expect(screen.getByRole('link', { name: 'Crear cuenta y empezar' })).toHaveAttribute('href', '/registro');
  expect(screen.getByRole('link', { name: 'Ya tengo cuenta' })).toHaveAttribute('href', '/login');
});

test('con sesión lleva directo a la encuesta', () => {
  guardarSesion('tok', usuarioDePrueba);

  renderConRutas(<Inicio />);

  expect(screen.getByRole('link', { name: 'Ir a la encuesta' })).toHaveAttribute('href', '/encuesta');
});
