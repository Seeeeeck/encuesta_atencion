# Fase 04 — Encuesta (API)

## Objetivo
Endpoints para que un usuario autenticado obtenga las preguntas y envíe todas sus respuestas de una
sola vez. **Decisión del usuario**: se descartó el flujo granular original (iniciar / guardar de a
una respuesta / reanudar / volver atrás / estado) por ser más simple no tener que persistir en cada
paso — el frontend arma el formulario completo en memoria y lo manda todo junto al final.

## Endpoints (bajo `/api`, requieren `auth:sanctum`)
- `GET  /encuesta/obtener/preguntas` — lista de preguntas fijas (ordenadas por id).
- `POST /encuesta/enviar` — recibe el array completo de respuestas, valida que estén **todas** las
  preguntas (ni de más ni de menos) y cada `numero_respuesta` en rango 1-5, crea la `Encuesta`
  (`is_ok = true`) y sus `Respuesta` en una transacción.

## Implementado
1. `EncuestaController` (Api): `obtenerPreguntas()`, `enviarEncuesta()`.
2. `EnviarEncuestaRequest`: valida `respuestas.*.id_pregunta` (required/integer/distinct/exists) y
   `respuestas.*.numero_respuesta` (required/integer/min:1/max:5), más `TodasLasRespuestasRule`
   sobre el array completo (exige que lleguen todas las preguntas del seeder).
3. `app/Rules/TodasLasRespuestasRule.php`: compara ids esperados (seeder) contra ids recibidos.
4. `enviarEncuesta()` corre dentro de `DB::beginTransaction()` / `commit()` / `rollBack()` — si algo
   falla a mitad de camino, no queda una `Encuesta` sin sus `Respuesta`.

## Archivos tocados
- `app/Http/Controllers/Api/EncuestaController.php`.
- `app/Http/Requests/EnviarEncuestaRequest.php`.
- `app/Rules/TodasLasRespuestasRule.php`.
- `routes/api.php`.

## Criterio de "hecho"
- `GET /encuesta/obtener/preguntas` devuelve las preguntas ordenadas.
- `POST /encuesta/enviar` con todas las respuestas completas y válidas → 200, `Encuesta` con
  `is_ok = true` y una `Respuesta` por pregunta.
- Rechaza (422): respuestas incompletas, respuestas de más (id_pregunta inexistente), duplicadas,
  o `numero_respuesta` fuera de 1-5.
- No se puede editar una encuesta ya enviada (no hay endpoint para eso — cada usuario tiene una sola
  `encuesta`, ver modelo de datos).

## Tests (pendiente)
- `tests/Feature/Encuesta/ObtenerPreguntasTest.php` — 200 con preguntas ordenadas; 401 sin auth.
- `tests/Feature/Encuesta/EnviarEncuestaTest.php` — camino feliz (200, `is_ok=true`, respuestas
  guardadas); 401 sin auth.
- `tests/Feature/Encuesta/EnviarIncompletaTest.php` — 422 si faltan `id_pregunta` o sobran.
- `tests/Feature/Encuesta/RespuestaInvalidaTest.php` — 422 ante `numero_respuesta` fuera de rango
  (`0`, `6`) o duplicado.

## Notas
- Descartado el link público de compartir y el endpoint de estado/progreso de esta fase — no hay
  guardado parcial que consultar. Si se necesitan más adelante, se evalúan como fase aparte.
- Actualizar `context/context_backend.md`.
