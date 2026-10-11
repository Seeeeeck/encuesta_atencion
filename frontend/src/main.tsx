import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { AppRutas } from './AppRutas';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/inter/wght.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppRutas />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
