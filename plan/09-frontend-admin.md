# Fase 09 — Frontend panel admin

## Objetivo
Panel solo para administradores: ver métricas de la encuesta, listar usuarios, ver respuestas de
cada usuario y editar/eliminar usuarios. Consume `/api/admin/*` (fase 05).

## Pasos
1. Ruta privada `src/pages/Admin/` accesible solo si el usuario tiene `rol = 'admin'` (si no, redirige). (listo)
2. **Dashboard de métricas** (`GET /api/admin/metricas`): visualizaciones simples — **promedio por
   pregunta (1–5)** y **distribución de respuestas 1–5** por pregunta, distribución por edad/sexo,
   % completadas. (listo)
3. **Lista de usuarios** (`GET /api/admin/usuarios`) con paginación. (listo) — *Búsqueda descartada:
   la API no la soporta; filtrar solo la página actual sería engañoso.*
4. **Detalle de respuestas** de un usuario (`GET /api/admin/usuarios/{id}/respuestas`). (listo)
5. **Editar** usuario (`PUT`) y **eliminar** usuario (`DELETE`) con confirmación. (listo)

## Archivos a tocar
- `frontend/src/pages/Admin/*`.
- `frontend/src/components/Metricas/*`, `src/components/TablaUsuarios/*`,
  `src/components/RespuestasUsuario/*`.
- `frontend/src/services/adminService.ts`.

## Criterio de "hecho"
- Un usuario normal no puede entrar al panel.
- El admin ve métricas coherentes, gestiona usuarios y consulta respuestas.

## Convenciones
- Componentes **< 300 líneas**; test al lado de cada componente.
- Gráficos: usar librería ligera (confirmar elección antes de instalar dependencia).

## Tests
- `src/pages/Admin/Admin.test.tsx` — guard de rol.
- `src/components/Metricas/Metricas.test.tsx`, `TablaUsuarios/TablaUsuarios.test.tsx`.

## Notas
- Actualizar `context/context_frontend.md`.
