import { render, screen } from '@testing-library/react';
import { Cargando } from './Cargando';

test('anuncia que está cargando', () => {
  render(<Cargando />);

  expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
});

test('acepta un texto propio', () => {
  render(<Cargando texto="Enviando encuesta…" />);

  expect(screen.getByRole('status')).toHaveTextContent('Enviando encuesta…');
});
