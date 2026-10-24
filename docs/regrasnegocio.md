# Guia Simples: Entendendo as Regras de Antecipação (Antecipe FIDC)

Este documento traduz as regras de negócio configuradas no sistema para uma linguagem não técnica. O objetivo é ajudar desenvolvedores, designers e usuários finais a entenderem **o que** está sendo validado, **por que** isso é importante e como o software deve se comportar.

---

## 1. Entendendo os Personagens

Antes das regras, precisamos entender quem é quem nessa história:

- **Fundo (ANTECIPE FIDC):** É o “banco” ou investidor que tem dinheiro hoje e quer comprar as notas.
- **Cedente (ex: Ana):** É a pequena empresa que vendeu um produto, tem uma nota fiscal para receber no futuro, mas precisa do dinheiro hoje.
- **Sacado:** É o cliente da Ana (quem comprou o produto e deve pagar a nota no futuro).

O Fundo não compra qualquer nota. Ele precisa garantir que não vai tomar um calote. Por isso, usamos os **Validadores**.

---

## 2. As Regras Ativas (O que o sistema bloqueia hoje)

Aqui estão as regras que estão com `"ativo": true` no nosso sistema e o motivo de existirem:

### 1. CNPJ do Sacado Válido (`CNPJ_SACADO_VALIDO`)

- **O que é:** Verifica se o número do CNPJ de quem vai pagar a conta existe matematicamente (não é um número inventado como 11.111.111/1111-11).
- **Por que importa:** Evita fraudes básicas e erros de digitação na hora de enviar a planilha.

### 2. Empresa Pagadora Ativa (`SITUACAO_CADASTRAL_SACADO`)

- **O que é:** O sistema só aceita notas se a empresa que deve pagar (o Sacado) estiver com a situação “ATIVA” na Receita Federal.
- **Por que importa:** O fundo não pode comprar uma dívida de uma empresa que já faliu, foi baixada ou está suspensa. É risco de calote na certa.

### 3. Tipo de Documento Correto (`TIPO_RECEBIVEL`)

- **O que é:** O fundo só aceita comprar “Duplicatas” e “Duplicatas de Serviço”.
- **Por que importa:** Nem todo documento tem validade jurídica forte para ser cobrado depois. Duplicatas são instrumentos formais de dívida reconhecidos por lei.

### 4. Valor Mínimo da Nota (`VALOR_MINIMO`: R$ 100,00)

- **O que é:** Notas com valor de face abaixo de R$ 100,00 são automaticamente recusadas.
- **Por que importa:** Custo operacional. O trabalho e as taxas para processar, registrar e cobrar uma nota de R$ 50,00 não compensam para o fundo.

### 5. A Conta Não Pode Estar Atrasada (`NAO_VENCIDA`)

- **O que é:** A data de vencimento da nota tem que ser no futuro.
- **Por que importa:** O fundo compra o direito de receber algo que vai vencer. Se a conta já venceu e o cliente da Ana não pagou, já é uma dívida “podre” (inadimplente).

### 6. Prazo Máximo (`PRAZO_MAXIMO`: 180 dias)

- **O que é:** A nota não pode ter um prazo de pagamento maior que 6 meses (180 dias).
- **Por que importa:** Quanto mais no futuro for a promessa de pagamento, maior o risco de algo dar errado no país ou na empresa. O fundo prefere previsibilidade de curto prazo.

### 7. Limite de Risco por Cliente (`CONCENTRACAO_MAXIMA_SACADO`: 10%)

- **O que é:** Se o fundo tem 1 Milhão de reais em notas, no máximo 100 mil (10%) podem ser notas devidas por uma mesma empresa (calculado pela Raiz do CNPJ, ou seja, matriz e filiais juntas).
- **Por que importa:** É a regra de “não colocar todos os ovos na mesma cesta”. Se um Sacado gigante falir, o fundo perde no máximo 10% do seu dinheiro, e não tudo.

---

## 3. As Regras Inativas (Cartas na Manga)

O sistema permite que o gestor do fundo ligue ou desligue regras sem precisar de programadores. Hoje, estas estão desligadas (`"ativo": false`), mas prontas para uso:

- **Prazo Mínimo (30 dias):** Se ligada, impediria a compra de notas que vencem muito rápido (ex: amanhã), pois o lucro do juros seria quase zero.
- **Concentração Máxima do Cedente (8%):** Se ligada, impediria que a Ana vendesse notas demais para o fundo, garantindo que o fundo atenda várias pequenas empresas diferentes, diluindo o risco.

---

## 4. Como é Calculado o Pagamento (Precificação)

- **Regra:** Desconto Simples.
- **Taxa:** 2.0% ao mês (base de 30 dias).
- **Explicando para a Ana:** “Para cada mês que adiantamos o seu dinheiro, cobramos 2% do valor da nota. Se a nota é de R$ 1.000 para daqui a um mês, ficamos com R$ 20 e depositamos R$ 980 na sua conta hoje.”

---

## 5. Sugestão de Filtros para a Interface (UI/UX)

Para deixar o software incrível para o usuário, o Front-end (React/Next.js) deve ter os seguintes filtros na tela de listagem de notas:

1. **Filtro de Status (Obrigatório):** Botões rápidos para ver `[Todas]`, `[Aprovadas]` e `[Recusadas]`.
2. **Filtro por Motivo de Recusa:** Um menu dropdown que permite ver “Apenas notas recusadas por Prazo Máximo” ou “Apenas recusadas por Valor Mínimo”. Isso ajuda a empresa a entender onde ela está errando mais.
3. **Filtro de Faixa de Valor:** Um controle deslizante (slider) ou campos de Mínimo e Máximo (ex: buscar notas entre R$ 1.000 e R$ 5.000).
4. **Ordenação:** Clicar no cabeçalho da tabela para ordenar do “Maior Valor para o Menor” ou “Vencimento mais próximo para o mais distante”.