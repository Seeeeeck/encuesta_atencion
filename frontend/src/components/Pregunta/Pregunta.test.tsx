import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pregunta } from './Pregunta';

const pregunta = { id: 7, pregunta_texto: 'Pierdo la noción del tiempo con el scroll.', tipo: 'N' as const };

test('muestra el número de pregunta y el texto como grupo de opciones', () => {
  render(<Pregunta pregunta={pregunta} numero={3} total={10} onResponder={() => {}} />);

  expect(screen.getByText('Pregunta 3 de 10')).toBeInTheDocument();
  expect(screen.getByRole('radiogroup', { name: pregunta.pregunta_texto })).toBeInTheDocument();
});

test('ofrece la escala del 1 al 5 con las anclas en los extremos', () => {
  render(<Pregunta pregunta={pregunta} numero={1} total={10} onResponder={() => {}} />);

  expect(screen.getAllByRole('radio')).toHaveLength(5);
  expect(screen.getByRole('radio', { name: '1 Totalmente en desacuerdo' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: '3' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: '5 Totalmente de acuerdo' })).toBeInTheDocument();
});

test('marca la respuesta elegida', () => {
  render(<Pregunta pregunta={pregunta} numero={1} total={10} valor={4} onResponder={() => {}} />);

  expect(screen.getByRole('radio', { name: '4' })).toBeChecked();
  expect(screen.getByRole('radio', { name: '3' })).not.toBeChecked();
});

test('avisa el valor elegido', async () => {
  const responder = jest.fn();
  render(<Pregunta pregunta={pregunta} numero={1} total={10} onResponder={responder} />);

  await userEvent.click(screen.getByRole('radio', { name: '2' }));

  expect(responder).toHaveBeenCalledWith(2);
});
