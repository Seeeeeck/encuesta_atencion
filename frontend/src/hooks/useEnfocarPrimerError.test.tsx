import { render, screen } from '@testing-library/react';
import { useEnfocarPrimerError } from './useEnfocarPrimerError';

function Formulario({ errores }: { errores: Record<string, string> }) {
  const ref = useEnfocarPrimerError(errores);
  return (
    <form ref={ref}>
      <input aria-label="nombre" aria-invalid={Boolean(errores.nombre)} />
      <input aria-label="correo" aria-invalid={Boolean(errores.correo)} />
    </form>
  );
}

test('lleva el foco al primer campo con error', () => {
  const { rerender } = render(<Formulario errores={{}} />);

  rerender(<Formulario errores={{ correo: 'Mal' }} />);

  expect(screen.getByLabelText('correo')).toHaveFocus();
});

test('sin errores no mueve el foco', () => {
  render(<Formulario errores={{}} />);

  expect(document.body).toHaveFocus();
});

test('con varios errores elige el primero del formulario', () => {
  const { rerender } = render(<Formulario errores={{}} />);

  rerender(<Formulario errores={{ correo: 'Mal', nombre: 'Mal' }} />);

  expect(screen.getByLabelText('nombre')).toHaveFocus();
});
