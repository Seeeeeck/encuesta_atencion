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
