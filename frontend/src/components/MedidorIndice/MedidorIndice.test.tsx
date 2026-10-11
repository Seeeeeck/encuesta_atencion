import { render, screen } from '@testing-library/react';
import { MedidorIndice } from './MedidorIndice';

test('expone el valor en una escala de 1 a 5', () => {
  render(<MedidorIndice etiqueta="Tu índice de atención" valor={3.25} />);

  const medidor = screen.getByRole('meter', { name: 'Tu índice de atención' });
  expect(medidor).toHaveAttribute('aria-valuemin', '1');
  expect(medidor).toHaveAttribute('aria-valuemax', '5');
  expect(medidor).toHaveAttribute('aria-valuenow', '3.25');
  expect(medidor).toHaveAttribute('aria-valuetext', '3.25 de 5');
});

test('la marca se ubica sobre la escala que empieza en 1', () => {
  render(<MedidorIndice etiqueta="Índice" valor={3} />);

  // 3 en una escala de 1 a 5 está en la mitad.
  expect(screen.getByTestId('marca-indice')).toHaveStyle({ left: '50%' });
});
