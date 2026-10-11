import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DistribucionRespuestas } from './DistribucionRespuestas';
import type { MetricaPregunta } from '../../types/admin';

const preguntas: MetricaPregunta[] = [
  {
    id_pregunta: 1,
    pregunta_texto: 'Reviso el celular sin decidirlo.',
    tipo: 'N',
    total_respuestas: 10,
    promedio: 3.4,
    promedio_ajustado: 2.6,
    distribucion: { 1: 1, 2: 1, 3: 2, 4: 3, 5: 3 },
  },
  {
    id_pregunta: 2,
    pregunta_texto: 'Retomo la concentración rápido.',
    tipo: 'P',
    total_respuestas: 0,
    promedio: null,
    promedio_ajustado: null,
    distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  },
];

test('tiene leyenda con el significado de cada valor', () => {
  render(<DistribucionRespuestas preguntas={preguntas} />);

  const leyenda = within(screen.getByRole('list', { name: 'Leyenda' }));
  expect(leyenda.getByText('1 · Totalmente en desacuerdo')).toBeInTheDocument();
  expect(leyenda.getByText('3 · Neutral')).toBeInTheDocument();
  expect(leyenda.getByText('5 · Totalmente de acuerdo')).toBeInTheDocument();
});

test('cada segmento describe su valor y porcentaje', () => {
  render(<DistribucionRespuestas preguntas={preguntas} />);

  expect(screen.getByRole('img', { name: 'Pregunta 1, respuesta 4: 3 de 10 (30 %)' })).toBeInTheDocument();
});

test('los segmentos son proporcionales y omiten los valores sin respuestas', () => {
  render(<DistribucionRespuestas preguntas={preguntas} />);

  expect(screen.getByRole('img', { name: 'Pregunta 1, respuesta 5: 3 de 10 (30 %)' })).toHaveStyle({ width: '15%' });
  expect(screen.queryByRole('img', { name: /Pregunta 2, respuesta/ })).not.toBeInTheDocument();
});

test('una pregunta sin respuestas lo indica', () => {
  render(<DistribucionRespuestas preguntas={preguntas} />);

  expect(screen.getByText('Sin respuestas todavía')).toBeInTheDocument();
});

test('ofrece los mismos datos como tabla', async () => {
  render(<DistribucionRespuestas preguntas={preguntas} />);

  await userEvent.click(screen.getByText('Ver como tabla'));

  const fila = within(screen.getByRole('row', { name: /P1/ }));
  expect(fila.getAllByRole('cell').map((celda) => celda.textContent)).toEqual(['1', '1', '2', '3', '3', '10']);
});
