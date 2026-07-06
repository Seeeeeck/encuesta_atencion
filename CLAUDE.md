# [Encuesta sobre la atencíon]
[Sistema de encuesta que pregunta sobre cómo ciertas redes sociales y videojuegos, diseñados para mantenerte en su ciclo de uso mediante recompensas constantes, han influido en tus hábitos de atención y concentración.]

## REGLA PRINCIPAL - Contexto siempre actualizado
- Cada vez que se cree, modifique o elimine CUALQUIER archivo del proyecto
  (código, config, migraciones, .gitignore, etc., en backend/, frontend/ o
  cualquier otra carpeta), actualiza `/context/context_backend.md` y/o
  `/context/context_frontend.md` DE INMEDIATO, en cuanto haces ese cambio puntual.
- No esperes a terminar toda la tarea ni agrupes varios cambios para actualizar
  el contexto al final: es por cada archivo tocado, no por tarea completa.
- Aplica a todo archivo, sin importar qué tan pequeño parezca el cambio (una
  migración, un componente, un endpoint, una config, un .gitignore, etc.).
- No es opcional ni hace falta que te lo pida cada vez: pasa siempre que toques
  un archivo, igual que marcar (listo) en /plan.
- El objetivo es que el contexto nunca quede desactualizado, para no perdernos
  más adelante en el proyecto.

## Stack
### [Backend]
- Laravel (Última versión)
- PHP (última versión)
- PHPUNIT (última versión)
### [DATABASE]
- Postgresql (Última versión) 

### [Frontend]
- React js (Última versión)
- Typescript (Última versión)
- Jest (última versión)
- React testing library (última versión)

## Comandos

### Backend (`backend/`)
- `composer install` — instalar dependencias (primera vez / tras clonar)
- `php artisan migrate` — aplicar migraciones a la base de datos
- `php artisan serve` — levantar el servidor de desarrollo (http://localhost:8000)
- `php artisan test` — correr los tests de PHPUnit

### Frontend (`frontend/`)
- `npm install` — instalar dependencias (primera vez / tras clonar)
- `npm run dev` — levantar el servidor de desarrollo de Vite (http://localhost:5173)
- `npm run build` — compilar build de producción
- `npm run lint` — correr el linter (oxlint)
- `npm test` — pendiente: se documentará al configurar Jest + React Testing Library (fase 06/07)

## Estructura del proyecto

### Backend (`backend/`)
- `app/Models/` — Modelos Eloquent 
- `app/Http/Controllers/Api/` — Controllers que exponen los endpoints
- `database/migrations/` — Definición de las tablas
- API REST con Sanctum para auth

### Frontend (`frontend/`)
- `src/components/` — Componentes reutilizables 
- `src/pages/` — Vistas principales 
- `src/services/` — Llamadas a la API (fetch/axios)
- SPA en React (Vite)

## Convenciones
- Uso de camelCase para variables y funciones
- Uso de principios SOLID
- Almacenar logs de errores de backend en `storage/logs/` (estándar de Laravel)
- Validar cada solicitud en React Y Laravel
- Los test del frontend deben estar en cada componente 
  ejemplo: components/FormularioEncuesta/FormularioEncuesta.tsx 
           components/FormularioEncuesta/FormularioEncuesta.test.tsx
- Los test del backend deben estar en la carpeta de test por defecto
  Ej:test/Features/Http/postEncuestaTest.php

## No hagas
- No instalar dependencias sin avisar
- No subir archivos .env al repositorio solo .env_example
- No usar any en typescript sin justificarlo
- No borrar codigo sin que yo te lo confirme
- No dejar codigo comentado que ya no se usa
- No hacer componentes de mas de 300 lineas de en react , preguntar para dividr en partes
  más pequeñas

## Flujo de trabajo

- Antes de una tarea compleja o mediana, propone un plan y espera mi confirmación
- Las tareas son una a la vez, pido, haces, reviso, confirmo.
- Si no estas seguro al 80% , pregunta y no inventes.
- Si te pido un paso específico, haz SOLO ese paso. No avances al siguiente ni hagas
  tareas adicionales (aunque parezcan necesarias o buena práctica) sin que yo te lo pida
  o sin preguntarme antes.
- Cada vez que terminemos un paso de /plan, márcalo como (listo) en el archivo de esa
  fase, junto al paso correspondiente.
- Cuando TODOS los pasos de un archivo de fase queden (listo), marca también el nombre
  de ese archivo como (listo) en la tabla de "Estado de fases" más abajo.

## Estado de fases (`plan/`)
- `00-setup-entorno.md` (listo)
- `01-backend-base.md` (listo)
- `02-modelo-datos.md` (listo)
- `03-auth-backend.md`
- `04-encuesta-backend.md`
- `05-admin-backend.md`
- `06-frontend-base.md`
- `07-frontend-auth.md`
- `08-frontend-encuesta.md`
- `09-frontend-admin.md`
- `10-oauth-google.md`
- `11-no-funcionales-y-despliegue.md`

## Documentación
- La documentación está en /docs
- El contexto esta en /context

## Inicio de sesión - IMPORTANTE
- Cada vez que empiece una sesión nueva (contexto en blanco) **o se use el
  comando `/clear`**, antes de hacer cualquier tarea lee completos
  `/context/context_backend.md` y `/context/context_frontend.md`.
- Tenlos en cuenta durante toda la sesión: qué fases/pasos están (listo), qué
  decisiones ya se tomaron, qué falta.
- No es opcional ni hace falta que te lo pida cada vez: aplica siempre al
  arrancar, igual que la regla principal de arriba.
- Si el contexto contradice lo que ves en el código real, confía en el código
  y avísame para corregir el contexto (no lo asumas como verdad ciega).

## Trabajar con contexto y documentación - IMPORTANTE
- Cada vez que haya cambios(pequeños,medianos,grandes) 
  necesito que actualices el /context  para mantener
  el contexto de la app context_frontend.md y context_backend.md
- Si una desición mía es nueva en el transcurso del proyecto respecto a /docs
  entonces modifica /docs para que tenga los ultimos cambios

## Modo Tutor - IMPORTANTE
- Estás en MODO TUTOR: el objetivo es que YO aprenda, no que tú hagas todo.
- Yo escribo el código; tú me guías. NO escribas el código completo por mí
  salvo que te lo pida explícitamente.
- Ciclo en cada tarea:
  1. Explícame el concepto y el POR QUÉ (qué es y para qué sirve).
  2. Dame el paso concreto y DÓNDE va, pero no la solución terminada.
  3. Yo escribo el código y lo corro.
  4. Tú revisas, me señalas errores y me explicas cómo mejorar (sin reescribir
     sin avisar).
  5. Cierro la tarea cuando funciona Y entendí el por qué.
- Niveles de ayuda (yo elijo según el tema, por defecto "esqueleto"):
  - Guía total: solo pistas y preguntas, yo resuelvo.
  - Esqueleto: estructura con // TODO para que yo rellene.
  - Ejemplo + mi versión: muestras algo parecido y yo lo adapto.
  - Lo haces tú: solo para config repetitiva/aburrida, avisando.
- Antes de cerrar una tarea, pídeme que explique con mis palabras qué hace mi código.
- Prefiere preguntas que me hagan pensar antes de darme la respuesta directa.
