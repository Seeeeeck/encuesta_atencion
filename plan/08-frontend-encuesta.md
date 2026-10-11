# Fase 08 — Frontend encuesta

## Objetivo
Flujo de respuesta de la encuesta: iniciar, navegar entre preguntas (ida y vuelta para cambiar
respuestas), enviar y ver el estado de finalización.

## Pasos
> Ajustado a la API real (decisión 2026-10-11): el borrador vive en el navegador (`localStorage`) y
> las respuestas se mandan todas juntas al final; no existen `PUT /encuesta/respuestas/{id}` ni
> `GET /encuesta/compartir`.

1. Página `src/pages/Encuesta/` que consulta `GET /encuesta/estado` (si ya está completa va a la
   pantalla final), carga `GET /encuesta/obtener/preguntas` y retoma el borrador local. (listo)
2. Componente de navegación pregunta-a-pregunta: avanzar, **retroceder** y editar respuestas previas.
   Escala 1–5 con anclas "Totalmente en desacuerdo" / "Totalmente de acuerdo" (de
   `docs/preguntas.json`); en BD se guarda el número. (listo)
3. Guardado de cada respuesta en el borrador local (`localStorage`) en cada cambio. (listo)
4. Indicador de progreso (respondidas/total). (listo)
5. Enviar (`POST /encuesta/enviar`): bloquear si está incompleta y mostrar qué falta; 409 = ya
   enviada. (listo)
6. Pantalla de "encuesta finalizada" (`/encuesta/finalizada`) + **compartir link** del frontend
   (`navigator.share` o copiar al portapapeles). (listo)

## Archivos a tocar
- `frontend/src/pages/Encuesta/*`.
- `frontend/src/components/Pregunta/*`, `src/components/ProgresoEncuesta/*`,
  `src/components/CompartirLink/*`.
- `frontend/src/services/encuestaService.ts`.

## Criterio de "hecho"
- Usuario inicia, responde, retrocede a cambiar una respuesta, envía y ve el estado finalizado.
- No deja enviar incompleta; el progreso refleja lo respondido.

## Convenciones
- Componentes **< 300 líneas** (la página de encuesta probablemente se divide en subcomponentes;
  preguntar antes de partir).
- Test al lado de cada componente.

## Tests
- `src/pages/Encuesta/Encuesta.test.tsx` — flujo cargar/responder/enviar.
- `src/components/Pregunta/Pregunta.test.tsx`, `ProgresoEncuesta/ProgresoEncuesta.test.tsx`.

## Notas
- Actualizar `context/context_frontend.md`.
