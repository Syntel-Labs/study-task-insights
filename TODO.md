# ✅ Checklist general del proyecto "Study Task Insights"

## 1️⃣ Base del repositorio (ya realizada)

* [x] Crear estructura base del repositorio (frontend, backend, docs, tests, assets, postman).
* [x] Configurar package.json, pnpm, nodemon.json, vite.config.js.
* [x] Crear `.env.example` para backend y frontend.
* [x] Commit inicial con README base y estructura vacía de carpetas.

## 2️⃣ Documentación inicial

* [x] Llenar **About** del repositorio: descripción, stack, objetivos, badges.
* [ ] Crear **Topics** en GitHub: tags que describan stack y funcionalidades.
* [ ] Crear **Wiki** de GitHub:

  * Explicación del funcionamiento general.
  * FAQ para usuarios y colaboradores.
* [ ] Completar **README principal global**: resumen del proyecto, stack, links a docs y wiki.
* [ ] Crear **README para cada módulo**:

  * Backend: setup, scripts, tests.
  * Frontend: setup, scripts, pruebas visuales.

## 3️⃣ Modelado de datos y ORM

* [x] Diseñar **modelo de datos**: tablas, relaciones, ERD.
* [x] Implementar **Prisma / ORM** con el esquema diseñado.
* [x] Crear migraciones iniciales para la base de datos.

## 4️⃣ Backend

* [x] Definir **estructura de carpetas y módulos**: controllers, routes, services, middlewares.
* [x] Implementar **CRUD básico** de tareas (sin usuarios por ahora).
* [x] Integrar **base de datos** con ORM.
* [x] Añadir **logs y manejo de errores** básicos.
* [x] Configurar **scripts de desarrollo** y nodemon para hot reload.
* [x] Preparar **Postman collection** con endpoints.

## 5️⃣ Frontend

* [x] Idear vistas principales y componentes React:

  * Lista de tareas
  * Formulario de nueva tarea
  * Vista de análisis semanal (mock visual)
* [x] Conectar **frontend con backend** mediante fetch/axios.
* [x] Implementar **hooks y utils** para manejar estados y llamadas API.
* [x] Configurar **Vite + React** con alias y hot reload.

## 6️⃣ Variables de entorno y configuración

* [x] `.env.example` para frontend y backend con variables mínimas necesarias.
* [x] Configuración de puerto, base de datos y secretos.

## 7️⃣ Dockerización y despliegue

* [x] Crear **Dockerfile** para backend y frontend.
* [x] Crear **docker-compose** para levantar backend + frontend + DB local.
* [ ] Planear despliegue en hosting gratuito o cloud (Railway, Render, Fly.io, etc).
* [ ] Configurar **database deployment** (PostgreSQL).

## 8️⃣ Tests y documentación técnica

* [ ] Tests unitarios y de integración backend (Jest, Supertest).
* [ ] Tests básicos frontend si aplica (React Testing Library).
* [ ] Documentación técnica en `docs/`:

  * Setup del proyecto
  * Guía de despliegue
  * Testing
  * ERD y modelo de datos
  * Notas de arquitectura y decisiones técnicas

## 9️⃣ Funcionalidades futuras / extras

* [x] Implementar **modelo LLM** que reciba métricas de tareas y genere recomendaciones.
* [ ] Integrar **Wiki** con tutoriales de usuario, FAQs, screenshots y vídeos.
* [ ] Mejorar visualización y UX del frontend según métricas y feedback.
