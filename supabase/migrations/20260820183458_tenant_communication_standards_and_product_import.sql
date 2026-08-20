-- Keep AI communication guidance separate from factual knowledge, while reusing
-- the existing tenant-scoped document and chunk architecture.
alter table public.organization_settings
  add column if not exists communication_rules text not null default '';

update public.organization_settings
set communication_rules = assistant_instructions
where communication_rules = '' and assistant_instructions <> '';

alter table public.knowledge_documents
  add column if not exists context_type text not null default 'knowledge'
    check (context_type in ('knowledge', 'communication_example'));

create index if not exists knowledge_documents_tenant_context_idx
  on public.knowledge_documents (organization_id, context_type, status);

-- Product identity is tenant-owned and model-year specific. Flexible approved
-- specifications live in one structured JSON document rather than duplicating
-- the legacy catalog columns.
alter table public.products
  add column if not exists product_type text not null default 'our_product'
    check (product_type in ('our_product', 'competitor_product')),
  add column if not exists brand text not null default '',
  add column if not exists manufacturer text not null default '',
  add column if not exists model_year integer,
  add column if not exists model_variant text not null default '',
  add column if not exists product_category text not null default '',
  add column if not exists sale_price_cents integer check (sale_price_cents is null or sale_price_cents >= 0),
  add column if not exists specifications jsonb not null default '{}'::jsonb,
  add column if not exists source_name text not null default '',
  add column if not exists source_url text not null default '',
  add column if not exists verified_date date,
  add column if not exists import_file_name text not null default '',
  add column if not exists imported_by uuid references public.profiles(id) on delete set null,
  add column if not exists imported_at timestamptz;

alter table public.products
  add constraint products_model_year_reasonable check (model_year is null or model_year between 1900 and 2200);

create unique index if not exists products_tenant_identity_idx
  on public.products (organization_id, brand, model_year, name, model_variant, product_type)
  where brand <> '' and model_year is not null;

create index if not exists products_tenant_type_identity_idx
  on public.products (organization_id, product_type, brand, model_year, product_category);

-- Factual retrieval must never mix communication examples into approved facts.
create or replace function public.match_communication_chunks(
  query_embedding extensions.vector(1536),
  match_tenant_id uuid,
  match_count integer default 4
)
returns table (
  chunk_id uuid,
  document_id uuid,
  document_name text,
  content text,
  section text,
  page_number integer,
  similarity double precision
)
language sql
security invoker
set search_path = public, extensions
as $$
  select chunk.id, chunk.document_id, document.title, chunk.content, chunk.section,
    chunk.page_number, 1 - (chunk.embedding <=> query_embedding) as similarity
  from public.knowledge_document_chunks chunk
  join public.knowledge_documents document
    on document.id = chunk.document_id and document.organization_id = chunk.organization_id
  where chunk.tenant_id = match_tenant_id
    and document.context_type = 'communication_example'
    and document.status = 'ready'
    and chunk.embedding is not null
    and (private.is_org_member(match_tenant_id) or private.is_platform_owner())
  order by chunk.embedding <=> query_embedding
  limit greatest(1, least(match_count, 8));
$$;

revoke all on function public.match_communication_chunks(extensions.vector, uuid, integer) from public, anon;
grant execute on function public.match_communication_chunks(extensions.vector, uuid, integer) to authenticated;
