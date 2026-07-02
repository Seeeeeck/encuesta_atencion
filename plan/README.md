# Plan de construcción — Encuesta sobre la atención

Roadmap paso a paso para construir la aplicación de principio a fin. Cada archivo es una
fase: define el **objetivo**, los **pasos concretos**, los **archivos a tocar**, el
**criterio de "hecho"** y los **tests**.

> Regla de trabajo (de `CLAUDE.md`): las tareas son **una a la vez** — pido → haces →
> reviso → confirmo. No se instalan dependencias sin avisar.

## Visión general

Sistema de encuesta (una sola encuesta fija) que mide cómo redes sociales y videojuegos
de alta recompensa influyen en la atención. Usuarios responden la encuesta; un administrador
ve métricas y gestiona usuarios.

### Stack
- **Backend**: Laravel (última) + PHP (última) + Sanctum (auth) + PHPUnit. BD: PostgreSQL.
- **Frontend**: React + TypeScript + Vite (SPA) + Jest + React Testing Library.

### Modelo de datos (ver `docs/modelo_relacional.png`)
- `usuario` — id_usuario, nombre, correo (unique), clave (cifrada), edad, sexo, **rol** (`usuario`/`admin`).
- `encuesta` — id_encuesta, id_usuario (FK), is_ok (bool, default false). Una instancia por usuario.
- `pregunta` — id_pregunta, pregunta_texto, **tipo** (CHAR(1), `'P'`=positiva/`'N'`=negativa, CHECK IN ('P','N')). Set fijo, precargado por seeder.
- `respuesta` — id_respuesta, id_encuesta (FK), id_pregunta (FK), respuesta (SMALLINT, valor 1–5, CHECK 1..5).

## Convenciones clave (de `CLAUDE.md`)
- `camelCase` para variables y funciones; principios SOLID.
- **Validar cada solicitud en React Y en Laravel**.
- Logs de errores de backend en carpeta `logs/`.
- Tests frontend **junto al componente** (`Componente/Componente.tsx` + `Componente/Componente.test.tsx`).
- Tests backend en la carpeta `tests/` por defecto (`tests/Feature/...`).
- Componentes React **< 300 líneas** (si crece, preguntar antes de dividir).
- No `any` en TS sin justificar. No `.env` al repo (solo `.env.example`).
- Cada cambio actualiza `/context` (`context_backend.md`, `context_frontend.md`).

## Fases

| #  | Archivo | Fase |
|----|---------|------|
| 00 | [00-setup-entorno.md](00-setup-entorno.md) | Setup del entorno y estructura |
| 01 | [01-backend-base.md](01-backend-base.md) | Backend base (Laravel + Sanctum + Postgres) |
| 02 | [02-modelo-datos.md](02-modelo-datos.md) | Migraciones, modelos y seeders |
| 03 | [03-auth-backend.md](03-auth-backend.md) | Autenticación (API) |
| 04 | [04-encuesta-backend.md](04-encuesta-backend.md) | Encuesta (API) |
| 05 | [05-admin-backend.md](05-admin-backend.md) | Administración y métricas (API) |
| 06 | [06-frontend-base.md](06-frontend-base.md) | Frontend base (Vite + router + API) |
| 07 | [07-frontend-auth.md](07-frontend-auth.md) | Frontend autenticación |
| 08 | [08-frontend-encuesta.md](08-frontend-encuesta.md) | Frontend encuesta |
| 09 | [09-frontend-admin.md](09-frontend-admin.md) | Frontend panel admin |
| 10 | [10-oauth-google.md](10-oauth-google.md) | Google OAuth (fase posterior) |
| 11 | [11-no-funcionales-y-despliegue.md](11-no-funcionales-y-despliegue.md) | No funcionales y despliegue |

## Leyenda de estado
Marca cada fase al avanzar: ⬜ Pendiente · 🟨 En progreso · ✅ Hecha

- ⬜ 00 · ⬜ 01 · ⬜ 02 · ⬜ 03 · ⬜ 04 · ⬜ 05 · ⬜ 06 · ⬜ 07 · ⬜ 08 · ⬜ 09 · ⬜ 10 · ⬜ 11
