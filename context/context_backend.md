# Contexto Backend — Encuesta sobre la atención

> Estado vivo del backend. Actualizar en cada cambio (regla de `CLAUDE.md`).

## Estado actual
- **Fase 00 (setup) completada.** `backend/` existe y corre.
- **Fase 01 (backend base) completada** — Sanctum, estructura API, CORS, logging (heredado de
  Fase 00) y respuestas JSON de error estandarizadas. Ver detalle abajo.
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
- **Fase 01 (backend base) en progreso** — pasos 1, 2 y 3 de `plan/01-backend-base.md` `(listo)`:
  - Paso 1: conexión PostgreSQL verificada (ya venía configurada desde Fase 00).
  - Paso 2: **Sanctum instalado** (`laravel/sanctum` v4.3.2 vía Composer). Publicado
    `config/sanctum.php` y la migración `create_personal_access_tokens_table` (publicando por
    el provider completo, no solo el tag `sanctum-config`, ya que la migración usa un tag
    separado). Trait `HasApiTokens` agregado a `app/Models/User.php` (verificado:
    `createToken()` disponible en runtime).
  - Paso 3: creada `app/Http/Controllers/Api/` (vacía, se puebla en fases siguientes). Creado
    `routes/api.php` (vacío por ahora — el endpoint de salud es el paso 6). Registrado
    `api: __DIR__.'/../routes/api.php'` en `bootstrap/app.php` dentro de `withRouting` (antes
    solo registraba `web`, `commands` y `health: '/up'`; sin este registro `/api/*` daba 404).
  - Paso 4: publicado `config/cors.php` (`php artisan config:publish cors`). `allowed_origins`
    cambiado de `['*']` a `[env('FRONTEND_URL', 'http://localhost:5173')]`; agregada
    `FRONTEND_URL=http://localhost:5173` en `.env` y `.env.example`. Verificado que
    `config('cors.allowed_origins')` resuelve al valor esperado y que el preflight `OPTIONS`
    responde con esa cabecera. Nota: con un solo origen en la lista, `fruitcake/php-cors`
    siempre devuelve ese valor fijo sin comparar el `Origin` de la petición (optimización
    "single origin" de la librería) — no es un fallo de seguridad, porque la restricción real
    la aplica el **navegador** comparando esa cabecera contra su propio origen, no el servidor;
    `curl` no aplica esa regla (por eso probar con `curl` "parece" permitir cualquier origen).
  - Paso 5: **redundante con Fase 00** — se detectó contradicción en el plan (Fase 00 paso 5 ya
    había decidido usar `storage/logs/laravel.log` en vez de una carpeta `logs/` aparte; Fase 01
    paso 5 pedía lo contrario). Se resolvió con el usuario: se mantiene el log por defecto de
    Laravel; el texto de `plan/01-backend-base.md` se ajustó para no contradecirse.
  - Paso 6: agregada ruta `GET /health` en `routes/api.php` → responde `200` JSON
    `{"status":"ok"}` en `GET /api/health` (el prefijo `/api` lo pone el registro de
    `routes/api.php` en `bootstrap/app.php`, paso 3). Verificado con `curl` contra el server
    real corriendo.
  - Paso 7: en `bootstrap/app.php` (`withExceptions`), agregado `$exceptions->render(...)` que
    para toda ruta `/api/*` devuelve JSON consistente: `{"message": "..."}` (más `errors` en
    `ValidationException`, 422), **sin** `exception`/`file`/`trace` sin importar `APP_DEBUG`
    (antes esos datos se filtraban en cada 404/405, incluyendo rutas absolutas del servidor).
    Ramas explícitas para `AuthenticationException` (401) y `AuthorizationException` (403),
    porque ninguna de las dos implementa `getStatusCode()` (caían a 500 por default). Rutas
    fuera de `/api/*` no se tocan (el callback devuelve `null`, Laravel sigue con su
    comportamiento HTML normal). Nota: Laravel 11+ no usa `app/Exceptions/Handler.php`, el
    manejo de excepciones vive en `bootstrap/app.php` — el plan original lo mencionaba
    desactualizado y se corrigió.
  - **Bug real encontrado y corregido** probando el 401: `Authenticate::unauthenticated()`
    evalúa `$request->expectsJson()` (basado en el header `Accept`, **no** afectado por
    `shouldRenderJsonWhen`) y, si es `false`, ejecuta el callback por defecto de Laravel
    `redirectGuestsTo(fn () => route('login'))` — como no existe ninguna ruta `login` (esta
    API no sirve páginas de login, el login lo hace React), explotaba con
    `RouteNotFoundException` (500) antes de que la `AuthenticationException` llegara a
    nuestro `render()`. Corregido en `withMiddleware()` con
    `$middleware->redirectGuestsTo(fn () => null)`, ya que esta app es 100% API y nunca debe
    intentar redirigir a un guest. Verificado con y sin header `Accept: application/json`.
  - **Ajuste posterior**: la rama de `AuthenticationException` (401) tenía el mensaje
    hardcodeado a `"No autenticado."`, ignorando cualquier mensaje personalizado de la
    excepción. Se corrigió para respetar `$e->getMessage()` (igual que `AuthorizationException`
    ya hacía), traduciendo únicamente el mensaje por defecto de Laravel en inglés
    (`"Unauthenticated."`) a español; cualquier mensaje custom se respeta tal cual. Verificado
    con ambos casos (default vía `auth:sanctum` sin token, y una excepción lanzada a mano con
    mensaje propio).
  - **Fase 01 completa** (los 7 pasos de `plan/01-backend-base.md` en `(listo)`).
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
