ALTER TABLE testes_oferta ADD COLUMN IF NOT EXISTS tipo_teste TEXT NOT NULL DEFAULT 'offer' CHECK (tipo_teste IN ('offer', 'creative'));
ALTER TABLE testes_oferta ADD COLUMN IF NOT EXISTS prejuizo_final NUMERIC(14,2) CHECK (prejuizo_final >= 0);
ALTER TABLE testes_oferta ADD COLUMN IF NOT EXISTS gasto_final NUMERIC(14,2) CHECK (gasto_final >= 0);
ALTER TABLE testes_oferta ADD COLUMN IF NOT EXISTS faturamento_final NUMERIC(14,2) CHECK (faturamento_final >= 0);
ALTER TABLE testes_oferta ADD COLUMN IF NOT EXISTS impressoes_final INTEGER CHECK (impressoes_final >= 0);
ALTER TABLE testes_oferta ADD COLUMN IF NOT EXISTS cliques_final INTEGER CHECK (cliques_final >= 0);
ALTER TABLE testes_oferta ADD COLUMN IF NOT EXISTS checkouts_final INTEGER CHECK (checkouts_final >= 0);
ALTER TABLE testes_oferta ADD COLUMN IF NOT EXISTS vendas_final INTEGER CHECK (vendas_final >= 0);
