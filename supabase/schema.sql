-- Estrutura de tabelas para o Supabase
-- Compatível com o backend existente (autenticação própria via JWT/bcrypt)

-- Tabela de usuários (autenticação própria, não usa auth.users do Supabase)
create table public.usuarios (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  email text unique not null,
  senha text not null,
  role text not null check (role in ('admin', 'gerente', 'garcom', 'cozinheiro', 'caixa')) default 'garcom',
  cargo text check (cargo in ('admin', 'gerente', 'garcom', 'cozinheiro', 'caixa')),
  ativo boolean default true,
  telefone text,
  data_contratacao timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Configurar RLS (Row Level Security) - desabilitado para permitir acesso via backend
alter table public.usuarios enable row level security;

-- Política para permitir todas as operações (o backend controla a segurança via JWT)
create policy "Permitir todas operações via service role" on usuarios
  for all using (true) with check (true);

-- Tabela de produtos
create table public.produtos (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  descricao text not null,
  preco decimal(10, 2) not null check (preco >= 0),
  categoria text not null check (categoria in ('hamburger', 'acompanhamento', 'bebida', 'sobremesa', 'combo')),
  imagem text default '',
  ingredientes text[] default '{}',
  disponivel boolean default true,
  destaque boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Configurar RLS para produtos
alter table public.produtos enable row level security;

-- Políticas de segurança para produtos
create policy "Todos podem ver produtos" on produtos
  for select using (true);

create policy "Apenas admins e gerentes podem modificar produtos" on produtos
  for all using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and cargo in ('admin', 'gerente')
    )
  );

-- Tabela de mesas
create table public.mesas (
  id uuid default uuid_generate_v4() primary key,
  numero integer not null unique,
  capacidade integer not null default 4,
  status text not null check (status in ('livre', 'ocupada', 'reservada', 'aguardando_atendimento', 'em_atendimento')) default 'livre',
  garcom_id uuid references public.usuarios(id),
  tempo_ocupacao_inicio timestamp with time zone,
  tempo_ocupacao_fim timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Configurar RLS para mesas
alter table public.mesas enable row level security;

-- Políticas de segurança para mesas
create policy "Todos usuários autenticados podem ver mesas" on mesas
  for select using (auth.role() = 'authenticated');

create policy "Garçons podem atualizar mesas" on mesas
  for update using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and cargo = 'garcom'
    )
  );

create policy "Admins e gerentes podem gerenciar mesas" on mesas
  for all using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and cargo in ('admin', 'gerente')
    )
  );

-- Tabela de pedidos
create table public.pedidos (
  id uuid default uuid_generate_v4() primary key,
  codigo text not null unique,
  mesa_id uuid references public.mesas(id) not null,
  garcom_id uuid references public.usuarios(id) not null,
  cliente text,
  status text not null check (status in ('pendente', 'em_preparo', 'pronto', 'entregue', 'cancelado')) default 'pendente',
  valor_total decimal(10, 2) not null default 0,
  observacoes text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Configurar RLS para pedidos
alter table public.pedidos enable row level security;

-- Políticas de segurança para pedidos
create policy "Usuários autenticados podem ver pedidos" on pedidos
  for select using (auth.role() = 'authenticated');

create policy "Garçons podem criar e atualizar seus pedidos" on pedidos
  for insert with check (
    exists (
      select 1 from usuarios
      where id = auth.uid() and cargo = 'garcom'
    )
  );

create policy "Garçons podem atualizar seus pedidos" on pedidos
  for update using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and cargo = 'garcom'
    ) and garcom_id = auth.uid()
  );

create policy "Cozinheiros podem atualizar status de pedidos" on pedidos
  for update using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and cargo = 'cozinheiro'
    )
  );

create policy "Admins e gerentes podem gerenciar todos os pedidos" on pedidos
  for all using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and cargo in ('admin', 'gerente')
    )
  );

-- Tabela de itens de pedido
create table public.itens_pedido (
  id uuid default uuid_generate_v4() primary key,
  pedido_id uuid references public.pedidos(id) not null,
  produto_id uuid references public.produtos(id) not null,
  quantidade integer not null check (quantidade > 0) default 1,
  preco_unitario decimal(10, 2) not null,
  observacoes text default '',
  adicionais jsonb default '[]',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Configurar RLS para itens de pedido
alter table public.itens_pedido enable row level security;

-- Políticas de segurança para itens de pedido
create policy "Usuários autenticados podem ver itens de pedido" on itens_pedido
  for select using (auth.role() = 'authenticated');

create policy "Garçons podem criar itens para seus pedidos" on itens_pedido
  for insert with check (
    exists (
      select 1 from pedidos
      where id = pedido_id and garcom_id = auth.uid()
    )
  );

create policy "Garçons podem atualizar itens de seus pedidos" on itens_pedido
  for update using (
    exists (
      select 1 from pedidos
      where id = pedido_id and garcom_id = auth.uid()
    )
  );

create policy "Admins e gerentes podem gerenciar todos os itens" on itens_pedido
  for all using (
    exists (
      select 1 from usuarios
      where id = auth.uid() and cargo in ('admin', 'gerente')
    )
  );

-- Função para atualizar o valor total do pedido
create or replace function update_pedido_valor_total()
returns trigger as $$
begin
  update pedidos
  set valor_total = (
    select sum(quantidade * preco_unitario)
    from itens_pedido
    where pedido_id = new.pedido_id
  )
  where id = new.pedido_id;
  return new;
end;
$$ language plpgsql;

-- Trigger para atualizar o valor total do pedido quando um item é adicionado/atualizado/removido
create trigger update_pedido_valor_after_item_change
after insert or update or delete on itens_pedido
for each row
execute function update_pedido_valor_total();

-- Função para gerar código único para pedidos
create or replace function generate_pedido_codigo()
returns trigger as $$
begin
  new.codigo = 'PED-' || to_char(now(), 'YYYYMMDD') || '-' || (
    select count(*) + 1 from pedidos
    where created_at::date = current_date
  );
  return new;
end;
$$ language plpgsql;

-- Trigger para gerar código único para pedidos
create trigger generate_pedido_codigo_before_insert
before insert on pedidos
for each row
execute function generate_pedido_codigo();

-- Função para atualizar o timestamp de updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para atualizar o timestamp de updated_at
create trigger update_usuarios_updated_at
before update on usuarios
for each row
execute function update_updated_at_column();

create trigger update_produtos_updated_at
before update on produtos
for each row
execute function update_updated_at_column();

create trigger update_mesas_updated_at
before update on mesas
for each row
execute function update_updated_at_column();

create trigger update_pedidos_updated_at
before update on pedidos
for each row
execute function update_updated_at_column();

create trigger update_itens_pedido_updated_at
before update on itens_pedido
for each row
execute function update_updated_at_column();

-- =============================================
-- Inserir usuário admin inicial
-- =============================================
-- Senha: admin123 (hash bcrypt)
-- IMPORTANTE: Mude a senha após o primeiro login!

INSERT INTO public.usuarios (id, nome, email, senha, role, cargo, ativo)
VALUES (
  uuid_generate_v4(),
  'Administrador',
  'admin@hamburgueria.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;