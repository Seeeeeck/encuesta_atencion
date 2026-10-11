import { render, screen } from '@testing-library/react';
import { BarrasIndice } from './BarrasIndice';

const filas = [
  { etiqueta: '18-25', valor: 3.5, detalle: '4 encuestas' },
  { etiqueta: '26-35', valor: null, detalle: '0 encuestas' },
];

test('tiene un título que describe el gráfico', () => {
  render(<BarrasIndice titulo="Índice por edad" filas={filas} />);

  expect(screen.getByRole('figure', { name: 'Índice por edad' })).toBeInTheDocument();
});

test('escribe el valor de cada barra, sin depender del color', () => {
  render(<BarrasIndice titulo="Índice por edad" filas={filas} />);

  expect(screen.getByRole('listitem', { name: '18-25: 3,50 de 5, 4 encuestas' })).toBeInTheDocument();
  expect(screen.getByText('3,50')).toBeInTheDocument();
});

test('el largo de la barra es proporcional a la escala de 1 a 5', () => {
  render(<BarrasIndice titulo="Índice por edad" filas={filas} />);

  expect(screen.getByTestId('barra-18-25')).toHaveStyle({ width: '70%' });
});

test('una fila sin datos lo dice en vez de dibujar una barra vacía', () => {
  render(<BarrasIndice titulo="Índice por edad" filas={filas} />);

  expect(screen.getByRole('listitem', { name: '26-35: sin datos, 0 encuestas' })).toBeInTheDocument();
  expect(screen.queryByTestId('barra-26-35')).not.toBeInTheDocument();
});
