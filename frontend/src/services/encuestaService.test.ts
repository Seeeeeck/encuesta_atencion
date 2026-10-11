import { enviarEncuesta, obtenerPreguntas } from './encuestaService';
import { servidorFalso } from '../test/servidorFalso';

const preguntas = [
  { id: 1, pregunta_texto: 'Primera', tipo: 'N' },
  { id: 2, pregunta_texto: 'Segunda', tipo: 'P' },
];

test('obtenerPreguntas devuelve la lista de GET /encuesta/obtener/preguntas', async () => {
  const peticiones = servidorFalso({ data: { message: 'ok', preguntas } });

  expect(await obtenerPreguntas()).toEqual(preguntas);
  expect(peticiones[0]).toMatchObject({ metodo: 'GET', url: '/encuesta/obtener/preguntas' });
});

test('enviarEncuesta manda las respuestas con el formato del backend', async () => {
  const peticiones = servidorFalso({ data: { message: 'Encuesta enviada correctamente' } });

  await enviarEncuesta({ 1: 4, 2: 1 });

  expect(peticiones[0]).toMatchObject({
    metodo: 'POST',
    url: '/encuesta/enviar',
    cuerpo: {
      respuestas: [
        { id_pregunta: 1, numero_respuesta: 4 },
        { id_pregunta: 2, numero_respuesta: 1 },
      ],
    },
  });
});
