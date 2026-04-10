-- ============================================================
-- Execute no SQL Editor do Supabase
-- Dashboard → SQL Editor → New Query → Cole e clique em Run
-- ============================================================

-- Tabela de categorias (dinâmicas, criadas pelo usuário)
create table if not exists categorias (
  id        uuid default gen_random_uuid() primary key,
  nome      text not null,
  cor       text not null default 'bg-gray-100 text-gray-700',
  criado_em timestamptz default now()
);

-- Tabela de registros (usa FK para categorias)
create table if not exists registros (
  id            uuid default gen_random_uuid() primary key,
  titulo        text not null,
  conteudo      text not null default '',
  categoria_id  uuid references categorias(id) on delete set null,
  criado_por    uuid references auth.users(id) on delete set null,
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Tabela de anexos
create table if not exists anexos (
  id          uuid default gen_random_uuid() primary key,
  registro_id uuid references registros(id) on delete cascade not null,
  nome        text not null,
  url         text not null,
  tipo        text not null check (tipo in ('imagem','pdf')),
  tamanho     bigint not null default 0,
  criado_em   timestamptz default now()
);

-- Índices
create index if not exists registros_categoria_idx on registros(categoria_id);
create index if not exists registros_criado_em_idx on registros(criado_em desc);
create index if not exists anexos_registro_id_idx  on anexos(registro_id);

-- Trigger para atualizar atualizado_em automaticamente
create or replace function atualizar_timestamp()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_atualizar_registro
  before update on registros
  for each row execute function atualizar_timestamp();

-- ============================================================
-- RLS — Apenas usuários autenticados acessam
-- ============================================================
alter table categorias enable row level security;
alter table registros   enable row level security;
alter table anexos      enable row level security;

create policy "autenticados leem categorias"   on categorias for select to authenticated using (true);
create policy "autenticados criam categorias"  on categorias for insert to authenticated with check (true);
create policy "autenticados editam categorias" on categorias for update to authenticated using (true);
create policy "autenticados excluem categorias" on categorias for delete to authenticated using (true);

create policy "autenticados leem registros"    on registros for select to authenticated using (true);
create policy "autenticados criam registros"   on registros for insert to authenticated with check (true);
create policy "autenticados editam registros"  on registros for update to authenticated using (true);
create policy "autenticados excluem registros" on registros for delete to authenticated using (true);

create policy "autenticados leem anexos"       on anexos for select to authenticated using (true);
create policy "autenticados criam anexos"      on anexos for insert to authenticated with check (true);
create policy "autenticados excluem anexos"    on anexos for delete to authenticated using (true);

-- ============================================================
-- Storage
-- ============================================================
insert into storage.buckets (id, name, public) values ('imagens',    'imagens',    true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('documentos', 'documentos', true) on conflict do nothing;

create policy "upload imagens"     on storage.objects for insert to authenticated with check (bucket_id = 'imagens');
create policy "ver imagens"        on storage.objects for select using (bucket_id = 'imagens');
create policy "excluir imagens"    on storage.objects for delete to authenticated using (bucket_id = 'imagens');
create policy "upload documentos"  on storage.objects for insert to authenticated with check (bucket_id = 'documentos');
create policy "ver documentos"     on storage.objects for select using (bucket_id = 'documentos');
create policy "excluir documentos" on storage.objects for delete to authenticated using (bucket_id = 'documentos');

-- ============================================================
-- Categorias iniciais de exemplo (opcional — pode apagar)
-- ============================================================
insert into categorias (nome, cor) values
  ('Bug / Erro',       'bg-red-100 text-red-700'),
  ('Procedimento',     'bg-blue-100 text-blue-700'),
  ('Dúvida Frequente', 'bg-yellow-100 text-yellow-700'),
  ('Configuração',     'bg-purple-100 text-purple-700'),
  ('Outro',            'bg-gray-100 text-gray-700')
on conflict do nothing;
