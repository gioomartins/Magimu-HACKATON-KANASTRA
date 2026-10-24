from decimal import Decimal
from django.db import connection
from django.db.models import Count, Sum
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Recebivel
from core.permissions import IsGestor


class AnalyticsDashboardView(APIView):
    """
    Endpoint de Analytics & Risco restrito a Gestores do Fundo (GESTOR).
    Retorna KPIs executivos, taxa de aprovação/rejeição, motivos de recusa e
    concentração de risco nos Top 5 Sacados.
    """
    permission_classes = [IsAuthenticated, IsGestor]

    def get(self, request, *args, **kwargs):
        # 1. Totalizadores de Operações
        total_notas = Recebivel.objects.count()

        # Agregações por status
        agregados_aprovado = Recebivel.objects.filter(status=Recebivel.Status.APROVADO).aggregate(
            volume=Sum('valor_nominal'),
            qtd=Count('id')
        )
        agregados_barrado = Recebivel.objects.filter(status=Recebivel.Status.BARRADO).aggregate(
            volume=Sum('valor_nominal'),
            qtd=Count('id')
        )

        vol_aprovado = float(agregados_aprovado['volume'] or Decimal('0.00'))
        vol_recusado = float(agregados_barrado['volume'] or Decimal('0.00'))
        qtd_aprovadas = agregados_aprovado['qtd'] or 0
        qtd_recusadas = agregados_barrado['qtd'] or 0

        # 2. Taxa de Rejeição e Aprovação
        if total_notas > 0:
            taxa_rejeicao = round((qtd_recusadas / total_notas) * 100, 2)
            taxa_aprovacao = round((qtd_aprovadas / total_notas) * 100, 2)
        else:
            taxa_rejeicao = 0.0
            taxa_aprovacao = 0.0

        # 3. Motivos de Recusa agrupados (Top motivos do campo ArrayField barrado_por)
        motivos_recusa = []
        if qtd_recusadas > 0:
            try:
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT unnest(barrado_por) AS motivo, COUNT(*) AS total
                        FROM antecipe_recebivel
                        WHERE status = 'BARRADO'
                        GROUP BY motivo
                        ORDER BY total DESC
                        LIMIT 8
                    """)
                    motivos_recusa = [
                        {"motivo": row[0], "total": int(row[1])}
                        for row in cursor.fetchall()
                    ]
            except Exception:
                # Fallback em Python caso o banco de testes não suporte unnest do postgres
                contagem_motivos = {}
                for rec in Recebivel.objects.filter(status=Recebivel.Status.BARRADO).only('barrado_por'):
                    for mot in rec.barrado_por:
                        contagem_motivos[mot] = contagem_motivos.get(mot, 0) + 1
                motivos_recusa = [
                    {"motivo": k, "total": v}
                    for k, v in sorted(contagem_motivos.items(), key=lambda x: x[1], reverse=True)[:8]
                ]

        # 4. Risco de Concentração (Top 5 Sacados por Volume Aprovado)
        sacados_query = (
            Recebivel.objects.filter(status=Recebivel.Status.APROVADO)
            .values('doc_sacado', 'nome_sacado')
            .annotate(
                volume=Sum('valor_nominal'),
                quantidade=Count('id')
            )
            .order_by('-volume')[:5]
        )

        risco_concentracao = [
            {
                "doc_sacado": s['doc_sacado'],
                "nome_sacado": s['nome_sacado'],
                "volume": float(s['volume'] or Decimal('0.00')),
                "quantidade": s['quantidade'],
                # Percentual de exposição sobre a carteira aprovada total
                "percentual_exposicao": round(
                    (float(s['volume']) / vol_aprovado * 100) if vol_aprovado > 0 else 0.0,
                    2
                )
            }
            for s in sacados_query
        ]

        payload = {
            "kpis": {
                "volume_total_aprovado": vol_aprovado,
                "volume_total_recusado": vol_recusado,
                "quantidade_total_processada": total_notas,
                "quantidade_aprovadas": qtd_aprovadas,
                "quantidade_recusadas": qtd_recusadas,
            },
            "taxa_rejeicao": {
                "percentual_rejeicao": taxa_rejeicao,
                "percentual_aprovacao": taxa_aprovacao,
            },
            "motivos_recusa": motivos_recusa,
            "risco_concentracao": risco_concentracao,
        }

        return Response(payload, status=status.HTTP_200_OK)
