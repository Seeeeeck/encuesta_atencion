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
- **Migraciones**: se corrió `php artisan migrate` — existen `cache`, `jobs` (de Laravel) más
  `personal_access_tokens` (Sanctum, batch 2). **`users`, `password_reset_tokens` y `sessions`
  se eliminaron** (ver más abajo, decisión `User`→`Usuario`). Las tablas de dominio (`usuario`
  con columna `rol`, `encuesta`, `pregunta`, `respuesta`) ya existen
  (Fase 02, `plan/02-modelo-datos.md`, **completa** — ver detalle abajo).
- **Fase 02 (modelo de datos) completa**:
  - Paso 1 (migraciones): generados los 4 archivos vacíos con `php artisan make:migration
    create_{usuario,encuesta,pregunta,respuesta}_table`, en ese orden (dependencias FK:
    `encuesta`→`usuario`; `respuesta`→`encuesta` y `pregunta`). **Bug encontrado y corregido**:
    los 4 comandos corrieron en el mismo segundo, generando el **mismo timestamp** en los 4
    nombres de archivo — Laravel ordena migraciones por nombre de archivo completo, así que con
    timestamp idéntico caía a orden alfabético (`encuesta` < `pregunta` < `respuesta` < `usuario`),
    lo que hubiera intentado crear `encuesta` (FK a `usuario`) **antes** de que `usuario`
    existiera. Se renombraron los archivos con timestamps incrementales
    (`..._201209_usuario`, `..._201210_encuesta`, `..._201211_pregunta`, `..._201212_respuesta`)
    para forzar el orden correcto; verificado con `php artisan migrate:status` (las 4 aparecen
    `Pending` en la secuencia correcta). Migración `usuario` ya completa y **corrida** contra
    Postgres (`id`, `nombre` varchar(100), `correo` varchar(150) unique, `clave` varchar(255),
    `edad` nullable — Postgres lo mapea a `smallint` porque no tiene `TINYINT` nativo —, `sexo`
    varchar(20) nullable, `rol` varchar(20) default `'usuario'`, timestamps). Verificado con
    `information_schema.columns` y `pg_indexes` (constraint `usuario_correo_unique` confirmado).
    Migración `encuesta` también completa y corrida (`id`, `id_usuario` FK → `usuario` con
    **`ON DELETE CASCADE`** — requerido por `plan/05-admin-backend.md`, que dice que eliminar un
    usuario debe borrar en cascada su encuesta/respuestas —, `is_ok` boolean default `false`,
    timestamps). Verificado con `information_schema` (columnas y la regla `delete_rule` del FK).
    Migración `pregunta` también completa y corrida: `id`, `pregunta_texto` varchar(255),
    `tipo` **`char(1)`** con `CHECK (tipo IN ('P', 'N'))` agregado vía `DB::statement` (el
    `Blueprint` de esta versión de Laravel no tiene helper fluido `->check()`), timestamps.
    Probado insertando `tipo = 'X'` (rechazado con `SQLSTATE[23514]`) y `tipo = 'P'` (aceptado);
    fila de prueba eliminada después.
  - **Migración `respuesta` completa y corrida** (última de las 4): `id`, `id_encuesta` FK →
    `encuesta` con **`ON DELETE CASCADE`** (necesario para que la cascada `usuario`→`encuesta`
    no falle por respuestas huérfanas), `id_pregunta` FK → `pregunta` con `ON DELETE NO ACTION`
    (sin requisito de cascada documentado; preguntas son un set fijo por seeder), `respuesta`
    `smallint` con `CHECK (respuesta BETWEEN 1 AND 5)` vía `DB::statement`, índice único
    compuesto `(id_encuesta, id_pregunta)`. Probado end-to-end con datos reales: `respuesta = 6`
    y `= 0` rechazados, `= 3` aceptado, duplicado `(id_encuesta, id_pregunta)` rechazado por el
    índice único. Datos de prueba limpiados de las 4 tablas al terminar.
  - **Las 4 migraciones del paso 1 de la Fase 02 están completas, corridas y verificadas contra
    Postgres real** (no solo el esqueleto).
  - Paso 2 (modelos Eloquent) — **en progreso**, empezó por `Usuario` (`app/Models/Usuario.php`):
    extiende `Authenticatable` (no un modelo genérico), usa `HasApiTokens` (Sanctum) y
    `HasFactory`, `$table = 'usuario'` explícito (Eloquent adivinaría `usuarios` por defecto,
    que no existe), `$fillable` con las columnas de negocio, `clave` en `$hidden` y con
    cast `'hashed'` (nunca texto plano), y **`$authPasswordName = 'clave'`** — necesario porque
    `Authenticatable` espera por defecto una columna `password`, y la nuestra se llama `clave`
    (sin esto, el login de la Fase 03 fallaría en silencio). Incluye relación
    `encuestas(): hasMany(Encuesta::class, 'id_usuario')`.
    **Decisión importante que motivó una limpieza**: se detectó que el proyecto tenía **dos
    tablas de "usuario" en paralelo** — la `users` que trae Laravel de fábrica (con
    `HasApiTokens` ya agregado en Fase 01, antes de que existiera `usuario`) y la `usuario` de
    dominio real que usa `plan/03-auth-backend.md`. Se confirmó con el usuario: `Usuario`
    (tabla `usuario`) es el único modelo autenticable. Se eliminó `users`,
    `password_reset_tokens` y `sessions` (revertidas manualmente vía `Schema::dropIfExists` +
    limpieza de su fila en la tabla `migrations`, porque compartían *batch* con `cache`/`jobs`
    que sí se conservan; no se pudo usar `migrate:rollback --path` por eso), se borró el archivo
    de esa migración, `app/Models/User.php` y `database/factories/UserFactory.php`, y se
    corrigieron las referencias en `config/auth.php` (`providers.users.model` →
    `Usuario::class`) y `database/seeders/DatabaseSeeder.php` (ya no llama a `User::factory()`).
    Verificado en runtime: `Usuario::create()` usa la tabla `usuario`, hashea `clave`
    automáticamente, la oculta en `toArray()`, tiene `createToken()` (Sanctum) disponible, y
    `getAuthPassword()` lee de `clave` correctamente. Nota aparte (no bug): justo después de
    `create()`, el objeto en memoria no refleja el `DEFAULT` de Postgres para `rol` (Eloquent con
    Postgres solo hace `RETURNING` del `id`, no de toda la fila) — hace falta `->refresh()` o
    una relectura para verlo; el valor real en la base sí es correcto desde el primer momento.
  - `app/Models/Encuesta.php` creado: extiende `Model` (no se autentica), `$table = 'encuesta'`,
    `$fillable = ['id_usuario', 'is_ok']`, `casts()` con `'is_ok' => 'boolean'`, relación
    `usuario(): belongsTo(Usuario::class, 'id_usuario')` (inversa de `Usuario::encuestas()`) y
    `respuestas(): hasMany(Respuesta::class, 'id_encuesta')` (el segundo argumento es el FK que
    vive en la tabla `respuesta`, no en `encuesta`). Sin `$hidden` (no tiene datos sensibles).
    Faltan los modelos `Pregunta` y `Respuesta`.
  - `app/Models/Pregunta.php` creado: extiende `Model`, `$table = 'pregunta'`,
    `$fillable = ['pregunta_texto', 'tipo']` (no incluye `id`, autoincremental). Sin `casts()`
    para `tipo`: Postgres lo guarda como `char(1)` pero Eloquent lo trae como `string` normal de
    PHP (no existe tipo `char` nativo en PHP, no hace falta convertir nada). Relación
    `respuestas(): hasMany(Respuesta::class, 'id_pregunta')`.
  - `app/Models/Respuesta.php` creado: extiende `Model`, `$table = 'respuesta'`,
    `$fillable = ['id_encuesta', 'id_pregunta', 'respuesta']`, `casts()` con
    `'respuesta' => 'integer'` (nota: el cast **no** valida el rango 1-5 — eso ya lo garantiza el
    `CHECK` de la migración a nivel BD; el cast solo asegura que PHP reciba un `int` real y no un
    string, relevante para sumas/promedios en la Fase 05 de métricas). Relaciones
    `encuesta(): belongsTo(Encuesta::class, 'id_encuesta')` y
    `pregunta(): belongsTo(Pregunta::class, 'id_pregunta')`.
  - **Paso 2 (modelos Eloquent) completo**: `Usuario`, `Encuesta`, `Pregunta` y `Respuesta`
    creados con sus relaciones cruzadas verificadas.
  - Paso 3 (seeders) **en progreso**:
    - `database/seeders/PreguntaSeeder.php` creado: lee `docs/preguntas.json` con
      `base_path('../docs/preguntas.json')` + `json_decode(..., true)`. **Bug encontrado y
      corregido**: `base_path()` apunta a la raíz de la app Laravel (`backend/`), no a la raíz
      del repo — como `docs/` vive un nivel arriba (hermano de `backend/`, no dentro), hacía
      falta el `../` para subir un nivel; sin él tiraba `file_get_contents(): Failed to open
      stream: No such file or directory` al buscar `backend/docs/preguntas.json` (que no
      existe). Itera `$datos['preguntas']`
      y mapea `direccion` (`'positiva'`/`'negativa'` del JSON) a `tipo` (`'P'`/`'N'` del modelo)
      con un `match`, creando cada `Pregunta` con `pregunta_texto` y `tipo`. Importa
      `use App\Models\Pregunta;` porque el seeder vive en `namespace Database\Seeders` (distinto
      al `namespace App\Models` de `Pregunta` — mismo namespace no requiere `use`, namespace
      distinto sí). Registrado en `DatabaseSeeder::run()` con
      `$this->call(PreguntaSeeder::class)` (sin `use` porque ambos comparten
      `namespace Database\Seeders`).
    - `database/seeders/AdminSeeder.php` creado: `Usuario::create()` con `nombre` fijo
      (`'Administrador'`, no sensible), `correo` y `clave` leídos con `env('ADMIN_EMAIL')` /
      `env('ADMIN_PASSWORD')` (nunca hardcodeados), `rol = 'admin'`. La `clave` se hashea sola
      gracias al cast `'hashed'` de `Usuario` (no se llama a ninguna función de hash a mano).
      Agregadas `ADMIN_EMAIL` y `ADMIN_PASSWORD` (vacías) en `.env.example`; valores reales
      cargados en `backend/.env` (no versionado). Registrado en `DatabaseSeeder::run()` con
      `$this->call(AdminSeeder::class)` después de `PreguntaSeeder::class`.
  - **Paso 3 (seeders) completo**: `PreguntaSeeder` y `AdminSeeder` implementados y registrados
    en `DatabaseSeeder`. Verificado con `php artisan migrate:fresh --seed` contra Postgres real:
    1 usuario (admin, `correo = fz4mbelli@gmail.com`, `rol = 'admin'`), 10 preguntas, `encuesta`
    y `respuesta` en 0 (se llenan en runtime, no por seeder).
  - **Tests de la Fase 02**:
    - **Entorno de test cambiado de SQLite en memoria a Postgres real**: las migraciones de
      `pregunta` y `respuesta` usan `DB::statement('ALTER TABLE ... ADD CONSTRAINT ... CHECK
      ...')`, sintaxis específica de Postgres que SQLite no soporta (su `ALTER TABLE` no admite
      agregar constraints así). Correr `RefreshDatabase` contra SQLite en memoria rompía al
      migrar. Se creó una BD de test separada `encuesta_simple_test` (mismo rol `encuesta_user`,
      que no tiene privilegio `CREATEDB` — la creó el usuario a mano con superusuario) y se
      cambió `phpunit.xml`: `DB_CONNECTION=pgsql`, `DB_HOST=127.0.0.1`, `DB_PORT=5432`,
      `DB_DATABASE=encuesta_simple_test`, `DB_USERNAME=encuesta_user`,
      `DB_PASSWORD=encuesta_dev_2026`. También se agregaron `ADMIN_EMAIL`/`ADMIN_PASSWORD` de
      prueba en `phpunit.xml` (valores ficticios, no los reales de `.env`) para que
      `AdminSeeder` tenga qué leer en el entorno de testing.
    - `tests/Feature/Database/SeedersTest.php`: usa `RefreshDatabase` + `$this->seed()` (corre
      `DatabaseSeeder` completo) y verifica `Pregunta::count() === 10` y que existe exactamente
      1 `Usuario` con `rol = 'admin'` cuyo `correo` coincide con `env('ADMIN_EMAIL')`.
    - `tests/Feature/Models/RelacionesTest.php`: 7 tests cubriendo las 4 relaciones cruzadas
      (`Usuario::encuestas`, `Encuesta::usuario`, `Encuesta::respuestas`, `Pregunta::respuestas`,
      `Respuesta::encuesta`/`Respuesta::pregunta`) y las 2 cascadas de borrado esperadas
      (eliminar `Usuario` borra su `Encuesta`; eliminar `Encuesta` borra sus `Respuesta`), usando
      `assertModelMissing()`.
    - Suite completa verificada: `php artisan test` → 10 tests, 13 assertions, todos en verde.
  - **Fase 02 completa**: migraciones, modelos, seeders y tests, verificados contra Postgres
    real (dev y test).
- **Fase 01 (backend base) en progreso** — pasos 1, 2 y 3 de `plan/01-backend-base.md` `(listo)`:
  - Paso 1: conexión PostgreSQL verificada (ya venía configurada desde Fase 00).
  - Paso 2: **Sanctum instalado** (`laravel/sanctum` v4.3.2 vía Composer). Publicado
    `config/sanctum.php` y la migración `create_personal_access_tokens_table` (publicando por
    el provider completo, no solo el tag `sanctum-config`, ya que la migración usa un tag
    separado). Trait `HasApiTokens` agregado en su momento a `app/Models/User.php` (verificado:
    `createToken()` disponible en runtime). **Desactualizado**: `User.php` se eliminó después
    (Fase 02, ver arriba) — el trait ahora vive en `app/Models/Usuario.php`, que es el modelo
    autenticable real.
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
