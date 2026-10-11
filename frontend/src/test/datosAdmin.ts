import type { Metricas, PaginaUsuarios } from '../types/admin';
import { usuarioDePrueba } from './datos';

export const metricasDePrueba: Metricas = {
  resumen: { total_usuarios: 20, total_encuestas: 16, encuestas_completadas: 15, indice_atencion_general: 2.97 },
  por_pregunta: [
    {
      id_pregunta: 1,
      pregunta_texto: 'Reviso el celular sin decidirlo.',
      tipo: 'N',
      total_respuestas: 10,
      promedio: 3.4,
      promedio_ajustado: 2.6,
      distribucion: { 1: 1, 2: 1, 3: 2, 4: 3, 5: 3 },
    },
  ],
  por_edad: [
    { rango: '<18', encuestas: 1, indice_atencion: 2.6 },
    { rango: '18-25', encuestas: 0, indice_atencion: null },
  ],
  por_sexo: [
    { sexo: 'M', encuestas: 8, indice_atencion: 3.03 },
    { sexo: 'N/R', encuestas: 0, indice_atencion: null },
    { sexo: 'Sin dato', encuestas: 1, indice_atencion: 3 },
  ],
};

export function paginaDePrueba(pagina: number, ultima = 3): PaginaUsuarios {
  return {
    current_page: pagina,
    last_page: ultima,
    per_page: 10,
    total: 21,
    data: [
      { ...usuarioDePrueba, id: 10 + pagina, nombre: `Usuario página ${pagina}`, correo: `p${pagina}@test.local` },
    ],
  };
}
