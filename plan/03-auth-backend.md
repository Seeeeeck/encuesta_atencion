# Fase 03 — Autenticación (API)

## Objetivo
Endpoints de cuenta de usuario: registro, login, logout, edición de perfil y eliminación de cuenta,
con validación server-side y emisión de token Sanctum.

## Endpoints (todos bajo `/api`)
- `POST /register` — crea usuario (nombre, correo, clave, edad?, sexo?). `rol = 'usuario'`.
  Manda el mail de verificación de correo.
- `POST /login` — valida credenciales, devuelve token Sanctum + datos básicos.
- `POST /logout` — revoca el token actual (requiere auth).
- `GET  /me` — datos del usuario autenticado (requiere auth).
- `PUT  /me/actualizar/nombre` — editar el nombre (requiere auth). **Decisión (paso 2)**: reemplaza
  al `PUT /me` único que se planeaba originalmente; se separó en un endpoint por campo.
- `PUT  /me/actualizar/clave` — editar la clave, pide `clave_actual` y `clave_nueva` (requiere auth).
- `GET  /me/actualizar/correo/verificacion` — manda al correo actual el link firmado para cambiarlo
  (requiere auth).
- `GET  /me/actualizar/correo/verificacion/firma` — comprueba que el link firmado siga vigente
  (middleware `signed`).
- `PUT  /me/actualizar/correo` — cambia el correo (middleware `signed`, no `auth:sanctum`; el link
  es de un solo uso).
- `DELETE /me/eliminar/usuario` — eliminar la propia cuenta (requiere auth).
- `GET  /email/verificar/{id}/{hash}` — verificación de correo tras el registro (middleware `signed`).

## Pasos
1. `AuthController` (Api) con acciones register/login/logout. (listo)
2. `PerfilController` (Api) con `show`/`destroy` y `updateName`/`updatePassword`/`updateEmail`
   (en vez de un único `update`), más `updateEmailVerify`/`verificacionFirmaEmail` para el flujo
   de cambio de correo con link firmado. (listo)
3. **Form Requests** de validación: correo válido y único, clave con mínimo de seguridad,
   edad numérica/rango, sexo dentro de valores permitidos (incluye "prefiero no responder").
   `RegisterRequest`, `LoginRequest`, `UpdateNombreRequest`, `UpdateClaveRequest` y
   `UpdateCorreoRequest` (reemplazan al `UpdatePerfilRequest` único que se había planeado). (listo)
4. Hash de la clave al crear/actualizar. Revocar tokens al eliminar cuenta. (listo)
5. Registrar rutas en `routes/api.php` con middleware `auth:sanctum` o `signed` donde corresponda. (listo)

## Archivos a tocar
- `app/Http/Controllers/Api/AuthController.php`, `.../PerfilController.php`.
- `app/Http/Requests/*` (RegisterRequest, LoginRequest, UpdateNombreRequest,
  UpdateClaveRequest, UpdateCorreoRequest).
- `app/Notifications/VerificarCorreo.php`, `VerificarCambioCorreo.php`.
- `routes/api.php`.

## Criterio de "hecho"
- Registro→login→/me→logout funciona de extremo a extremo.
- Validaciones devuelven `422` con mensajes claros; credenciales malas → `401`.
- Eliminar cuenta borra usuario (y en cascada su encuesta/respuestas).

## Tests
- `tests/Feature/Api/register/Test.php`, `login/Test.php`, `logout/Test.php`.
- `tests/Feature/Api/perfil/Test.php` — ver, editar nombre/clave y eliminar cuenta.
- `tests/Feature/Api/correo/Test.php` — verificación de correo y cambio de correo con links firmados.
- `tests/Feature/Request/RegisterRequestTest.php` — reglas de `RegisterRequest` aisladas.

## Notas
- Validar también en frontend (fase 07), pero la **fuente de verdad es el backend**.
- Actualizar `context/context_backend.md` (endpoints de auth).
