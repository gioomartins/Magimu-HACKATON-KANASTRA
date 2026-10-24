Atue como um Engenheiro de Software Full-Stack Sênior e Arquiteto de Segurança. Estamos na reta final do hackathon da Kanastra e precisamos implementar a camada de Autenticação (RBAC), Testes e CI/CD para o projeto "Antecipe" (Stack: Django DRF + Next.js).

### 1. AUTENTICAÇÃO E CONTROLE DE ACESSO (BACKEND - DJANGO)
Implemente autenticação baseada em JWT (use `djangorestframework-simplejwt`).
- Crie um sistema simples de perfis vinculados ao User model com dois tipos: `GESTOR` e `EMPRESA`.
- Crie os endpoints `/api/auth/register/` e `/api/auth/login/` (retornando o token e a role do usuário).
- Proteja as rotas da API: O upload do CSV pode ser feito por ambos, mas apenas o `GESTOR` pode ter acesso de escrita/leitura nas configurações do motor de regras.

### 2. TELAS DE LOGIN E CRIAÇÃO DE CONTA (FRONTEND - NEXT.JS)
Crie duas telas (`/login` e `/register`) usando Tailwind CSS, seguindo o design system da Kanastra (fundo verde escuro institucional `bg-[#0B2C20]`, cards off-white `bg-[#F8F6F1]`).
- Armazene o JWT e a `role` do usuário (Gestor ou Empresa) de forma segura no frontend (context ou localStorage).

### 3. UX DE PERMISSÕES (FRONTEND - NAVIGATION)
O sistema possui duas telas principais: Tela 1 (Dashboard de Antecipação/Upload) e Tela 2 (Configuração de Regras do Fundo).
- Implemente a lógica de UI na Navbar ou Sidebar: Se a role for `GESTOR`, ambos os botões funcionam normalmente.
- Se a role for `EMPRESA`, o botão de navegação para a "Tela 2 (Regras)" deve estar visível, mas desabilitado. Aplique as classes Tailwind para UX: `opacity-50 cursor-not-allowed`. Ao dar hover neste botão, exiba um tooltip customizado ou use a classe `title` do HTML dizendo: "Acesso restrito a Gestores do Fundo".

### 4. TESTES UNITÁRIOS (BACKEND - PYTEST/UNITTEST)
Foque os testes exclusivamente na regra de negócio (Core) para provar a confiabilidade do sistema. Crie um arquivo `test_rules_engine.py`:
- Teste 1: Garantir que o cálculo de Desconto Simples está matematicamente correto.
- Teste 2: Garantir que o `ValidadorDuplicidade` barra notas com o mesmo hash_id.
- Teste 3: Garantir que a regra de `VALOR_MINIMO` recusa notas abaixo do piso e aprova notas acima.

### 5. CI/CD BÁSICO (GITHUB ACTIONS)
Crie o arquivo `.github/workflows/pipeline.yml` para rodar a cada PUSH ou PULL REQUEST na branch `main`.
- O Job deve ter dois steps paralelos ou sequenciais:
  1. Backend: Fazer setup do Python, instalar `requirements.txt` e rodar os testes unitários do Django.
  2. Frontend: Fazer setup do Node.js, instalar dependências (`npm install --legacy-peer-deps`) e garantir que o build do Next.js passa sem erros (`npm run build`).

### OUTPUT ESPERADO:
Gere os códigos na seguinte ordem para integração rápida:
1. O arquivo `.github/workflows/pipeline.yml`.
2. A configuração de JWT e as Views de Login/Register (Django).
3. O arquivo de testes `test_rules_engine.py`.
4. Os componentes React de Login e a lógica de restrição do botão na Navbar (Next.js).