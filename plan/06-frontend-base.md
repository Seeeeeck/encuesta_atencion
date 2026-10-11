# Fase 06 — Frontend base (Vite + router + API)

## Objetivo
SPA React+TS lista: routing, capa de servicios HTTP (axios) en `src/services`, layout común y
una paleta de colores que relaje la vista (requisito no funcional).

## Pasos
1. Configurar **React Router** con rutas públicas y privadas (guard por sesión/token). (listo)
2. Crear `src/services/apiClient.ts` (axios con baseURL desde `.env`, interceptor que adjunta el
   token Sanctum y maneja `401` → cerrar sesión). (listo)
3. Servicios por dominio: `src/services/authService.ts`, `encuestaService.ts`, `adminService.ts`. (listo)
4. **Layout** base (`src/components/Layout/`) + tema (colores suaves/relajantes, buen contraste). (listo)
5. Estado de sesión: contexto/almacenamiento del token y del usuario actual. (listo)
6. Manejo de errores y carga (componentes de feedback reutilizables en `src/components/`). (listo)

## Archivos a tocar
- `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/routes/*`.
- `frontend/src/services/*`, `frontend/src/components/Layout/*`, tema/estilos globales.
- `frontend/.env.example` (`VITE_API_URL`).

## Criterio de "hecho"
- La SPA arranca, navega entre rutas y consume `GET /api/health`.
- El `apiClient` adjunta token y redirige a login en `401`.

## Convenciones
- `camelCase`; componentes **< 300 líneas** (dividir antes de exceder, preguntando).
- Sin `any` sin justificar.
- Cada componente con su test al lado (`Componente/Componente.test.tsx`).

## Tests
- `src/services/apiClient.test.ts` — interceptores (token y manejo 401).
- `src/components/Layout/Layout.test.tsx` — render del layout.

## Notas
- Actualizar `context/context_frontend.md`.
