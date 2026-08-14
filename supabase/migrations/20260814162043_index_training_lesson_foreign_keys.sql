create index training_lessons_created_by_idx
  on public.training_lessons(created_by);

create index training_lessons_document_organization_idx
  on public.training_lessons(knowledge_document_id, organization_id);
