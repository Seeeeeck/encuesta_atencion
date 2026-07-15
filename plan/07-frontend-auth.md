# Fase 07 — Frontend autenticación

## Objetivo
Páginas y componentes de cuenta: registro, login, perfil (editar), logout y eliminación de cuenta,
con validación en cliente (además de la del backend).

## Pasos
1. Páginas en `src/pages/`: `Registro`, `Login`, `Perfil`.
2. Componentes de formulario reutilizables en `src/components/` (inputs validados, mensajes de error).
3. Validación en cliente: correo válido, clave segura, edad numérica, sexo permitido — coherente con
   las reglas del backend (fase 03).
4. Flujo de sesión: guardar token tras login/registro, redirigir a la encuesta; logout limpia estado.
5. Edición de perfil (`PUT /me`) y eliminación de cuenta (`DELETE /me`) con confirmación.
6. Rutas privadas protegidas: sin sesión → redirige a login.
7. Verificación de correo:
   - Página `/verificar-correo` (`src/pages/VerificarCorreo/*`) que, **al cargar**, lee los query
     params del link del email (`id`, `hash`, `expires`, `signature`), reconstruye la URL firmada y
     le pega automáticamente al backend (`verification.verify`), y muestra un mensaje de resultado
     (verificado / link inválido o vencido).
   - **Pendiente relacionado (backend):** editar/personalizar la plantilla del correo de verificación
     (`App\Notifications\VerificarCorreo` + vistas de mail de Laravel si se quiere cambiar el diseño).

## Archivos a tocar
- `frontend/src/pages/Registro/*`, `frontend/src/pages/Login/*`, `frontend/src/pages/Perfil/*`.
- `frontend/src/components/Formulario*/*`.
- `frontend/src/services/authService.ts` (consumo de endpoints de auth).

## Criterio de "hecho"
- Registrar → iniciar sesión → ver/editar perfil → cerrar sesión → eliminar cuenta funciona.
- Errores del backend (422/401) se muestran al usuario de forma clara.

## Convenciones
- Componentes **< 300 líneas**; test al lado de cada componente.

## Tests
- `src/pages/Login/Login.test.tsx`, `src/pages/Registro/Registro.test.tsx` (RTL + Jest):
  validación, envío y manejo de errores.
- `src/pages/Perfil/Perfil.test.tsx` — editar y eliminar cuenta.

## Notas
- Actualizar `context/context_frontend.md`.
