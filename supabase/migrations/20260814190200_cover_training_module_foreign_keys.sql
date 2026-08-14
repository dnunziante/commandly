-- Cover composite foreign keys used for tenant-safe module assignments.
drop index if exists public.training_module_lessons_lesson_idx;
create index training_module_lessons_lesson_organization_idx
  on public.training_module_lessons(lesson_id, organization_id);
create index training_module_lessons_module_organization_idx
  on public.training_module_lessons(module_id, organization_id);
