import { screen } from '@testing-library/react';
import { AdminMetricas } from './AdminMetricas';
import { guardarSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { adminDePrueba } from '../../test/datos';
import { metricasDePrueba } from '../../test/datosAdmin';

beforeEach(() => {
  localStorage.clear();
  guardarSesion('tok', adminDePrueba);
});

test('carga las métricas y muestra el resumen', async () => {
  const peticiones = servidorFalso({ data: { message: 'ok', metricas: metricasDePrueba } });

  renderConRutas(<AdminMetricas />);

  expect(await screen.findByRole('group', { name: 'Usuarios' })).toHaveTextContent('20');
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/admin/metricas' });
});

test('muestra el índice ajustado de cada pregunta', async () => {
  servidorFalso({ data: { message: 'ok', metricas: metricasDePrueba } });

  renderConRutas(<AdminMetricas />);

  expect(await screen.findByRole('figure', { name: 'Índice de atención por pregunta' })).toBeInTheDocument();
  expect(screen.getByRole('listitem', { name: 'P1: 2,60 de 5, 10 respuestas' })).toBeInTheDocument();
});

test('muestra el índice por edad y por sexo con nombres legibles', async () => {
  servidorFalso({ data: { message: 'ok', metricas: metricasDePrueba } });

  renderConRutas(<AdminMetricas />);

  expect(await screen.findByRole('listitem', { name: '<18: 2,60 de 5, 1 encuesta' })).toBeInTheDocument();
  expect(screen.getByRole('listitem', { name: '18-25: sin datos, 0 encuestas' })).toBeInTheDocument();
  expect(screen.getByRole('listitem', { name: 'Masculino: 3,03 de 5, 8 encuestas' })).toBeInTheDocument();
  expect(screen.getByRole('listitem', { name: 'Prefiero no responder: sin datos, 0 encuestas' })).toBeInTheDocument();
  expect(screen.getByRole('listitem', { name: 'Sin dato: 3,00 de 5, 1 encuesta' })).toBeInTheDocument();
});

test('incluye la distribución de respuestas', async () => {
  servidorFalso({ data: { message: 'ok', metricas: metricasDePrueba } });

  renderConRutas(<AdminMetricas />);

  expect(await screen.findByRole('figure', { name: 'Distribución de respuestas por pregunta' })).toBeInTheDocument();
});

test('si falla muestra el error', async () => {
  servidorFalso({ status: 500 });

  renderConRutas(<AdminMetricas />);

  expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error en el servidor.');
});
