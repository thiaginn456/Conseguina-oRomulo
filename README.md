# Consignação de Brinquedos

Sistema em React + Supabase para controlar consignação de brinquedos: cadastro de clientes,
estoque próprio, envio de brinquedos em consignação, fechamento de vendas com cálculo de
lucro, e emissão de notinha (impressão/PDF).

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito (ou use um que já tenha).
2. No painel do projeto, vá em **SQL Editor** → **New query**.
3. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o conteúdo, cole no editor e clique em **Run**.
   - Isso cria as 4 tabelas (`clients`, `products`, `consignments`, `consignment_items`) e já
     insere 6 brinquedos de teste no estoque.
4. Vá em **Project Settings → API**. Copie:
   - **Project URL** (ex: `https://xxxx.supabase.co`)
   - **anon public key**

## 2. Configurar o projeto localmente

```bash
# instalar dependências
npm install

# criar o arquivo de variáveis de ambiente
cp .env.example .env
```

Abra o `.env` e cole os valores que você copiou do Supabase:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 3. Rodar o projeto

```bash
npm run dev
```

Acesse o endereço mostrado no terminal (normalmente `http://localhost:5173`).

## 4. Como usar

1. **Estoque** (menu superior): cadastre os brinquedos que você tem, ou clique em
   "Popular com brinquedos de teste" se a tabela estiver vazia (o `schema.sql` já insere
   alguns, então normalmente esse botão não aparece).
2. **Clientes**: cadastre um cliente com nome, telefone, endereço e documento.
3. Clique no cliente para abrir o perfil dele.
4. **Nova consignação**: escolha manualmente quais brinquedos (já cadastrados) e quantas
   unidades de cada um foram entregues para esse cliente. Isso já desconta do seu estoque.
5. Quando o cliente devolver/acertar: na consignação ativa, clique em **"Registrar vendas / Fechar"**.
   - Informe quantas unidades de cada brinquedo foram vendidas e o preço final cobrado.
   - Escolha a situação do pagamento: **pago à vista**, **fiado** (nada pago ainda) ou
     **parcial** (informe quanto foi pago agora).
   - O que não foi vendido volta automaticamente para o seu estoque.
   - Ao confirmar, o sistema calcula o total a receber e o lucro (venda − preço base) e
     abre a **notinha** na tela, com opção de imprimir ou salvar como PDF (use "Imprimir" e
     escolha "Salvar como PDF" na janela de impressão do navegador).
6. Consignações já fechadas ficam no **Histórico** do cliente, e você pode reabrir a notinha
   a qualquer momento clicando em "Ver / imprimir notinha".

## Estrutura das tabelas

- `clients`: nome, telefone, endereço, documento.
- `products`: nome do brinquedo, preço base, quantidade em estoque.
- `consignments`: cliente, data de envio, status (ativo/finalizado), situação de pagamento
  (pago/fiado/parcial), valor pago, valor total, lucro.
- `consignment_items`: consignação, produto, quantidade consignada, quantidade vendida,
  preço final unitário cobrado.

## Observações

- As políticas de segurança (RLS) do `schema.sql` estão liberadas para a chave `anon`, o que
  é adequado para uso pessoal/testes. Se for publicar o sistema para outras pessoas
  acessarem, vale adicionar autenticação (Supabase Auth) e restringir as políticas.
- O projeto usa Vite + React + Tailwind CSS. Para gerar uma versão de produção: `npm run build`.
