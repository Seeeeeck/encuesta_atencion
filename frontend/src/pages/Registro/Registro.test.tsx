import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { Registro } from './Registro';
import { leerSesion } from '../../services/sesion';
import { renderConRutas } from '../../test/renderConRutas';
import { servidorFalso } from '../../test/servidorFalso';
import { usuarioDePrueba } from '../../test/datos';

function renderRegistro() {
  return renderConRutas(
    <Routes>
      <Route path="/registro" element={<Registro />} />
      <Route path="/encuesta" element={<p>pantalla encuesta</p>} />
    </Routes>,
    '/registro',
  );
}

async function completarObligatorios() {
  await userEvent.type(screen.getByLabelText('Nombre'), 'Ana');
  await userEvent.type(screen.getByLabelText('Correo'), 'ana@test.local');
  await userEvent.type(screen.getByLabelText('Clave'), 'Clave!');
}

const botonCrear = () => screen.getByRole('button', { name: 'Crear cuenta' });

beforeEach(() => localStorage.clear());

test('sin datos muestra los errores y no llama a la API', async () => {
  const peticiones = servidorFalso();
  renderRegistro();

  await userEvent.click(botonCrear());

  expect(screen.getByText('Ingresá tu nombre.')).toBeInTheDocument();
  expect(screen.getByText('Ingresá tu correo.')).toBeInTheDocument();
  expect(screen.getByText('Ingresá una clave.')).toBeInTheDocument();
  expect(peticiones).toHaveLength(0);
});

test('explica cómo tiene que ser la clave', () => {
  renderRegistro();

  expect(screen.getByLabelText('Clave')).toHaveAccessibleDescription(
    'Mínimo 5 caracteres, con al menos una mayúscula y un símbolo.',
  );
});

test('crea la cuenta con todos los datos, inicia sesión y va a la encuesta', async () => {
  const peticiones = servidorFalso({ status: 201, data: { token: 'tok', usuario: usuarioDePrueba } });
  renderRegistro();

  await completarObligatorios();
  await userEvent.type(screen.getByLabelText(/Edad/), '30');
  await userEvent.selectOptions(screen.getByLabelText(/Sexo/), 'F');
  await userEvent.click(botonCrear());

  expect(await screen.findByText('pantalla encuesta')).toBeInTheDocument();
  expect(peticiones[0]).toMatchObject({
    metodo: 'POST',
    url: '/register',
    cuerpo: { nombre: 'Ana', correo: 'ana@test.local', clave: 'Clave!', edad: 30, sexo: 'F' },
  });
  expect(leerSesion()?.token).toBe('tok');
});

test('edad y sexo vacíos se mandan como null', async () => {
  const peticiones = servidorFalso({ status: 201, data: { token: 'tok', usuario: usuarioDePrueba } });
  renderRegistro();

  await completarObligatorios();
  await userEvent.click(botonCrear());

  await screen.findByText('pantalla encuesta');
  expect(peticiones[0].cuerpo).toMatchObject({ edad: null, sexo: null });
});

test('ofrece "prefiero no responder" en sexo', () => {
  renderRegistro();

  expect(screen.getByRole('option', { name: 'Prefiero no responder' })).toHaveValue('N/R');
});

test('un correo ya registrado se marca en el campo', async () => {
  servidorFalso({
    status: 422,
    data: { message: 'El correo ya está registrado.', errors: { correo: ['El correo ya está registrado.'] } },
  });
  renderRegistro();

  await completarObligatorios();
  await userEvent.click(botonCrear());

  expect(await screen.findByText('El correo ya está registrado.')).toBeInTheDocument();
  expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true');
});

test('ofrece ir al login', () => {
  renderRegistro();

  expect(screen.getByRole('link', { name: 'Ingresá' })).toHaveAttribute('href', '/login');
});
