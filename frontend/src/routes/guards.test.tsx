import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { RutaAdmin, RutaInvitado, RutaPrivada } from './guards';
import { guardarSesion } from '../services/sesion';
import { renderConRutas } from '../test/renderConRutas';
import { adminDePrueba, usuarioDePrueba } from '../test/datos';

function rutas() {
  return (
    <Routes>
      <Route path="/login" element={<p>pantalla login</p>} />
      <Route path="/encuesta" element={<p>pantalla encuesta</p>} />
      <Route path="/admin" element={<p>pantalla admin</p>} />
      <Route element={<RutaPrivada />}>
        <Route path="/perfil" element={<p>pantalla perfil</p>} />
      </Route>
      <Route element={<RutaAdmin />}>
        <Route path="/admin/usuarios" element={<p>pantalla usuarios</p>} />
      </Route>
      <Route element={<RutaInvitado />}>
        <Route path="/registro" element={<p>pantalla registro</p>} />
      </Route>
    </Routes>
  );
}

beforeEach(() => localStorage.clear());

describe('RutaPrivada', () => {
  test('sin sesión manda al login', () => {
    renderConRutas(rutas(), '/perfil');

    expect(screen.getByText('pantalla login')).toBeInTheDocument();
  });

  test('con sesión muestra la pantalla', () => {
    guardarSesion('tok', usuarioDePrueba);

    renderConRutas(rutas(), '/perfil');

    expect(screen.getByText('pantalla perfil')).toBeInTheDocument();
  });
});

describe('RutaAdmin', () => {
  test('sin sesión manda al login', () => {
    renderConRutas(rutas(), '/admin/usuarios');

    expect(screen.getByText('pantalla login')).toBeInTheDocument();
  });

  test('un usuario normal vuelve a la encuesta', () => {
    guardarSesion('tok', usuarioDePrueba);

    renderConRutas(rutas(), '/admin/usuarios');

    expect(screen.getByText('pantalla encuesta')).toBeInTheDocument();
  });

  test('un admin ve la pantalla', () => {
    guardarSesion('tok', adminDePrueba);

    renderConRutas(rutas(), '/admin/usuarios');

    expect(screen.getByText('pantalla usuarios')).toBeInTheDocument();
  });
});

describe('RutaInvitado', () => {
  test('sin sesión muestra la pantalla', () => {
    renderConRutas(rutas(), '/registro');

    expect(screen.getByText('pantalla registro')).toBeInTheDocument();
  });

  test('un usuario con sesión va a la encuesta', () => {
    guardarSesion('tok', usuarioDePrueba);

    renderConRutas(rutas(), '/registro');

    expect(screen.getByText('pantalla encuesta')).toBeInTheDocument();
  });

  test('un admin con sesión va al panel', () => {
    guardarSesion('tok', adminDePrueba);

    renderConRutas(rutas(), '/registro');

    expect(screen.getByText('pantalla admin')).toBeInTheDocument();
  });
});
