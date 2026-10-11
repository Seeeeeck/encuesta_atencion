import { screen } from '@testing-library/react';
import { NoEncontrada } from './NoEncontrada';
import { renderConRutas } from '../../test/renderConRutas';

test('avisa que la página no existe y ofrece volver al inicio', () => {
  renderConRutas(<NoEncontrada />);

  expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
});
