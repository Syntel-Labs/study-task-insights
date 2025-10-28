# Data Model – Study Task Insights (v1)

Este modelo está diseñado como un checklist académico controlado por un único administrador global. Permite:

- Definir tareas académicas, clasificarlas por tipo, prioridad, estado y etiquetas.
- Llevar un **histórico de tareas y sesiones de estudio**, con métricas semanales agregadas para evaluar desempeño.
- Consultar fácilmente el progreso de un periodo académico, por ejemplo: “¿cómo rendí en el primer semestre?”.
- Cambiar el estado de las tareas, agregar nuevas tareas o archivarlas, generando un histórico completo para análisis posterior (por LLM u otras herramientas de reporte).

> Nota: No hay múltiples usuarios ni login; todas las tareas y métricas se gestionan desde un punto de control único.

| Tabla                  | Tipo      | Propósito breve                                                                |
| ---------------------- | --------- | ------------------------------------------------------------------------------ |
| `terms`                | Catálogo  | Define periodos académicos (semestres/trimestres) para clasificar tareas.      |
| `task_statuses`        | Catálogo  | Estados de las tareas del checklist (`pending`, `in_progress`, `completed`).   |
| `task_priorities`      | Catálogo  | Prioridad de las tareas (`low`, `normal`, `high`, `urgent`).                   |
| `task_types`           | Catálogo  | Tipo/naturaleza de las tareas (`assignment`, `exam`, `project`).               |
| `task_tags`            | Catálogo  | Etiquetas globales para categorizar tareas (`proyecto-1`, `lectura`).          |
| `tasks`                | Principal | Checklist principal con título, descripción, fechas, estado, prioridad y tipo. |
| `task_tag_assignments` | Combinada | Asocia etiquetas a tareas (N:M).                                               |
| `study_sessions`       | Principal | Registra sesiones de estudio y duración para análisis histórico.               |
| `weekly_productivity`  | Principal | Métricas agregadas por semana para reportes y consultas de desempeño.          |

## 1. Tablas de catálogo

### 1.1 `terms`

Esta tabla representa los **periodos académicos** (por ejemplo, semestres o trimestres) en los cuales se agrupan las tareas y se registran métricas históricas. Cada registro define un periodo con fechas de inicio y fin, un nombre identificativo único y un estado que determina si el periodo está activo o inactivo.

**Relaciones:**

- **1:N** con `tasks` → cada periodo puede tener múltiples tareas asociadas.

**Columnas principales y finalidad:**

| Columna      | Tipo                                         | Req | Finalidad                                        |
| ------------ | -------------------------------------------- | :-: | ------------------------------------------------ |
| `term_id`    | `SMALLSERIAL PK`                             |  ✅  | Identificador único del periodo.                 |
| `name`       | `VARCHAR(80) UNIQUE`                         |  ✅  | Nombre corto y único del periodo, ej. `2025-S1`. |
| `start_date` | `DATE`                                       |  ✅  | Fecha de inicio del periodo académico.           |
| `end_date`   | `DATE`                                       |  ✅  | Fecha de fin del periodo académico.              |
| `status`     | `ENUM('active','inactive') DEFAULT 'active'` |  ✅  | Indica si el periodo está habilitado para uso.   |
| `created_at` | `TIMESTAMP TZ DEFAULT now()`                 |  ✅  | Fecha de creación del registro.                  |
| `updated_at` | `TIMESTAMP TZ DEFAULT now()`                 |  ✅  | Fecha de última modificación del registro.       |

### 1.2 `task_statuses`

Define los **estados posibles de cada tarea** dentro del checklist académico.

**Relaciones:**

- **1:N** con `tasks` → cada estado puede aplicarse a múltiples tareas.

**Columnas principales y finalidad:**

| Columna          | Tipo                         | Req | Finalidad                                                          |
| ---------------- | ---------------------------- | :-: | ------------------------------------------------------------------ |
| `task_status_id` | `SMALLSERIAL PK`             |  ✅  | Identificador único del estado.                                    |
| `code`           | `VARCHAR(40) UNIQUE`         |  ✅  | Código único y breve del estado, ej. `pending`.                    |
| `description`    | `VARCHAR(160)`               |  ❌  | Descripción opcional del estado.                                   |
| `is_final`       | `BOOLEAN DEFAULT FALSE`      |  ✅  | Indica si el estado representa un punto final del flujo de tareas. |
| `created_at`     | `TIMESTAMP TZ DEFAULT now()` |  ✅  | Fecha de creación del registro.                                    |

### 1.3 `task_priorities`

Define **la prioridad de cada tarea** dentro del checklist ya sea por código de la prioridad o por el indicador numérico para comparaciones (`weight`).

**Relaciones:**

- **1:N** con `tasks` → cada prioridad puede aplicarse a múltiples tareas.

**Columnas principales y finalidad:**

| Columna            | Tipo                         | Req | Finalidad                                |
| ------------------ | ---------------------------- | :-: | ---------------------------------------- |
| `task_priority_id` | `SMALLSERIAL PK`             |  ✅  | Identificador único de la prioridad.     |
| `code`             | `VARCHAR(30) UNIQUE`         |  ✅  | Código breve, ej. `high` o `urgent`.     |
| `weight`           | `SMALLINT DEFAULT 0`         |  ✅  | Valor numérico para ordenar prioridades. |
| `created_at`       | `TIMESTAMP TZ DEFAULT now()` |  ✅  | Fecha de creación del registro.          |

### 1.4 `task_types` — **Catálogo de tipos de tareas**

Esta tabla clasifica la **naturaleza académica de cada tarea**, como `assignment`, `exam`, `project`, `reading` u `other`.

**Relaciones:**

- **1:N** con `tasks` → cada tipo puede aplicarse a múltiples tareas.

**Columnas principales y finalidad:**

| Columna        | Tipo                         | Req | Finalidad                              |
| -------------- | ---------------------------- | :-: | -------------------------------------- |
| `task_type_id` | `SMALLSERIAL PK`             |  ✅  | Identificador único del tipo de tarea. |
| `code`         | `VARCHAR(40) UNIQUE`         |  ✅  | Código breve del tipo, ej. `exam`.     |
| `description`  | `VARCHAR(160)`               |  ❌  | Descripción opcional del tipo.         |
| `created_at`   | `TIMESTAMP TZ DEFAULT now()` |  ✅  | Fecha de creación del registro.        |

### 1.5 `task_tags` — **Catálogo de etiquetas globales**

Esta tabla contiene **etiquetas que se pueden asignar a las tareas**, como `proyecto-1`, `laboratorio` o `lectura`.

**Relaciones:**

- **N:M** con `tasks` → una etiqueta puede aplicarse a muchas tareas y una tarea puede tener muchas etiquetas.

**Columnas principales y finalidad:**

| Columna       | Tipo                         | Req | Finalidad                           |
| ------------- | ---------------------------- | :-: | ----------------------------------- |
| `task_tag_id` | `UUID PK`                    |  ✅  | Identificador único de la etiqueta. |
| `name`        | `VARCHAR(50) UNIQUE`         |  ✅  | Nombre de la etiqueta.              |
| `color`       | `VARCHAR(20)`                |  ❌  | Color asociado para UI.             |
| `created_at`  | `TIMESTAMP TZ DEFAULT now()` |  ✅  | Fecha de creación del registro.     |

## 2. Tablas principales

### 2.1 `tasks` — **Checklist principal**

Contiene los **ítems del checklist académico** que el usuario principal controla. Aquí se gestionan las tareas que forman parte del historial académico: se pueden crear, cambiar de estado, priorizar, archivar o asociar a un periodo académico (semestre). Cada tarea puede tener un tipo, prioridad, estado, etiquetas y un historial de sesiones de estudio, permitiendo análisis y reportes posteriores, incluso para el LLM que consulte el rendimiento histórico.

**Relaciones:**

- **N:1** con `terms`, `task_statuses`, `task_priorities`, `task_types` → permite clasificar y filtrar tareas por semestre, estado, prioridad y tipo.
- **N:M** con `task_tags` mediante `task_tag_assignments` → una tarea puede tener múltiples etiquetas para clasificación flexible.
- **1:N** con `study_sessions` → cada tarea puede tener varias sesiones de estudio registradas para métricas de esfuerzo y tiempo.

**Columnas principales y finalidad:**

| Columna             | Tipo                                              | Req | Finalidad                                                                  |
| ------------------- | ------------------------------------------------- | :-: | -------------------------------------------------------------------------- |
| `task_id`           | `UUID PK`                                         |  ✅  | Identificador único de la tarea.                                           |
| `term_id`           | `SMALLINT FK -> terms.term_id`                    |  ❌  | Asociar la tarea a un semestre o periodo académico.                        |
| `task_status_id`    | `SMALLINT FK -> task_statuses.task_status_id`     |  ✅  | Estado actual de la tarea (pendiente, en progreso, completada, archivada). |
| `task_priority_id`  | `SMALLINT FK -> task_priorities.task_priority_id` |  ✅  | Prioridad asignada para organizar el checklist.                            |
| `task_type_id`      | `SMALLINT FK -> task_types.task_type_id`          |  ✅  | Clasificación académica de la tarea (examen, proyecto, lectura, etc.).     |
| `title`             | `VARCHAR(160)`                                    |  ✅  | Nombre o título breve de la tarea.                                         |
| `description`       | `TEXT`                                            |  ❌  | Detalles adicionales de la tarea.                                          |
| `due_at`            | `TIMESTAMP TZ`                                    |  ❌  | Fecha límite de entrega o realización.                                     |
| `estimated_minutes` | `INTEGER CHECK (estimated_minutes >= 0)`          |  ❌  | Tiempo estimado para completar la tarea.                                   |
| `actual_minutes`    | `INTEGER CHECK (actual_minutes >= 0)`             |  ❌  | Tiempo real invertido en la tarea (puede derivarse de sesiones).           |
| `completed_at`      | `TIMESTAMP TZ`                                    |  ❌  | Fecha en que la tarea fue completada.                                      |
| `archived_at`       | `TIMESTAMP TZ`                                    |  ❌  | Fecha de archivado lógico, si corresponde.                                 |
| `created_at`        | `TIMESTAMP TZ DEFAULT now()`                      |  ✅  | Fecha de creación del registro.                                            |
| `updated_at`        | `TIMESTAMP TZ DEFAULT now()`                      |  ✅  | Fecha de última actualización del registro.                                |

### 2.2 `task_tag_assignments` — **Relación Tarea–Etiqueta (N:M)**

Esta tabla actúa como **puente entre tareas y etiquetas**, permitiendo asignar múltiples etiquetas a cada tarea de manera flexible. Cada combinación tarea–etiqueta es única, evitando duplicados y asegurando integridad. Esto facilita la clasificación de tareas por temáticas, proyectos o cualquier criterio definido en `task_tags`.

**Relaciones:**

- **N:1** con `tasks` → cada asignación pertenece a una tarea específica.
- **N:1** con `task_tags` → cada asignación refiere a una etiqueta específica.

**Columnas principales y finalidad:**

| Columna                  | Tipo                               | Req | Finalidad                                |
| ------------------------ | ---------------------------------- | :-: | ---------------------------------------- |
| `task_tag_assignment_id` | `UUID PK`                          |  ✅  | Identificador único de la asignación.    |
| `task_id`                | `UUID FK -> tasks.task_id`         |  ✅  | La tarea a la que se asigna la etiqueta. |
| `task_tag_id`            | `UUID FK -> task_tags.task_tag_id` |  ✅  | La etiqueta asignada a la tarea.         |
| `created_at`             | `TIMESTAMP TZ DEFAULT now()`       |  ✅  | Fecha de creación de la relación.        |

**Restricciones:**

- `UNIQUE (task_id, task_tag_id)` → asegura que no se repita la misma etiqueta en una tarea.

### 2.3 `study_sessions` — **Sesiones de estudio**

Esta tabla registra **sesiones de estudio reales**, incluyendo inicio, fin y duración calculada automáticamente. Está pensada para **analizar el rendimiento académico y la productividad**, permitiendo generar métricas agregadas y reportes históricos. Idealmente, cada sesión **debería estar vinculada a una tarea específica**.

**Relaciones:**

- **N:1** con `tasks` → cada sesión pertenece a una tarea. Se recomienda que esta relación sea obligatoria (`NOT NULL`) para asegurar integridad en métricas y reportes.

**Columnas principales y finalidad:**

| Columna            | Tipo                                                                                         | Req | Finalidad                                 |
| ------------------ | -------------------------------------------------------------------------------------------- | :-: | ----------------------------------------- |
| `study_session_id` | `UUID PK`                                                                                    |  ✅  | Identificador único de la sesión.         |
| `task_id`          | `UUID FK -> tasks.task_id`                                                                   |  ✅  | Tarea asociada (recomendado obligatorio). |
| `started_at`       | `TIMESTAMP TZ`                                                                               |  ✅  | Hora de inicio de la sesión.              |
| `ended_at`         | `TIMESTAMP TZ`                                                                               |  ✅  | Hora de fin de la sesión.                 |
| `duration_minutes` | `INTEGER GENERATED ALWAYS AS ((EXTRACT(EPOCH FROM (ended_at - started_at))/60)::int) STORED` |  ✅  | Duración calculada automáticamente.       |
| `notes`            | `TEXT`                                                                                       |  ❌  | Observaciones opcionales de la sesión.    |
| `created_at`       | `TIMESTAMP TZ DEFAULT now()`                                                                 |  ✅  | Fecha de creación del registro.           |

### 2.4 `weekly_productivity` — **Materialized view de métricas semanales**

Esta **materialized view** consolida automáticamente resúmenes semanales de desempeño académico a partir de `tasks` y `study_sessions`. Permite generar reportes y responder consultas del tipo: “¿cómo rendí en el primer semestre?”. Cada registro corresponde a una **semana ISO de un año**, consolidando tareas creadas, completadas, tiempo estimado y tiempo real invertido.

**Columnas principales y finalidad:**

| Columna                   | Tipo                                         | Req | Finalidad                                         |
| ------------------------- | -------------------------------------------- | :-: | ------------------------------------------------- |
| `weekly_productivity_id`  | `UUID PK`                                    |  ✅  | Identificador único de la métrica semanal.        |
| `iso_year`                | `INTEGER`                                    |  ✅  | Año ISO.                                          |
| `iso_week`                | `SMALLINT CHECK (iso_week BETWEEN 1 AND 53)` |  ✅  | Número de semana ISO.                             |
| `tasks_created`           | `INTEGER DEFAULT 0`                          |  ✅  | Total de tareas creadas en la semana.             |
| `tasks_completed`         | `INTEGER DEFAULT 0`                          |  ✅  | Total de tareas completadas.                      |
| `completion_rate`         | `NUMERIC(5,2)`                               |  ✅  | Porcentaje completado.                            |
| `planned_minutes`         | `INTEGER DEFAULT 0`                          |  ✅  | Suma de estimaciones de tiempo planificado.       |
| `actual_minutes`          | `INTEGER DEFAULT 0`                          |  ✅  | Suma de tiempo real invertido (`study_sessions`). |
| `avg_completion_time_min` | `INTEGER`                                    |  ❌  | Promedio de tiempo entre creación y completado.   |
| `created_at`              | `TIMESTAMP TZ DEFAULT now()`                 |  ✅  | Fecha de creación del registro.                   |
| `updated_at`              | `TIMESTAMP TZ DEFAULT now()`                 |  ✅  | Fecha de última actualización.                    |

**Restricciones clave:**

- `UNIQUE (iso_year, iso_week)` → garantiza un registro por semana.

## 3. Índices

> **Objetivo**: acelerar filtros típicos del checklist, calendarios y agregaciones, y garantizar unicidad donde corresponde.

- **`tasks(task_status_id)`**
  
  **Por qué**: vistas del checklist por estado son frecuentes (pendientes, en progreso, completadas).
  
  **Beneficio**: filtra rápido por estado actual sin escanear toda la tabla.

- **`tasks(task_priority_id)`**
  
  **Por qué**: ordenar/filtrar por prioridad para decidir foco del día.
  
  **Beneficio**: permite “top tareas urgentes” eficiente.

- **`tasks(due_at)`**
  
  **Por qué**: calendarios y recordatorios se basan en deadlines.
  
  **Beneficio**: rangos por fecha (semana/mes) más rápidos.

- **`tasks(term_id, due_at)`**
  
  **Por qué**: consultas históricas por **semestre** y ventana temporal (ej. “S1 2025, próximos vencimientos”).
  
  **Beneficio**: combinación de filtro por término + orden cronológico.

- **`task_tag_assignments(task_id, task_tag_id)` (UNIQUE)**
  
  **Por qué**: evitar duplicar etiquetas en una tarea y acelerar búsquedas por combinación.
  
  **Beneficio**: integridad y joins N:M más eficientes.

- **`study_sessions(task_id, started_at)`**
  
  **Por qué**: obtener el historial de tiempo por tarea en orden temporal.
  
  **Beneficio**: cargas para gráficos/series de tiempo sin “filesort”.

- **`weekly_productivity(iso_year, iso_week)` (UNIQUE)**
  
  **Por qué**: acceso directo a la semana solicitada y garantía de un registro por semana.
  
  **Beneficio**: reportes semanales y agregaciones consistentes.
