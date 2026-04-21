-- Usar siempre el esquema sti
SET search_path TO sti, public;

-- Limpiar contenido previo
TRUNCATE TABLE
    sti.task_tag_assignments,
    sti.tasks,
    sti.task_tags,
    sti.task_types,
    sti.task_priorities,
    sti.task_statuses,
    sti.terms
RESTART IDENTITY CASCADE;

-- ===========================
-- 1. TERMS (periodos académicos)
-- ===========================
INSERT INTO sti.terms (name, start_date, end_date, status)
VALUES
    ('2025-S1', '2025-01-15', '2025-06-15', 'active'),
    ('2025-S2', '2025-07-01', '2025-12-01', 'inactive');

-- ===========================
-- 2. TASK STATUSES
-- ===========================
INSERT INTO sti.task_statuses (code, description, is_final)
VALUES
    ('pending',       'Tarea pendiente por iniciar', FALSE),
    ('in_progress',   'Tarea actualmente en progreso', FALSE),
    ('completed',     'Tarea completada exitosamente', TRUE),
    ('archived',      'Tarea archivada (histórico)', TRUE);

-- ===========================
-- 3. TASK PRIORITIES
-- ===========================
INSERT INTO sti.task_priorities (code, weight)
VALUES
    ('low',     1),
    ('normal',  2),
    ('high',    3),
    ('urgent',  4);

-- ===========================
-- 4. TASK TYPES
-- ===========================
INSERT INTO sti.task_types (code, description)
VALUES
    ('assignment', 'Tareas académicas o trabajos prácticos'),
    ('exam',       'Exámenes o evaluaciones'),
    ('project',    'Proyectos o entregas largas'),
    ('reading',    'Lecturas o revisión de materiales'),
    ('other',      'Otro tipo de actividad académica');

-- ===========================
-- 5. TASK TAGS (etiquetas iniciales)
-- ===========================
INSERT INTO sti.task_tags (task_tag_id, name, color)
VALUES
    (gen_random_uuid(), 'matemática',    '#3B82F6'),
    (gen_random_uuid(), 'lectura',       '#10B981'),
    (gen_random_uuid(), 'proyecto-1',    '#F59E0B'),
    (gen_random_uuid(), 'investigación', '#8B5CF6'),
    (gen_random_uuid(), 'finales',       '#EF4444');
