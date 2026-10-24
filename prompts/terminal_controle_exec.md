Atue como um Engenheiro DevOps e SRE (Site Reliability Engineer) Sênior. Estamos nos momentos finais do hackathon e precisamos de um utilitário de terminal (um arquivo `Makefile` ou script `bash` chamado `healthcheck.sh`) para auditar e validar toda a integridade, performance e deploy do sistema "Antecipe" (Django + Next.js).

### 1. HEALTHCHECK DE INICIALIZAÇÃO E PORTAS
O script deve verificar automaticamente se os serviços estão de pé:
- Ping no backend (Django) na porta 8000 para garantir que a API iniciou sem erros fatais.
- Ping no frontend (Next.js) na porta 3000.
- Validação do banco de dados: Rodar `python manage.py showmigrations` ou um check customizado para garantir que não há migrações pendentes.

### 2. PERFORMANCE PROFILING (TEMPO DE EXECUÇÃO E QUERIES)
Precisamos provar para a banca que lidamos bem com o volume de dados do CSV.
- Crie um decorador leve em Python (`utils/profiler.py`) para injetar no serviço de upload do Django. Ele deve medir e logar no terminal:
  a) Tempo total de parsing do CSV (em chunks).
  b) Tempo de execução e quantidade de queries executadas no banco (especialmente o `bulk_create`).
- O script de terminal deve ter um comando para exibir esses logs de performance recentes.

### 3. TESTES UNITÁRIOS COM OUTPUT VISUAL
O script deve orquestrar a bateria de testes de forma clara e legível no terminal:
- Acionar `pytest backend/ -v --color=yes` para mostrar o status de cada teste (pass/fail) detalhadamente.
- Acionar `pytest --cov` (se configurado) para mostrar a cobertura de código das regras de negócio.

### 4. SIMULAÇÃO DE DEPLOY E VERIFICAÇÃO CI/CD
- Garantia de Build do Front: O script deve rodar `npm run build` na pasta do frontend para assegurar que nenhum erro de linting ou tipagem vai quebrar a pipeline de produção.
- Status do GitHub Actions: Integre um comando simples usando o GitHub CLI (`gh run list --limit 1`) para buscar e exibir no terminal se a última pipeline de CI/CD passou (verde) ou falhou (vermelho).

### OUTPUT ESPERADO:
Gere os códigos focados em execução rápida e visual limpo:
1. O código completo do arquivo `Makefile` (ou `healthcheck.sh`) com comandos segmentados (ex: `make check-ports`, `make test-visual`, `make check-ci`) e um comando global `make audit-all`.
2. O código do decorador `profiler.py` (usando `time` e `connection.queries` do Django) para anexar à função de upload.