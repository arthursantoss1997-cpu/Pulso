CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  external_product_id TEXT NOT NULL UNIQUE,
  preco_base NUMERIC(14,2) NOT NULL CHECK (preco_base >= 0),
  taxa_plataforma_porcentagem NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK (taxa_plataforma_porcentagem >= 0),
  taxa_plataforma_fixa NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (taxa_plataforma_fixa >= 0),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campanhas_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_campaign_id TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metricas_campanha_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES campanhas_meta(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  gasto_meta NUMERIC(14,2) NOT NULL DEFAULT 0,
  cliques INTEGER NOT NULL DEFAULT 0,
  impressoes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, data)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_order_id TEXT NOT NULL,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'refunded')),
  gross_amount NUMERIC(14,2) NOT NULL CHECK (gross_amount >= 0),
  moeda CHAR(3) NOT NULL DEFAULT 'BRL',
  checkout_started_on DATE,
  approved_on DATE,
  refunded_on DATE,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_order_id)
);

CREATE INDEX IF NOT EXISTS pedidos_produto_status_idx ON pedidos (produto_id, status, approved_on);
CREATE INDEX IF NOT EXISTS pedidos_checkout_idx ON pedidos (produto_id, checkout_started_on);

CREATE TABLE IF NOT EXISTS webhook_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  external_order_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_event_id)
);

CREATE TABLE IF NOT EXISTS metricas_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  gasto_meta NUMERIC(14,2) NOT NULL DEFAULT 0,
  cliques INTEGER NOT NULL DEFAULT 0,
  impressoes INTEGER NOT NULL DEFAULT 0,
  vendas_aprovadas INTEGER NOT NULL DEFAULT 0,
  faturamento_bruto NUMERIC(14,2) NOT NULL DEFAULT 0,
  checkouts_iniciados INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (produto_id, data)
);

CREATE TABLE IF NOT EXISTS execucoes_sincronizacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origem TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed')),
  detalhes JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
