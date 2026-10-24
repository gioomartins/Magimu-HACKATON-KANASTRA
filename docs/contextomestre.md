# Contexto Mestre: Projeto “Antecipe” - Hackathon Kanastra 2026

## 1. Visão Geral do Desafio

O objetivo é construir o portal **Antecipe**, uma solução de backoffice financeiro para um Fundo de Investimento em Direitos Creditórios (FIDC).

- **O Problema:** Pequenas empresas (cedentes, ex: “Ana”) vendem a prazo, mas precisam do dinheiro hoje. Elas antecipam (vendem) essas notas fiscais para o Fundo Kanastra. O Fundo precisa validar essas notas contra regras rígidas de compliance (prazo, valor, risco) e calcular o desconto (juros).
- **O Mantra do Produto:** Importar. Decidir. Explicar. Simular.

## 2. Stack Tecnológico Escolhido

- **Backend:** Django (Python) focado em ORM para integridade de dados e lógica financeira. (Pode usar Django REST Framework ou Django Ninja para a API).
- **Frontend:** React (Next.js) com Tailwind CSS para estilização ágil.
- **Banco de Dados:** SQLite (para o MVP/Hackathon) ou PostgreSQL, utilizando `UniqueConstraints` severas.

## 3. Requisitos Core e Lógica de Negócio

### A. Ingestão de Dados (CSV)

- O sistema deve receber arquivos CSV massivos (100 mil a 500 mil linhas).
- Formato: Separador `;`, decimal com vírgula `,`, datas `dd/mm/aaaa`, UTF-8.
- **Diferencial Técnico:** A leitura não pode travar o servidor. O backend deve ler o arquivo em *chunks* (streaming) e usar `bulk_create` (ou similar) no banco de dados.

### B. Motor de Regras Dinâmico (Sem Deploy)

- O sistema não pode ter valores fixos no código (`if valor < 100`).
- As regras são lidas de um arquivo `validadores_antecipe.json`.
- O backend deve aplicar o padrão *Strategy*: executar apenas as regras marcadas como `"ativo": true` no JSON. Se o JSON mudar na interface administrativa (ou for sobrescrito), as novas regras valem para o próximo lote, sem precisar reiniciar o servidor.

### C. Idempotência e Duplicidade (Requisito Crítico)

- Uma nota não pode ser vendida duas vezes.
- **Solução Técnica:** O banco de dados deve ter uma chave única composta (ex: `Hash(CNPJ_Cedente + CNPJ_Sacado + Numero_Nota)`). Se o usuário enviar o mesmo arquivo duas vezes ou der duplo clique, o banco rejeita a inserção silenciosamente (evitando *Race Conditions*) e o sistema marca a nota como “Recusada por Duplicidade”.

### D. Matemática Financeira (Precificação)

- **Data-base para cálculo:** 22/10/2026 (Fixar essa data no código/configuração).
- **Regra:** Desconto Simples Comercial.
- **Taxa:** 2% ao mês (base 30 dias).
- **Fórmula:**
    1. Prazo = Diferença em dias entre Vencimento e Data-Base.
    2. Taxa Efetiva = 2% * (Prazo / 30).
    3. Desconto = Valor de Face * Taxa Efetiva.
    4. Valor Líquido = Valor de Face - Desconto.

## 4. Diretrizes de UI/UX e Design System (Frontend)

O frontend deve espelhar o rebranding da Kanastra (conexão com a natureza + solidez financeira).

### Paleta de Cores (Tailwind):

- **Fundo da Página:** Verde Kanastra Escuro (`bg-[#0B3B24]` ou `bg-emerald-950`).
- **Fundo dos Cards/Tabelas:** Off-white/Creme quente (`bg-[#F8F6F1]` ou `bg-stone-100`).
- **Textos Principais (Dados):** Cinza bem escuro (`text-stone-800`).
- **Cabeçalhos das Colunas:** Cinza pardacento (`text-stone-500`).
- **Status Aprovada:** Verde vibrante/médio (`text-emerald-600`, `bg-emerald-100`).
- **Status Recusada:** Vermelho/Rosa suave (`text-rose-600`, `bg-rose-100`).

### Tipografia e Estilo:

- **Fonte Base:** Inter (sans-serif).
- **Bordas:** Arredondamento suave nos containers (`rounded-xl` ou `rounded-2xl`).
- **Divisores:** Linhas horizontais ultra sutis entre as linhas da tabela (`border-b border-stone-200/60`).
- **Cabeçalho da Tabela:** CAIXA ALTA, texto pequeno, tracking largo (`text-xs uppercase tracking-wider font-bold`).

### Experiência do Usuário (UX Writing - Explicação da Recusa):

- **O Diferencial:** O erro não pode ser um código técnico.
- Se uma nota for recusada, a linha da tabela deve expandir visualmente para baixo, mostrando um bloco de alerta (cor de fundo avermelhada muito clara) com a explicação em linguagem natural.
- *Exemplo:* “Prazo acima do limite: vence em 90 dias; o limite configurado é 60.”
- O sistema deve exibir uma barra inferior (sticky) no card mostrando a “Simulação” com o Total Líquido aprovado (ex: `R$ 9.800,00`).

## 5. Estrutura de Resposta Esperada da IA

Ao atuar neste projeto, a IA deve focar em:

1. Produzir código Django otimizado para operações em lote (QuerySets, `bulk_create`).
2. Produzir componentes React pequenos e reutilizáveis, usando estritamente as cores e classes Tailwind descritas acima.
3. Garantir que todo retorno de erro seja amigável e focado na persona “Ana” (Pequena Empreendedora).