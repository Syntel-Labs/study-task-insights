-- Seed de datos demo (solo si SEED_DEMO=true)
-- Genera tareas y study_sessions distribuidas en ~8 semanas para poblar gráficos y métricas.
SET search_path TO sti, public;

-- Limpia datos previos de demo (no toca catálogos)
TRUNCATE TABLE sti.study_sessions, sti.task_tag_assignments, sti.tasks RESTART IDENTITY CASCADE;

-- IDs de catálogo (para reutilizar en los INSERT)
DO $$
DECLARE
    v_term_id          SMALLINT;
    v_status_pending   SMALLINT;
    v_status_progress  SMALLINT;
    v_status_completed SMALLINT;
    v_status_archived  SMALLINT;
    v_prio_low         SMALLINT;
    v_prio_normal      SMALLINT;
    v_prio_high        SMALLINT;
    v_prio_urgent      SMALLINT;
    v_type_assignment  SMALLINT;
    v_type_exam        SMALLINT;
    v_type_project     SMALLINT;
    v_type_reading     SMALLINT;
    v_type_other       SMALLINT;
    v_tag_math         UUID;
    v_tag_reading      UUID;
    v_tag_project1     UUID;
    v_tag_research     UUID;
    v_tag_finals       UUID;

    -- IDs generados para reutilizar
    v_task_id          UUID;
    v_session_id       UUID;
    v_base_date        TIMESTAMPTZ := now() - INTERVAL '56 days';

    -- Config de generación
    i INTEGER;
    v_week_offset      INTEGER;
    v_day_offset       INTEGER;
    v_title_idx        INTEGER;
    v_titles TEXT[] := ARRAY[
        'Resolver problemas de cálculo integral',
        'Leer capítulo sobre álgebra lineal',
        'Preparar examen parcial de estadística',
        'Entrega parcial de proyecto final',
        'Investigar paper sobre redes neuronales',
        'Ensayo de literatura contemporánea',
        'Laboratorio de física cuántica',
        'Análisis de caso de estudio',
        'Preparación de presentación oral',
        'Quiz sorpresa de química orgánica',
        'Tarea de programación en Python',
        'Revisión de notas de historia',
        'Ejercicios de inglés técnico',
        'Redacción de informe de prácticas',
        'Simulacro de examen final',
        'Estudio grupal de macroeconomía',
        'Taller de diseño UX',
        'Investigación bibliográfica',
        'Entrega de proyecto colaborativo',
        'Repaso general para finales'
    ];

BEGIN
    -- Recupera IDs reales de catálogos
    SELECT term_id INTO v_term_id FROM sti.terms WHERE name = '2025-S1' LIMIT 1;

    SELECT task_status_id INTO v_status_pending   FROM sti.task_statuses WHERE code = 'pending';
    SELECT task_status_id INTO v_status_progress  FROM sti.task_statuses WHERE code = 'in_progress';
    SELECT task_status_id INTO v_status_completed FROM sti.task_statuses WHERE code = 'completed';
    SELECT task_status_id INTO v_status_archived  FROM sti.task_statuses WHERE code = 'archived';

    SELECT task_priority_id INTO v_prio_low    FROM sti.task_priorities WHERE code = 'low';
    SELECT task_priority_id INTO v_prio_normal FROM sti.task_priorities WHERE code = 'normal';
    SELECT task_priority_id INTO v_prio_high   FROM sti.task_priorities WHERE code = 'high';
    SELECT task_priority_id INTO v_prio_urgent FROM sti.task_priorities WHERE code = 'urgent';

    SELECT task_type_id INTO v_type_assignment FROM sti.task_types WHERE code = 'assignment';
    SELECT task_type_id INTO v_type_exam       FROM sti.task_types WHERE code = 'exam';
    SELECT task_type_id INTO v_type_project    FROM sti.task_types WHERE code = 'project';
    SELECT task_type_id INTO v_type_reading    FROM sti.task_types WHERE code = 'reading';
    SELECT task_type_id INTO v_type_other      FROM sti.task_types WHERE code = 'other';

    SELECT task_tag_id INTO v_tag_math     FROM sti.task_tags WHERE name = 'matemática';
    SELECT task_tag_id INTO v_tag_reading  FROM sti.task_tags WHERE name = 'lectura';
    SELECT task_tag_id INTO v_tag_project1 FROM sti.task_tags WHERE name = 'proyecto-1';
    SELECT task_tag_id INTO v_tag_research FROM sti.task_tags WHERE name = 'investigación';
    SELECT task_tag_id INTO v_tag_finals   FROM sti.task_tags WHERE name = 'finales';

    -- Generar 24 tareas distribuidas en 8 semanas (3 por semana)
    FOR i IN 0..23 LOOP
        v_week_offset := i / 3;                  -- 0..7
        v_day_offset  := (i % 3) * 2;            -- 0, 2, 4
        v_title_idx   := (i % 20) + 1;           -- rota entre 20 títulos

        v_task_id := gen_random_uuid();

        -- Variedad de estado según semana: las últimas 2 semanas tienen pending/in_progress,
        -- las anteriores tienen más completadas.
        INSERT INTO sti.tasks (
            task_id, term_id,
            task_status_id, task_priority_id, task_type_id,
            title, description,
            due_at, estimated_minutes, actual_minutes,
            completed_at, archived_at,
            created_at, updated_at
        )
        VALUES (
            v_task_id,
            v_term_id,
            -- Status: semana 0-1 = pending/in_progress, semana 2-5 = completed, semana 6-7 = archived
            CASE
                WHEN v_week_offset <= 1 THEN
                    CASE WHEN i % 2 = 0 THEN v_status_pending ELSE v_status_progress END
                WHEN v_week_offset <= 5 THEN v_status_completed
                ELSE v_status_archived
            END,
            -- Prioridad rotativa
            CASE (i % 4)
                WHEN 0 THEN v_prio_low
                WHEN 1 THEN v_prio_normal
                WHEN 2 THEN v_prio_high
                ELSE v_prio_urgent
            END,
            -- Tipo rotativo
            CASE (i % 5)
                WHEN 0 THEN v_type_assignment
                WHEN 1 THEN v_type_exam
                WHEN 2 THEN v_type_project
                WHEN 3 THEN v_type_reading
                ELSE v_type_other
            END,
            v_titles[v_title_idx] || ' #' || (i + 1),
            'Tarea de demostración generada automáticamente para visualizar métricas y gráficos.',
            v_base_date + (v_week_offset * INTERVAL '7 days') + (v_day_offset * INTERVAL '1 day') + INTERVAL '18 hours',
            30 + ((i * 17) % 180),               -- 30..209 min estimados
            CASE
                WHEN v_week_offset > 1 THEN 20 + ((i * 23) % 200)
                ELSE NULL
            END,
            CASE
                WHEN v_week_offset BETWEEN 2 AND 7 THEN
                    v_base_date + (v_week_offset * INTERVAL '7 days') + (v_day_offset * INTERVAL '1 day') + INTERVAL '20 hours'
                ELSE NULL
            END,
            CASE
                WHEN v_week_offset >= 6 THEN
                    v_base_date + (v_week_offset * INTERVAL '7 days') + (v_day_offset * INTERVAL '1 day') + INTERVAL '22 hours'
                ELSE NULL
            END,
            v_base_date + (v_week_offset * INTERVAL '7 days') + (v_day_offset * INTERVAL '1 day'),
            v_base_date + (v_week_offset * INTERVAL '7 days') + (v_day_offset * INTERVAL '1 day')
        );

        -- Asignar 1-2 tags según tipo
        INSERT INTO sti.task_tag_assignments (task_tag_assignment_id, task_id, task_tag_id)
        VALUES (
            gen_random_uuid(),
            v_task_id,
            CASE (i % 5)
                WHEN 0 THEN v_tag_math
                WHEN 1 THEN v_tag_finals
                WHEN 2 THEN v_tag_project1
                WHEN 3 THEN v_tag_reading
                ELSE v_tag_research
            END
        );

        -- Un segundo tag para tareas pares
        IF i % 2 = 0 AND v_tag_finals IS NOT NULL THEN
            INSERT INTO sti.task_tag_assignments (task_tag_assignment_id, task_id, task_tag_id)
            VALUES (gen_random_uuid(), v_task_id, v_tag_finals)
            ON CONFLICT (task_id, task_tag_id) DO NOTHING;
        END IF;

        -- Crear 1-2 study_sessions para tareas que no son pending
        IF v_week_offset > 0 THEN
            v_session_id := gen_random_uuid();
            INSERT INTO sti.study_sessions (
                study_session_id, task_id,
                started_at, ended_at, notes
            )
            VALUES (
                v_session_id,
                v_task_id,
                v_base_date + (v_week_offset * INTERVAL '7 days') + (v_day_offset * INTERVAL '1 day') + INTERVAL '15 hours',
                v_base_date + (v_week_offset * INTERVAL '7 days') + (v_day_offset * INTERVAL '1 day') + INTERVAL '16 hours 30 minutes',
                'Sesión demo: enfoque productivo'
            );

            -- Sesión adicional para variedad
            IF i % 3 = 0 THEN
                INSERT INTO sti.study_sessions (
                    study_session_id, task_id,
                    started_at, ended_at, notes
                )
                VALUES (
                    gen_random_uuid(),
                    v_task_id,
                    v_base_date + (v_week_offset * INTERVAL '7 days') + ((v_day_offset + 1) * INTERVAL '1 day') + INTERVAL '10 hours',
                    v_base_date + (v_week_offset * INTERVAL '7 days') + ((v_day_offset + 1) * INTERVAL '1 day') + INTERVAL '11 hours 15 minutes',
                    'Sesión demo: repaso ligero'
                );
            END IF;
        END IF;
    END LOOP;

    -- Refresca la materialized view
    REFRESH MATERIALIZED VIEW sti.weekly_productivity;

    RAISE NOTICE 'Seed demo cargado: 24 tareas, ~30 sesiones, asignaciones de tags y MV refrescada.';
END $$;
