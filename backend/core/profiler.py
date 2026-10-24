"""
Módulo de Profiling de Performance e Auditoria de Queries do Django.

Mede com precisão cirúrgica:
1. Tempo total de execução (parsing e validação de chunks CSV).
2. Quantidade total e tempo gasto em queries no banco de dados.
3. Quantidade de inserções em lote (bulk_create) e throughput (linhas/segundo).
4. Persistência em arquivo de log dedicado (backend/logs/performance_profile.log).
"""

from __future__ import annotations

import functools
import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

from django.conf import settings
from django.db import connection

logger = logging.getLogger(__name__)


def _obter_caminho_log_perf() -> Path:
    logs_dir = getattr(settings, 'BASE_DIR', Path('.')) / 'logs'
    logs_dir.mkdir(exist_ok=True, parents=True)
    return logs_dir / 'performance_profile.log'


def profile_performance(nome_etapa: str = "Processamento CSV"):
    """
    Decorador para medir tempo total e profiling de queries no PostgreSQL.
    Funciona tanto com settings.DEBUG=True quanto DEBUG=False utilizando connection.execute_wrapper.
    """
    def decorador(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            queries_executadas = []
            bulk_creates_count = 0

            def query_tracker(execute, sql, params, many, context):
                q_start = time.perf_counter()
                try:
                    return execute(sql, params, many, context)
                finally:
                    q_duration = time.perf_counter() - q_start
                    sql_str = str(sql).strip()
                    is_bulk = "INSERT INTO" in sql_str.upper() and ("antecipe_recebivel" in sql_str.lower() or many)
                    nonlocal bulk_creates_count
                    if is_bulk:
                        bulk_creates_count += 1

                    queries_executadas.append({
                        "sql": sql_str[:120] + ("..." if len(sql_str) > 120 else ""),
                        "duration": q_duration,
                        "is_bulk": is_bulk,
                    })

            t_inicio = time.perf_counter()

            # Executa com wrapper de queries ativo
            with connection.execute_wrapper(query_tracker):
                resultado = func(*args, **kwargs)

            t_total = time.perf_counter() - t_inicio
            qtd_queries = len(queries_executadas)
            tempo_queries = sum(q["duration"] for q in queries_executadas)
            tempo_cpu = max(0.0, t_total - tempo_queries)

            # Tenta inferir o total de linhas do resultado se for um LoteImportacao
            total_linhas = 0
            if isinstance(resultado, tuple) and len(resultado) > 0:
                lote = resultado[0]
                total_linhas = getattr(lote, "total_recebiveis", 0) or 0
            elif hasattr(resultado, "total_recebiveis"):
                total_linhas = resultado.total_recebiveis

            throughput = f"{int(total_linhas / t_total):,} linhas/s" if t_total > 0 and total_linhas > 0 else "N/A"

            # Formata saída visual no terminal
            cyan = "\033[96m"
            green = "\033[92m"
            yellow = "\033[93m"
            bold = "\033[1m"
            reset = "\033[0m"

            banner = f"""
{bold}{cyan}┌───────────────────────── PERFORMANCE PROFILE ─────────────────────────┐{reset}
{bold}{cyan}│{reset} {bold}Operação:{reset} {nome_etapa:<53} {cyan}│{reset}
{bold}{cyan}│{reset} {bold}Tempo Total:{reset} {green}{t_total:.4f}s{reset} (CPU: {tempo_cpu:.4f}s | BD: {tempo_queries:.4f}s){' ' * max(0, 24 - len(f'{t_total:.4f}'))} {cyan}│{reset}
{bold}{cyan}│{reset} {bold}Queries Executadas:{reset} {yellow}{qtd_queries}{reset} queries ({bulk_creates_count} operações de bulk_create){' ' * max(0, 16 - len(str(qtd_queries)))} {cyan}│{reset}
{bold}{cyan}│{reset} {bold}Throughput Ingestão:{reset} {green}{throughput}{reset}{' ' * max(0, 42 - len(throughput))} {cyan}│{reset}
{bold}{cyan}└────────────────────────────────────────────────────────────────────────┘{reset}
"""
            print(banner)

            # Grava no log de performance
            log_path = _obter_caminho_log_perf()
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "etapa": nome_etapa,
                "tempo_total_segundos": round(t_total, 4),
                "tempo_queries_segundos": round(tempo_queries, 4),
                "tempo_processamento_cpu_segundos": round(tempo_cpu, 4),
                "total_queries": qtd_queries,
                "operacoes_bulk_create": bulk_creates_count,
                "total_linhas": total_linhas,
                "throughput": throughput,
            }

            try:
                with open(log_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
            except Exception as e:
                logger.warning(f"Não foi possível gravar log de performance: {e}")

            return resultado

        return wrapper
    return decorador
