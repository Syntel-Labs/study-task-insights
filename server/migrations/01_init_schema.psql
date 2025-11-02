-- 1) DROP en orden seguro
DROP MATERIALIZED VIEW IF EXISTS weekly_productivity CASCADE;
DROP TABLE IF EXISTS
    study_sessions,
    task_tag_assignments,
    tasks,
    task_tags,
    task_types,
    task_priorities,
    task_statuses,
    terms
CASCADE;

-- 2) DROP de ENUMs si existieran
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'term_status') THEN
        DROP TYPE term_status;
    END IF;
END$$;

-- 3) ENUMs
CREATE TYPE term_status AS ENUM ('active', 'inactive');

-- 4) CATÁLOGOS
-- 4.1 terms
CREATE TABLE terms (
    term_id      SMALLSERIAL PRIMARY KEY,
    name         VARCHAR(80) UNIQUE NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    status       term_status NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (start_date <= end_date)
);

-- 4.2 task_statuses
CREATE TABLE task_statuses (
    task_status_id SMALLSERIAL PRIMARY KEY,
    code           VARCHAR(40) UNIQUE NOT NULL,
    description    VARCHAR(160),
    is_final       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.3 task_priorities
CREATE TABLE task_priorities (
    task_priority_id SMALLSERIAL PRIMARY KEY,
    code             VARCHAR(30) UNIQUE NOT NULL,
    weight           SMALLINT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.4 task_types
CREATE TABLE task_types (
    task_type_id SMALLSERIAL PRIMARY KEY,
    code         VARCHAR(40) UNIQUE NOT NULL,
    description  VARCHAR(160),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.5 task_tags
CREATE TABLE task_tags (
    task_tag_id UUID PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    color       VARCHAR(20),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) PRINCIPALES
-- 5.1 tasks
CREATE TABLE tasks (
    task_id           UUID PRIMARY KEY,
    term_id           SMALLINT REFERENCES terms(term_id) ON DELETE RESTRICT,
    task_status_id    SMALLINT NOT NULL REFERENCES task_statuses(task_status_id) ON DELETE RESTRICT,
    task_priority_id  SMALLINT NOT NULL REFERENCES task_priorities(task_priority_id) ON DELETE RESTRICT,
    task_type_id      SMALLINT NOT NULL REFERENCES task_types(task_type_id) ON DELETE RESTRICT,
    title             VARCHAR(160) NOT NULL,
    description       TEXT,
    due_at            TIMESTAMPTZ,
    estimated_minutes INTEGER CHECK (estimated_minutes >= 0),
    actual_minutes    INTEGER CHECK (actual_minutes >= 0),
    completed_at      TIMESTAMPTZ,
    archived_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.2 task_tag_assignments (N:M)
CREATE TABLE task_tag_assignments (
    task_tag_assignment_id UUID PRIMARY KEY,
    task_id                UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    task_tag_id            UUID NOT NULL REFERENCES task_tags(task_tag_id) ON DELETE RESTRICT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_task_tag UNIQUE (task_id, task_tag_id)
);

-- 5.3 study_sessions
CREATE TABLE study_sessions (
    study_session_id UUID PRIMARY KEY,
    task_id          UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    started_at       TIMESTAMPTZ NOT NULL,
    ended_at         TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        (EXTRACT(EPOCH FROM (ended_at - started_at)) / 60)::int
    ) STORED,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ended_at >= started_at)
);

-- 5.4 weekly_productivity (materialized view)
CREATE MATERIALIZED VIEW weekly_productivity AS
SELECT
  gen_random_uuid()                                         AS weekly_productivity_id,
  EXTRACT(YEAR FROM ss.started_at)::int                     AS iso_year,
  EXTRACT(WEEK FROM ss.started_at)::int                     AS iso_week,

  COUNT(DISTINCT t.task_id) FILTER (
    WHERE t.created_at >= date_trunc('week', ss.started_at)
      AND t.created_at <  date_trunc('week', ss.started_at) + interval '1 week'
  )::int                                                    AS tasks_created,

  COUNT(DISTINCT t.task_id) FILTER (
    WHERE t.completed_at >= date_trunc('week', ss.started_at)
      AND t.completed_at <  date_trunc('week', ss.started_at) + interval '1 week'
  )::int                                                    AS tasks_completed,

  CASE
    WHEN COUNT(DISTINCT t.task_id) FILTER (
           WHERE t.created_at >= date_trunc('week', ss.started_at)
             AND t.created_at <  date_trunc('week', ss.started_at) + interval '1 week'
         ) = 0
    THEN 0
    ELSE ROUND(
      COUNT(DISTINCT t.task_id) FILTER (
        WHERE t.completed_at >= date_trunc('week', ss.started_at)
          AND t.completed_at <  date_trunc('week', ss.started_at) + interval '1 week'
      )::numeric
      /
      COUNT(DISTINCT t.task_id) FILTER (
        WHERE t.created_at >= date_trunc('week', ss.started_at)
          AND t.created_at <  date_trunc('week', ss.started_at) + interval '1 week'
      )::numeric * 100, 2
    )
  END::float8                                               AS completion_rate,

  COALESCE(SUM(t.estimated_minutes), 0)::int                AS planned_minutes,
  COALESCE(SUM(ss.duration_minutes), 0)::int                AS actual_minutes,

  /* promedio en minutos entre creación y completado, solo tareas completadas esa semana */
  COALESCE(ROUND(AVG(
    EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 60.0
  ) FILTER (
    WHERE t.completed_at >= date_trunc('week', ss.started_at)
      AND t.completed_at <  date_trunc('week', ss.started_at) + interval '1 week'
  )), 0)::int                                               AS avg_completion_time_min,

  now()                                                     AS created_at,
  now()                                                     AS updated_at
FROM tasks t
LEFT JOIN study_sessions ss ON ss.task_id = t.task_id
GROUP BY iso_year, iso_week;

-- índice único
CREATE UNIQUE INDEX uq_weekly_productivity_week ON weekly_productivity (iso_year, iso_week);

-- 6) ÍNDICES (según consultas típicas)
-- tasks
CREATE INDEX idx_tasks_status        ON tasks (task_status_id);
CREATE INDEX idx_tasks_priority      ON tasks (task_priority_id);
CREATE INDEX idx_tasks_due_at        ON tasks (due_at);
CREATE INDEX idx_tasks_term_due      ON tasks (term_id, due_at);
CREATE UNIQUE INDEX ux_tasks_active_term_title_due
  ON tasks (term_id, lower(btrim(title)), due_at)
  WHERE archived_at IS NULL
    AND due_at IS NOT NULL;
CREATE UNIQUE INDEX ux_tasks_active_term_title_nodue
  ON tasks (term_id, lower(btrim(title)))
  WHERE archived_at IS NULL
    AND due_at IS NULL;

-- task_tag_assignments
CREATE INDEX idx_task_tag_assign_task  ON task_tag_assignments (task_id);
CREATE INDEX idx_task_tag_assign_tag   ON task_tag_assignments (task_tag_id);

-- study_sessions
CREATE INDEX idx_study_sessions_task_started ON study_sessions (task_id, started_at);
