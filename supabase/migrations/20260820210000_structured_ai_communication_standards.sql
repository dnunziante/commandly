-- Tenant-owned communication behavior. Factual knowledge remains in knowledge_documents/products.
alter table public.organization_settings
  add column if not exists ai_tone text not null default 'conversational' check (ai_tone in ('professional','conversational','friendly','direct','consultative')),
  add column if not exists ai_response_length text not null default 'balanced' check (ai_response_length in ('concise','balanced','detailed')),
  add column if not exists ai_sales_approach text not null default 'consultative' check (ai_sales_approach in ('consultative','educational','direct','relationship_focused')),
  add column if not exists ai_discovery_level text not null default 'moderate' check (ai_discovery_level in ('minimal','moderate','thorough')),
  add column if not exists ai_competitor_behavior text not null default 'when_asked' check (ai_competitor_behavior in ('do_not_discuss','when_asked','when_helpful')),
  add column if not exists ai_cta_strength text not null default 'balanced' check (ai_cta_strength in ('soft','balanced','strong')),
  add column if not exists ai_formatting jsonb not null default '{"shortParagraphs":true,"bullets":true,"headings":true,"avoidLargeBlocks":true}'::jsonb,
  add column if not exists ai_recommendation_behavior jsonb not null default '{"askDiscoveryBeforeRecommendation":true,"explainRecommendation":true,"offerAlternative":true,"connectBenefits":true}'::jsonb,
  add column if not exists ai_advanced_instructions text not null default '';

-- Preserve current customer guidance as the migration-compatible advanced layer.
update public.organization_settings
set ai_advanced_instructions = coalesce(nullif(communication_rules, ''), nullif(assistant_instructions, ''), '')
where ai_advanced_instructions = '';
