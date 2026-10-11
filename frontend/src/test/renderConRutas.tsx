import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '../context/AuthContext';

export function renderConRutas(ui: ReactElement, rutaInicial = '/') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[rutaInicial]}>{ui}</MemoryRouter>
    </AuthProvider>,
  );
}
