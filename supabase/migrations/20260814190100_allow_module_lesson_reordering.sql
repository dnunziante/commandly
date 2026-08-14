-- Lesson positions are normalized by the application. Avoid transient uniqueness
-- conflicts when an administrator swaps two existing lesson positions.
alter table public.training_module_lessons
  drop constraint training_module_lessons_module_id_sort_order_key;
