import {
  validarClaveNueva,
  validarCorreo,
  validarEdad,
  validarLogin,
  validarNombre,
  validarRegistro,
} from './validacion';

describe('validarNombre', () => {
  test.each([
    ['', 'Ingresa tu nombre.'],
    ['   ', 'Ingresa tu nombre.'],
    ['Al', 'El nombre debe tener al menos 3 caracteres.'],
    ['a'.repeat(101), 'El nombre no puede superar los 100 caracteres.'],
  ])('"%s" es inválido', (nombre, error) => {
    expect(validarNombre(nombre)).toBe(error);
  });

  test('un nombre de 3 a 100 caracteres es válido', () => {
    expect(validarNombre('Ana')).toBeNull();
    expect(validarNombre('a'.repeat(100))).toBeNull();
  });
});

describe('validarCorreo', () => {
  test.each([
    ['', 'Ingresa tu correo.'],
    ['ana', 'Ingresa un correo válido.'],
    ['ana@', 'Ingresa un correo válido.'],
    ['ana@test', 'Ingresa un correo válido.'],
    [`${'a'.repeat(140)}@test.local`, 'El correo no puede superar los 150 caracteres.'],
  ])('"%s" es inválido', (correo, error) => {
    expect(validarCorreo(correo)).toBe(error);
  });

  test('un correo con dominio es válido', () => {
    expect(validarCorreo('ana@test.local')).toBeNull();
  });
});

describe('validarClaveNueva', () => {
  test.each([
    ['', 'Ingresa una clave.'],
    ['Ab!c', 'La clave debe tener al menos 5 caracteres.'],
    [`A!${'a'.repeat(99)}`, 'La clave no puede superar los 100 caracteres.'],
    ['abcde!', 'La clave debe tener al menos una mayúscula.'],
    ['Abcdef', 'La clave debe tener al menos un símbolo (por ejemplo ! o _).'],
  ])('"%s" es inválida', (clave, error) => {
    expect(validarClaveNueva(clave)).toBe(error);
  });

  test('con 5 caracteres, una mayúscula y un símbolo es válida', () => {
    expect(validarClaveNueva('Abcd!')).toBeNull();
    expect(validarClaveNueva('Abcd_')).toBeNull();
  });
});

describe('validarEdad', () => {
  test('vacía es válida porque es opcional', () => {
    expect(validarEdad('')).toBeNull();
  });

  test.each(['0', '201', '2.5', 'abc', '-3'])('"%s" es inválida', (edad) => {
    expect(validarEdad(edad)).toBe('La edad debe ser un número entero entre 1 y 200.');
  });

  test('un entero entre 1 y 200 es válido', () => {
    expect(validarEdad('1')).toBeNull();
    expect(validarEdad('200')).toBeNull();
  });
});

describe('validarRegistro', () => {
  const valido = { nombre: 'Ana', correo: 'ana@test.local', clave: 'Clave!', edad: '30', sexo: 'F' };

  test('datos válidos no tienen errores', () => {
    expect(validarRegistro(valido)).toEqual({});
  });

  test('junta los errores de cada campo', () => {
    expect(validarRegistro({ nombre: '', correo: 'x', clave: 'abc', edad: '0', sexo: 'X' })).toEqual({
      nombre: 'Ingresa tu nombre.',
      correo: 'Ingresa un correo válido.',
      clave: 'La clave debe tener al menos 5 caracteres.',
      edad: 'La edad debe ser un número entero entre 1 y 200.',
      sexo: 'Elige una opción válida.',
    });
  });

  test('sexo vacío es válido porque es opcional', () => {
    expect(validarRegistro({ ...valido, sexo: '' })).toEqual({});
  });
});

describe('validarLogin', () => {
  test('pide correo y clave', () => {
    expect(validarLogin({ correo: '', clave: '' })).toEqual({
      correo: 'Ingresa tu correo.',
      clave: 'Ingresa tu clave.',
    });
  });

  test('no exige reglas de complejidad para la clave', () => {
    expect(validarLogin({ correo: 'ana@test.local', clave: 'x' })).toEqual({});
  });
});
