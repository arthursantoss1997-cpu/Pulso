ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS meta_campaign_id TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS meta_ad_id TEXT;
CREATE INDEX IF NOT EXISTS pedidos_campaign_attribution_idx ON pedidos (meta_campaign_id, approved_on);
CREATE INDEX IF NOT EXISTS pedidos_ad_attribution_idx ON pedidos (meta_ad_id, approved_on);

CREATE TABLE IF NOT EXISTS criativos_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_ad_id TEXT NOT NULL UNIQUE,
  meta_campaign_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metricas_criativo_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criativo_id UUID NOT NULL REFERENCES criativos_meta(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  gasto_meta NUMERIC(14,2) NOT NULL DEFAULT 0,
  cliques INTEGER NOT NULL DEFAULT 0,
  impressoes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (criativo_id, data)
);

CREATE TABLE IF NOT EXISTS testes_oferta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  hipotese TEXT NOT NULL,
  publico TEXT NOT NULL,
  orcamento_diario NUMERIC(14,2) NOT NULL CHECK (orcamento_diario >= 0),
  status TEXT NOT NULL CHECK (status IN ('running', 'scale', 'iterate', 'paused')) DEFAULT 'running',
  nota_decisao TEXT,
  iniciado_em DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
