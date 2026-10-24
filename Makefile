# ==============================================================================
# Makefile — Antecipe (Hackathon Kanastra 2026)
# Utilitário de Terminal e Controle de Execução SRE/DevOps
# ==============================================================================

.PHONY: help check-ports test-visual build-front check-ci perf-logs audit-all run-backend run-frontend

help:
	@echo "=========================================================================="
	@echo "   ANTECIPE · COMANDOS DE AUDITORIA, DEPLOY E PERFORMANCE SRE            "
	@echo "=========================================================================="
	@echo "  make check-ports   : Verifica saúde dos serviços (8000, 3000) e migrações"
	@echo "  make test-visual   : Roda testes com pytest, cores e cobertura de regras"
	@echo "  make build-front   : Simula deploy com build de produção do Next.js"
	@echo "  make check-ci      : Consulta status recente da pipeline CI/CD no GitHub"
	@echo "  make perf-logs     : Exibe profiling recente de ingestão CSV e queries"
	@echo "  make audit-all     : Executa a auditoria completa de ponta a ponta"
	@echo "=========================================================================="

check-ports:
	@./healthcheck.sh ports

test-visual:
	@./healthcheck.sh tests

build-front:
	@./healthcheck.sh build

check-ci:
	@./healthcheck.sh ci

perf-logs:
	@./healthcheck.sh perf

audit-all:
	@./healthcheck.sh all
