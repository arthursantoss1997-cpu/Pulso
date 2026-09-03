CREATE TABLE IF NOT EXISTS economia_oferta (
  produto_id UUID PRIMARY KEY REFERENCES produtos(id) ON DELETE CASCADE,
  margem_desejada_porcentagem NUMERIC(7,4) NOT NULL DEFAULT 30 CHECK (margem_desejada_porcentagem >= 0 AND margem_desejada_porcentagem < 100),
  cpm_planejado NUMERIC(14,2) NOT NULL DEFAULT 20 CHECK (cpm_planejado >= 0),
  clique_checkout_porcentagem NUMERIC(7,4) NOT NULL DEFAULT 8 CHECK (clique_checkout_porcentagem >= 0 AND clique_checkout_porcentagem <= 100),
  checkout_venda_porcentagem NUMERIC(7,4) NOT NULL DEFAULT 45 CHECK (checkout_venda_porcentagem >= 0 AND checkout_venda_porcentagem <= 100),
  order_bump_preco NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (order_bump_preco >= 0),
  order_bump_aceite_porcentagem NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK (order_bump_aceite_porcentagem >= 0 AND order_bump_aceite_porcentagem <= 100),
  upsell_preco NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (upsell_preco >= 0),
  upsell_aceite_porcentagem NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK (upsell_aceite_porcentagem >= 0 AND upsell_aceite_porcentagem <= 100),
  downsell_preco NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (downsell_preco >= 0),
  downsell_aceite_porcentagem NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK (downsell_aceite_porcentagem >= 0 AND downsell_aceite_porcentagem <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
