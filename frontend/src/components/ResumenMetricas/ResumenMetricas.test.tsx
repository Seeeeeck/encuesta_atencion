import { render, screen, within } from '@testing-library/react';
import { ResumenMetricas } from './ResumenMetricas';

const resumen = { total_usuarios: 20, total_encuestas: 16, encuestas_completadas: 15, indice_atencion_general: 2.97 };

function indicador(nombre: string) {
  return within(screen.getByRole('group', { name: nombre }));
}

test('muestra los usuarios registrados', () => {
  render(<ResumenMetricas resumen={resumen} />);

  expect(indicador('Usuarios').getByText('20')).toBeInTheDocument();
});

test('muestra las encuestas completadas y el porcentaje sobre los usuarios', () => {
  render(<ResumenMetricas resumen={resumen} />);

  expect(indicador('Encuestas completadas').getByText('15')).toBeInTheDocument();
  expect(indicador('Encuestas completadas').getByText('75 % de los usuarios')).toBeInTheDocument();
});

test('muestra el índice de atención sobre 5 con coma decimal', () => {
  render(<ResumenMetricas resumen={resumen} />);

  expect(indicador('Índice de atención').getByText('2,97')).toBeInTheDocument();
  expect(indicador('Índice de atención').getByText('de 5')).toBeInTheDocument();
});

test('sin respuestas no inventa valores', () => {
  render(
    <ResumenMetricas
      resumen={{ total_usuarios: 0, total_encuestas: 0, encuestas_completadas: 0, indice_atencion_general: null }}
    />,
  );

  expect(indicador('Índice de atención').getByText('Sin datos')).toBeInTheDocument();
  expect(indicador('Encuestas completadas').getByText('0 % de los usuarios')).toBeInTheDocument();
});
