-- Tenant-safe Retrieval Augmented Generation (RAG) fields. Original files remain
-- in private Storage; searchable chunks live separately in this table.
create extension if not exists vector with schema extensions;

alter type public.knowledge_document_status add value if not exists 'failed';

alter table public.products
  add constraint products_id_organization_id_key unique (id, organization_id);

alter table public.knowledge_documents
  add column if not exists tenant_id uuid generated always as (organization_id) stored,
  add column if not exists location_id uuid,
  add column if not exists product_id uuid,
  add column if not exists processing_error text,
  add column if not exists processed_at timestamptz;

alter table public.knowledge_documents
  drop constraint if exists knowledge_documents_location_tenant_fkey,
  drop constraint if exists knowledge_documents_product_tenant_fkey;

alter table public.knowledge_documents
  add constraint knowledge_documents_location_tenant_fkey
    foreign key (location_id, organization_id)
    references public.locations (id, organization_id) on delete set null (location_id),
  add constraint knowledge_documents_product_tenant_fkey
    foreign key (product_id, organization_id)
    references public.products (id, organization_id) on delete set null (product_id);

alter table public.knowledge_document_chunks
  add column if not exists tenant_id uuid generated always as (organization_id) stored,
  add column if not exists location_id uuid,
  add column if not exists product_id uuid,
  add column if not exists page_number integer,
  add column if not exists section text,
  add column if not exists embedding extensions.vector(1536),
  add column if not exists embedding_model text;

alter table public.knowledge_document_chunks
  drop constraint if exists knowledge_document_chunks_location_tenant_fkey,
  drop constraint if exists knowledge_document_chunks_product_tenant_fkey;

alter table public.knowledge_document_chunks
  add constraint knowledge_document_chunks_location_tenant_fkey
    foreign key (location_id, organization_id)
    references public.locations (id, organization_id) on delete set null (location_id),
  add constraint knowledge_document_chunks_product_tenant_fkey
    foreign key (product_id, organization_id)
    references public.products (id, organization_id) on delete set null (product_id);

create index if not exists knowledge_chunks_tenant_document_idx
  on public.knowledge_document_chunks (tenant_id, document_id, chunk_index);
create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_document_chunks using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null;

create or replace function public.match_knowledge_chunks(
  query_embedding extensions.vector(1536),
  match_tenant_id uuid,
  match_location_id uuid default null,
  match_product_id uuid default null,
  match_count integer default 8
)
returns table (
  chunk_id uuid,
  document_id uuid,
  document_name text,
  content text,
  section text,
  page_number integer,
  location_id uuid,
  product_id uuid,
  similarity double precision
)
language sql
security invoker
set search_path = public, extensions
as $$
  select
    chunk.id,
    chunk.document_id,
    document.title,
    chunk.content,
    chunk.section,
    chunk.page_number,
    chunk.location_id,
    chunk.product_id,
    1 - (chunk.embedding <=> query_embedding) as similarity
  from public.knowledge_document_chunks chunk
  join public.knowledge_documents document
    on document.id = chunk.document_id
   and document.organization_id = chunk.organization_id
  where chunk.tenant_id = match_tenant_id
    and document.status = 'ready'
    and chunk.embedding is not null
    and (match_location_id is null or chunk.location_id is null or chunk.location_id = match_location_id)
    and (match_product_id is null or chunk.product_id is null or chunk.product_id = match_product_id)
    and (private.is_org_member(match_tenant_id) or private.is_platform_owner())
  order by chunk.embedding <=> query_embedding
  limit greatest(1, least(match_count, 12));
$$;

revoke all on function public.match_knowledge_chunks(extensions.vector, uuid, uuid, uuid, integer) from public, anon;
grant execute on function public.match_knowledge_chunks(extensions.vector, uuid, uuid, uuid, integer) to authenticated;
