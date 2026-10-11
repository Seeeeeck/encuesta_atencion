import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pregunta } from './Pregunta';

const pregunta = { id: 7, pregunta_texto: 'Pierdo la noción del tiempo con el scroll.', tipo: 'N' as const };

test('muestra el texto de la pregunta como título y grupo de opciones', () => {
  render(<Pregunta pregunta={pregunta} onResponder={() => {}} />);

  expect(screen.getByRole('heading', { level: 1, name: pregunta.pregunta_texto })).toBeInTheDocument();
  expect(screen.getByRole('radiogroup', { name: pregunta.pregunta_texto })).toBeInTheDocument();
});

test('cada valor de la escala tiene su significado escrito', () => {
  render(<Pregunta pregunta={pregunta} onResponder={() => {}} />);

  for (const radio of screen.getAllByRole('radio')) {
    expect(radio).not.toHaveAttribute('aria-label');
  }
  for (const nombre of [
    '1 Totalmente en desacuerdo',
    '2 En desacuerdo',
    '3 Neutral',
    '4 De acuerdo',
    '5 Totalmente de acuerdo',
  ]) {
    expect(screen.getByRole('radio', { name: nombre })).toBeInTheDocument();
  }
});

test('marca la respuesta elegida', () => {
  render(<Pregunta pregunta={pregunta} valor={4} onResponder={() => {}} />);

  expect(screen.getByRole('radio', { name: '4 De acuerdo' })).toBeChecked();
  expect(screen.getByRole('radio', { name: '3 Neutral' })).not.toBeChecked();
});

test('avisa el valor elegido', async () => {
  const responder = jest.fn();
  render(<Pregunta pregunta={pregunta} onResponder={responder} />);

  await userEvent.click(screen.getByRole('radio', { name: '2 En desacuerdo' }));

  expect(responder).toHaveBeenCalledWith(2);
});

test('el título puede recibir el foco para anunciar la pregunta nueva', () => {
  render(<Pregunta pregunta={pregunta} onResponder={() => {}} />);

  expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
});
