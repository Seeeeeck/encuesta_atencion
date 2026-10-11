import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompartirLink } from './CompartirLink';

const url = 'https://encuesta.test/';

// navigator.share y navigator.clipboard son APIs del navegador que jsdom no trae:
// se reemplazan en cada test (único caso donde un mock es inevitable).
function definirNavegador(propiedades: { share?: unknown; clipboard?: unknown }) {
  Object.defineProperty(navigator, 'share', { value: propiedades.share, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: propiedades.clipboard, configurable: true });
}

const compartir = () => userEvent.click(screen.getByRole('button', { name: 'Compartir la encuesta' }));

test('usa el menú de compartir del dispositivo cuando existe', async () => {
  const share = jest.fn().mockResolvedValue(undefined);
  definirNavegador({ share });
  render(<CompartirLink url={url} />);

  await compartir();

  expect(share).toHaveBeenCalledWith(expect.objectContaining({ url }));
});

test('si no hay menú de compartir copia el link', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  definirNavegador({ clipboard: { writeText } });
  render(<CompartirLink url={url} />);

  await compartir();

  expect(writeText).toHaveBeenCalledWith(url);
  expect(await screen.findByRole('status')).toHaveTextContent('¡Link copiado!');
});

test('si no se puede copiar muestra el link para copiarlo a mano', async () => {
  definirNavegador({ clipboard: { writeText: jest.fn().mockRejectedValue(new Error('denegado')) } });
  render(<CompartirLink url={url} />);

  await compartir();

  expect(await screen.findByDisplayValue(url)).toBeInTheDocument();
});

test('cancelar el menú de compartir no muestra errores', async () => {
  const cancelado = Object.assign(new Error('cancelado'), { name: 'AbortError' });
  definirNavegador({ share: jest.fn().mockRejectedValue(cancelado) });
  render(<CompartirLink url={url} />);

  await compartir();

  expect(screen.queryByDisplayValue(url)).not.toBeInTheDocument();
});
