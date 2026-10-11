import { render, screen } from '@testing-library/react';
import { MensajeError } from './MensajeError';

test('muestra el mensaje como alerta', () => {
  render(<MensajeError mensaje="Credenciales inválidas." />);

  expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas.');
});

test('sin mensaje no muestra nada', () => {
  const { container } = render(<MensajeError mensaje="" />);

  expect(container).toBeEmptyDOMElement();
});
