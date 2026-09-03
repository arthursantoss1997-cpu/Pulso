CREATE TABLE IF NOT EXISTS importacoes_historicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  gasto NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (gasto >= 0),
  faturamento_bruto NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (faturamento_bruto >= 0),
  chargebacks NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (chargebacks >= 0),
  vendas INTEGER NOT NULL DEFAULT 0 CHECK (vendas >= 0),
  vendas_estornadas INTEGER NOT NULL DEFAULT 0 CHECK (vendas_estornadas >= 0),
  impressoes INTEGER NOT NULL DEFAULT 0 CHECK (impressoes >= 0),
  cliques INTEGER NOT NULL DEFAULT 0 CHECK (cliques >= 0),
  checkouts INTEGER NOT NULL DEFAULT 0 CHECK (checkouts >= 0),
  atribuicao TEXT NOT NULL DEFAULT 'tracked' CHECK (atribuicao IN ('tracked', 'untracked', 'partial')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
