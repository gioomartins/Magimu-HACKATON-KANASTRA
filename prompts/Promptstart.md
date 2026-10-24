Atue como um Engenheiro de Software Full-Stack Sênior e Arquiteto de Soluções. Estamos desenvolvendo o "Antecipe", um sistema de backoffice financeiro para o hackathon da Kanastra. 

O lema do produto é: "Importar. Decidir. Explicar. Simular."

### TECH STACK
- Backend: Django + Django REST Framework (DRF) + SQLite/PostgreSQL.
- Frontend: React (Next.js) + Tailwind CSS.
- Data-base para cálculos financeiros: 22 de outubro de 2026.

### DIRETRIZES DE ARQUITETURA BACKEND (DJANGO)

1. MODELAGEM DE DADOS E IDEMPOTÊNCIA (ORM)
Crie um model `Recebivel` mapeando exatamente as colunas do CSV de entrada: nome_fundo, doc_fundo, nome_cedente, doc_cedente, nome_sacado, doc_sacado, nu_documento, tipo_recebivel, valor_nominal (Decimal), data_vencimento_original (Date) e data_aquisicao (Date).
- Adicione os campos de controle interno: valor_liquido (Decimal), status (CharField: Aprovada/Recusada), motivo_recusa (TextField) e hash_id (CharField com indexação).
- Regra de Idempotência: O `hash_id` deve ser gerado usando SHA-256 combinando os campos `doc_cedente + doc_sacado + nu_documento`. 
- Mock de API: Para a regra "SITUACAO_CADASTRAL_SACADO", crie uma função mockada que simule uma consulta de CNPJ retornando sempre o status "ATIVA".
- Prevenção de Race Condition: Adicione uma `UniqueConstraint` no banco de dados para o `hash_id`. No parser do CSV, trate as datas no padrão BR (dd/mm/yyyy) e use `bulk_create(ignore_conflicts=True)` para garantir que envios simultâneos falhem silenciosamente a nível de banco sem quebrar a aplicação, classificando a nota como "Recusada: Duplicidade".

2. OTIMIZAÇÃO DE UPLOAD E CHUNKING
O sistema deve suportar CSVs de até 500.000 linhas. 
- O endpoint de upload em DRF não deve carregar o arquivo inteiro na memória. Implemente um parser em Python usando geradores (`yield`) ou `pandas.read_csv(chunksize=10000)` para processar e salvar no banco em lotes (chunks). 
- Utilize cache (Redis/Memcached, ou em memória para o MVP) para armazenar as regras ativas durante o processamento do lote, evitando queries no banco a cada linha.

3. MOTOR DE REGRAS DINÂMICO (STRATEGY PATTERN)
O JSON de regras (validadores_antecipe.json) não pode estar hardcoded em `if/else`.
- Crie um padrão Strategy no Python. Cada validador (ex: `PRAZO_MAXIMO`, `VALOR_MINIMO`) deve ser uma classe ou função separada.
- O motor deve carregar as regras (apenas as com `"ativo": true`), iterar sobre a nota e, se falhar, interromper imediatamente retornando um erro legível para humanos. 
- Cálculo de Desconto Simples: Taxa proporcional em dias (base 30 dias/mês). Fórmula: `Desconto = Valor_Face * (Taxa_Mensal * (Dias_Ate_Vencimento / 30))`.

### DIRETRIZES DE FRONTEND (NEXT.JS + TAILWIND)

1. DESIGN SYSTEM KANASTRA
- Tipografia: Inter.
- Cores: Fundo da tela institucional verde escuro (`bg-[#0B2C20]`). Cards de dados em off-white quente (`bg-[#F8F6F1]`). 
- Status Semântico: Aprovada (`text-emerald-600`), Recusada (`text-rose-500`).

2. ESTRUTURA DOS COMPONENTES
Gere o código para uma Single Page Application contendo:
- Top Dashboard: 3 Cards (Total de Notas processadas, Valor Líquido Aprovado em Verde, Valor Recusado em Vermelho).
- Área de Upload: Um *dropzone* limpo para o CSV.
- Tabela de Resultados: Colunas (NOTA, SACADO, VENCIMENTO, VALOR, STATUS). 
- UX de Recusa (CRÍTICO): Quando uma nota é recusada, renderize imediatamente abaixo dela uma "sub-linha" expandida (fundo `bg-rose-50`) com o motivo da recusa traduzido para linguagem clara (ex: "O prazo desta nota excede o limite máximo permitido pelo fundo de 60 dias.").
- Bottom Bar: Barra fixa na base da tela com o total da simulação ("Valor Líquido a Receber").

### OUTPUT ESPERADO DA IA
Por favor, gere a estrutura do projeto passo a passo:
1. O Model Django (`models.py`) com as constraints de idempotência.
2. A lógica do Motor de Regras (`rules_engine.py`) aplicando o Strategy Pattern e o cálculo de Juros.
3. A View/Service de processamento de Upload em chunks (`views.py` / `services.py`).
4. O componente principal React da página do Dashboard (`Dashboard.tsx`), incluindo a tabela que expande o erro da recusa.

Comece gerando os arquivos do Backend (Django). Forneça o código limpo, comentado e pronto para rodar.

### ESTRUTURA DE DIRETÓRIOS (PASTEAMENTO)
Siga estritamente esta estrutura de pastas para o projeto, portanto reestruture (reaproveite o que tem) o projeto ja existente para essa estrutura:

A pasta /interface-da-plataforma-antecipe possui o frontend atual. Aproveite o conteudo la presente para o front reestruturado.

/antecipe-kanastra
│
├── /backend                 # Projeto Django
│   ├── /core                # App principal (models, views, serializers)
│   │   ├── models.py        # Model Invoice com hash_id
│   │   ├── rules_engine.py  # Motor de validação Strategy
│   │   ├── services.py      # Lógica de chunking do CSV
│   │   └── views.py         # Endpoints DRF
│   ├── /config              # Configurações do Django (settings.py, urls.py)
│   ├── requirements.txt
│   └── manage.py
│
├── /frontend                # Projeto Next.js
│   ├── /src
│   │   ├── /components      # Componentes UI (Upload, Tabela, Cards)
│   │   ├── /pages           # Dashboard principal
│   │   ├── /services        # Integração Axios com o Backend
│   │   └── /styles          # Globals CSS e Tailwind
│   ├── tailwind.config.js
│   └── package.json
│
└── validadores_antecipe.json # Arquivo de regras na raiz para leitura