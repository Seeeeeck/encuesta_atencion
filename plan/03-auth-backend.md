# Fase 03 — Autenticación (API)

## Objetivo
Endpoints de cuenta de usuario: registro, login, logout, edición de perfil y eliminación de cuenta,
con validación server-side y emisión de token Sanctum.

## Endpoints (todos bajo `/api`)
- `POST /register` — crea usuario (nombre, correo, clave, edad?, sexo?). `rol = 'usuario'`.
- `POST /login` — valida credenciales, devuelve token Sanctum + datos básicos.
- `POST /logout` — revoca el token actual (requiere auth).
- `GET  /me` — datos del usuario autenticado.
- `PUT  /me` — editar nombre, correo y/o clave (requiere auth).
- `DELETE /me` — eliminar la propia cuenta (requiere auth).

## Pasos
1. `AuthController` (Api) con acciones register/login/logout. (listo)
2. `PerfilController` (Api) con show/update/destroy para `/me`.
3. **Form Requests** de validación: correo válido y único, clave con mínimo de seguridad,
   edad numérica/rango, sexo dentro de valores permitidos (incluye "prefiero no responder").
   `RegisterRequest` y `LoginRequest` ya creados (adelantados durante el paso 1); falta
   `UpdatePerfilRequest` cuando se haga el paso 2.
4. Hash de la clave al crear/actualizar. Revocar tokens al eliminar cuenta.
5. Registrar rutas en `routes/api.php` con middleware `auth:sanctum` donde corresponda.

## Archivos a tocar
- `app/Http/Controllers/Api/AuthController.php`, `.../PerfilController.php`.
- `app/Http/Requests/*` (RegisterRequest, LoginRequest, UpdatePerfilRequest).
- `routes/api.php`.

## Criterio de "hecho"
- Registro→login→/me→logout funciona de extremo a extremo.
- Validaciones devuelven `422` con mensajes claros; credenciales malas → `401`.
- Eliminar cuenta borra usuario (y en cascada su encuesta/respuestas).

## Tests
- `tests/Feature/Auth/RegisterTest.php`, `LoginTest.php`, `LogoutTest.php`.
- `tests/Feature/Auth/PerfilTest.php` — editar y eliminar cuenta.
- **Nota (paso 1, ya hecho)**: los tests reales quedaron en `tests/Feature/Api/RegisterTest.php`
  y `tests/Feature/Api/LoginTest.php` (no `tests/Feature/Auth/...` como decía este plan), más
  `tests/Feature/Request/RegisterRequestTest.php` para las reglas de validación aisladas. Falta
  un test de Feature para `/api/logout`.

## Notas
- Validar también en frontend (fase 07), pero la **fuente de verdad es el backend**.
- Actualizar `context/context_backend.md` (endpoints de auth).
