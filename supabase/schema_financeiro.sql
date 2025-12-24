-- =============================================
-- SCHEMA FINANCEIRO - Sistema de Controle Financeiro
-- =============================================

-- Categorias financeiras (ex: Alimentação, Salários, Manutenção)
CREATE TABLE IF NOT EXISTS public.categorias_financeiras (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT DEFAULT '',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para categorias_financeiras
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações via service role" ON categorias_financeiras
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =============================================
-- Formas de pagamento
-- =============================================
CREATE TABLE IF NOT EXISTS public.formas_pagamento (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'vale_refeicao', 'outros')),
  ativo BOOLEAN DEFAULT TRUE,
  taxa_percentual DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para formas_pagamento
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações via service role" ON formas_pagamento
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =============================================
-- Controle de caixa (abertura/fechamento diário)
-- =============================================
CREATE TABLE IF NOT EXISTS public.caixa (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  usuario_abertura_id UUID REFERENCES public.usuarios(id) NOT NULL,
  usuario_fechamento_id UUID REFERENCES public.usuarios(id),
  valor_abertura DECIMAL(10, 2) NOT NULL DEFAULT 0,
  valor_fechamento DECIMAL(10, 2),
  valor_sistema DECIMAL(10, 2) DEFAULT 0, -- Valor calculado pelo sistema
  diferenca DECIMAL(10, 2) DEFAULT 0, -- Diferença entre valor informado e sistema
  status TEXT NOT NULL CHECK (status IN ('aberto', 'fechado')) DEFAULT 'aberto',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para caixa
ALTER TABLE public.caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações via service role" ON caixa
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =============================================
-- Movimentações do caixa
-- =============================================
CREATE TABLE IF NOT EXISTS public.movimentacoes_caixa (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  caixa_id UUID REFERENCES public.caixa(id) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'sangria', 'reforco')),
  valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
  descricao TEXT NOT NULL,
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  usuario_id UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para movimentacoes_caixa
ALTER TABLE public.movimentacoes_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações via service role" ON movimentacoes_caixa
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =============================================
-- Contas a pagar
-- =============================================
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  descricao TEXT NOT NULL,
  fornecedor TEXT,
  valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  status TEXT NOT NULL CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')) DEFAULT 'pendente',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para contas_pagar
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações via service role" ON contas_pagar
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =============================================
-- Contas a receber
-- =============================================
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  descricao TEXT NOT NULL,
  cliente TEXT,
  valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  status TEXT NOT NULL CHECK (status IN ('pendente', 'recebido', 'vencido', 'cancelado')) DEFAULT 'pendente',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar RLS para contas_receber
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações via service role" ON contas_receber
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =============================================
-- Triggers para atualizar updated_at
-- =============================================
CREATE TRIGGER update_categorias_financeiras_updated_at
BEFORE UPDATE ON categorias_financeiras
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formas_pagamento_updated_at
BEFORE UPDATE ON formas_pagamento
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_caixa_updated_at
BEFORE UPDATE ON caixa
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contas_pagar_updated_at
BEFORE UPDATE ON contas_pagar
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contas_receber_updated_at
BEFORE UPDATE ON contas_receber
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Função para atualizar valor do sistema no caixa
-- =============================================
CREATE OR REPLACE FUNCTION update_caixa_valor_sistema()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE caixa
  SET valor_sistema = valor_abertura + COALESCE((
    SELECT SUM(
      CASE 
        WHEN tipo IN ('entrada', 'reforco') THEN valor 
        WHEN tipo IN ('saida', 'sangria') THEN -valor 
        ELSE 0 
      END
    )
    FROM movimentacoes_caixa
    WHERE caixa_id = NEW.caixa_id
  ), 0)
  WHERE id = NEW.caixa_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_caixa_after_movimentacao
AFTER INSERT OR UPDATE OR DELETE ON movimentacoes_caixa
FOR EACH ROW
EXECUTE FUNCTION update_caixa_valor_sistema();

-- =============================================
-- Dados iniciais - Formas de pagamento padrão
-- =============================================
INSERT INTO public.formas_pagamento (nome, tipo, ativo, taxa_percentual)
VALUES 
  ('Dinheiro', 'dinheiro', true, 0),
  ('Cartão de Crédito', 'cartao_credito', true, 2.99),
  ('Cartão de Débito', 'cartao_debito', true, 1.49),
  ('PIX', 'pix', true, 0),
  ('Vale Refeição', 'vale_refeicao', true, 3.50)
ON CONFLICT DO NOTHING;

-- =============================================
-- Dados iniciais - Categorias financeiras padrão
-- =============================================
INSERT INTO public.categorias_financeiras (nome, tipo, descricao)
VALUES 
  -- Despesas
  ('Fornecedores', 'despesa', 'Pagamento a fornecedores de insumos'),
  ('Salários', 'despesa', 'Pagamento de funcionários'),
  ('Aluguel', 'despesa', 'Aluguel do espaço'),
  ('Energia', 'despesa', 'Conta de energia elétrica'),
  ('Água', 'despesa', 'Conta de água'),
  ('Internet/Telefone', 'despesa', 'Telecomunicações'),
  ('Manutenção', 'despesa', 'Manutenção de equipamentos'),
  ('Marketing', 'despesa', 'Propaganda e publicidade'),
  ('Impostos', 'despesa', 'Tributos e taxas'),
  ('Outras Despesas', 'despesa', 'Despesas diversas'),
  -- Receitas
  ('Vendas', 'receita', 'Receita de vendas'),
  ('Delivery', 'receita', 'Receita de entregas'),
  ('Outras Receitas', 'receita', 'Receitas diversas')
ON CONFLICT DO NOTHING;
