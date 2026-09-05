# ViraTopo

Beta de um ranking público para produtos brasileiros. Cada temporada dura 24 horas; produtos verificados são ordenados pelo maior lance confirmado e, em caso de empate, pela confirmação mais antiga.

O repositório não contém produtos, métricas ou pagamentos fictícios. Sem Supabase configurado, a interface permanece em pré-lançamento e informa que a fonte de dados está desconectada.

## Desenvolvimento local

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Comandos de validação:

```bash
npm test
npm run lint
npm run build
```

## Supabase

1. Crie um projeto no Supabase.
2. Execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor.
3. Copie `.env.example` para `.env.local`.
4. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` para a leitura da RPC pública sanitizada.
5. Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente no servidor para o pré-cadastro.
6. Defina `LEGAL_CONTROLLER_NAME`, `LEGAL_CONTACT_EMAIL` e gere um `WAITLIST_RATE_LIMIT_SECRET` aleatório com pelo menos 32 caracteres antes de persistir qualquer dado pessoal.

O ranking público lê apenas `get_public_ranking`. Referências do provedor, inscrições de pré-lançamento, fingerprints HMAC de limite e eventos brutos ficam no schema privado e não possuem leitura anônima. Um e-mail existente não é sobrescrito nem reativado por novas submissões.

## Estado dos pagamentos

O transporte Node do Mercado Pago está em `src/lib/mercado-pago.mjs`, com criação PIX pela Orders API, consulta por ID, prazo de 30 minutos, chave de idempotência fornecida pela tentativa persistida e validação HMAC da assinatura de notificações. Os testes usam respostas controladas; nenhuma cobrança foi enviada ao provedor.

Esse módulo ainda não está ligado a uma rota pública nem ao checkout. Antes de conectá-lo, persistir uma tentativa imutável, autorizar o dono do produto e conferir o valor retornado pelo provedor contra o valor devido no banco. A assinatura autentica o ID notificado, não o status no corpo do webhook. A consulta deve também validar conta recebedora, referência externa e estado final. Eventos fora da janela de cinco minutos exigirão reconciliação pelo servidor. Nunca recriar uma chave após timeout: a primeira chamada pode ter criado a order.

Documentação do contrato: [PIX via Orders API](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/pix) e [notificações de orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/notifications).

Pagamentos reais estão desativados. O fluxo atual simula o valor, explica as regras e, quando a infraestrutura privada está configurada, registra interesse no lançamento. Ele não cria QR Code, não aceita uma confirmação do navegador e não reserva posição.

Antes de ativar Mercado Pago em produção, ainda é obrigatório:

- criar a order no servidor com chave de idempotência;
- manter o Access Token somente no servidor;
- validar a assinatura do webhook;
- consultar o recurso no provedor antes de confirmar o lance;
- testar expiração, repetição de eventos, falha, estorno e reembolso;
- publicar responsável, contato e política de retenção.

## Deploy na Vercel

O projeto já é compatível com Vercel. Cadastre as variáveis do `.env.example` nos ambientes corretos, execute as validações acima e publique. Nunca adicione `SUPABASE_SERVICE_ROLE_KEY` ou futuras credenciais de pagamento com prefixo `NEXT_PUBLIC_`.

## Regras resumidas

- temporada de 24 horas;
- lance declarado entre R$ 1 e R$ 9.999;
- um produto por posição;
- somente produto verificado e lance confirmado entram no quadro;
- maior valor vence; empate favorece a confirmação mais antiga;
- métricas ausentes aparecem como indisponíveis, não como zero inventado;
- visibilidade não garante cliques, vendas ou conversão.

As condições completas estão em `/termos` e a metodologia de medição em `/analytics`.
