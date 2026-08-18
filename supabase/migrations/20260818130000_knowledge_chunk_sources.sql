-- Keep each indexed excerpt self-describing while preserving the document FK as
-- the canonical source relationship.
alter table public.knowledge_document_chunks
  add column if not exists source_name text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.knowledge_document_chunks chunk
set source_name = document.original_filename
from public.knowledge_documents document
where document.id = chunk.document_id
  and document.organization_id = chunk.organization_id
  and chunk.source_name is null;

alter table public.knowledge_document_chunks
  alter column source_name set not null;
