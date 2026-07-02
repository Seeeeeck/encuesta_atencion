# Fase 01 — Backend base (Laravel + Sanctum + Postgres)

## Objetivo
Backend Laravel configurado como API REST con autenticación Sanctum, conexión a PostgreSQL,
logging de errores (`storage/logs/laravel.log`, ya resuelto en Fase 00) y CORS para el frontend.

## Pasos
1. Configurar conexión PostgreSQL en `backend/config/database.php` + `.env` (`DB_CONNECTION=pgsql`). (listo)
2. Instalar y configurar **Laravel Sanctum** (auth por token para la SPA). (listo)
3. Definir la estructura de carpetas API: `app/Http/Controllers/Api/`, `app/Models/`. (listo)
4. Configurar **CORS** (`config/cors.php`) para permitir el origen del frontend (Vite). (listo)
5. ~~Configurar logging de errores hacia `logs/`~~ — ya cubierto por Fase 00 (paso 5): se usa
   `storage/logs/laravel.log` (canal `single` estándar de Laravel), no una carpeta `logs/`
   aparte. (listo)
6. Definir un prefijo de rutas API (`routes/api.php`) y un endpoint de salud (`GET /api/health`). (listo)
7. Estandarizar respuestas JSON de error (handler) y formato de validación. (listo)

## Archivos a tocar
- `backend/config/database.php`, `backend/config/cors.php`.
- `backend/routes/api.php`, `backend/app/Models/User.php` (trait `HasApiTokens`).
- `backend/bootstrap/app.php` (registro de `routes/api.php`; `withExceptions` para respuestas
  JSON consistentes — Laravel 11+ ya no usa `app/Exceptions/Handler.php`).

## Criterio de "hecho"
- `GET /api/health` responde `200` JSON.
- Sanctum operativo (rutas protegidas devuelven `401` sin token).
- Errores no controlados quedan registrados en `storage/logs/laravel.log`.

## Tests
- `tests/Feature/HealthTest.php` — el endpoint de salud responde 200.
- `tests/Feature/Auth/SanctumProtectionTest.php` — ruta protegida devuelve 401 sin token.

## Notas
- Aplicar principios SOLID: controllers delgados, lógica en servicios/acciones.
- Actualizar `context/context_backend.md`.
