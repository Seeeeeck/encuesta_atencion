import { render, screen } from '@testing-library/react';
import { ProgresoEncuesta } from './ProgresoEncuesta';

test('muestra cuántas preguntas van respondidas', () => {
  render(<ProgresoEncuesta respondidas={4} total={10} />);

  expect(screen.getByText('4 de 10 respondidas')).toBeInTheDocument();
});

test('expone el avance como barra de progreso accesible', () => {
  render(<ProgresoEncuesta respondidas={4} total={10} />);

  const barra = screen.getByRole('progressbar', { name: 'Progreso de la encuesta' });
  expect(barra).toHaveAttribute('aria-valuenow', '4');
  expect(barra).toHaveAttribute('aria-valuemax', '10');
});
