import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevisionEncuesta } from './RevisionEncuesta';
import type { Pregunta } from '../../types/encuesta';

const preguntas: Pregunta[] = [
  { id: 11, pregunta_texto: 'Primera afirmación', tipo: 'N' },
  { id: 12, pregunta_texto: 'Segunda afirmación', tipo: 'P' },
  { id: 13, pregunta_texto: 'Tercera afirmación', tipo: 'N' },
];

function renderRevision(respuestas: Record<number, 1 | 2 | 3 | 4 | 5>, extra: Partial<Parameters<typeof RevisionEncuesta>[0]> = {}) {
  const props = { onCambiar: jest.fn(), onEnviar: jest.fn(), enviando: false, ...extra };
  render(<RevisionEncuesta preguntas={preguntas} respuestas={respuestas} {...props} />);
  return props;
}

test('lista cada afirmación con la respuesta elegida y su significado', () => {
  renderRevision({ 11: 4, 12: 1, 13: 3 });

  const filas = screen.getAllByRole('listitem');
  expect(within(filas[0]).getByText('Primera afirmación')).toBeInTheDocument();
  expect(within(filas[0]).getByText('4 · De acuerdo')).toBeInTheDocument();
  expect(within(filas[1]).getByText('1 · Totalmente en desacuerdo')).toBeInTheDocument();
});

test('avisa que después de enviar no se puede cambiar', () => {
  renderRevision({ 11: 4, 12: 1, 13: 3 });

  expect(screen.getByRole('heading', { level: 1, name: 'Revisa tus respuestas' })).toBeInTheDocument();
  expect(screen.getByText(/no podrás cambiar tus respuestas/i)).toBeInTheDocument();
});

test('permite volver a cambiar una respuesta', async () => {
  const { onCambiar } = renderRevision({ 11: 4, 12: 1, 13: 3 });

  await userEvent.click(screen.getByRole('button', { name: 'Cambiar la respuesta 2' }));

  expect(onCambiar).toHaveBeenCalledWith(1);
});

test('marca las que faltan y no envía si queda alguna sin responder', async () => {
  const { onEnviar, onCambiar } = renderRevision({ 11: 4 });

  expect(screen.getAllByText('Sin responder')).toHaveLength(2);
  await userEvent.click(screen.getByRole('button', { name: 'Enviar encuesta' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Te falta responder 2 preguntas.');
  expect(onEnviar).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole('button', { name: 'Responder la pregunta 3' }));
  expect(onCambiar).toHaveBeenCalledWith(2);
});

test('con todo respondido envía', async () => {
  const { onEnviar } = renderRevision({ 11: 4, 12: 1, 13: 3 });

  await userEvent.click(screen.getByRole('button', { name: 'Enviar encuesta' }));

  expect(onEnviar).toHaveBeenCalledTimes(1);
});

test('mientras envía bloquea el botón', () => {
  renderRevision({ 11: 4, 12: 1, 13: 3 }, { enviando: true });

  expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
});

test('al abrirse lleva el foco al título para anunciar la revisión', () => {
  renderRevision({ 11: 4, 12: 1, 13: 3 });

  expect(screen.getByRole('heading', { level: 1, name: 'Revisa tus respuestas' })).toHaveFocus();
});
