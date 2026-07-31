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
- **Fase 03 (auth backend) en progreso** — trabajando en rama `auth-backend`. Paso 1 de
  `plan/03-auth-backend.md`:
  - `app/Http/Controllers/Api/AuthController.php` creado con `register()`, `login()` y
    `logout()` como **esqueletos** (solo `TODO`, sin lógica todavía — modo tutor, el usuario
    completa el cuerpo). Firma con `Illuminate\Http\Request $request` genérico por ahora; se
    reemplaza por Form Requests dedicados (`RegisterRequest`, `LoginRequest`) en el paso 3 del
    plan, no antes.
  - Rutas registradas en `routes/api.php`: `POST /register` y `POST /login` públicas;
    `POST /logout` dentro de `Route::middleware('auth:sanctum')->group(...)`.
  - Diseño de auth acordado: **Sanctum en modo token** (Personal Access Tokens vía
    `createToken()->plainTextToken`), no el modo cookie/SPA — el frontend manda
    `Authorization: Bearer <token>` en cada request. `login()` va a usar
    `Auth::attempt(['correo' => ..., 'password' => ...])`: la key `'password'` es fija en el
    array de credenciales (hardcodeada en
    `Illuminate\Auth\EloquentUserProvider::validateCredentials`, busca literalmente esa key sin
    importar el nombre real de la columna); lo que sí lee `Usuario::$authPasswordName = 'clave'`
    es `getAuthPassword()`, usado internamente para comparar el hash contra la columna `clave`
    real. Si se usa cualquier otra key (p.ej. `'clave'`) en el array, el intento falla en
    silencio (sin excepción) porque `retrieveByCredentials` no descarta esa key del `WHERE`
    (comparando texto plano contra un hash) y `validateCredentials` no encuentra
    `$credentials['password']`.
  - Pendiente en el paso 1: rellenar los `TODO` de los 3 métodos del controller.
  - `app/Http/Requests/RegisterRequest.php` creado con `php artisan make:request RegisterRequest`
    (adelantando parte del paso 3 del plan, a pedido del usuario, mientras el paso 1 sigue sin
    cerrar). `authorize()` cambiado a `true` (cualquier visitante puede registrarse). `rules()`
    completo:
    - `nombre`: required, string, min:3, max:100.
    - `correo`: required, email, unique:usuario,correo.
    - `clave`: required, string, min:5, max:100, regex con al menos 1 mayúscula (`/[A-Z]/`) y
      al menos 1 símbolo/puntuación (`/[\W_]/`).
    - `edad`: nullable, integer, min:1, max:200.
    - `sexo`: nullable, in:M,F,N/R (valores exactos acordados: `M`, `F`, `N/R` — este último
      representa "prefiero no responder" de `docs/requisitos_funcionales.md`).
    - **`rol` NO está en este Request a propósito**: el registro público nunca debe aceptar ni
      validar `rol` del cliente (se sigue fijando `'usuario'` a mano en el controller). El
      usuario decidió que la creación de administradores será un Request/flujo aparte más
      adelante (`RegisterAdminRequest`, sin fase asignada todavía — anotar cuando se defina en
      qué fase entra).
    - `AuthController::register()` ya tipa `RegisterRequest $request` (antes `Request`
      genérico) — la validación corre sola antes de entrar al método. TODO actualizado para usar
      `$request->validated()` (excluye automáticamente cualquier campo fuera de `rules()`, como
      `rol`, capa extra sobre fijarlo a mano). El cuerpo del método (los 3 TODO) quedó envuelto en
      un `try/catch (\Throwable $e)`: el `catch` ya está implementado — llama a `Log::error()` con
      contexto (`controlador` = `self::class`, `metodo` = `__FUNCTION__`, `fecha_hora` =
      `now()->toDateTimeString()`, `mensaje` = `$e->getMessage()`) y devuelve `response()->json`
      genérico 500. Nota: el timestamp de `Log::error()` ya es automático en cada línea de
      `storage/logs/laravel.log` (formato `[fecha] canal.NIVEL: ...`); `fecha_hora` en el
      contexto es redundante para lectura humana pero útil si estos logs se estructuran/exportan
      más adelante.
    - **`AuthController::register()` completo**: dentro del `try`, crea el usuario
      (`$datos = $request->validated(); $datos['rol'] = 'usuario'; $usuario =
      Usuario::create($datos);`), genera el token (`$usuario->createToken('auth-token')
      ->plainTextToken`) y responde `response()->json(['token' => $token, 'usuario' =>
      $usuario], 201)`. `clave` no aparece en el JSON porque está en `$hidden` del modelo
      (serialización automática).
    - `tests/Feature/Api/RegisterTest.php` creado (5 tests, todos en verde): test end-to-end
      contra el endpoint real (`postJson('/api/register', ...)`), a diferencia de
      `RegisterRequestTest` que solo probaba las `rules()` aisladas. Cubre: 201 con estructura
      `token` + `usuario` (y `usuario.clave` ausente), que se genera un token Sanctum real
      (`$usuario->tokens` cuenta 1), que `rol` no se puede forzar a `admin` desde el body
      (siempre queda `usuario`), correo duplicado → 422, campos obligatorios faltantes → 422.
      Usa `RefreshDatabase`.
    - Suite completa verificada tras estos cambios: `php artisan test` → **30 tests, 48
      assertions, todos en verde**.
    - Faltan `login()` y `logout()` del `AuthController` (siguen en TODO, sin tocar).
    - `app/Http/Requests/LoginRequest.php` creado con `php artisan make:request LoginRequest`.
      `authorize()` en `true` (cualquier visitante no autenticado puede intentar loguearse).
      `rules()` completo: `correo` => required, email, max:150; `clave` => required, string,
      max:255 (los máximos coinciden con el tamaño real de columnas `correo varchar(150)` /
      `clave varchar(255)`; decisión explícita del usuario: **sin** `min`/`regex` de complejidad
      acá — esas restricciones ya se validaron en el registro, login solo necesita que los
      campos vengan y respeten el límite de columna). `messages()` completo con textos en
      español (5 combinaciones: `correo.required/email/max`, `clave.required/max`).
    - `AuthController::login()` ya tipa `LoginRequest $request` (antes `Request` genérico) y
      quedó envuelto en el mismo patrón `try/catch (\Throwable $e)` que `register()`: el `catch`
      loguea con `Log::error('Error al iniciar sesión', [...])` (mismo contexto: `controlador`,
      `metodo`, `fecha_hora`, `mensaje`) y devuelve `response()->json` genérico 500. El cuerpo
      del `try` sigue en los 4 TODO originales (`Auth::attempt`, manejo de fallo 401, generar
      token, response 200) — sin escribir todavía.
    - Dentro del `try` de `login()`, paso 1 de 4 completo: `$autenticado = Auth::attempt(['correo'
      => $request->correo, 'password' => $request->clave]);`. Recordatorio ya documentado más
      arriba: la key `'password'` es fija (la busca `EloquentUserProvider`), no `'clave'` —
      `Usuario::$authPasswordName` es lo que traduce la comparación a la columna real. Paso 2
      completo: `if (! $autenticado) { return response()->json(['message' => 'Credenciales
      inválidas.'], 401); }` (early return). Paso 3 completo: `$usuario = Auth::user(); $token =
      $usuario->createToken('auth-token')->plainTextToken;`.
    - **`AuthController::login()` completo**: paso 4 = `response()->json(['token' => $token,
      'usuario' => $usuario], 200)`.
    - `tests/Feature/Api/LoginTest.php` creado (5 tests, todos en verde), mismo patrón que
      `RegisterTest`: end-to-end contra `postJson('/api/login', ...)` con `RefreshDatabase`.
      Cubre: 200 con estructura `token` + `usuario` (y `usuario.clave` ausente), que se genera un
      token Sanctum real, clave incorrecta → 401, correo inexistente → 401, campos obligatorios
      faltantes → 422.
    - Suite completa verificada tras estos cambios: `php artisan test` → **35 tests, 63
      assertions, todos en verde**.
    - **`logout()` del `AuthController` completo**: mismo patrón `try/catch` + `Log::error()`
      (mensaje `'Error al cerrar sesión'`). Dentro del `try`:
      `$request->user()->currentAccessToken()->delete();` (escrito por el usuario, revoca solo
      el token de esta request) seguido de
      `return response()->json(['message' => 'Sesión cerrada correctamente.'], 200);`.
    - **Paso 1 de `plan/03-auth-backend.md` completo**: `AuthController` con `register()`,
      `login()` y `logout()` totalmente implementados, cada uno con su Form Request (donde
      aplica) y su `try/catch` + logging. Suite completa verificada: `php artisan test` → 35
      tests, 63 assertions, todos en verde. Sin tests de Feature para `/api/logout` todavía
      (pendiente, similar a `RegisterTest`/`LoginTest`, si se decide agregarlo).
    - Pendiente para cerrar la Fase 03: pasos 2 (`PerfilController` para `/me`), y evaluar si
      falta algo del paso 3 (Form Requests) — `RegisterRequest`/`LoginRequest` ya están,
      faltaría `UpdatePerfilRequest` cuando se haga el paso 2.
    - Se evaluó crear `LogoutRequest` (Form Request vacío, sin campos que validar ya que
      `/logout` no recibe body). Se descartó: `AuthController::logout()` sigue tipando
      `Request $request` genérico, sin Form Request dedicado.
- **Fase 03, paso 2 (`PerfilController`) — en progreso**:
  - `app/Http/Controllers/Api/PerfilController.php` creado con `show()`, `destroy()` y,
    **decisión del usuario**, la edición del perfil se dividió en **3 métodos separados** en vez
    de un único `update()`: `updateName()`, `updatePassword()`, `updateEmail()` — uno por campo,
    cada uno con su propio Form Request (sin `sometimes`, todos `required`, porque cada endpoint
    siempre espera exactamente ese campo). Las 5 acciones operan siempre sobre `$request->user()`
    (el usuario autenticado vía `auth:sanctum`), nunca sobre un id de la URL — así nadie puede
    editar/borrar la cuenta de otro usuario. Se descartó el enfoque inicial de un único
    `UpdatePerfilRequest` con campos `sometimes` (ese archivo se creó y se borró en el mismo
    intercambio, nunca se commiteó).
  - Rutas registradas en `routes/api.php`, dentro del mismo grupo `auth:sanctum` que `/logout`:
    `GET /me` → `show`, `DELETE /me` → `destroy`, `PUT /me/actualizar/nombre` → `updateName`,
    `PUT /me/actualizar/clave` → `updatePassword`, `PUT /me/actualizar/correo` → `updateEmail`,
    `GET /me/actualizar/correo/verificacion` → `updateEmailVerify` (nuevo, ver abajo). Las rutas
    se renombraron de `/me/nombre|clave|correo` a `/me/actualizar/nombre|clave|correo` (más
    explícito). Esto reemplaza el único `PUT /me` que proponía originalmente
    `plan/03-auth-backend.md` — pendiente actualizar ese archivo de plan cuando se cierre el
    paso 2 completo. También se agregó `POST /destroy/user` → `destroy` (alias de `DELETE /me`
    para pruebas, mismo grupo `auth:sanctum`).
  - **`show()` completo**: `return response()->json($request->user(), 200);` (`clave` no
    aparece por `$hidden`).
  - **`destroy()` completo**: `$usuario = $request->user(); $usuario->tokens()->delete();
    $usuario->delete();` y responde `response()->json(['message' => 'Cuenta eliminada
    correctamente.'], 200)`. **Hallazgo importante**: la tabla `personal_access_tokens` de
    Sanctum usa `morphs('tokenable')` **sin foreign key real** a nivel BD (a diferencia de
    `encuesta`/`respuesta` que sí tienen `ON DELETE CASCADE`) — si no se borran los tokens a
    mano antes de `$usuario->delete()`, quedan huérfanos en la tabla. Esto es lo que pedía
    explícito el paso 4 del plan ("Revocar tokens al eliminar cuenta").
  - **`updateName()`, `updateEmail()` completos**, mismo patrón en los 2: `$usuario =
    $request->user(); $usuario->update($request->validated()); return
    response()->json(["message" => "Se cambió el nombre/correo", $usuario], 200)`, cada uno con
    su `try/catch` + `Log::error()` propio.
  - **`updatePassword()` completo**: valida clave actual con `Hash::check()`, busca usuario,
    asigna `$usuario->clave = Hash::make($request->clave_nueva)`, llama `$usuario->save()`. Sin
    código muerto.
  - 3 Form Requests, todos con `authorize()` en `true` y `messages()` en español:
    - `UpdateNombreRequest`: `nombre` required/string/min:3/max:100 (mismos límites que
      `RegisterRequest`).
    - `UpdateClaveRequest` — **actualizado**: ya no pide un solo campo `clave`, ahora pide
      `clave_actual` (required, sin más reglas — se valida contra el hash en el controller) y
      `clave_nueva` (required/string/min:5/max:100 + mismas 2 regex de mayúscula/símbolo que
      `RegisterRequest`). Mensajes en español actualizados para los 2 campos nuevos.
    - `UpdateCorreoRequest`: **reglas y mensajes vaciados** (decisión del usuario). La validación
      del `correo` se confía al signed middleware + lógica inline en el controller.
  - **`updateEmailVerify(Request $request)` completo**: manda la notificación `VerificarCambioCorreo`
    y responde 200 con el correo actual del usuario. Catch con `return` 500.
  - `app/Notifications/VerificarCambioCorreo.php` **completado**: `toMail()` genera **dos** URLs
    firmadas: `update.email` (para `PUT /me/actualizar/correo`, con `id` + `hash`) y
    `verification.verify.sign` (para `GET /me/actualizar/correo/verificacion/firma`, mismo `id` +
    `hash`). Extrae query string de `update.email` con `parse_url()` + `parse_str()`, y arma
    link del frontend (`/actualizar-correo?verificacion=<URL verificación>&<params update.email>`).
  - **Rutas nuevas en `routes/api.php`** dentro del grupo `signed`:
    - `GET /me/actualizar/correo/verificacion/firma` → `PerfilController::verificacionFirmaEmail`
      (name: `verification.verify.sign`). Devuelve 200 si la firma es válida.
    - `PUT /me/actualizar/correo` → `PerfilController::updateEmail` (name: `update.email`).
      **Movida** del grupo `auth:sanctum` al grupo `signed`. `updateEmail()` ahora busca usuario
      por `$request->id` (del query string firmado) en vez de `$request->user()`.
  - `UpdateCorreoRequest.php`: reglas y mensajes **vaciados** (la validación se confía al signed
    middleware + la lógica inline).
  - `PerfilController::verificacionFirmaEmail()` **nuevo**: devuelve `200` sin más lógica — el
    middleware `signed` ya validó la firma antes de llegar.
  - Diseño del flujo de verificación de cambio de correo (completado backend):
    1. `updateEmailVerify` manda `VerificarCambioCorreo` al correo actual del usuario.
    2. La notificación genera **dos** URLs firmadas: `update.email` (para cambiar el correo) y
       `verification.verify.sign` (para verificar que el link no expiró al cargar el frontend).
    3. El link del mail apunta a `/actualizar-correo` del frontend con ambas firmas.
    4. Frontend llama primero a `GET /me/actualizar/correo/verificacion/firma` (middleware `signed`)
       al cargar; si 200 muestra el formulario, si 403 avisa expiró.
    5. El cambio real se hace vía `PUT /me/actualizar/correo` (protegido por middleware `signed`,
       ya no por `auth:sanctum`), usando `$request->id` para identificar al usuario.
  - Verificado: `php artisan test` → 35 tests, 63 assertions, todos en verde (sin tests de
    Feature nuevos para `/api/me` GET/DELETE/PUT todavía — pendiente si se decide agregarlos).
    **Nota**: estos tests fueron corridos antes de los últimos cambios (`updatePassword`
    reescrito, `updateEmailVerify` nuevo) — no hay test que hoy cubra ninguno de los 2 bugs
    señalados arriba.
  - **Métodos de depuración `//TEST` (temporales, NO son parte del diseño final)**:
    - `showUserByEmail(Request)` → busca `Usuario::where('correo', $request->email)->first()`,
      404 si no existe, si no devuelve el usuario.
    - `deleteUserByEmail(Request)` → `Usuario::where('correo', $request->email)->delete()`, 404 si
      no borró (0 filas). ⚠️ **No** revoca tokens antes de borrar (deja tokens huérfanos, mismo
      hallazgo que `destroy()`).
    - Rutas asociadas en `routes/api.php` **fuera** del grupo `auth:sanctum` (públicas, sin auth):
      `GET user/email` → `showUserByEmail`, `POST user/destroy` → `deleteUserByEmail`. ⚠️ Riesgo:
      `user/destroy` borra usuarios sin autenticación — **quitar antes de mergear a `main`**.
    - También se agregó `POST /destroy/user` → `destroy` dentro del grupo `auth:sanctum` (alias del
      `DELETE /me`, para pruebas).
    - **Pendiente**: estas rutas/métodos `//TEST` se quitan antes de cerrar la fase / mergear a `main`.
  - Falta cerrar el paso 2: considerar tests de Feature para estos 5 endpoints.
  - **Tests reestructurados**: los tests de Feature en `tests/Feature/Api/` pasaron a subcarpetas
    por endpoint: `login/Test.php` (`Tests\Feature\Api\Login\Test`) y `register/Test.php`
    (`Tests\Feature\Api\Register\Test`).
- **Feature nueva, fuera del plan original: verificación de correo — en progreso**. No estaba en
  `docs/requisitos_funcionales.md` ni en `plan/03-auth-backend.md` (que solo mencionaba
  "confirmar la cuenta con Google", algo distinto, Fase 10/OAuth). Decisiones tomadas con el
  usuario:
  - Columna `is_verified` (boolean, default `false`) en `usuario`, **no** la convención de
    Laravel (`email_verified_at` timestamp).
  - El link de verificación apunta al **frontend** (`FRONTEND_URL/verificar-correo?...`), no
    directo al backend — arquitectura API + SPA separados. El backend genera una URL firmada
    real hacia una ruta propia (`GET /api/email/verificar/{id}/{hash}`, middleware `signed`);
    esos mismos parámetros (`id`, `hash`, `expires`, `signature`) se pasan como query string al
    link del frontend. La pantalla de React (a construir en Fase 07/08, todavía no existe) va a
    tomar esos parámetros y pegarle al backend reconstruyendo la URL firmada exacta — recién ahí
    Laravel valida la firma.
  - `login()` **bloquea** con `403` si `is_verified` es `false` (decisión explícita del usuario,
    a diferencia de dejarlo pasar).
  - Mail configurado con **Mailtrap** (sandbox de testing, no manda correos reales) en
    `backend/.env`: `MAIL_MAILER=smtp`, `MAIL_HOST=sandbox.smtp.mailtrap.io`, `MAIL_PORT=2525`,
    credenciales de la cuenta del usuario. No se tocó `.env.example` (sigue con el driver `log`
    por defecto, para no versionar nada específico de Mailtrap).
  - Migración `2026_07_08_182111_add_is_verified_to_usuario_table.php` corrida contra Postgres
    real: agrega `is_verified boolean default false` a `usuario` (`Schema::table`, no
    `Schema::create`, porque modifica una tabla existente de la Fase 02). Suite verificada
    post-migración: `php artisan test` → 35 tests, 63 assertions, todos en verde.
  - **`Usuario` actualizado** (`app/Models/Usuario.php`): `implements
    Illuminate\Contracts\Auth\MustVerifyEmail`, usa el trait `Illuminate\Auth\MustVerifyEmail`
    (importado como `MustVerifyEmailTrait` para no chocar de nombre con la interfaz), pero
    **sobrescribe** 4 de sus métodos porque el trait por defecto asume columnas `email`/
    `email_verified_at` que no existen en esta tabla:
    - `hasVerifiedEmail()` → lee `is_verified` (bool) en vez de `email_verified_at`.
    - `markEmailAsVerified()` / `markEmailAsUnverified()` → `forceFill(['is_verified' =>
      true/false])->save()` en vez de tocar `email_verified_at`.
    - `getEmailForVerification()` → devuelve `$this->correo` en vez de `$this->email`.
    - `routeNotificationFor($driver, $notification = null)` → devuelve `$this->getEmailForVerification()`
      (el `correo`). Sin esto, las notificaciones por mail se ruteaban al `$this->email` por defecto
      (que es `null` en esta tabla) y **el correo de verificación no llegaba a Mailtrap** aunque el
      registro devolviera 201. NOTA: la versión actual devuelve el correo para **cualquier** driver;
      si a futuro se agrega otro canal (database, etc.) habrá que filtrar por `$driver === 'mail'` y
      delegar el resto a `parent::routeNotificationFor(...)`.
    - `sendEmailVerificationNotification()` → manda una notificación propia
      `App\Notifications\VerificarCorreo` (todavía no creada) en vez de la
      `Illuminate\Auth\Notifications\VerifyEmail` por defecto de Laravel (que generaría un link
      apuntando a una ruta del propio Laravel, no al frontend).
    - `sendUpdateEmailVerification()` → nuevo, mismo patrón que `sendEmailVerificationNotification()`
      pero manda `App\Notifications\VerificarCambioCorreo` (notificación nueva, creada con
      `php artisan make:notification`, esqueleto genérico de artisan todavía sin completar su
      `toMail()` — pendiente armar la URL firmada hacia una ruta backend nueva + el link al
      formulario del frontend, siguiendo el mismo patrón que `VerificarCorreo`).
    - Un método sobrescrito en la clase siempre gana sobre el mismo método traído por un trait —
      por eso alcanza con definirlos directo en `Usuario`, sin tocar el trait.
    - `is_verified` agregado a `casts()` como `'boolean'` (igual que `is_ok` en `Encuesta`).
      **No** está en `$fillable` — mismo criterio que `rol`, nadie debe poder mandarlo desde el
      request.
    - Verificado: `php artisan test` → 35 tests, 63 assertions, todos en verde (el import de
      `VerificarCorreo` no rompe nada porque PHP no la instancia hasta que se llame
      `sendEmailVerificationNotification()`, y ningún test la llama todavía).
  - **Corrección de proceso**: a partir de acá se retoma el "Modo Tutor" (esqueleto con TODO,
    el usuario escribe el cuerpo) — la migración y el modelo de arriba se escribieron completos
    sin querer, sin seguir ese modo; el usuario decidió dejarlos así (ya funcionan y están
    testeados) y seguir para adelante correctamente desde acá.
  - `app/Notifications/VerificarCorreo.php` creado con `php artisan make:notification
    VerificarCorreo`. `via()` en `['mail']`. **`toMail()` completo** (commiteado en `dfd88ac`,
    contexto corregido tras detectar que estaba desactualizado — el código real ya tenía los 4
    pasos y el `return`, no un esqueleto): 1) genera URL firmada real con
    `URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' =>
    $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())])` hacia una
    ruta del backend que **todavía no existe** (`verification.verify`); 2) extrae
    `expires`/`signature` de esa URL con `parse_url()` + `parse_str()`; 3) arma la URL del
    **frontend** (`config('app.frontend_url').'/verificar-correo'`) con `id`, `hash` y esos
    mismos parámetros de firma vía `http_build_query()`; 4) devuelve el `MailMessage` (`subject`,
    `greeting`, `line`, `action` con la URL del frontend, `line` final).
  - **Ruta creada** en `routes/api.php`: `Route::middleware('signed')->group(...)` con
    `GET /email/verificar/{id}/{hash}` → `AuthController::verifyEmail`, `->name('verification.verify')`.
    Pública (sin `auth:sanctum`, quien hace click en el mail no está logueado).
  - **`AuthController::verifyEmail()` completo**: mismo patrón `try/catch` + `Log::error()` que
    el resto del controller. Dentro del `try`, en orden: 1) busca `Usuario::where('id',
    $request->id)->first()` (`$id`/`$hash` leídos de `$request->id` / `$request->hash`, que
    Laravel resuelve solo desde los parámetros de la ruta vía el fallback de
    `Request::__get()`); 2) si `$usuario` es `null` → 404 "No existe el usuario" (chequeo
    **antes** de usar `$usuario->correo`, corregido un bug de orden durante el desarrollo); 3) si
    `$hash !== sha1($usuario->correo)` → **403** (no 401 — no es un problema de credenciales,
    es un link que dejó de ser válido porque el correo cambió; se alineó con el criterio que ya
    usa el middleware `signed` de Laravel, que también responde 403 ante firma inválida); 4)
    `$usuario->markEmailAsVerified()` (ya existía en el modelo) y responde 200 con
    `is_verified`. Probado end-to-end a mano con Tinker (URL firmada generada con
    `URL::temporarySignedRoute()`).
  - **`AuthController::register()` actualizado**: agrega `$usuario->sendEmailVerificationNotification();`
    justo después de `Usuario::create($datos)`, antes de generar el token Sanctum.
  - **Bug encontrado y AÚN NO corregido** (pendiente, a propósito — se decidió parar por hoy):
    `sendEmailVerificationNotification()` no tiraba ningún error pero el mail nunca llegaba a
    Mailtrap. Diagnóstico completo:
    1. `Usuario` no tenía el trait `Illuminate\Notifications\Notifiable` — `Illuminate\Foundation\Auth\User`
       (la clase base) **no lo incluye** por defecto (se verificó leyendo el código fuente real
       de Laravel en `vendor/`, corrigiendo una suposición inicial incorrecta). Se agregó
       `use Illuminate\Notifications\Notifiable;` + `Notifiable` al `use` de la clase — esto
       arregló el error `BadMethodCallException: Call to undefined method notify()`.
    2. Con el trait agregado, `notify()` ya no explota, pero el mail **sigue sin llegar**, sin
       ningún error. Causa real identificada: el canal `mail` de Laravel resuelve el destinatario
       llamando a `routeNotificationForMail()` (o, si no está definido, al default del trait
       `Notifiable`, que lee `$this->email`). La tabla `usuario` no tiene columna `email`, tiene
       `correo` — mismo problema de fondo que ya se había resuelto en `getEmailForVerification()`,
       pero acá falta el override equivalente. Cuando la dirección resuelve a `null`,
       `Illuminate\Notifications\Channels\MailChannel::send()` hace `return;` **en silencio**, sin
       excepción — por eso `sendEmailVerificationNotification()` devuelve `null` limpio y no hay
       nada en el log. Confirmado con `Mail::raw(...)` en Tinker, que sí llegó a Mailtrap (aislando
       que el transporte SMTP funciona bien; el problema es específico del sistema de
       Notifications).
    - **Pendiente para la próxima sesión**: agregar `routeNotificationForMail(): string { return
      $this->correo; }` a `Usuario.php`.
    - También pendiente revisar: quedó un `use Override;` sin usar en `Usuario.php` (agregado en
      algún momento de esta sesión, no confirmado si fue intencional — revisar si se usa en algún
      método con `#[Override]` o si hay que sacarlo).
  - **Bug aparte, no relacionado a esta feature, encontrado y corregido**: `SESSION_DRIVER=database`
    en `.env` apuntaba a la tabla `sessions`, que se había eliminado a propósito en Fase 02 (esta
    app es 100% API con tokens Sanctum, no usa sesiones de servidor). Cualquier request que pasara
    por el middleware `web` (ej. la home `/`) tiraba `SQLSTATE[42P01]: Undefined table: sessions`.
    Corregido cambiando `SESSION_DRIVER=database` → `SESSION_DRIVER=array` en `.env` y
    `.env.example` (no persiste nada, no hace falta ninguna tabla).
  - Pendiente para cerrar esta feature (además del bug de arriba): el bloqueo `403` en `login()`
    si `is_verified` es `false`, y actualizar `docs/requisitos_funcionales.md` +
    `plan/03-auth-backend.md` con este requisito nuevo.
    - `messages()` completo con textos en español (escritos por el asistente a pedido del
      usuario, pendiente de su revisión), ya que `config('app.locale')` es `'en'` y el proyecto
      no tiene carpeta `lang/` publicada — sin esto los errores de validación volverían en
      inglés. Cubre las 14 combinaciones campo+regla de `rules()`. Nota: `clave.regex` es un
      mensaje único que cubre ambas reglas `regex` (mayúscula y símbolo) — no se puede
      diferenciar cuál de las dos falló en el texto.
    - `tests/Feature/Request/RegisterRequestTest.php` creado (15 tests, todos en verde):
      testea `rules()` de forma aislada armando `Validator::make($datos, $request->rules(),
      $request->messages())` a mano — **no** instancia `RegisterRequest` como request HTTP real
      ni pega contra el endpoint `/api/register` (el `AuthController::register()` todavía no
      tiene lógica, sigue en TODO). Cubre: datos válidos pasan, `edad`/`sexo` opcionales,
      `nombre` required/min/max, `correo` formato y unicidad (crea un `Usuario` de prueba con
      `Usuario::create()` para chocar el `unique`), `clave` min/max y las 2 reglas regex por
      separado (falta mayúscula / falta símbolo), `edad` integer/min/max, `sexo` fuera del
      set `M,F,N/R`. Usa `RefreshDatabase` (necesario porque `unique:usuario,correo` consulta
      la tabla real).
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
- **Fase 04 (encuesta backend) — completa** (rama `logica_encuesta`):
  - `app/Http/Controllers/Api/EncuestaController.php` creado con 2 métodos:
    - `obtenerPreguntas()` — `GET /encuesta/obtener/preguntas` (devuelve todas las preguntas ordenadas por id).
    - **`enviarEncuesta(EnviarEncuestaRequest)` completo** — `POST /encuesta/enviar`: dentro de
      `DB::beginTransaction()`, crea la `Encuesta` (`id_usuario` = `$request->user()->id`, `is_ok = true`),
      itera `$request->respuestas` creando cada `Respuesta` (`id_encuesta`, `id_pregunta`,
      `respuesta` = `numero_respuesta`), `DB::rollBack()` si algún `save()` falla, `DB::commit()`
      al final. Mismo patrón `try/catch` + `Log::error()` que el resto de los controllers.
  - `app/Http/Requests/EnviarEncuestaRequest.php` creado: valida array `respuestas` con `id_pregunta`
    (required/integer/distinct/exists:pregunta,id) y `numero_respuesta` (required/integer/min:1/max:5),
    más una regla custom `TodasLasRespuestasRule` sobre el campo `respuestas` completo (exige que
    lleguen **todas** las preguntas del seeder, ni de más ni de menos).
  - `app/Rules/TodasLasRespuestasRule.php` creado: compara `Pregunta::pluck('id')` (ordenado) contra
    los `id_pregunta` recibidos (ordenados); si no coinciden, arma un mensaje que lista los
    `id_pregunta` faltantes y sobrantes con `array_diff()`.
  - **Bug encontrado y corregido**: en `EnviarEncuestaRequest::rules()`, la regla de `respuestas`
    estaba escrita como `'respuestas' => ["required" => new TodasLasRespuestasRule()]` — un array
    asociativo donde `"required"` es una **key**, no una regla. Laravel arma las reglas de un campo
    iterando el array con `foreach` y usando solo los **valores** (las keys se ignoran) — así que el
    `"required"` nunca se aplicaba de verdad, solo la rule custom. Corregido a
    `'respuestas' => ['required', "required_todas_respuestas" => new TodasLasRespuestasRule()]`:
    ahora `'required'` es un elemento de índice numérico normal (si o si se aplica), y la rule
    custom queda bajo una key string arbitraria (solo decorativa, Laravel la ignora igual, pero deja
    claro en el código qué hace esa regla).
  - **Limpieza de imports muertos**: tanto `EnviarEncuestaRequest.php` como `EncuestaController.php`
    tenían `use App\Rules\TodasLasRespuestasValidacion;` — una clase que nunca llegó a crearse
    (quedó de un rename a mitad de camino a `TodasLasRespuestasRule`). Sacados los dos imports (y de
    paso `use Override;` sin uso en `EnviarEncuestaRequest.php`). No rompían nada en runtime (import
    sin instanciar no falla), pero eran basura de un rename incompleto.
  - `messages()` de `EnviarEncuestaRequest`: el mensaje de `respuestas.required` tenía un placeholder
    (`"caa"`) sin terminar, corregido a un texto real en español.
  - Rutas en `routes/api.php` dentro del grupo `auth:sanctum` (con comentarios `//Manipulacion de
    encuesta` agregados para separar visualmente las secciones del archivo de rutas — junto con
    `//logout`, `//Cambios del perfil de usuario` y `//Api de firmas` en los otros grupos; también se
    sacó una ruta duplicada `POST /eliminar/usuario` que repetía `DELETE /me`).
  - **Tests de Feature agregados** en `backend/tests/Feature/Api/encuesta/Test.php` (namespace
    `Tests\Feature\Api\encuesta`): `test_obtener_preguntas` (camino feliz) y `test_enviar_encuesta`
    (camino feliz). Validado además manualmente por Postman que `POST /encuesta/enviar` responde
    bien end-to-end.
  - **Bug de aislamiento en los tests — resuelto**: `listarRespuestasEnviar()` (antes
    `listarRespuestas()`) hardcodea `id_pregunta` de 1 a 10. El riesgo era que si
    `test_enviar_encuesta` corría después de otro test que ya sembró `Pregunta` (ej.
    `test_obtener_preguntas`), fallaba con 422 — no porque quedaran filas viejas (`RefreshDatabase`
    sí las revierte en una transacción), sino porque en Postgres las **secuencias no son
    transaccionales**: el rollback no reinicia el contador de `id`, así que el siguiente seed
    arrancaba en el id 11 en vez del 1. Se mantuvo el `Pregunta::truncate()` antes del
    `$this->seed(DatabaseSeeder::class)` en `test_enviar_encuesta` — en Postgres `truncate()` sí
    resetea la secuencia — pero ahora a conciencia de por qué hace falta, no como parche a ciegas.
    Verificado corriendo `Test.php` completo (los dos tests en orden): pasa (2 tests, 5
    assertions).
  - **Tests de 401 agregados**: `test_obtener_preguntas_sin_auth` y `test_enviar_encuesta_sin_auth`
    en `Test.php`, verifican `401` + `{"message": "No autenticado."}` (confirmado antes a mano con
    `curl` contra `php artisan serve`, coincide con lo visto en Postman). 4 tests, 9 assertions,
    todos en verde.
  - **Tests de validación agregados**: `test_enviar_encuesta_incompleta` (falta una respuesta),
    `test_enviar_encuesta_respuesta_sobrante` (`id_pregunta` inexistente, 11), 
    `test_enviar_encuesta_numero_respuesta_fuera_de_rango` (0 y 6) y
    `test_enviar_encuesta_respuesta_duplicada` (`id_pregunta` repetido) — los 4 esperan `422`.
    Se agregó el helper privado `registrarYObtenerToken()` para no repetir registro+token en cada
    test. Suite completa: 8 tests, 18 assertions, todos en verde.
  - **Fase 04 completa (`listo`)**. Se decidió no agregar assert de `is_ok` en
    `test_enviar_encuesta`: el campo se setea en `EncuestaController` pero ningún endpoint lo lee
    todavía (no hay endpoint de estado), así que no aporta cubrir algo que no se consume.
- **Fase 05 (admin backend) — en progreso**, rama `admin`:
  - `app/Http/Middleware/EsAdmin.php` creado: `handle()` verifica `$request->user()->rol !== 'admin'`
    y hace `abort(403, "El usuario no es administrador")` si no lo es; si es admin, `return $next($request)`.
    Registrado como alias `es_admin` (usado en `routes/api.php` en `Route::middleware(['auth:sanctum',
    'es_admin', 'throttle:60,1'])`).
  - `app/Http/Controllers/Api/AdminController.php` creado (namespace `App\Http\Controllers\Api`,
    **no** `Api\Admin` — se descartó ese subnamespace; hubo una versión intermedia en
    `Api/Admin/UsuarioController.php` que se movió/renombró a este archivo) con 2 métodos, mismo
    patrón `try/catch` + `Log::error()` que el resto de los controllers:
    - `listarUsuarios()` — `GET /admin/usuarios`: `Usuario::paginate(10)`, responde `{"message":
      ..., "usuarios": $usuarios}` (el paginador serializa con `data` + metadata `current_page`,
      `last_page`, `per_page`, `total`, etc., anidado bajo la key `usuarios`).
    - `obtenerUsuarioRespuestas()` — `GET /admin/usuarios/{id}/respuestas`: 3 validaciones en cadena,
      cada una con su propio `404`: 1) usuario no existe (`Usuario::where('id', $id_usuario)->first()`
      null); 2) usuario existe pero no tiene `Encuesta` (`El usuario aún no realiza la encuesta`);
      3) la encuesta existe pero no tiene todas las respuestas — compara `count($respuestas) !==
      Pregunta::count()` (dinámico, **no** hardcodeado a `10` — se corrigió durante el desarrollo
      para no quedar desactualizado si cambia la cantidad de preguntas del seeder). Si pasa las 3,
      responde `200` con `{"message": ..., "respuestas": $respuestas}`.
  - Rutas en `routes/api.php`, grupo nuevo `Route::middleware(['auth:sanctum', 'es_admin',
    'throttle:60,1'])`: `GET /admin/usuarios` → `listarUsuarios`, `GET /admin/usuarios/{id}/respuestas`
    → `obtenerUsuarioRespuestas`. Reemplaza el closure placeholder que devolvía `1` a mano.
  - **Convención nueva en toda la app**: los mensajes de error `500` (dentro de cada `catch`) ahora
    llevan el prefijo `Err:` (ej. `"Err:Ocurrió un error al registrar el usuario."`). Aplicado en
    `AuthController`, `EncuestaController`, `PerfilController` y `AdminController`.
  - **Factories nuevas** para tests: `database/factories/UsuarioFactory.php`,
    `EncuestaFactory.php` (usa `for($usuario, 'usuario')` para asociar), `RespuestaFactory.php`
    (**solo** define `respuesta` con `fake()->randomElement([1,2,3,4,5])` — **no** define
    `id_pregunta` ni `id_encuesta`, hay que pasarlos con `for()`/`sequence()` al llamarla).
  - **Tests** en `tests/Feature/Api/admin/AdminController/Test.php` (namespace
    `Tests\Feature\Api\admin\AdminController`, con `RefreshDatabase`), 9 tests, todos en verde:
    - `test_listar_usuarios` (200 admin), `test_usuarios_authorization` (403 no-admin),
      `test_listar_usuarios_sin_token` (401).
    - `test_obtener_respuestas_sin_encuesta` (404, usuario sin `Encuesta`),
      `test_obtener_respuestas_sin_respuestas` (404, encuesta sin todas las respuestas),
      `test_obtener_respuestas_por_id_usuario` (200, 10 respuestas — `assertJsonCount(10,
      'respuestas')`), `test_obtener_respuestas_id_equivocado_token_valido` (404, id de usuario
      inexistente), `test_obtener_respuestas_sin_token` (401),
      `test_obtener_respuestas_usuario_normal_sin_permiso` (403).
    - **Bug de aislamiento encontrado y corregido** (mismo patrón que ya se había visto en la Fase
      04): las secuencias de Postgres no son transaccionales, así que sembrar `Pregunta` con el
      seeder sin `Pregunta::truncate()` antes hacía que los ids arrancaran en 11, 21, etc. en tests
      sucesivos de la misma clase — rompía los `id_pregunta` hardcodeados (1 a 10) usados en el
      `sequence()` de `Respuesta::factory()`. Se agregó `Pregunta::truncate()` antes de cada
      `PreguntaSeeder::run()` en estos tests.
    - Para variar el `id_pregunta` en las 10 `Respuesta` creadas por test (evitando el índice único
      `(id_encuesta, id_pregunta)`) se usa `->sequence(['id_pregunta' => 1], ['id_pregunta' => 2],
      ...)` encadenado a la factory — permite asignar un valor distinto en cada `create()` sucesivo
      sin tener que resolverlo dentro de la propia `definition()` de la factory (que no tiene forma
      de recordar qué valores ya usó en llamadas anteriores).
  - **`editarUsuario()` agregado** a `AdminController` — `PUT /admin/usuario/editar` (nota:
    ruta plana, no `PUT /admin/usuarios/{id}`; el `id` va en el body). Valida con
    `App\Http\Requests\editarUsuarioRequest` (`id` required|numeric|exists:usuario,id;
    `nombre` min:3|max:100|string; `clave` string|min:5|max:100 + 2 regex (mayúscula y
    símbolo); `edad` nullable|integer|min:1|max:200; `sexo` nullable|in:M,F,N/R|string;
    `rol` in:admin,usuario|string; `regla` required_without_all:nombre,edad,sexo,rol,clave
    — exige que venga al menos uno de los 5 campos editables). El controller actualiza
    solo los campos presentes vía `$request->filled(...)` (edición parcial), 404 si el
    `id` no corresponde a un usuario, 500 si `save()` falla, mismo patrón `try/catch` +
    `Log::error()` con prefijo `Err:`. `eliminarUsuario()` **creado como stub vacío**
    (`Request $request) {}`), ruta `DELETE /admin/usuario/eliminar` ya registrada — falta
    la implementación.
  - **Tests de `editarUsuario`** agregados a `tests/Feature/Api/admin/AdminController/Test.php`,
    usando `#[DataProvider]` de PHPUnit para no repetir el mismo test por cada campo/regla:
    - `datosInvalidosProvider()` + `test_editar_usuario_datos_invalidos(string $campo, $valor,
      string $errorEsperado)`: cubre las 3 reglas de `id` (faltante/no numérico/no existe) y
      cada regla de `nombre`, `clave` (min, max, sin mayúscula, sin símbolo), `edad`, `sexo`,
      `rol`. Payload se arma como `['id' => $usuario->id, $campo => $valor]` (si `$campo`
      es `'id'`, la segunda entrada pisa a la primera). Assert: `422` +
      `assertJsonValidationErrors($campo)` — clave del JSON de errores es el **nombre del
      campo**, nunca `campo.regla` (esa notación solo existe dentro de `messages()` del
      FormRequest, no en la respuesta).
    - `datosValidosProvider()` + `test_editar_usuario_datos_validos(...)`: cubre los valores
      límite válidos de cada regla (min/max exactos, cada valor de los `in:`). Assert: `200`
      + `assertJson(...)` comparando contra `Usuario::where('id', $usuario->id)->first()`
      (**no** contra la variable `$usuario` original en memoria, que no se refresca sola
      tras el `put()` — bug encontrado durante el desarrollo: comparar contra el objeto viejo
      hacía que el test fallara mostrando el valor nuevo correcto contra el esperado viejo).
    - `test_editar_usuario_ningun_valor_enviado()`: caso aparte (no cabe en ningún data
      provider por campo, ya que valida la *ausencia* de todos los campos editables a la
      vez) — payload solo con `id`, espera `422` + `assertJsonValidationErrors('regla')`.
  - **`editarUsuarioRequest` renombrado a `EditarUsuarioRequest`** (PascalCase, convención
    Laravel) — mismo contenido, solo el nombre del archivo/clase cambia; `AdminController`
    actualizado para importar la clase nueva.
  - **`eliminarUsuario()` implementado** (ya no es un stub) — `DELETE /admin/usuario/eliminar`,
    validado por `EliminarUsuarioRequest` (`id` required|numeric): busca el `Usuario` por
    `id`, 404 si no existe; **revoca los tokens de Sanctum antes de destruir** (`$usuario->
    tokens()->delete()` → `Usuario::destroy($request->id)`) — mismo motivo que ya se había
    encontrado en `PerfilController::destroy()`: `personal_access_tokens` no tiene FK real
    hacia `usuario` (relación polimórfica sin constraint a nivel BD), así que si se borra el
    usuario primero, los tokens quedan huérfanos. 500 si `destroy()` no borra ninguna fila,
    200 si se elimina. Mismo patrón `try/catch` + `Log::error()` con prefijo `Err:`.
  - **Tests de `eliminarUsuario`** agregados a `tests/Feature/Api/admin/AdminController/Test.php`:
    `test_eliminar_usuario` (200; crea un token para el `$usuario` a eliminar, lo revoca a mano
    para simular el estado esperado tras el endpoint y confirma `count() === 0`; llama al
    endpoint autenticado **como admin** y confirma con `assertNull(Usuario::where('id', ...)
    ->first())` que el usuario ya no existe) y `test_eliminar_usuario_inexistente` (404, id
    que no existe). **Bug encontrado y corregido durante el desarrollo del test**: la primera
    versión reasignaba la variable `$token` (creada para `$user_admin` en la línea de
    autenticación) al crear el token de `$usuario`, pisándola — la request `DELETE` terminaba
    mandando el token del usuario normal (ya revocado por la propia prueba, así que ni
    siquiera un token válido) en vez del token del admin, y el endpoint nunca llegaba a
    ejecutarse de verdad (el `assertNull` pasaba por motivos equivocados o fallaba según el
    caso). Corregido sin reutilizar la variable `$token` para el usuario normal.
  - **`UpdateCorreoRequest` actualizado**: se habían vaciado sus `rules()`/`messages()` a
    propósito (ver más arriba, la validación de `correo` se confiaba solo al middleware
    `signed` + lógica inline). Se revirtió esa decisión: ahora valida `correo` con
    `required|email|unique:usuario,correo` (con sus 3 mensajes en español), sumando una capa
    de validación explícita sobre el endpoint `PUT /me/actualizar/correo` además del `signed`.
  - Rutas nuevas en `routes/api.php`, dentro del grupo `auth:sanctum` + `es_admin`:
    `PUT /admin/usuario/editar` → `editarUsuario`, `DELETE /admin/usuario/eliminar` →
    `eliminarUsuario`.
  - Suite completa verificada tras estos cambios: `php artisan test` → **82 tests, 164
    assertions, todos en verde**.
  - **Pendiente para cerrar la Fase 05**: `Admin/MetricasController` (`GET /admin/metricas`).
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

## Endpoints actuales (ver `plan/03`, `plan/04`, `plan/05`)
- Auth (públicos): `POST /register`, `POST /login`.
- Auth (auth:sanctum): `POST /logout`, `GET /me`, `DELETE /me`,
  `PUT /me/actualizar/nombre`, `PUT /me/actualizar/clave`,
  `GET /me/actualizar/correo/verificacion`, `POST /eliminar/usuario`.
- Encuesta (auth:sanctum): `GET /encuesta/obtener/preguntas`, `POST /encuesta/enviar`.
- Auth (signed): `GET /email/verificar/{id}/{hash}` (name: `verification.verify`),
  `GET /me/actualizar/correo/verificacion/firma` (name: `verification.verify.sign`),
  `PUT /me/actualizar/correo` (name: `update.email`).
- Público: `GET /health`.
- Admin (auth:sanctum + middleware `es_admin`): `GET /admin/usuarios` (paginado),
  `GET /admin/usuarios/{id}/respuestas`, `PUT /admin/usuario/editar` (edición parcial,
  validado por `EditarUsuarioRequest`), `DELETE /admin/usuario/eliminar` (revoca tokens
  Sanctum antes de borrar, validado por `EliminarUsuarioRequest`).
- **Rate limiting**: middleware `throttle:60,1` aplicado a todos los grupos de rutas API
  (públicas, signed, auth:sanctum, admin). 60 requests por minuto.
- Encuesta (pendiente): `GET /preguntas`, `POST /encuesta/iniciar`, `GET /encuesta`,
  `PUT /encuesta/respuestas/{idPregunta}`, `POST /encuesta/enviar`, `GET /encuesta/estado`,
  `GET /encuesta/compartir`.
- Admin (pendiente): `GET /admin/metricas`.

## Decisiones
- Rol admin mediante columna `rol` en `usuario` (no tabla de roles aparte).
- Google OAuth → **fase posterior** (fase 10); MVP con correo+clave.

## Convenciones
- camelCase, SOLID, controllers delgados. Validar **toda** solicitud en el backend.
- Clave siempre cifrada (hash), nunca en texto plano; `clave` en `$hidden`.
- No subir `.env` (solo `.env.example`). No instalar dependencias sin avisar.
