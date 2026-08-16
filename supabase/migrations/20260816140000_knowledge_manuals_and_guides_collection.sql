-- Expands the permitted shared Knowledge Base collections without changing any documents.
alter table public.knowledge_documents
  drop constraint if exists knowledge_documents_collection_check;

alter table public.knowledge_documents
  add constraint knowledge_documents_collection_check
  check (collection in ('General', 'Product knowledge', 'Manuals and Guides', 'Policies', 'Sales process', 'Operations'));
