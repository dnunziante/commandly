-- Preserve the existing destination fee as TP Destination, then add RR Destination.
alter table public.locations
  add column if not exists tp_destination_fee_cents integer not null default 0 check (tp_destination_fee_cents >= 0),
  add column if not exists rr_destination_fee_cents integer not null default 0 check (rr_destination_fee_cents >= 0);

update public.locations
set tp_destination_fee_cents = shipping_destination_fee_cents
where tp_destination_fee_cents = 0 and shipping_destination_fee_cents <> 0;
