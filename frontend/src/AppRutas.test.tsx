import { screen } from '@testing-library/react';
import { AppRutas } from './AppRutas';
import { renderConRutas } from './test/renderConRutas';
import { servidorFalso } from './test/servidorFalso';

beforeEach(() => {
  localStorage.clear();
  servidorFalso({ data: { status: 'ok' } });
});

test('la raíz muestra el inicio dentro del layout', async () => {
  renderConRutas(<AppRutas />, '/');

  expect(await screen.findByRole('link', { name: 'Atención' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/atención/i);
});

test('una ruta desconocida muestra la página 404', async () => {
  renderConRutas(<AppRutas />, '/no-existe');

  expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
});
