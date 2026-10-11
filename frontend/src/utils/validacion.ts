// Reglas copiadas de los Form Requests del backend (RegisterRequest, LoginRequest,
// UpdateNombreRequest, UpdateClaveRequest, UpdateCorreoRequest). El backend sigue
// siendo la fuente de verdad: esto solo evita viajes al servidor con datos inválidos.

export type ErroresFormulario = Record<string, string>;

const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sexosPermitidos = ['M', 'F', 'N/R'];

export function validarNombre(nombre: string): string | null {
  const limpio = nombre.trim();
  if (!limpio) {
    return 'Ingresa tu nombre.';
  }
  if (limpio.length < 3) {
    return 'El nombre debe tener al menos 3 caracteres.';
  }
  if (limpio.length > 100) {
    return 'El nombre no puede superar los 100 caracteres.';
  }
  return null;
}

export function validarCorreo(correo: string): string | null {
  const limpio = correo.trim();
  if (!limpio) {
    return 'Ingresa tu correo.';
  }
  if (!formatoCorreo.test(limpio)) {
    return 'Ingresa un correo válido.';
  }
  if (limpio.length > 150) {
    return 'El correo no puede superar los 150 caracteres.';
  }
  return null;
}

export function validarClaveNueva(clave: string): string | null {
  if (!clave) {
    return 'Ingresa una clave.';
  }
  if (clave.length < 5) {
    return 'La clave debe tener al menos 5 caracteres.';
  }
  if (clave.length > 100) {
    return 'La clave no puede superar los 100 caracteres.';
  }
  if (!/[A-Z]/.test(clave)) {
    return 'La clave debe tener al menos una mayúscula.';
  }
  if (!/[\W_]/.test(clave)) {
    return 'La clave debe tener al menos un símbolo (por ejemplo ! o _).';
  }
  return null;
}

export function validarEdad(edad: string): string | null {
  if (!edad.trim()) {
    return null;
  }
  const numero = Number(edad);
  if (!/^\d+$/.test(edad.trim()) || numero < 1 || numero > 200) {
    return 'La edad debe ser un número entero entre 1 y 200.';
  }
  return null;
}

function juntarErrores(errores: Record<string, string | null>): ErroresFormulario {
  const resultado: ErroresFormulario = {};
  for (const [campo, error] of Object.entries(errores)) {
    if (error) {
      resultado[campo] = error;
    }
  }
  return resultado;
}

export interface FormularioRegistro {
  nombre: string;
  correo: string;
  clave: string;
  edad: string;
  sexo: string;
}

export function validarRegistro(datos: FormularioRegistro): ErroresFormulario {
  return juntarErrores({
    nombre: validarNombre(datos.nombre),
    correo: validarCorreo(datos.correo),
    clave: validarClaveNueva(datos.clave),
    edad: validarEdad(datos.edad),
    sexo: datos.sexo && !sexosPermitidos.includes(datos.sexo) ? 'Elige una opción válida.' : null,
  });
}

export function validarLogin(datos: { correo: string; clave: string }): ErroresFormulario {
  return juntarErrores({
    correo: validarCorreo(datos.correo),
    clave: datos.clave ? null : 'Ingresa tu clave.',
  });
}
