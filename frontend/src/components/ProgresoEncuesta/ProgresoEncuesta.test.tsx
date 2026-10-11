import { render, screen } from '@testing-library/react';
import { ProgresoEncuesta } from './ProgresoEncuesta';

test('muestra en qué pregunta está y cuántas respondió', () => {
  render(<ProgresoEncuesta posicion={3} respondidas={2} total={10} />);

  expect(screen.getByText('Pregunta 3 de 10')).toBeInTheDocument();
  expect(screen.getByText('2 respondidas')).toBeInTheDocument();
});

test('la barra refleja la posición, no solo lo respondido', () => {
  render(<ProgresoEncuesta posicion={3} respondidas={2} total={10} />);

  const barra = screen.getByRole('progressbar', { name: 'Progreso de la encuesta' });
  expect(barra).toHaveAttribute('aria-valuenow', '3');
  expect(barra).toHaveAttribute('aria-valuemax', '10');
});

test('usa singular con una sola respondida', () => {
  render(<ProgresoEncuesta posicion={1} respondidas={1} total={10} />);

  expect(screen.getByText('1 respondida')).toBeInTheDocument();
});
