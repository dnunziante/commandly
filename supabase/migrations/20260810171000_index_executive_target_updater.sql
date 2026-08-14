create index executive_targets_updated_by_idx
on public.executive_targets(updated_by)
where updated_by is not null;
