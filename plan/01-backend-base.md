# Fase 01 — Backend base (Laravel + Sanctum + Postgres)

## Objetivo
Backend Laravel configurado como API REST con autenticación Sanctum, conexión a PostgreSQL,
logging de errores a `logs/` y CORS para el frontend.

## Pasos
1. Configurar conexión PostgreSQL en `backend/config/database.php` + `.env` (`DB_CONNECTION=pgsql`). (listo)
2. Instalar y configurar **Laravel Sanctum** (auth por token para la SPA). (listo)
3. Definir la estructura de carpetas API: `app/Http/Controllers/Api/`, `app/Models/`.
4. Configurar **CORS** (`config/cors.php`) para permitir el origen del frontend (Vite).
5. Configurar **logging de errores** hacia `logs/` (canal de log apuntando a la carpeta `logs/`).
6. Definir un prefijo de rutas API (`routes/api.php`) y un endpoint de salud (`GET /api/health`).
7. Estandarizar respuestas JSON de error (handler) y formato de validación.

## Archivos a tocar
- `backend/config/database.php`, `backend/config/cors.php`, `backend/config/logging.php`.
- `backend/routes/api.php`, `backend/app/Http/Kernel.php` (middleware Sanctum/API).
- `backend/app/Exceptions/Handler.php` (respuestas JSON consistentes).

## Criterio de "hecho"
- `GET /api/health` responde `200` JSON.
- Sanctum operativo (rutas protegidas devuelven `401` sin token).
- Errores no controlados quedan registrados en `logs/`.

## Tests
- `tests/Feature/HealthTest.php` — el endpoint de salud responde 200.
- `tests/Feature/Auth/SanctumProtectionTest.php` — ruta protegida devuelve 401 sin token.

## Notas
- Aplicar principios SOLID: controllers delgados, lógica en servicios/acciones.
- Actualizar `context/context_backend.md`.
