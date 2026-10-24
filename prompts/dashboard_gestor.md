Atue como um Engenheiro Full-Stack Sênior e Especialista em Data Analytics. Precisamos adicionar uma nova aba de "Analytics & Risco" no sistema "Antecipe" (Django + Next.js), com acesso restrito à role de `GESTOR`.

### 1. BACKEND (DJANGO REST FRAMEWORK)
Crie um endpoint `/api/analytics/dashboard/` que retorne dados agregados para os gráficos. Utilize as funções de agregação do Django (`Sum`, `Count`) no model `Recebivel`. O JSON de resposta deve conter:
- kpis: Volume financeiro total aprovado, Volume total recusado, e Quantidade total de notas processadas.
- taxa_rejeicao: Porcentagem de notas recusadas vs aprovadas.
- motivos_recusa: Contagem agrupada dos principais motivos de recusa (para um gráfico de pizza).
- risco_concentracao: Top 5 Sacados (CNPJ) com maior volume financeiro aprovado (para monitorar risco de exposição).

### 2. FRONTEND (NEXT.JS + TAILWIND CSS)
Crie a página `/gestao/analytics.tsx`.
- Proteção de Rota: A página deve redirecionar para `/` se o usuário não for `GESTOR`.
- Design System: Mantenha o padrão Kanastra. Fundo da tela em verde escuro (`bg-[#0B2C20]`), e os painéis/cards dos gráficos em off-white (`bg-[#F8F6F1]`).
- Integração de Gráficos: Utilize a biblioteca `recharts` (ou `chart.js` via `react-chartjs-2`) para renderizar:
  1. Uma linha superior com 3 High-Level KPIs (Volume Aprovado, Volume Recusado, Total de Operações).
  2. Um Gráfico de Pizza (Donut) evidenciando os "Motivos de Recusa".
  3. Um Gráfico de Barras Horizontais evidenciando o "Risco de Concentração (Top 5 Sacados)".

### 3. OUTPUT ESPERADO
Gere os códigos focados em entrega rápida:
1. A view `AnalyticsDashboardView` no Django e sua rota em `urls.py`.
2. O componente React `/gestao/analytics.tsx` completo, já importando o `recharts` e aplicando as classes Tailwind com os mocks ou integração de API mapeada.