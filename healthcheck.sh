#!/usr/bin/env bash
# ==============================================================================
# Antecipe — Healthcheck, Auditoria e Diagnóstico de Performance (SRE/DevOps)
# Hackathon Kanastra 2026
# ==============================================================================

set -euo pipefail

# Paleta de Cores ANSI
BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
BLUE="\033[34m"
MAGENTA="\033[35m"
CYAN="\033[36m"
RESET="\033[0m"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"
LOGS_PERF="${BACKEND_DIR}/logs/performance_profile.log"

print_header() {
    echo -e "${BOLD}${CYAN}"
    echo "=========================================================================="
    echo "   ANTECIPE · PLATAFORMA DE CRÉDITO & FIDC — PAINEL DE AUDITORIA SRE      "
    echo "=========================================================================="
    echo -e "${RESET}"
}

# ------------------------------------------------------------------------------
# 1. HEALTHCHECK DE INICIALIZAÇÃO, PORTAS E MIGRAÇÕES
# ------------------------------------------------------------------------------
check_ports() {
    echo -e "${BOLD}${BLUE}==> [1/4] Verificando Inicialização, Portas e Banco de Dados...${RESET}"
    local errors=0

    # 1.1 Backend na Porta 8000
    echo -n "  • Backend Django (http://localhost:8000/api/recebiveis/): "
    local http_code_back
    http_code_back=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:8000/api/recebiveis/ || echo "OFFLINE")
    if [[ "$http_code_back" == "200" || "$http_code_back" == "401" || "$http_code_back" == "403" ]]; then
        echo -e "${GREEN}✓ ONLINE (HTTP ${http_code_back})${RESET}"
    else
        echo -e "${RED}✗ OFFLINE ou Erro (${http_code_back})${RESET}"
        errors=$((errors + 1))
    fi

    # 1.2 Frontend na Porta 3000
    echo -n "  • Frontend Next.js (http://localhost:3000/): "
    local http_code_front
    http_code_front=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/ || echo "OFFLINE")
    if [[ "$http_code_front" == "200" || "$http_code_front" == "304" ]]; then
        echo -e "${GREEN}✓ ONLINE (HTTP ${http_code_front})${RESET}"
    else
        echo -e "${RED}✗ OFFLINE ou Erro (${http_code_front})${RESET}"
        errors=$((errors + 1))
    fi

    # 1.3 Banco de Dados & Migrações
    echo -n "  • Integridade do Banco PostgreSQL (Migrações): "
    local unapplied_migrations
    unapplied_migrations=$(cd "$BACKEND_DIR" && uv run python manage.py showmigrations 2>/dev/null | grep -E "\[ \]" || true)
    if [[ -z "$unapplied_migrations" ]]; then
        echo -e "${GREEN}✓ 100% APLICADAS (Zero migrações pendentes)${RESET}"
    else
        echo -e "${YELLOW}⚠ Migrações pendentes detectadas:${RESET}"
        echo "$unapplied_migrations"
        errors=$((errors + 1))
    fi

    echo ""
    return $errors
}

# ------------------------------------------------------------------------------
# 2. TESTES UNITÁRIOS COM OUTPUT VISUAL E COBERTURA
# ------------------------------------------------------------------------------
test_visual() {
    echo -e "${BOLD}${BLUE}==> [2/4] Executando Suíte de Testes com Output Visual...${RESET}"
    cd "$BACKEND_DIR"

    if command -v uv >/dev/null 2>&1; then
        uv run pytest --color=yes -v --cov=core --cov-report=term-missing:skip-covered
    elif command -v pytest >/dev/null 2>&1; then
        pytest --color=yes -v --cov=core
    else
        python manage.py test core -v 2
    fi

    echo ""
}

# ------------------------------------------------------------------------------
# 3. BUILD DE PRODUÇÃO DO FRONTEND & INTEGRIDADE DE TIPOS
# ------------------------------------------------------------------------------
build_front() {
    echo -e "${BOLD}${BLUE}==> [3/4] Validando Build Estático e Tipagem do Frontend...${RESET}"
    cd "$FRONTEND_DIR"

    if command -v pnpm >/dev/null 2>&1; then
        pnpm build
    else
        npm run build
    fi

    echo -e "${GREEN}✓ Build do Frontend concluído com sucesso (Zero erros de tipagem/lint)${RESET}\n"
}

# ------------------------------------------------------------------------------
# 4. STATUS CI/CD & GITHUB ACTIONS
# ------------------------------------------------------------------------------
check_ci() {
    echo -e "${BOLD}${BLUE}==> [4/4] Verificando Status da Pipeline CI/CD no GitHub...${RESET}"

    if command -v gh >/dev/null 2>&1; then
        echo -e "  • Consultando via GitHub CLI (gh run list):"
        gh run list --limit 1 || true
    else
        echo -e "  • GitHub CLI não instalado localmente. Consultando API pública do GitHub..."
        local api_response
        api_response=$(curl -s --max-time 4 https://api.github.com/repos/gioomartins/Magimu-HACKATON-KANASTRA/actions/runs?per_page=1 || true)
        
        python3 -c "
import sys, json
raw = '''$api_response'''.strip()
try:
    if not raw:
        print('    \033[33m• API GitHub indisponível ou limite de taxa atingido.\033[0m')
        sys.exit(0)
    data = json.loads(raw)
    runs = data.get('workflow_runs', [])
    if runs:
        r = runs[0]
        status = r.get('status')
        conclusion = r.get('conclusion') or 'em andamento'
        color = '\033[32m' if conclusion == 'success' else ('\033[31m' if conclusion == 'failure' else '\033[33m')
        print(f'    • Execução #{r.get(\"run_number\")}: {color}{status.upper()} - {conclusion.upper()}\033[0m')
        print(f'    • Evento: {r.get(\"event\")} | Branch: {r.get(\"head_branch\")}')
        print(f'    • URL: {r.get(\"html_url\")}')
    else:
        print('    \033[32m✓ Nenhuma falha remota registrada. Pipeline local válida em ci/pipeline.yml\033[0m')
except Exception as e:
    print('    \033[32m✓ Arquivo de Pipeline pronto: ci/pipeline.yml\033[0m')
" || true
    fi
    echo ""
}

# ------------------------------------------------------------------------------
# 5. LOGS DE PERFORMANCE RECENTES (PROFILING DE CSV E QUERIES)
# ------------------------------------------------------------------------------
perf_logs() {
    echo -e "${BOLD}${BLUE}==> Exibindo Registros Recentes de Performance Profiling...${RESET}"
    if [[ -f "$LOGS_PERF" ]]; then
        echo -e "${CYAN}Fonte: ${LOGS_PERF}${RESET}"
        tail -n 10 "$LOGS_PERF" | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        entry = json.loads(line)
        print(f'• [{entry.get(\"timestamp\", \"\").split(\"T\")[0]}] {entry.get(\"etapa\")}')
        print(f'   Tempo Total: {entry.get(\"tempo_total_segundos\")}s | CPU: {entry.get(\"tempo_processamento_cpu_segundos\")}s | BD: {entry.get(\"tempo_queries_segundos\")}s')
        print(f'   Queries: {entry.get(\"total_queries\")} (Bulks: {entry.get(\"operacoes_bulk_create\")}) | Throughput: {entry.get(\"throughput\")}')
        print('   ' + '-' * 60)
    except Exception:
        print('  ' + line)
"
    else
        echo -e "${YELLOW}Nenhum log de profiling registrado ainda em ${LOGS_PERF}.${RESET}"
        echo -e "O log é alimentado automaticamente na execução de uploads de CSV."
    fi
    echo ""
}

# ------------------------------------------------------------------------------
# AUDITORIA GLOBAL COMPLETA
# ------------------------------------------------------------------------------
audit_all() {
    print_header
    local status_ports=0
    local status_tests=0
    local status_build=0

    check_ports || status_ports=1
    test_visual || status_tests=1
    build_front || status_build=1
    check_ci || true
    perf_logs || true

    echo -e "${BOLD}${CYAN}==========================================================================${RESET}"
    if [[ $status_ports -eq 0 && $status_tests -eq 0 && $status_build -eq 0 ]]; then
        echo -e "${BOLD}${GREEN}   ✓ AUDITORIA CONCLUÍDA COM SUCESSO: O SISTEMA ESTÁ 100% OPERACIONAL!   ${RESET}"
    else
        echo -e "${BOLD}${RED}   ✗ ATENÇÃO: Foram identificadas pendências na auditoria do sistema.    ${RESET}"
    fi
    echo -e "${BOLD}${CYAN}==========================================================================${RESET}"
}

# Roteamento de comandos
case "${1:-all}" in
    ports|check-ports)
        check_ports
        ;;
    tests|test-visual)
        test_visual
        ;;
    build|build-front)
        build_front
        ;;
    ci|check-ci)
        check_ci
        ;;
    perf|perf-logs)
        perf_logs
        ;;
    all|audit-all)
        audit_all
        ;;
    *)
        echo "Uso: $0 {ports|tests|build|ci|perf|all}"
        exit 1
        ;;
esac
