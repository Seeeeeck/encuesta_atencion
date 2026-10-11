# Contexto Frontend — Encuesta sobre la atención

> Estado vivo del frontend. Actualizar en cada cambio (regla de `CLAUDE.md`).

## Estado actual
- **Fase 00 (setup) completada.** `frontend/` existe y corre.
- Proyecto generado con `npm create vite@latest -- --template react-ts`: **React 19.2**,
  **TypeScript ~6.0**, **Vite 8.1**. `npm install` corrido, 0 vulnerabilidades. Scaffold base
  de Vite (`src/App.tsx`, `src/main.tsx`), aún sin router, servicios ni componentes propios.
- Roadmap de construcción en `plan/` (fases 00–11). Fase 00: ver `plan/00-setup-entorno.md`
  (los 7 pasos están marcados `(listo)`).
- **`.env.example`** creado con `VITE_API_URL=http://localhost:8000/api` (apunta al backend
  Laravel local, prefijo `/api` que se define en la Fase 01 del backend).
- **`.gitignore`**: el scaffold de Vite solo ignoraba `*.local` (no cubría `.env` a secas).
  Se agregó bloque explícito `.env` / `.env.*` / `!.env.example`, verificado con
  `git check-ignore`.
- **Modo de trabajo del frontend (decisión del usuario, 2026-10-11)**: el asistente escribe todo el
  frontend (fases 06–09), **con TDD estricto** (skill `obra/superpowers/test-driven-development`:
  test primero → verlo fallar por la razón correcta → código mínimo → refactor), y revisa cada fase
  en el navegador con Claude in Chrome contra la API real. Una rama + un PR por fase, con pausa para
  que el usuario revise y mergee antes de la siguiente. El modo tutor sigue vigente para el resto.
- **Fase 06 (frontend base) — rama `frontend-base`**:
  - Dependencias: `react-router` **8.4** (v8: el paquete ya no se llama `react-router-dom`),
    `axios`. Dev: `jest` 30 + `jest-environment-jsdom`, `babel-jest` + presets env/react/typescript
    (Babel 8), `@testing-library/react|dom|jest-dom|user-event`, `identity-obj-proxy`, `@types/jest`.
    No se usó `ts-jest` (posible incompatibilidad con TypeScript 6). `npm audit` marca 22
    vulnerabilidades, todas dentro de la cadena de Jest (dev, no llegan al build).
  - **Config de Jest** (`jest.config.js`, `babel.config.cjs`, `jest.polyfills.cjs`):
    - `npm test` = `jest`. Tests `src/**/*.test.{ts,tsx}` al lado de cada archivo.
    - `react-router` v8 y sus deps (`@remix-run/*`, `cookie-es`) son **solo ESM** (`.js`/`.mjs`):
      se pasan por Babel (`transform` incluye `.mjs` + `transformIgnorePatterns` con excepción).
    - Plugin propio en `babel.config.cjs` que reemplaza `import.meta` por `({ env: {} })` (Jest
      corre en CommonJS). Babel solo lo usa Jest; Vite compila con su propio plugin.
    - `jest.polyfills.cjs`: `TextEncoder`/`TextDecoder` (jsdom no los trae; react-router los usa).
      Está fuera de `src/` para que `tsc` no lo compile.
    - `src/entorno.ts` es el único lugar que lee `import.meta.env.VITE_API_URL` (fallback
      `http://localhost:8000/api`); en tests se reemplaza por `src/__mocks__/entorno.ts`
      (`http://api.test/api`) vía `moduleNameMapper`. Se llamaba `config.ts` pero la regex del
      mapper chocaba con el `./config` interno de `@testing-library/dom`.
    - `tsconfig.app.json`: `types` incluye `jest`.
  - `src/types/`: `usuario.ts` (`Usuario`, `Rol`, `Sexo`), `encuesta.ts` (`Pregunta`,
    `ValorRespuesta` 1–5, `RespuestaEnviada`), `admin.ts` (`PaginaUsuarios`, `RespuestaDeUsuario`,
    `CambiosUsuario`, `Metricas`… con la forma real de las respuestas de la API).
  - `src/services/`:
    - `sesion.ts`: token + usuario en `localStorage` (`leerSesion`/`guardarSesion`/`borrarSesion`;
      JSON corrupto = sin sesión).
    - `apiClient.ts`: axios con `baseURL` de `entorno`, `Accept: application/json`, interceptor que
      agrega `Authorization: Bearer`. Un **401 solo cierra la sesión si la request llevaba token**
      (así un login fallido no dispara el cierre); avisa vía `alExpirarSesion(callback)`.
    - `errores.ts`: `extraerError(error)` → `{ mensaje, campos }` (422 → primer mensaje por campo;
      429 → "Demasiados intentos…"; 5xx → mensaje genérico, sin mostrar el `Err:` interno; sin
      respuesta → "No se pudo conectar con el servidor.").
    - `firmas.ts`: `consultaFirmada()` arma el query de un link firmado con las claves en orden
      alfabético y `signature` al final (Laravel valida la firma sobre el query string tal cual
      llega, en el orden en que lo firmó con `ksort`).
    - `authService.ts`: register, login, logout, `/me`, nombre, clave, pedir cambio de correo,
      eliminar cuenta, `verificarCorreo` (GET `/email/verificar/{id}/{hash}?expires&signature`),
      `verificarLinkCambioCorreo` y `cambiarCorreo`. **Seguridad**: el parámetro `verificacion` del
      mail es una URL absoluta; solo se toma su firma y se llama a nuestra `apiUrl` (si se usara la
      URL tal cual, el interceptor mandaría el token a cualquier dominio).
    - `encuestaService.ts` (preguntas, enviar con `{ respuestas: [{ id_pregunta,
      numero_respuesta }] }`), `adminService.ts` (usuarios paginados `?page=`, respuestas, editar,
      eliminar con `{ id }` en el body del DELETE, métricas), `saludService.ts` (`apiDisponible()`).
  - `src/context/`: `AuthProvider` (`AuthContext.tsx`), contexto (`authContexto.ts`) y hook
    `useAuth` (`useAuth.ts`) separados para que oxlint no marque `only-export-components`. Expone
    `usuario`, `esAdmin`, `iniciarSesion`, `actualizarUsuario`, `cerrarSesion`; se suscribe a
    `alExpirarSesion` para vaciar la sesión ante un 401.
  - `src/routes/guards.tsx`: `RutaPrivada` (sin sesión → `/login`), `RutaAdmin` (sin sesión →
    `/login`, no admin → `/encuesta`), `RutaInvitado` (con sesión → `/admin` si es admin, si no
    `/encuesta`).
  - `src/components/`: `Layout` (header con navegación según sesión, botón Salir que cierra sesión
    aunque el backend falle, aviso si `/health` no responde), `Cargando` (`role="status"`),
    `MensajeError` (`role="alert"`).
  - `src/pages/`: `Inicio` (presentación + CTA según sesión), `NoEncontrada` (404).
  - `src/AppRutas.tsx` (árbol de rutas, testeable con `MemoryRouter`); `main.tsx` monta
    `AuthProvider` + `BrowserRouter` + `AppRutas`. `index.html` en `lang="es"` con título y
    description.
  - **Tema** en `src/index.css`: variables CSS con paleta salvia/arena de bajo brillo, contraste AA,
    modo oscuro automático (`prefers-color-scheme`), clases `.tarjeta`, `.boton`
    (`--secundario`, `--peligro`), `.visualmente-oculto`, foco visible, `prefers-reduced-motion`.
  - Helpers de test en `src/test/`: `servidorFalso()` (reemplaza el adapter de axios, registra las
    requests y responde lo indicado), `renderConRutas()`, `datos.ts` (usuarios de prueba).
  - Verificado: **70 tests en verde**, `tsc -b`, `oxlint` y `vite build` limpios (JS 94 kB gzip).
    En Chrome contra la API real: inicio, navegación cliente, 404 y `/health` vía CORS.
  - Restos de la demo de Vite borrados (confirmado por el usuario): `src/App.tsx`,
    `src/App.css`, `src/assets/*`, `public/icons.svg`.
- **Fase 07 (frontend auth) — rama `frontend-auth`** (sale de `frontend-base`; PR contra esa rama
  hasta que se mergee la Fase 06):
  - `src/utils/validacion.ts`: copia las reglas de los Form Requests (`validarNombre` 3–100,
    `validarCorreo` con dominio y máx. 150, `validarClaveNueva` 5–100 + mayúscula + símbolo
    `/[\W_]/`, `validarEdad` entero 1–200 opcional, `validarRegistro`, `validarLogin` sin reglas de
    complejidad). `src/utils/opciones.ts`: opciones y textos de sexo (`M`, `F`, `N/R` = "Prefiero no
    responder").
  - `CampoFormulario`: label + input o select (`opciones`), error con `aria-invalid` y
    `aria-describedby`, texto de ayuda, marca "(opcional)".
  - Páginas: `Login` (vuelve a `state.desde` o va a `/admin`/`/encuesta` según el rol), `Registro`
    (edad/sexo vacíos → `null`), `VerificarCorreo` (`/verificar-correo`, verifica al cargar; con
    sesión refresca `/me` para que el aviso desaparezca), `ActualizarCorreo` (`/actualizar-correo`,
    comprueba la firma del link antes de mostrar el formulario; 403 = link vencido o ya usado),
    `Perfil` (datos + estado de verificación, refresca `/me` al entrar).
  - Componentes del perfil, uno por acción y cada uno con su test: `EditarNombre`, `CambiarClave`
    (clave actual + nueva + repetida), `SolicitarCambioCorreo`, `EliminarCuenta` (confirmación en
    la misma pantalla, sin `window.confirm`).
  - `Layout`: aviso "Te mandamos un correo para verificar tu cuenta…" si `is_verified` es false
    (decisión: el login deja entrar sin verificar).
  - **`sinCierreDeSesion`** (opción propia de axios, declarada con module augmentation en
    `apiClient.ts`): el backend responde **401** cuando la *clave actual* es incorrecta; sin esta
    marca el interceptor lo tomaba como token vencido y cerraba la sesión. `actualizarClave` la usa.
  - **Gotcha de react-router v8**: `navigate()` se aplica dentro de `startTransition`, pero cambiar
    la sesión es una actualización urgente que se aplica antes. Si se cierra/abre la sesión y
    después se navega, el guard de la ruta actual redirige primero (eliminar cuenta terminaba en
    `/login`; el login desde una página privada no volvía a ella). Se resuelve haciendo ambas cosas
    dentro del mismo `startTransition` (`EliminarCuenta`, `Login`). Cubierto con tests de
    integración en `AppRutas.test.tsx`.
  - Rutas (`AppRutas`): públicas `/`, `/verificar-correo`, `/actualizar-correo`; solo invitados
    `/login`, `/registro`; privada `/perfil`. `/encuesta` todavía es 404 (Fase 08).
  - Verificado: **162 tests en verde**, `tsc`, `oxlint` y build limpios. En Chrome contra la API
    real: registro → aviso de verificación → link de verificación (firma real de Laravel) →
    perfil: cambiar nombre, clave actual incorrecta (marca el campo y no cierra la sesión) → link
    de cambio de correo → login con el correo nuevo → eliminar cuenta. Quedan 0 usuarios
    `@test.local` en la base de dev.
- **Fase 08 (frontend encuesta) — rama `frontend-encuesta`**:
  - Usa solo los endpoints reales: `GET /encuesta/estado`, `GET /encuesta/obtener/preguntas` y
    `POST /encuesta/enviar` (409 si ya se envió). No hay guardado por pregunta en el backend.
  - `services/borradorEncuesta.ts`: el avance (respuestas + pregunta actual) se guarda en
    `localStorage` por usuario (`borrador-encuesta-<id>`); descarta valores fuera de 1–5 o JSON roto.
    Se borra al enviar (o al recibir 409).
  - `encuestaService.obtenerEstado()` → `completada: boolean`.
  - Componentes: `Pregunta` (radios nativos accesibles, navegables con flechas; anclas
    "Totalmente en desacuerdo"/"Totalmente de acuerdo" de `docs/preguntas.json`), `ProgresoEncuesta`
    (`role="progressbar"`), `CompartirLink` (`navigator.share` si existe; si no, copia al
    portapapeles; si falla, muestra el link para copiar a mano; cancelar el menú no muestra error).
  - `pages/Encuesta` (`/encuesta`, privada): si ya está completada redirige a `/encuesta/finalizada`;
    si no, carga preguntas y retoma el borrador. Anterior/Siguiente; en la última, "Enviar
    encuesta": si falta alguna, avisa cuántas y ofrece "Ir a la pregunta N" (no llama a la API).
  - `pages/EncuestaFinalizada` (`/encuesta/finalizada`, privada): consulta el estado; si está
    completa agradece y ofrece compartir `window.location.origin + '/'`; si no, invita a responder.
  - Verificado: **194 tests en verde**, `tsc`, `oxlint` y build limpios (JS 100 kB gzip). En Chrome
    contra la API real: login desde `/encuesta` → responder → recargar (retoma el borrador) →
    enviar incompleta (aviso de faltantes) → teclado (flechas) → completar → enviar → pantalla
    final → `/encuesta` redirige a la final. En la BD quedó 1 encuesta `is_ok = true` con las 10
    respuestas elegidas. Usuario de prueba borrado (0 `@test.local`).
- **Fase 09 (frontend admin) — rama `frontend-admin`**:
  - Rutas bajo `RutaAdmin` + `AdminLayout` (pestañas "Métricas"/"Usuarios", `aria-current`):
    `/admin` (métricas), `/admin/usuarios` (lista, `?pagina=N`), `/admin/usuarios/:id` (detalle).
  - **Métricas** (`AdminMetricas`), diseñadas con la skill `dataviz`:
    - `ResumenMetricas`: fila de indicadores (usuarios, encuestas completadas con % sobre usuarios,
      índice de atención /5), sin gráfico.
    - `BarrasIndice`: barras horizontales de un solo tono (`--primario`) en escala 1–5, valor escrito
      en la punta de cada barra, filas sin datos dicen "Sin datos". Se usa para índice por pregunta
      (`promedio_ajustado`), por edad y por sexo (con nombres legibles).
    - `DistribucionRespuestas`: **barra apilada divergente centrada en el neutro (3)** (Likert),
      leyenda con texto, tooltip por segmento con hover y foco de teclado (`data-tooltip`), y vista
      "Ver como tabla". Paleta divergente terracota ↔ azul petróleo con gris en el medio, validada con
      `validate_palette.js` de la skill en claro (sobre `#ffffff`) y oscuro (sobre `#232d2b`):
      claro `#a84d27 #e08e5a #c9c7c2 #4db4cc #00739c`, oscuro `#d17746 #964b2c #5a5955 #006d95
      #29a1c1`. La paleta salvia original no alcanzaba el piso de croma ni la separación entre tonos
      vecinos; los tonos claros quedan con contraste < 3:1, compensado con leyenda + tabla.
    - `utils/formato.ts`: números con coma decimal (`es-AR`), porcentajes y plurales.
  - **Usuarios** (`AdminUsuarios`): tabla paginada (la página va en la URL), link "Ver" con
    `aria-label` que pasa el usuario en el `state` de la navegación. **Sin búsqueda**: la API no la
    soporta y filtrar solo la página actual sería engañoso.
  - **Detalle** (`AdminUsuario`): la API no tiene `GET /admin/usuarios/{id}`, así que los datos llegan
    por `state` (el navegador lo conserva al recargar); si faltan o no coinciden con el id de la URL,
    pide abrirlo desde la lista. Tres componentes:
    - `RespuestasUsuario`: cruza `GET /encuesta/obtener/preguntas` con las respuestas; el 404 "aún
      no realiza la encuesta" se muestra como aviso, no como error.
    - `EditarUsuarioAdmin`: manda solo los campos que cambiaron (el backend actualiza solo los que
      llegan); clave solo si se escribe una nueva; edad/sexo vacíos no se mandan (el backend no
      permite borrarlos); "No hay cambios para guardar." sin llamar a la API; un admin no puede
      cambiarse su propio rol; si se edita a sí mismo actualiza la sesión.
    - `EliminarUsuarioAdmin`: confirmación en pantalla; un admin no puede eliminarse desde el panel.
  - `CampoFormulario` ahora acepta `deshabilitado`. `utils/opciones.ts` suma `opcionesRol` y
    `significadoRespuesta` (compartido con la distribución).
  - `Layout`: vuelve arriba (`window.scrollTo(0, 0)`) en cada cambio de ruta — `BrowserRouter` no
    restaura el scroll (detectado en Chrome).
  - Verificado: **246 tests en verde**, `tsc`, `oxlint` y build limpios (JS 104 kB gzip). En Chrome
    contra la API real con un admin temporal `@test.local`: métricas (barras, distribución divergente,
    tooltip con teclado, tabla), lista paginada, detalle con respuestas, edición parcial (solo edad y
    rol) verificada en la BD, eliminación, scroll al cambiar de ruta. Usuarios de prueba borrados.
- **Comandos de desarrollo** documentados en la raíz `CLAUDE.md` (sección Comandos):
  `npm install`, `npm run dev`, `npm run build`, `npm run lint`.

## Stack
- React + **TypeScript** + **Vite** (SPA).
- Tests: **Jest** 30 + **React Testing Library** (instalados en Fase 06), **junto a cada componente**
  (`Componente/Componente.tsx` + `Componente/Componente.test.tsx`).

## Estructura prevista (de `CLAUDE.md`)
- `src/components/` — componentes reutilizables (cada uno con su test al lado).
- `src/pages/` — vistas principales (Login, Registro, Perfil, Encuesta, Admin).
- `src/services/` — llamadas a la API (axios): `apiClient`, `authService`, `encuestaService`,
  `adminService`.

## Flujos previstos (ver `plan/07`, `plan/08`, `plan/09`)
- **Auth**: registro, login, perfil (editar), logout, eliminar cuenta. Token Sanctum en `apiClient`.
- **Encuesta**: iniciar, responder, volver atrás a cambiar respuestas, progreso, enviar,
  pantalla finalizada, compartir link.
- **Admin** (solo `rol = admin`): métricas, lista de usuarios, detalle de respuestas, editar/eliminar.

## Decisiones
- Paleta de **colores que relajen la vista** (requisito no funcional).
- Validación en cliente coherente con el backend (la **fuente de verdad es el backend**).
- Google OAuth → fase posterior (botón en Login/Registro en fase 10).

## Convenciones
- camelCase, SOLID. **Componentes < 300 líneas** (preguntar antes de dividir).
- No `any` en TS sin justificar. `VITE_API_URL` desde `.env` (no subir `.env`).
- No instalar dependencias sin avisar (incluida librería de gráficos para el panel admin).
