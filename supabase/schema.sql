-- ============================================================
-- Sistema de Consignação de Brinquedos - Schema Supabase
-- ============================================================
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (Supabase Dashboard > SQL Editor > New query > colar e rodar)
-- ============================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabela: clients
-- ------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  document text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: products (estoque próprio do vendedor)
-- ------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_price numeric(10,2) not null default 0,
  stock_quantity integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: consignments (cada "envio" de brinquedos a um cliente)
-- ------------------------------------------------------------
create table if not exists consignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  sent_date timestamptz not null default now(),
  status text not null default 'ativo' check (status in ('ativo', 'finalizado')),
  payment_status text check (payment_status in ('pago', 'fiado', 'parcial')),
  amount_paid numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  profit_amount numeric(10,2) not null default 0,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: consignment_items (itens de cada consignação)
-- ------------------------------------------------------------
create table if not exists consignment_items (
  id uuid primary key default gen_random_uuid(),
  consignment_id uuid not null references consignments(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name_snapshot text not null,
  base_price_snapshot numeric(10,2) not null default 0,
  quantity_consigned integer not null default 0,
  quantity_sold integer not null default 0,
  unit_sale_price numeric(10,2),
  created_at timestamptz not null default now()
);

create index if not exists idx_consignments_client on consignments(client_id);
create index if not exists idx_items_consignment on consignment_items(consignment_id);

-- ------------------------------------------------------------
-- Habilitar acesso (modo de teste: liberado para a chave anon)
-- Ajuste as políticas depois se for usar autenticação de usuários.
-- ------------------------------------------------------------
alter table clients enable row level security;
alter table products enable row level security;
alter table consignments enable row level security;
alter table consignment_items enable row level security;

drop policy if exists "allow all clients" on clients;
create policy "allow all clients" on clients for all using (true) with check (true);

drop policy if exists "allow all products" on products;
create policy "allow all products" on products for all using (true) with check (true);

drop policy if exists "allow all consignments" on consignments;
create policy "allow all consignments" on consignments for all using (true) with check (true);

drop policy if exists "allow all consignment_items" on consignment_items;
create policy "allow all consignment_items" on consignment_items for all using (true) with check (true);

-- ------------------------------------------------------------
-- Dados de teste: estoque inicial de brinquedos
-- ------------------------------------------------------------
insert into products (name, base_price, stock_quantity) values
  ('Carrinho de Corrida', 12.00, 20),
  ('Boneca Articulada', 25.00, 15),
  ('Jogo de Tabuleiro - Trilha', 35.00, 8),
  ('Quebra-Cabeça 100 peças', 18.00, 12),
  ('Bicho de Pelúcia', 22.00, 10),
  ('Blocos de Montar (kit)', 40.00, 6)
on conflict do nothing;
