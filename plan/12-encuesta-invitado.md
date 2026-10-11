# Fase 12 — Encuesta como invitado (sin cuenta)

## Objetivo
Permitir que alguien responda la encuesta sin registrarse ni loguearse. Idea planteada durante la
Fase 05, no se desarrolla todavía — queda anotada para evaluar más adelante.

## Problema a resolver
Hoy `Encuesta` depende de `id_usuario` (columna no nullable), y `POST /encuesta/enviar` vive dentro
del grupo `auth:sanctum`. Las métricas de admin (edad/sexo) también salen del `Usuario` asociado.
Un invitado sin cuenta rompe esos tres supuestos.

## Ideas a evaluar (sin decidir todavía)
- Hacer `id_usuario` nullable en `Encuesta` (migración).
- Pedir `edad`/`sexo` sueltos en el body del request de invitado (ya que no hay `Usuario` del cual
  sacarlos).
- Sacar `POST /encuesta/enviar` (variante invitado) del grupo `auth:sanctum`, con su propio
  rate-limit por IP (ya existe throttle general, ver si alcanza o hace falta uno más estricto).
- Definir si el invitado puede ver un link/resultado propio después de enviar, o si es "enviar y
  listo" sin nada más.
- Revisar cómo afecta esto a las métricas de admin (Fase 05): ¿se agrupan invitados aparte de
  usuarios registrados, o van todos juntos?

## Notas
- No bloquea ninguna fase anterior. Se retoma cuando el resto del backend esté más avanzado.
- Actualizar `context/context_backend.md` cuando se arranque esta fase.
