# Magimu-HACKATON-KANASTRA
Hackaton Kanastra 2026

Integrantes: Giovanna Oliveira Martins, Maria Luísa Gabriel Domingues e Murilo Alves Beppler

Diagnóstico resumido da base de dados usada:

| Indicador / Métrica               | Valor Apurado     | Diagnóstico & Parecer Técnico                                                             |
| :-------------------------------- | :---------------- | :---------------------------------------------------------------------------------------- |
| **Total de Recebíveis Auditados** | 100.554           | 100% de preenchimento; nenhuma célula em branco nas colunas obrigatórias.                 |
| **Valor Nominal Consolidado**     | R$ 604.931.711,69 | 100% dos títulos apresentam valores positivos e estritamente numéricos.                   |
| **Prazo Médio (Duration Bruta)**  | 111,2 dias        | Prazos operacionais consistentes; nenhum título adquirido já vencido.                     |
| **Cedentes Únicos**               | 122               | Relação 1:1 estrita entre Razão Social e CNPJ cadastrado.                                 |
| **Sacados Únicos (CNPJ)**         | 4.209             | 3.940 nomes empresariais para 4.209 CNPJs (269 filiais ativas na carteira).               |
| **Duplicidades Reais**            | 0 registros       | Zero duplicatas integrais ou ocultas (mesmo sacado, valor e vencimento).                  |
| **Contratos Multiparcelas**       | 9.657 títulos     | Documentos com mais de um registro referente a parcelas com datas distintas (CCBs e NCs). |
| **Segregação de Fundos**          | 18 FIDCs          | A planilha agrega 18 fundos diferentes em uma única base de dados.                        |
| **Nota de Qualidade dos Dados**   | **8,5 / 10**      | Base operacionalmente íntegra; ressalva pela consolidação de múltiplos fundos.            |

---

## Como rodar (do zero)

**Pré-requisitos:** [Docker](https://docs.docker.com/get-docker/) (com Compose) e [uv](https://docs.astral.sh/uv/).

```bash
# 1. Variáveis de ambiente (usadas pelo Docker e pelo Django)
cp .env.example .env

# 2. Sobe o PostgreSQL 17
docker compose up -d --wait

# 3. Instala as dependências e cria as tabelas
cd backend
uv sync
uv run python manage.py migrate

# 4. Carrega a base de situação cadastral dos CNPJs (cnpj_situacao_mock.csv)
uv run python manage.py carregar_situacao_cadastral

# 5. (opcional) Testes e admin
uv run python manage.py test core
uv run python manage.py createsuperuser
uv run python manage.py runserver   # http://127.0.0.1:8000/admin
```

> Sem uv: `pip install -r backend/requirements.txt` e use `python manage.py ...`.

## Estrutura do projeto

```text
.
├── backend/                  # Django (uv)
│   ├── config/               # settings.py, urls.py
│   ├── core/                 # models, utils (hash), comandos de gestão
│   ├── pyproject.toml / uv.lock / requirements.txt
│   └── manage.py
├── interface-da-plataforma-antecipe/   # Frontend Next.js (será movido para frontend/)
├── docs/regrasnegocio.md     # Contexto e regras de negócio
├── docker-compose.yml        # PostgreSQL
└── validadores_antecipe.json # Regras do fundo (lidas em tempo de execução)
```

## Época 0 — Banco de dados (PostgreSQL)

| Tabela | Papel |
| :-- | :-- |
| `antecipe_lote_importacao` | Um upload de CSV: status, totais da simulação e **snapshot das regras** usadas (auditoria, já que o JSON muda sem deploy). |
| `antecipe_recebivel` | Uma linha do CSV + resultado: `status` (`APROVADO`/`BARRADO`), `barrado_por` (lista de regras), `motivo_recusa`, `prazo_dias`, `desconto`, `valor_liquido`. |
| `antecipe_situacao_cadastral_cnpj` | Base mock da Receita usada pela regra `SITUACAO_CADASTRAL_SACADO`. |

**Principais decisões:**

- **Duplicidade / idempotência:** `hash_id = SHA-256(doc_cedente + doc_sacado + nu_documento + vencimento)`. Não há `UNIQUE` global (duplicatas são gravadas como `BARRADO` para que a recusa apareça na tela), mas um **índice único parcial** `UNIQUE (hash_id) WHERE status = 'APROVADO'` garante no banco, mesmo sob concorrência, que uma nota nunca é aprovada duas vezes.
- **Vencimento no hash:** a base tem ~2.270 Duplicatas parceladas com o mesmo `nu_documento` e vencimentos diferentes; sem o vencimento elas seriam falsos duplicados. Com ele: zero colisões nas 100 mil linhas.
- **Vários motivos por nota:** `barrado_por` é um `ARRAY` (com índice GIN para o filtro "recusadas por regra X"), compatível com o formato de `resultado_esperado_100k.json`.
- **Desempenho:** tabela desnormalizada (espelha o CSV) para `bulk_create` em chunks; índices compostos `(doc_fundo, raiz_cnpj_sacado)` e `(doc_fundo, doc_cedente)` atendem as regras de concentração.
- **Integridade:** `CHECK`s garantem que nota aprovada tem `valor_liquido` e nota recusada tem ao menos um motivo.

---

## Época 1 — Backend: Funções para o BD e Entrada de Dados

Nesta época foram implementadas as funcionalidades centrais de ingestão, regras de negócio e endpoints REST:

### 1. Ingestão de CSV em Streaming e Gestão de Duplicatas (`core/services.py`)
- Leitura sequencial e processamento em *chunks* (lotes configuráveis de até 10.000 linhas) para suportar arquivos massivos (100k a 500k linhas) sem estourar memória.
- **Regra de Duplicatas da Época 1:**
  - Em caso de notas duplicadas (mesmo hash SHA-256 de `doc_cedente + doc_sacado + nu_documento + vencimento`), a submissão de nova linha é impedida e a recusa é registrada no log de auditoria.
  - **Exceção atendida:** Se a nota já existir na tabela com status `BARRADO` e o reenvio contiver a nota em status aceitável (`APROVADO`), o registro existente é atualizado com as novas informações, sem duplicação de linha.

### 2. Motor de Regras Dinâmico — Strategy Pattern (`core/rules_engine.py`)
- As regras são carregadas dinamicamente a partir do arquivo `validadores_antecipe.json` (sem valores *hardcoded* e sem necessidade de deploy para novas parametrizações).
- Suporte a todas as 9 regras do catálogo:
  1. `PRAZO_MAXIMO`: Prazo entre aquisição e vencimento menor que o limite (ex: 180 dias).
  2. `PRAZO_MINIMO`: Prazo entre aquisição e vencimento maior que o limite (ex: 30 dias).
  3. `NAO_VENCIDA`: Vencimento estritamente posterior à data-base da operação.
  4. `VALOR_MINIMO`: Valor de face superior ao piso mínimo (ex: R$ 100,00).
  5. `TIPO_RECEBIVEL`: Checagem de tipos aceitos (Duplicata, Duplicata de Serviço, etc.).
  6. `CNPJ_SACADO_VALIDO`: Validação matemática de formato e dígitos verificadores.
  7. `SITUACAO_CADASTRAL_SACADO`: Consulta em cache à base mock da Receita (`cnpj_situacao_mock.csv`).
  8. `CONCENTRACAO_MAXIMA_SACADO`: Percentual máximo do sacado (por raiz de CNPJ) em relação ao total do cedente/fundo.
  9. `CONCENTRACAO_MAXIMA_CEDENTE`: Percentual máximo de um cedente em relação à carteira total do fundo.
- Notas não duplicadas, mesmo que reprovadas, são salvas com `status = 'BARRADO'`, lista de violações em `barrado_por` e explicação amigável em `motivo_recusa`.

### 3. Precificação Financeira (Desconto Simples)
- Aplicação das fórmulas de Desconto Simples Comercial configuradas no JSON:
  - $\text{Taxa Efetiva} = \text{Taxa Mensal} \times \left( \frac{\text{Dias até Vencimento}}{30} \right)$
  - $\text{Desconto} = \text{Valor Nominal} \times \text{Taxa Efetiva}$
  - $\text{Valor Líquido} = \text{Valor Nominal} - \text{Desconto}$

### 4. Endpoints REST e Paginação de 20 em 20 (`core/views.py` e `core/urls.py`)
- `POST /api/upload-csv/`: Upload de arquivo CSV, validação em streaming, atualização de duplicatas e geração de log de auditoria.
- `GET /api/recebiveis/`: Listagem paginada padrão de **20 em 20 registros**, com filtros por `status`, `lote` e `nu_documento`.
- `POST /api/recebiveis/`, `GET /api/recebiveis/{id}/`, `PUT /api/recebiveis/{id}/`, `PATCH /api/recebiveis/{id}/`, `DELETE /api/recebiveis/{id}/`: CRUD completo de recebíveis via Django REST Framework.
- `GET /api/lotes/`: Histórico e totais consolidados dos lotes processados.
- `GET /api/regras/`: Consulta às regras ativas e parâmetros de precificação vigentes.

### 5. Log de Auditoria
- Cada lote gera um arquivo de log (ex: `backend/logs/log_processamento_<nome>.json`) no formato especificado:
  ```json
  // Aprovação
  { "linha": 2, "id": "725714", "status": "APROVADO" }
  // Rejeição
  { "linha": 3, "id": "1-759172", "status": "BARRADO", "barrado_por": [ "CONCENTRACAO_MAXIMA_SACADO" ] }
  ```

---

## Época 2 — Frontend: Facetas do Sistema e Organização da Interface

O frontend (`frontend/`) foi estruturado em **Next.js (React 19) com Tailwind CSS**, espelhando o Design System Kanastra (verde floresta `#0b2c20`, containers `#103b2c`, cards `#f8f6f1`, tipografia Inter) com uma **Barra Nav** que alterna entre as duas facetas:

### 1. Faceta dos Cedentes (`frontend/components/tabela-cedente.tsx`)
- **Tabela Paginada de 20 em 20:** Apresenta todas as notas submetidas para o fundo, ordenadas e paginadas de forma performática.
- **Toggle Expansível de Detalhes:** Cada linha possui um botão de detalhamento que expande dados adicionais (Cedente, Sacado, Prazo de Vencimento, Data de Aquisição e Valores).
- **UX de Recusa:** Para notas com status `BARRADO`, exibe um bloco destacado com alerta visual e a **explicação do motivo da recusa em linguagem clara**.
- **Filtros por Campo:** Filtros rápidos por status (`Todas`, `Aprovadas`, `Recusadas`) e buscas por número de nota, sacado e fundo.
- **Upload de CSV com Regra de Duplicatas:** Área de upload que integra com o backend, impedindo duplicatas e atualizando notas rejeitadas quando reenviadas como aprovadas.
- **Simulação Sticky:** Barra inferior que consolida em tempo real o valor líquido total a receber das notas aprovadas.

### 2. Faceta dos Fundos (`frontend/components/dashboard-fundo.tsx`)
- **Painel de Governança e Compliance:** Dashboard com as informações de cadastro do fundo e a política de precificação financeira (taxa mensal percentual e base de dias).
- **Formulário Fixo dos Validadores:** Exibe todos os validadores (`VALOR_MINIMO`, `PRAZO_MAXIMO`, `PRAZO_MINIMO`, `CONCENTRACAO_MAXIMA_SACADO`, etc.) com toggles de ativação e campos numéricos/listas para parametrização direta à mão.
- **Importação e Exportação de JSON:** Permite subir diretamente um arquivo `.json` (como o `validadores_antecipe.json`) para preencher e aplicar as regras, assim como exportar a configuração atualizada em formato JSON para download.
- **Reavaliação e Precificação em Tempo Real:** Conforme a regra da Época 2, ao salvar uma nova configuração:
  - Notas já aprovadas **nunca** se tornam rejeitadas.
  - Notas antes rejeitadas que agora passarem nas novas regras tornam-se **aprovadas**.
  - O valor líquido e o desconto de todas as notas aprovadas são recalculados em tempo real e refletidos imediatamente na visualização dos Cedentes.

### Como rodar o Frontend:

```bash
cd frontend
pnpm install   # ou npm install
pnpm dev       # Acesse em http://localhost:3000
```


