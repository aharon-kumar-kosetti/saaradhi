-- Saaradhi schema (v1.5). Run in the Supabase SQL editor.
-- Embedding dimension 768: set your embedding call (e.g. Gemini embeddings) to output 768 dims.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ---------- users ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'te' check (language in ('te','hi','en')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- reference data (readable by everyone, written by service role) ----------
create table if not exists trusted_registry (
  department text primary key,
  state text,                          -- 'AP' | 'TS' | 'IN'
  domains text[] not null default '{}',
  payment_gateways text[] not null default '{}',
  ref_regex text,
  helpline text,
  portal_url text,
  verified boolean not null default false,   -- NOT official until a human verifies
  last_verified date
);

create table if not exists glossary (
  term text primary key,
  telugu text,
  hindi text,
  notes text,
  reviewed boolean not null default false
);

create table if not exists kb_sources (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  title text not null,
  url text,
  language text not null check (language in ('te','hi','en')),
  last_verified date,
  created_at timestamptz not null default now()
);

create table if not exists kb_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references kb_sources(id) on delete cascade,
  content text not null,
  embedding vector(768),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists kb_chunks_embedding_idx on kb_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists kb_chunks_fts_idx on kb_chunks using gin (to_tsvector('simple', content));

create table if not exists form_guides (
  id uuid primary key default gen_random_uuid(),
  form_code text not null,
  department text not null,
  field_name text not null,
  instruction_te text,
  instruction_hi text,
  instruction_en text,
  where_to_find text,
  common_mistake text,
  source_ref uuid references kb_sources(id)
);

-- ---------- user data (logged-in users only; guests stay on-device) ----------
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  image_path text,
  category text check (category in ('health_insurance','financial_utility','community_service','scam_fraud','other')),
  department text,
  due_date date,
  amount numeric,
  status text not null default 'new' check (status in ('new','confirmed','explained','done','escalated')),
  created_at timestamptz not null default now()
);

create table if not exists extracted_fields (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references notices(id) on delete cascade,
  field text not null,
  value text,
  confidence real,
  confirmed boolean not null default false
);

create table if not exists scam_reports (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references notices(id) on delete cascade,
  label text not null check (label in ('safe','suspicious','dangerous','unsure')),
  reasons jsonb not null default '[]'::jsonb,
  signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references notices(id) on delete cascade,
  text text not null,
  kind text not null check (kind in ('document','step')),
  done boolean not null default false
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references notices(id) on delete cascade,
  fire_at timestamptz not null,
  kind text not null check (kind in ('t7','t3','t1','due_day','custom'))
);

create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid references notices(id) on delete set null,
  user_id uuid not null references profiles(id) on delete cascade,
  reason text not null check (reason in ('scam_unsure','no_kb_answer','low_ocr_confidence','user_request','wrong_translation')),
  summary text not null,
  consent boolean not null default false check (consent = true),
  status text not null default 'open' check (status in ('open','in_review','resolved')),
  reviewer_note text,
  created_at timestamptz not null default now()
);

-- ---------- hybrid retrieval ----------
create or replace function match_kb_chunks(
  query_embedding vector(768),
  query_text text,
  dept text default null,
  match_count int default 6
) returns table (chunk_id uuid, source_id uuid, content text, metadata jsonb, score float)
language sql stable as $$
  select c.id, c.source_id, c.content, c.metadata,
         (1 - (c.embedding <=> query_embedding))
         + 0.15 * ts_rank(to_tsvector('simple', c.content), plainto_tsquery('simple', query_text)) as score
  from kb_chunks c
  where dept is null or c.metadata->>'department' = dept
  order by score desc
  limit match_count;
$$;

-- ---------- row-level security ----------
alter table profiles enable row level security;
alter table notices enable row level security;
alter table extracted_fields enable row level security;
alter table scam_reports enable row level security;
alter table checklist_items enable row level security;
alter table reminders enable row level security;
alter table review_queue enable row level security;
alter table trusted_registry enable row level security;
alter table glossary enable row level security;
alter table kb_sources enable row level security;
alter table kb_chunks enable row level security;
alter table form_guides enable row level security;

create or replace function is_admin() returns boolean language sql stable security definer as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own notices" on notices for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own fields" on extracted_fields for all
  using (exists (select 1 from notices n where n.id = notice_id and n.user_id = auth.uid()))
  with check (exists (select 1 from notices n where n.id = notice_id and n.user_id = auth.uid()));
create policy "own scam reports" on scam_reports for all
  using (exists (select 1 from notices n where n.id = notice_id and n.user_id = auth.uid()))
  with check (exists (select 1 from notices n where n.id = notice_id and n.user_id = auth.uid()));
create policy "own checklist" on checklist_items for all
  using (exists (select 1 from notices n where n.id = notice_id and n.user_id = auth.uid()))
  with check (exists (select 1 from notices n where n.id = notice_id and n.user_id = auth.uid()));
create policy "own reminders" on reminders for all
  using (exists (select 1 from notices n where n.id = notice_id and n.user_id = auth.uid()))
  with check (exists (select 1 from notices n where n.id = notice_id and n.user_id = auth.uid()));

create policy "user inserts own queue item" on review_queue for insert with check (user_id = auth.uid());
create policy "user reads own queue item" on review_queue for select using (user_id = auth.uid() or is_admin());
create policy "admin updates queue" on review_queue for update using (is_admin());

create policy "read registry" on trusted_registry for select using (true);
create policy "read glossary" on glossary for select using (true);
create policy "read kb sources" on kb_sources for select using (true);
create policy "read kb chunks" on kb_chunks for select using (true);
create policy "read form guides" on form_guides for select using (true);

-- ---------- storage ----------
-- Dashboard: create a PRIVATE bucket named 'notices'. Store files at notices/{user_id}/{notice_id}.jpg
-- and add a storage policy so users can only read/write paths starting with their own auth.uid().
