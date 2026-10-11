import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { CampoFormulario } from './CampoFormulario';

function CampoControlado(props: { error?: string; ayuda?: string; opciones?: { valor: string; texto: string }[] }) {
  const [valor, setValor] = useState('');
  return (
    <>
      <CampoFormulario etiqueta="Correo" nombre="correo" valor={valor} onCambio={setValor} {...props} />
      <p>valor: {valor}</p>
    </>
  );
}

test('asocia la etiqueta con el campo', () => {
  render(<CampoControlado />);

  expect(screen.getByLabelText('Correo')).toHaveAttribute('name', 'correo');
});

test('avisa los cambios de valor', async () => {
  render(<CampoControlado />);

  await userEvent.type(screen.getByLabelText('Correo'), 'ana');

  expect(screen.getByText('valor: ana')).toBeInTheDocument();
});

test('muestra el error y marca el campo como inválido', () => {
  render(<CampoControlado error="Ingresá tu correo." />);

  const campo = screen.getByLabelText('Correo');
  expect(campo).toHaveAttribute('aria-invalid', 'true');
  expect(campo).toHaveAccessibleDescription('Ingresá tu correo.');
});

test('sin error el campo es válido', () => {
  render(<CampoControlado />);

  expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'false');
});

test('muestra un texto de ayuda', () => {
  render(<CampoControlado ayuda="Lo usamos para iniciar sesión." />);

  expect(screen.getByLabelText('Correo')).toHaveAccessibleDescription('Lo usamos para iniciar sesión.');
});

test('con opciones se muestra como una lista desplegable', async () => {
  render(
    <CampoControlado
      opciones={[
        { valor: 'M', texto: 'Masculino' },
        { valor: 'F', texto: 'Femenino' },
      ]}
    />,
  );

  await userEvent.selectOptions(screen.getByLabelText('Correo'), 'F');

  expect(screen.getByText('valor: F')).toBeInTheDocument();
});

test('se puede deshabilitar', () => {
  render(<CampoFormulario etiqueta="Rol" nombre="rol" valor="" onCambio={() => {}} deshabilitado />);

  expect(screen.getByLabelText('Rol')).toBeDisabled();
});
