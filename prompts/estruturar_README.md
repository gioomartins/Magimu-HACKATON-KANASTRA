Atue como um Technical Writer Sênior e Arquiteto de Software. Analise todo o código fonte deste projeto (Backend em Django, Frontend em Next.js, Testes e CI/CD) e crie um arquivo `README.md` exaustivo, profissional e visualmente impressionante para a entrega final do hackathon da Kanastra.

O produto se chama "Antecipe" e o lema é: "Importar. Decidir. Explicar. Simular."

O `README.md` deve conter obrigatoriamente as seguintes seções estruturadas:

1. **Visão Geral e Valor de Negócio:** Explique a proposta de valor focada na clareza da recusa de crédito para a pequena empresa (Ana) e na automação do motor de regras sem deploy para o fundo.
2. **Tech Stack e Ferramentas:** Liste as tecnologias de forma categorizada (Django, DRF, Next.js, Tailwind, GitHub Actions, JWT, Pytest).
3. **Decisões de Arquitetura (System Design):** Documente as soluções técnicas adotadas:
   - O padrão Strategy para os validadores dinâmicos.
   - O processamento do CSV em chunks para não estourar a memória.
   - A geração de hash_id (SHA-256) e a validação intralote/banco para barrar notas duplicadas e evitar Race Conditions.
4. **Diagramas de Fluxo e Arquitetura (Mermaid):**
   - Gere um código Mermaid `graph TD` mostrando a arquitetura de alto nível (Client -> Next.js -> Django API -> Rules Engine -> DB).
   - Gere um código Mermaid `sequenceDiagram` ilustrando a jornada da nota fiscal: do upload do CSV até a decisão final (Aprovada/Recusada) e cálculo de juros simples.
5. **CI/CD e Segurança:** Detalhe a pipeline automatizada (GitHub Actions) e a proteção de rotas com RBAC (Gestor vs. Empresa).
6. **Guia de Execução Local:** Forneça os comandos exatos de terminal (copiar e colar) para rodar o backend, as migrações, o frontend e os testes unitários a partir do zero.
7. **Trabalhos Futuros:** Cite melhorias como a adoção de mensageria assíncrona (NATS/Kafka) para escalar a ingestão.

Entregue a resposta com a formatação Markdown completa e os blocos de código Mermaid prontos para renderização nativa no GitHub.