export const opcionesSexo = [
  { valor: 'M', texto: 'Masculino' },
  { valor: 'F', texto: 'Femenino' },
  { valor: 'N/R', texto: 'Prefiero no responder' },
];

export const textoSexo: Record<string, string> = {
  M: 'Masculino',
  F: 'Femenino',
  'N/R': 'Prefiero no responder',
};

export const opcionesRol = [
  { valor: 'usuario', texto: 'Usuario' },
  { valor: 'admin', texto: 'Administrador' },
];

export const significadoRespuesta: Record<number, string> = {
  1: 'Totalmente en desacuerdo',
  2: 'En desacuerdo',
  3: 'Neutral',
  4: 'De acuerdo',
  5: 'Totalmente de acuerdo',
};
