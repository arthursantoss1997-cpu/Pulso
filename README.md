# Pulso — Performance Low Ticket

Painel PWA para acompanhar tráfego, faturamento aprovado, taxas de plataforma, lucro líquido e ROAS por produto.

## Rodar localmente

1. Instale as dependências com `npm install`.
2. Execute `npm run dev` para navegar pelo modo demonstrativo.
3. Para funções, banco e identidade locais, conecte o projeto à Netlify e use `netlify dev`.

## Preparação na Netlify

1. Crie a Netlify Database e aplique a migração em `netlify/database/migrations/001_low_ticket_panel.sql`.
2. Ative Netlify Identity, selecione cadastro somente por convite e atribua a função `admin` ao seu usuário.
3. Configure as variáveis presentes em `.env.example` somente no painel seguro da Netlify.
4. Cadastre os produtos e associe as campanhas Meta dentro de **Configurar**.

## Contrato do webhook

Envie `POST /api/webhooks/sales` com `Content-Type: application/json` e `x-webhook-signature: sha256=<hmac-do-corpo>`.

```json
{
  "eventId": "evt_0001",
  "orderId": "ord_0001",
  "provider": "generic",
  "externalProductId": "guia-detox-21d",
  "status": "approved",
  "amountGross": 38.99,
  "currency": "BRL",
  "occurredAt": "2026-09-02T15:30:00-03:00",
  "metaCampaignId": "1202...",
  "metaAdId": "1203..."
}
```

Eventos repetidos são ignorados pelo `eventId`. Um reembolso exclui a venda aprovada do faturamento e do lucro operacional do dia de aprovação.

Os IDs Meta são opcionais, mas necessários para atribuir faturamento e lucro a uma campanha ou criativo específico no painel de detalhamento.
