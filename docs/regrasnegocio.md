# Contexto Mestre e Regras de Negócio: Projeto “Antecipe” - Hackathon Kanastra 2026

Este documento centraliza e unifica a visão geral, fundamentos do domínio, arquitetura técnica, catálogo de regras de negócio, modelagem de dados, fórmulas financeiras e diretrizes completas de UI/UX do projeto **Antecipe**.

---

## 1. Visão Geral do Desafio e Fundamentos

O objetivo é construir o portal **Antecipe**, uma solução de backoffice financeiro para um Fundo de Investimento em Direitos Creditórios (FIDC).

- **O Problema:** Pequenas empresas (cedentes) vendem a prazo, mas precisam do dinheiro hoje. Elas antecipam (vendem) essas notas fiscais para o Fundo. O Fundo precisa validar essas notas contra regras rígidas de compliance (prazo, valor, risco) e calcular o desconto (juros).
- **O Mantra do Produto:** Importar. Decidir. Explicar. Simular.

### Fundamentos do Domínio (Quem é quem)

Somos um sistema que gerencia interações entre um fundo financeiro e empresas que vendem produtos/serviços a prazo. As empresas vendem a prazo e requisitam o dinheiro de forma antecipada do fundo financeiro, que paga o valor do serviço/produto (com uma taxa descontada) à empresa, e posteriormente aguarda o pagamento do cliente (Sacado).

- **Empresas (Cedentes):** submetem notas (Recebíveis) das vendas no sistema. Elas podem ser barradas (por serem duplicadas), aprovadas ou reprovadas para antecipação de pagamento pelos Fundos.
  - Informações no CSV (base de dados) pertencentes aos cedentes:
    - `NOME_CEDENTE`: Nome da empresa que vendeu a nota.
    - `DOC_CEDENTE`: CNPJ da empresa que vendeu a nota.
- **Fundos:** recebem essas notas via sistema e, conforme restrições próprias do fundo quanto a algumas informações das notas, decidem se a nota é válida para antecipação de pagamento ou não.
  - Informações no CSV (base de dados) pertencentes aos fundos:
    - `NOME_FUNDO`: Nome do fundo que comprou a nota.
    - `DOC_FUNDO`: CNPJ do fundo que comprou a nota.
- **Cliente (Sacado):** São quem deve pagar as notas (Recebíveis). Suas informações vêm presentes nas operações do sistema.
  - Informações no CSV (base de dados) pertencentes aos sacados:
    - `NOME_SACADO`: Nome do cliente que vai pagar a nota.
    - `DOC_SACADO`: CNPJ do cliente que vai pagar a nota.
- **Notas (Recebíveis):** São registros que manifestam o direito de receber um valor futuro do cliente. Suas informações vêm presentes nas operações do sistema.
  - Informações no CSV (base de dados) pertencentes aos recebíveis:
    - `NU_DOCUMENTO`: Número da nota no sistema do cedente (cada empresa numera do seu jeito).
    - `TIPO_RECEBIVEL`: Duplicata, Duplicata de Serviço, Cheque, CCB ou Nota Comercial.
    - `VALOR_NOMINAL`: Valor de face, em reais.
    - `DATA_VENCIMENTO_ORIGINAL`: Data de vencimento da nota.
    - `DATA_AQUISICAO`: Data em que o fundo comprou a nota.

---

## 2. Stack Tecnológico

- **Backend:** Django (Python) focado em ORM para integridade de dados e lógica financeira (usando Django REST Framework ou Django Ninja para a API).
- **Frontend:** React (Next.js) com Tailwind CSS para estilização ágil e responsiva.
- **Banco de Dados:** PostgreSQL, utilizando `UniqueConstraints` severas.

---

## 3. Requisitos Core e Arquitetura de Dados

### A. Ingestão de Dados (CSV)

- O sistema deve receber arquivos CSV massivos (100 mil a 500 mil linhas).
- Formato: Separador `;`, decimal com vírgula `,`, datas `dd/mm/aaaa`, codificação UTF-8.
- **Cabeçalho / Estrutura das Colunas:**
  ```csv
  NOME_FUNDO;DOC_FUNDO;NOME_CEDENTE;DOC_CEDENTE;NOME_SACADO;DOC_SACADO;NU_DOCUMENTO;TIPO_RECEBIVEL;VALOR_NOMINAL;DATA_VENCIMENTO_ORIGINAL;DATA_AQUISICAO
  ```
- **Diferencial Técnico:** A leitura não pode travar o servidor. O backend deve ler o arquivo em *chunks* (streaming) e usar `bulk_create` (ou similar) no banco de dados.

### B. Idempotência e Duplicidade (Validação Obrigatória e Imutável)

Existe uma validação sobre duplicidade que **sempre fica ativa e não é decidida pelo gestor**:

- **Sem duplicidade:** Uma mesma nota não pode ser vendida 2 vezes. Uma vez aprovada, se for enviada novamente será recusada por duplicidade.
- **Solução Técnica:** O banco de dados deve possuir chave única composta (ex: `Hash(CNPJ_Cedente + CNPJ_Sacado + Numero_Nota)`). Se o usuário reenviar o mesmo lote ou der duplo clique, o banco rejeita a inserção (evitando *Race Conditions*) e o sistema marca a nota como “Recusada por Duplicidade”.

### C. Motor de Regras Dinâmico (Sem Deploy)

- O sistema não deve ter valores fixos hardcoded no código (`if valor < 100`).
- As regras são lidas de um arquivo de configuração (ex: `validadores_antecipe.json`).
- O backend deve aplicar o padrão *Strategy*: executar apenas as regras marcadas como `"ativo": true` no JSON. Se o JSON mudar na interface administrativa (ou for sobrescrito), as novas regras valem para o próximo lote, sem necessidade de deploy ou reinício do servidor.

---

## 4. Catálogo Detalhado das Regras de Negócio

Aqui está o funcionamento detalhado de cada regra suportada pelo motor dinâmico:

1. **`PRAZO_MAXIMO`**
   - **Lógica:** A diferença em dias entre a `DATA_AQUISICAO` e a `DATA_VENCIMENTO_ORIGINAL` tem que ser menor que o prazo máximo definido pelo fundo (ex: 180 dias).
   - **Por que importa:** Quanto mais distante for o vencimento, maior o risco de inadimplência e incertezas macroeconômicas.

2. **`PRAZO_MINIMO`**
   - **Lógica:** A diferença em dias entre a `DATA_AQUISICAO` e a `DATA_VENCIMENTO_ORIGINAL` tem que ser maior que o prazo mínimo definido pelo fundo (ex: 30 dias).
   - **Por que importa:** Títulos que vencem rápido demais geram margem de juros insignificante frente ao custo operacional.

3. **`NAO_VENCIDA`**
   - **Lógica:** A data atual (ou data de aquisição/corte) é estritamente anterior à `DATA_VENCIMENTO_ORIGINAL`.
   - **Por que importa:** O fundo adquire direitos futuros. Títulos já vencidos configuram créditos inadimplentes ("podres").

4. **`VALOR_MINIMO`**
   - **Lógica:** O `VALOR_NOMINAL` precisa ser maior que o valor mínimo definido pelo fundo (ex: R$ 100,00).
   - **Por que importa:** Cobrir custos operacionais de registro, custódia e cobrança.

5. **`TIPO_RECEBIVEL`**
   - **Lógica:** Verificar se o `TIPO_RECEBIVEL` pertence à lista de tipos aceitos pelo fundo (ex: apenas Duplicata e Duplicata de Serviço).
   - **Por que importa:** Segurança e robustez jurídica na execução do título.

6. **`CNPJ_SACADO_VALIDO`**
   - **Lógica:** O `DOC_SACADO` deve estar no formato correto (máscara de CNPJ) e ser matematicamente válido pelos dígitos verificadores.
   - **Por que importa:** Evitar erros de digitação e fraudes cadastrais.

7. **`SITUACAO_CADASTRAL_SACADO`**
   - **Lógica:** Verificar se o `DOC_SACADO` está com situação "ATIVA", consultando a base de apoio (`cnpj_situacao_mock.csv`).
   - **Por que importa:** Proteger o fundo contra compras de dívidas de empresas baixadas, suspensas ou inaptas na Receita Federal.

8. **`CONCENTRACAO_MAXIMA_SACADO`**
   - **Lógica:** Verificar se o valor total envolvendo todos os recebíveis associados àquele Sacado (agrupados pela raiz do CNPJ) totaliza uma porcentagem excedente ou não ao parâmetro dado (excedente = inválido).
   - **Cálculo da Base:** O total é a soma de todos os recebíveis de um Cedente associado ao Fundo observado.
   - **Por que importa:** Mitigação de risco sistêmico ("não colocar todos os ovos na mesma cesta").

9. **`CONCENTRACAO_MAXIMA_CEDENTE`**
   - **Lógica:** Verificar se o valor total envolvendo todos os recebíveis associados àquele Cedente totaliza uma porcentagem excedente ou não ao parâmetro dado (excedente = inválido).
   - **Cálculo da Base:** O total é a soma de todos os recebíveis de todos os Cedentes associados ao Fundo observado.
   - **Por que importa:** Diversificação da carteira do fundo, evitando dependência excessiva de uma única empresa cedente.

---

## 5. Matemática Financeira (Precificação e Simulação)

- **Data-base para cálculo:** `22/10/2026` (Fixar essa data no código/configuração).
- **Regra de Precificação:** Desconto Simples Comercial.
- **Taxa Padrão:** 2,0% ao mês (base de 30 dias corridos).
- **Fórmulas de Cálculo:**
  1. $\text{Prazo (dias)} = \text{DATA\_VENCIMENTO\_ORIGINAL} - \text{Data-base}$
  2. $\text{Taxa Efetiva} = 0{,}02 \times \left( \frac{\text{Prazo}}{30} \right)$
  3. $\text{Desconto} = \text{VALOR\_NOMINAL} \times \text{Taxa Efetiva}$
  4. $\text{Valor Líquido} = \text{VALOR\_NOMINAL} - \text{Desconto}$
- **Explicação ao Usuário:** "Para cada mês que adiantamos o seu dinheiro, cobramos 2% do valor da nota. Se a nota é de R$ 1.000 para daqui a 30 dias, descontamos R$ 20 e creditamos R$ 980 na sua conta hoje."

---

## 6. Diretrizes de UI/UX e Design System

O frontend espelha a identidade da Kanastra (conexão com a natureza, elegância e solidez financeira), em consonância com a implementação de `interface-da-plataforma-antecipe/`.

### Paleta de Cores e Tokens Visuais:

- **Fundo da Página (Background Principal):** Verde Floresta Kanastra Profundo (`bg-[#0b2c20]` / `bg-[#0B2C20]` / `--bg: #0B2C20`).
- **Cards e Containers no Fundo Escuro:** Verde Floresta Médio com bordas translúcidas (`bg-[#103b2c]` com `border border-emerald-200/15`).
- **Cards Principais, Tabelas e Containers de Conteúdo:** Off-white / Creme quente suave (`bg-[#f8f6f1]` / `bg-[#F8F6F1]`, sombra `shadow-[0_20px_60px_rgba(0,0,0,0.14)]`).
- **Tipografia sobre o Fundo Escuro:**
  - Títulos principais: Branco quente (`text-[#f8f6f1]`).
  - Textos de apoio / subtítulos: Verde esmeralda claro translúcido (`text-emerald-100/65` ou `text-emerald-100/70`).
  - Badges superiores: Verde esmeralda suave (`text-emerald-300/80`, marcador `bg-emerald-400`).
- **Tipografia sobre os Cards Claros (`#f8f6f1`):**
  - Título / Textos principais de dados: Cinza pedra escuro (`text-stone-800` / `var(--ink: #292524)`).
  - Rótulos e cabeçalhos de tabela: Cinza médio suave em caixa alta (`text-stone-500` com `uppercase tracking-[0.18em]`).
  - Textos de suporte e prazos: Cinza neutro (`text-stone-600` / `text-stone-400`).
- **Status Aprovada / Métricas Positivas:**
  - Badge: `bg-emerald-100 text-emerald-700` (com ícone `Check`).
  - Destaques / Acentos: `text-emerald-400` / `bg-emerald-400` / barra de progresso `bg-emerald-400` sobre `bg-emerald-950`.
- **Status Recusada / Métricas Negativas:**
  - Badge: `bg-rose-100 text-rose-600` (com ícone `X`).
  - Bloco explicativo de recusa: Fundo avermelhado suave (`bg-rose-50 border-rose-100 text-rose-800`), ícone de alerta `text-rose-500`.
- **Botões e Ações:**
  - Botão Primário: `bg-[#f8f6f1] text-[#0b2c20]` com hover para `bg-white` (ou `bg-[#F8F6F1] text-emerald-950`).
  - Dropzone de Arquivo: Borda tracejada `border-dashed border-emerald-100/20` (ativa com `border-emerald-300 bg-emerald-400/10`).
- **Barra de Simulação Inferior:** Container em verde escuro (`bg-[#0b2c20] text-[#f8f6f1]`), destaque do valor líquido em `text-emerald-300`.

### Tipografia e Estilo:

- **Fonte Base:** `Inter` (sans-serif), tracking ligeiramente compacto nos títulos (`tracking-[-0.04em]` / `tracking-tight`).
- **Bordas e Raios:** `rounded-xl` para cards menores e botões; `rounded-2xl` para as seções principais.
- **Divisores de Linha:** Linhas horizontais ultra sutis (`border-b border-stone-200/60` a `border-b border-stone-200/80`).
- **Cabeçalho da Tabela:** CAIXA ALTA, texto pequeno, tracking largo (`text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500`).

### Experiência do Usuário (UX Writing e Filtros):

- **Explicação Clara da Recusa:** O erro nunca deve ser um código técnico puro. Se a nota for recusada, a linha expande para exibir um bloco explicativo em linguagem natural (ex: *"Prazo acima do limite: vence em 90 dias; o limite configurado do fundo é 60 dias."*).
- **Filtros Recomendados:**
  1. *Filtro de Status (Obrigatório):* Botões rápidos para `[Todas]`, `[Aprovadas]` e `[Recusadas]`.
  2. *Filtro por Motivo de Recusa:* Dropdown para filtrar por regra específica violada (ex: apenas recusadas por Prazo Máximo ou Valor Mínimo).
  3. *Filtro por Faixa de Valor:* Campos numéricos ou slider de mínimo e máximo.
  4. *Ordenação:* Ordenar colunas por Maior/Menor Valor e Vencimento mais próximo/distante.