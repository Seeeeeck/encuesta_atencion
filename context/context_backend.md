# Contexto Backend — Encuesta sobre la atención

> Estado vivo del backend. Actualizar en cada cambio (regla de `CLAUDE.md`).

## Estado actual
- **Fase 00 (setup) completada.** `backend/` existe y corre.
- Proyecto Laravel **13.18** generado con `laravel new --database=pgsql --phpunit`
  (PHP **8.4.11**, PHPUnit **12.5**). Sin starter kit (React/Vue/Livewire) ni scaffolding
  de auth — la API y la auth se construyen a mano (fases 01–05).
- Roadmap de construcción en `plan/` (fases 00–11). Fase 00: ver `plan/00-setup-entorno.md`
  (los 7 pasos están marcados `(listo)`).
- **Base de datos**: PostgreSQL 17.6 corriendo localmente. Base `encuesta_simple` creada,
  propiedad del rol dedicado `encuesta_user` (no se usa el superusuario del sistema, por
  buena práctica de menor privilegio). Conexión por TCP `127.0.0.1:5432`. Credenciales reales
  solo en `backend/.env` (no versionado); `.env.example` documenta las claves sin password.
- **Migraciones**: se corrió `php artisan migrate` — existen las tablas base de Laravel
  (`users`, `cache`, `jobs`) más `personal_access_tokens` (Sanctum, batch 2). Las tablas de
  dominio (`usuario` con columna `rol`, `encuesta`, `pregunta`, `respuesta`) **aún no existen**,
  se crean en la Fase 02 (`plan/02-modelo-datos.md`), todavía pendiente.
- **Fase 01 (backend base) en progreso** — pasos 1 y 2 de `plan/01-backend-base.md` `(listo)`:
  - Paso 1: conexión PostgreSQL verificada (ya venía configurada desde Fase 00).
  - Paso 2: **Sanctum instalado** (`laravel/sanctum` v4.3.2 vía Composer). Publicado
    `config/sanctum.php` y la migración `create_personal_access_tokens_table` (publicando por
    el provider completo, no solo el tag `sanctum-config`, ya que la migración usa un tag
    separado). Trait `HasApiTokens` agregado a `app/Models/User.php` (verificado:
    `createToken()` disponible en runtime). Pasos 3–7 (estructura API, CORS, logging a `logs/`,
    endpoint de salud, exception handler) **pendientes**.
- **Logs**: se usa `storage/logs/laravel.log` (canal `single` por defecto de Laravel). No se
  creó una carpeta `/logs` aparte — el paso 5 de la Fase 00 se marcó listo así.
- **`.gitignore`**: el que trae Laravel 11+ ya cubre `.env`, `/vendor`, `/node_modules` y todo
  `storage/*` (vía `*.log` + `.gitignore` anidados en `storage/framework/*`). No requirió ajustes.
- **Comandos de desarrollo** documentados en la raíz `CLAUDE.md` (sección Comandos):
  `composer install`, `php artisan migrate`, `php artisan serve`, `php artisan test`.

## Stack
- Laravel (última) + PHP (última). Auth: **Sanctum v4.3.2** (token para SPA) — instalado y
  conectado al modelo `User`; falta usarlo en endpoints reales (fase 03).
- BD: **PostgreSQL**. Tests: **PHPUnit** en `tests/` (`tests/Feature/...`).
- Logs de errores en `storage/logs/` (estándar de Laravel).

## Modelo de datos (ver `docs/modelo_relacional.png`)
- **usuario**: id_usuario, nombre, correo (unique), clave (cifrada/hash), edad (null), sexo (null),
  **rol** (`usuario` | `admin`, default `usuario`).
- **encuesta**: id_encuesta, id_usuario (FK), is_ok (bool, default false). 1 por usuario.
- **pregunta**: id_pregunta, pregunta_texto, **tipo** (CHAR(1), `'P'`=positiva | `'N'`=negativa,
  not null, CHECK IN ('P','N')). Set fijo (seeder).
- **respuesta**: id_respuesta, id_encuesta (FK), id_pregunta (FK), respuesta (SMALLINT, 1-5,
  CHECK). Único (encuesta, pregunta).

Relaciones: Usuario 1—N Encuesta; Encuesta 1—N Respuesta; Pregunta 1—N Respuesta.

## Endpoints previstos (ver `plan/03`, `plan/04`, `plan/05`)
- Auth: `POST /register`, `POST /login`, `POST /logout`, `GET/PUT/DELETE /me`.
- Encuesta: `GET /preguntas`, `POST /encuesta/iniciar`, `GET /encuesta`,
  `PUT /encuesta/respuestas/{idPregunta}`, `POST /encuesta/enviar`, `GET /encuesta/estado`,
  `GET /encuesta/compartir`.
- Admin (`/api/admin`, middleware rol admin): `GET /metricas`, `GET /usuarios`,
  `GET /usuarios/{id}/respuestas`, `PUT /usuarios/{id}`, `DELETE /usuarios/{id}`.

## Decisiones
- Rol admin mediante columna `rol` en `usuario` (no tabla de roles aparte).
- Google OAuth → **fase posterior** (fase 10); MVP con correo+clave.

## Convenciones
- camelCase, SOLID, controllers delgados. Validar **toda** solicitud en el backend.
- Clave siempre cifrada (hash), nunca en texto plano; `clave` en `$hidden`.
- No subir `.env` (solo `.env.example`). No instalar dependencias sin avisar.
