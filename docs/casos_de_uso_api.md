# Casos de uso de la API

Cada caso está probado dos veces: con **PHPUnit** (`php artisan test`, base de datos de test) y con la
colección de **Postman** (`docs/postman/`, contra el servidor real). Los nombres de abajo son los mismos
requests de la colección; cada archivo de test tiene al principio un comentario "Casos de uso cubiertos".

## Cómo correrlos

```
# PHPUnit (desde backend/)
php artisan test

# Postman CLI (desde docs/postman/, con php artisan serve levantado)
postman collection run encuesta_atencion.postman_collection.json -e encuesta_local.postman_environment.json --env-var "appKey=<APP_KEY del .env>"
```

- `appKey` hace falta para firmar los links de la carpeta 05 (mismo HMAC-SHA256 que usa Laravel). No se guarda en el repo.
- La colección se corre completa y en orden: cada carpeta crea sus usuarios y `99 Limpieza` los borra.

## 00 Setup

Tests: `tests/Feature/Api/health/Test.php`

| Caso | Request |
|---|---|
| Health | `GET /health` |
| Login admin | `POST /login` |

## 01 Register

Tests: `tests/Feature/Api/register/Test.php`, `tests/Feature/Request/RegisterRequestTest.php`

| Caso | Request |
|---|---|
| Registro exitoso → 201 con token y usuario | `POST /register` |
| El token del registro es un token Sanctum real (GET /me) | `GET /me` |
| El rol no se puede forzar desde el body | `POST /register` |
| Edad y sexo son opcionales | `POST /register` |
| Correo duplicado → 422 | `POST /register` |
| Campos obligatorios faltantes → 422 | `POST /register` |
| Validación: nombre corto → 422 | `POST /register` |
| Validación: nombre largo → 422 | `POST /register` |
| Validación: correo con formato inválido → 422 | `POST /register` |
| Validación: clave corta → 422 | `POST /register` |
| Validación: clave larga → 422 | `POST /register` |
| Validación: clave sin mayúscula → 422 | `POST /register` |
| Validación: clave sin símbolo → 422 | `POST /register` |
| Validación: edad no entera → 422 | `POST /register` |
| Validación: edad menor a 1 → 422 | `POST /register` |
| Validación: edad mayor a 200 → 422 | `POST /register` |
| Validación: sexo fuera de M/F/N/R → 422 | `POST /register` |

## 02 Login

Tests: `tests/Feature/Api/login/Test.php`

| Caso | Request |
|---|---|
| Setup: registrar usuario login | `POST /register` |
| Login exitoso → 200 con token y usuario | `POST /login` |
| El token del login es un token Sanctum real (GET /me) | `GET /me` |
| Clave incorrecta → 401 | `POST /login` |
| Correo inexistente → 401 | `POST /login` |
| Campos obligatorios faltantes → 422 | `POST /login` |

## 03 Logout

Tests: `tests/Feature/Api/logout/Test.php`

| Caso | Request |
|---|---|
| Setup: registrar usuario logout | `POST /register` |
| Logout → 200 | `POST /logout` |
| El token revocado ya no sirve → 401 | `GET /me` |
| Logout sin token → 401 | `POST /logout` |
| Logout con token inválido → 401 | `POST /logout` |

## 04 Perfil

Tests: `tests/Feature/Api/perfil/Test.php`

| Caso | Request |
|---|---|
| Setup: registrar usuario perfil | `POST /register` |
| Ver perfil → 200 con sus datos y sin clave | `GET /me` |
| Ver perfil sin token → 401 | `GET /me` |
| Actualizar nombre → 200 | `PUT /me/actualizar/nombre` |
| Actualizar nombre: nombre faltante → 422 | `PUT /me/actualizar/nombre` |
| Actualizar nombre: nombre corto → 422 | `PUT /me/actualizar/nombre` |
| Actualizar nombre: nombre largo → 422 | `PUT /me/actualizar/nombre` |
| Actualizar nombre sin token → 401 | `PUT /me/actualizar/nombre` |
| Actualizar clave con clave actual incorrecta → 401 | `PUT /me/actualizar/clave` |
| Actualizar clave: clave actual faltante → 422 | `PUT /me/actualizar/clave` |
| Actualizar clave: clave nueva faltante → 422 | `PUT /me/actualizar/clave` |
| Actualizar clave: clave nueva corta → 422 | `PUT /me/actualizar/clave` |
| Actualizar clave: clave nueva larga → 422 | `PUT /me/actualizar/clave` |
| Actualizar clave: clave nueva sin mayúscula → 422 | `PUT /me/actualizar/clave` |
| Actualizar clave: clave nueva sin símbolo → 422 | `PUT /me/actualizar/clave` |
| Actualizar clave sin token → 401 | `PUT /me/actualizar/clave` |
| Actualizar clave → 200 | `PUT /me/actualizar/clave` |
| Login con la clave nueva → 200 | `POST /login` |
| Login con la clave vieja → 401 | `POST /login` |
| Eliminar cuenta sin token → 401 | `DELETE /me/eliminar/usuario` |
| Eliminar cuenta → 200 | `DELETE /me/eliminar/usuario` |
| El token usado ya no sirve → 401 | `GET /me` |
| Los otros tokens del usuario también se revocaron → 401 | `GET /me` |
| El usuario ya no existe (admin) → 404 | `GET /admin/usuarios/{{perfilId}}/respuestas` |

## 05 Correo (links firmados)

Tests: `tests/Feature/Api/correo/Test.php`

| Caso | Request |
|---|---|
| Setup: registrar usuario correo | `POST /register` |
| Verificar correo: firma alterada → 403 | `GET (link firmado)` |
| Verificar correo: link vencido → 403 | `GET (link firmado)` |
| Verificar correo: sin firma → 403 | `GET (link firmado)` |
| Verificar correo con hash de otro correo → 403 | `GET (link firmado)` |
| Verificar correo de usuario inexistente → 404 | `GET (link firmado)` |
| Todavía no está verificado | `GET /me` |
| Verificar correo → 200 | `GET (link firmado)` |
| Queda verificado | `GET /me` |
| Solicitar cambio de correo sin token → 401 | `GET /me/actualizar/correo/verificacion` |
| Solicitar cambio de correo → 200 | `GET /me/actualizar/correo/verificacion` |
| Firma de cambio de correo válida → 200 | `GET (link firmado)` |
| Firma de cambio de correo: firma alterada → 403 | `GET (link firmado)` |
| Firma de cambio de correo: link vencido → 403 | `GET (link firmado)` |
| Firma de cambio de correo: sin firma → 403 | `GET (link firmado)` |
| Actualizar correo: firma alterada → 403 | `PUT (link firmado)` |
| Actualizar correo: link vencido → 403 | `PUT (link firmado)` |
| Actualizar correo: sin firma → 403 | `PUT (link firmado)` |
| Actualizar correo con hash de otro correo → 403 | `PUT (link firmado)` |
| Actualizar correo: correo faltante → 422 | `PUT (link firmado)` |
| Actualizar correo: correo con formato inválido → 422 | `PUT (link firmado)` |
| Actualizar correo: correo de otra cuenta → 422 | `PUT (link firmado)` |
| Actualizar correo de usuario inexistente → 404 | `PUT (link firmado)` |
| Actualizar correo → 200 | `PUT (link firmado)` |
| El mismo link usado dos veces → 403 | `PUT (link firmado)` |
| El correo quedó con el primer cambio | `GET /me` |

## 06 Encuesta

Tests: `tests/Feature/Api/encuesta/Test.php`

| Caso | Request |
|---|---|
| Setup: registrar usuario encuesta | `POST /register` |
| Obtener preguntas sin token → 401 | `GET /encuesta/obtener/preguntas` |
| Enviar encuesta sin token → 401 | `POST /encuesta/enviar` |
| Estado sin token → 401 | `GET /encuesta/estado` |
| Obtener preguntas → 200 | `GET /encuesta/obtener/preguntas` |
| Enviar encuesta incompleta → 422 | `POST /encuesta/enviar` |
| Enviar encuesta con una pregunta inexistente de más → 422 | `POST /encuesta/enviar` |
| Enviar encuesta con respuesta fuera de rango (0) → 422 | `POST /encuesta/enviar` |
| Enviar encuesta con respuesta fuera de rango (6) → 422 | `POST /encuesta/enviar` |
| Enviar encuesta con una pregunta duplicada → 422 | `POST /encuesta/enviar` |
| Estado antes de enviar → completada false | `GET /encuesta/estado` |
| Enviar encuesta → 200 | `POST /encuesta/enviar` |
| Estado después de enviar → completada true | `GET /encuesta/estado` |
| Enviar encuesta otra vez → 409 | `POST /encuesta/enviar` |

## 07 Admin

Tests: `tests/Feature/Api/admin/AdminController/Test.php`

| Caso | Request |
|---|---|
| Setup: registrar usuario editar | `POST /register` |
| Setup: registrar usuario sinEncuesta | `POST /register` |
| Listar usuarios (admin) → 200 | `GET /admin/usuarios` |
| Listar usuarios (usuario normal) → 403 | `GET /admin/usuarios` |
| Listar usuarios con token falso → 401 | `GET /admin/usuarios` |
| Respuestas de un usuario sin encuesta → 404 | `GET /admin/usuarios/{{sinEncuestaId}}/respuestas` |
| Respuestas de un usuario → 200 (una por pregunta) | `GET /admin/usuarios/{{encuestaId}}/respuestas` |
| Respuestas de un id inexistente → 404 | `GET /admin/usuarios/999999/respuestas` |
| Respuestas sin token → 401 | `GET /admin/usuarios/{{encuestaId}}/respuestas` |
| Respuestas (usuario normal) → 403 | `GET /admin/usuarios/{{encuestaId}}/respuestas` |
| Editar usuario: id faltante → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: id no numérico → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: id que no existe → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: nombre corto → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: nombre largo → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: correo inválido → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: correo largo → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: correo de otro usuario → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: clave corta → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: clave sin mayúscula → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: clave sin símbolo → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: clave larga → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: edad no entera → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: edad menor a 1 → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: edad mayor a 200 → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: sexo inválido → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: rol inválido → 422 | `PUT /admin/usuario/editar` |
| Editar usuario sin ningún campo → 422 | `PUT /admin/usuario/editar` |
| Editar usuario: nombre mínimo → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: nombre máximo → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: correo nuevo → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: correo propio (sin cambio) → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: clave mínima → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: clave máxima → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: edad mínima → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: edad máxima → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: sexo M → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: sexo F → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: sexo N/R → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: rol admin → 200 | `PUT /admin/usuario/editar` |
| Editar usuario: rol usuario → 200 | `PUT /admin/usuario/editar` |
| Setup: registrar usuario borrar | `POST /register` |
| Eliminar usuario → 200 | `DELETE /admin/usuario/eliminar` |
| Los tokens del usuario eliminado se revocaron → 401 | `GET /me` |
| El usuario eliminado ya no existe → 404 | `GET /admin/usuarios/{{borrarId}}/respuestas` |
| Eliminar usuario inexistente → 404 | `DELETE /admin/usuario/eliminar` |

## 08 Métricas

Tests: `tests/Feature/Api/admin/MetricasController/Test.php`

| Caso | Request |
|---|---|
| Métricas sin token → 401 | `GET /admin/metricas` |
| Métricas (usuario normal) → 403 | `GET /admin/metricas` |
| Métricas (admin) → 200 y cálculos consistentes | `GET /admin/metricas` |

## Casos que solo prueba PHPUnit

- El registro **manda el mail** de verificación y el pedido de cambio de correo manda el suyo (`Notification::fake()`): Postman no puede ver mails.
- Eliminar la cuenta borra **en cascada** encuesta y respuestas (se mira la base directo).
- Admin: respuestas de un usuario con encuesta **sin todas las respuestas** → 404 (por la API no se puede crear una encuesta incompleta).
- Métricas con **valores exactos** (2 usuarios y 2 preguntas controlados). Postman, con datos compartidos, verifica las reglas de cálculo: distribución que suma el total, promedio ponderado, ajustado = 6 − promedio en negativas, grupos fijos y totales.
