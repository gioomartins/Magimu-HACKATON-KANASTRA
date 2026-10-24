Atue como um Engenheiro Frontend Sênior especializado em React e Next.js. Precisamos implementar internacionalização (i18n) no sistema "Antecipe", adicionando suporte para Português (pt-BR) e Inglês (en), com um botão de alternância (toggle) na interface.

### 1. CONFIGURAÇÃO DO i18n (react-i18next)
- Configure a biblioteca `react-i18next` e `i18next` no projeto Next.js.
- Crie a estrutura de diretórios para os dicionários (ex: `/locales/pt/common.json` e `/locales/en/common.json`).
- Inicialize o i18n garantindo que o idioma padrão seja o `pt-BR` e que a troca de idioma persista no `localStorage`.

### 2. MAPEAMENTO E REVISÃO DE TEXTOS (DICIONÁRIOS)
Faça uma varredura nas telas que criamos (Upload, Dashboard, Tabela de Resultados, Login, Analytics e Navbar) e extraia todas as strings hardcoded para os dicionários JSON. 
Certifique-se de incluir:
- **Navbar/Tabs:** Dashboard, Configurações, Analytics, Sair.
- **Botões:** "Fazer upload do lote", "Simular Antecipação", "Entrar", "Criar Conta".
- **Tabela e Status:** Nota, Sacado, Vencimento, Valor, Status, "Aprovada", "Recusada".
- **Mensagens de Erro/Motivos:** Traduza a estrutura base dos motivos de recusa (ex: "Prazo acima do limite" -> "Term exceeds limit").
- **Métricas:** "Total de Notas", "Valor Aprovado (Líquido)", "Valor Recusado".

### 3. COMPONENTE DE LANGUAGE SWITCHER (UI)
- Crie um componente `LanguageSwitcher.tsx` (um botão toggle ou dropdown minimalista).
- Mantenha o design system da Kanastra: utilize cores discretas que funcionem no fundo verde escuro (`bg-[#0B2C20]`) da Navbar, com texto off-white, ou bandeiras/ícones minimalistas (PT / EN).
- O botão deve utilizar a função `i18n.changeLanguage()` para alterar o idioma globalmente e re-renderizar a UI instantaneamente.

### OUTPUT ESPERADO:
Gere os códigos necessários na seguinte ordem:
1. O arquivo de configuração `i18n.ts` (ou `.js`).
2. Os dois arquivos JSON de dicionário (`pt.json` e `en.json`) com todas as chaves de tradução mapeadas.
3. O componente `LanguageSwitcher.tsx`.
4. Um exemplo prático mostrando como atualizar o arquivo `Dashboard.tsx` para importar o hook `useTranslation()` e substituir pelo menos 3 textos estáticos pelas chaves do dicionário (ex: `t('dashboard.title')`).