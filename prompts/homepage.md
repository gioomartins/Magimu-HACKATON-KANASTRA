Atue como Engenheiro Frontend Sênior e UI/UX Designer, especialista em React, Tailwind CSS, animação web, acessibilidade e SEO técnico, com experiência em FinTechs.

# CONTEXTO
Estamos construindo o "Antecipe", plataforma para o hackathon da fintech Kanastra. Pequenas empresas enviam um CSV com milhares de notas fiscais (recebíveis) para antecipação de crédito. O sistema aplica as regras de um fundo de investimento (FIDC) e devolve o que foi aprovado, o que foi recusado e o porquê, além de simular o valor líquido a receber. Lema: "Importar. Decidir. Explicar. Simular."

Já existe a tela da aplicação (com as facetas de cedente e fundo). NÃO quebre nem reescreva essa tela. Sua tarefa é criar a HOME (landing page), o tema claro/escuro, a identidade do site, o SEO e garantir a responsividade.

# PASSO 0: RECONHECIMENTO (faça antes de codar)
1. Inspecione o repositório e identifique: framework (Vite + React, Next.js, etc.), gerenciador de pacotes, roteador, onde ficam index.html / layout, pasta public, versão e configuração do Tailwind (v3 ou v4) e como as cores estão definidas hoje.
2. Localize a pasta /assets e liste os arquivos. Devem existir: animacao-logo-antecipe.mp4, logo-antecipe-claro (svg/png), logo-antecipe-escuro (svg/png) e icone-antecipe (svg/png). Se algum faltar, me avise antes de seguir.
3. Resuma em poucas linhas o que encontrou e o plano de alteração. Depois execute.

# DESIGN SYSTEM
- Fonte: Inter (font-display: swap).
- Rótulos pequenos: uppercase, text-xs, tracking-wider, font-bold, text-stone-500 (no tema escuro, um cinza-esverdeado claro com contraste AA).
- Texto principal em cards: font-medium. Divisores sutis (border-b com stone-200/60 no claro e emerald-200/15 no escuro), sem grades duras.
- Cores semânticas: "Aprovada" = emerald (text-emerald-600 / bg-emerald-100); "Recusada" = rose (text-rose-500 / bg-rose-100); explicação de recusa em bg-rose-50 (no tema escuro, equivalente translúcido, por exemplo bg-rose-500/10, com contraste AA).
- Tom sóbrio e premium de backoffice financeiro. Nada de gradientes chamativos nem emojis.

# TEMA CLARO / ESCURO (BOTÃO DE ALTERNÂNCIA)
Defina dois temas por tokens (variáveis CSS mapeadas no Tailwind), sem cores fixas espalhadas pelos componentes:
- Tema ESCURO = identidade atual da marca, que deve continuar IDÊNTICA à tela da aplicação existente: fundo da página #0B2C20, cards/áreas de dados #F8F6F1 com rounded-xl, texto principal stone-800 nos cards, texto claro #F8F6F1 sobre o verde.
- Tema CLARO: fundo da página #F8F6F1, cards #FFFFFF com borda sutil (stone-200/60), texto principal stone-800, secundário stone-500; faixas de destaque (hero, CTA final, barra de simulação e rodapé) podem manter o verde institucional #0B2C20 com texto creme, para preservar a identidade.
- Se a mudança de cores na tela da aplicação exigir trocar cores fixas por tokens, faça isso SEM alterar o visual atual dela no tema escuro.

Requisitos do botão:
1. Botão com ícone sol/lua (SVG inline ou lucide-react) na navbar da Home e também no cabeçalho da aplicação, com a mesma lógica compartilhada (um hook useTheme e um ThemeProvider).
2. Acessibilidade: elemento <button> com aria-label dinâmico ("Ativar tema claro" / "Ativar tema escuro"), aria-pressed ou role="switch", foco visível, alvo de toque mínimo de 44x44px, tooltip por title.
3. Primeira visita: respeitar prefers-color-scheme do sistema. Depois da escolha manual, persistir em localStorage (chave "antecipe-theme") e usar essa escolha. Opcional: um terceiro estado "Sistema".
4. Sem flash de tema errado: inserir um script inline mínimo no <head> (antes da renderização) que lê localStorage/prefers-color-scheme e aplica a classe "dark" (ou data-theme) no <html>. Em Next.js, use a abordagem equivalente (por exemplo next-themes com suppressHydrationWarning).
5. Configurar o Tailwind conforme a versão encontrada: darkMode por classe/atributo no v3, ou @custom-variant dark no v4. Definir também color-scheme no CSS (light/dark) para controles nativos e barras de rolagem.
6. Atualizar dinamicamente <meta name="theme-color"> conforme o tema.
7. Trocar a logo automaticamente: usar a versão adequada ao fundo em que ela está (logo-antecipe-escuro sobre verde, logo-antecipe-claro sobre fundo claro), no navbar e no rodapé.
8. O vídeo da marca e o poster continuam sobre um card de fundo verde nos dois temas (o vídeo tem fundo verde próprio).
9. Transição suave de cores (150 a 250 ms) apenas em color, background-color e border-color, desativada com prefers-reduced-motion. Cuidado para não animar propriedades pesadas.
10. Verificar contraste AA (4.5:1 para texto normal, 3:1 para texto grande e componentes de interface) em TODOS os componentes nos dois temas, incluindo badges, linha de erro rosa, inputs, foco e estados desabilitados.

# ESTRUTURA DA HOME (uma página fluida, em português do Brasil)
1. Navbar fixa e discreta: logo, links âncora (Como funciona, Regras, Perguntas), botão de tema e botão "Abrir plataforma" levando à tela da aplicação. No mobile, vira menu hambúrguer com drawer acessível (foco preso, fecha com Esc e ao clicar fora, aria-expanded, rolagem do body travada enquanto aberto).
2. Hero: H1 "Antecipe seus recebíveis com decisões claras." Subtítulo: "Envie o CSV com milhares de notas fiscais e veja, em segundos, o que o fundo aprova, o que recusa e por quê." Dois botões: "Começar agora" (vai para a aplicação) e "Ver como funciona" (rola até a seção). Ao lado ou abaixo, uma pré-visualização estilizada em HTML/CSS do resultado: uma linha "Aprovada" e uma "Recusada" com a sub-linha rosa explicando "Prazo acima do limite: vence em 90 dias; o limite configurado do fundo é 60 dias." (marcada como exemplo).
3. Seção do vídeo da marca: exibir /assets/animacao-logo-antecipe.mp4 (animação da logo, 4,5 s) dentro de um card arredondado.
   - Atributos: muted, playsInline, preload="metadata", poster gerado a partir do último quadro do vídeo.
   - Tocar uma vez quando entrar na viewport (IntersectionObserver), com botão discreto "Reproduzir novamente".
   - Respeitar prefers-reduced-motion (mostrar só o poster, sem autoplay).
   - Lazy load e aspect-ratio fixo para evitar CLS. Se possível, gerar também versão .webm menor.
   - Copiar/otimizar o arquivo para a pasta pública correta do projeto (não referenciar caminho fora do build).
4. "Como funciona": 4 etapas em cards, uma para cada palavra do lema: Importar (upload do CSV), Decidir (aplicação das regras do fundo), Explicar (motivo claro de cada recusa), Simular (valor líquido já com a taxa descontada). Numeração e linha de progresso que se preenche conforme o scroll (no mobile, vira lista vertical).
5. "Regras que o fundo aplica": três cards de exemplo (prazo máximo, concentração por sacado, valor máximo por nota), com contadores animados nos números.
6. "Para quem é": pequenas empresas cedentes e gestores de FIDC, com 3 benefícios cada, em texto curto.
7. Perguntas frequentes (accordion acessível, também usado no JSON-LD de FAQ).
8. CTA final no fundo verde, com botão "Abrir plataforma".
9. Rodapé: logo, links, e a frase "Projeto desenvolvido para o hackathon Kanastra".

# ANIMAÇÕES E BIBLIOTECAS
- Use Motion (pacote "motion", antigo framer-motion) para: revelação ao rolar (whileInView, once: true), stagger nos cards, animações de entrada do hero, accordion do FAQ e transições de rota (AnimatePresence) entre a Home e a aplicação. Se o framework suportar, ofereça também View Transitions API como fallback progressivo.
- Opcional: Lenis para rolagem suave e GSAP ScrollTrigger apenas se realmente agregar (ex.: linha de progresso do "Como funciona"). Não instale as duas bibliotecas se uma resolve.
- Componentes prontos via MCP: se houver servidores MCP configurados (shadcn MCP, Magic UI, 21st.dev Magic ou similar), use-os para buscar e instalar componentes como BlurFade, NumberTicker, AnimatedBeam, TextReveal, Marquee e BentoGrid, adaptando-os aos tokens de tema acima (devem funcionar nos dois temas). Se nenhum MCP estiver disponível, instale os mesmos componentes via CLI (por exemplo, npx shadcn@latest add ...) e me diga qual caminho usou. Confira a documentação atual de cada biblioteca antes de instalar, pois APIs e comandos mudam.
- Performance: animar somente transform e opacity (exceto a transição de cores do tema); carregar bibliotecas pesadas com import dinâmico/lazy; nada que bloqueie a thread principal; respeitar prefers-reduced-motion em TODAS as animações (desativar ou reduzir para fade simples).

# RESPONSIVIDADE E QA VISUAL (OBRIGATÓRIO)
Abordagem mobile-first, com layout fluido (grid/flex, clamp() na tipografia e nos espaçamentos, max-width nos containers, unidades relativas, aspect-ratio em mídia). Nada de larguras fixas em px que causem overflow.

Viewports a verificar (largura x altura em px):
- Celulares: 320x568, 360x740, 390x844, 430x932; e paisagem 844x390.
- Tablets: 768x1024, 820x1180, 1024x768.
- Desktop: 1280x800, 1440x900, 1920x1080 e ultrawide 2560x1080 (conteúdo centralizado com largura máxima, sem esticar).

Critérios que devem passar em cada viewport e nos dois temas:
1. Zero rolagem horizontal na página (document.documentElement.scrollWidth <= clientWidth). Conteúdo largo (tabela da aplicação, código) rola dentro do próprio container (overflow-x-auto).
2. Texto base >= 16px no mobile, sem corte nem sobreposição; títulos com clamp(); zoom do navegador a 200% e texto ampliado sem quebrar o layout.
3. Alvos de toque >= 44x44px, com espaçamento entre eles.
4. Navbar vira menu hambúrguer no mobile; hero empilha (texto, depois pré-visualização); grids passam de 1 coluna (mobile) para 2 (tablet) e 3 ou 4 (desktop).
5. Vídeo e imagens mantêm proporção, sem CLS; o vídeo ocupa a largura do card em qualquer tela.
6. Respeitar safe areas (viewport-fit=cover e env(safe-area-inset-*)) em navbar, rodapé e barras fixas; usar 100dvh em vez de 100vh onde houver altura de tela cheia.
7. Tela da aplicação: sem alterar seu visual no desktop, garantir que no mobile a barra lateral de filtros vire gaveta/accordion recolhível, a tabela role horizontalmente com a primeira coluna legível, a paginação não estoure a largura e a barra de simulação não cubra o conteúdo.
8. Foco e navegação por teclado funcionando em todos os breakpoints (menu, accordion, botão de tema).

Como verificar (não pule esta etapa):
- Se houver Playwright, Chrome DevTools MCP ou Playwright MCP disponíveis, use-os; caso contrário, instale o Playwright como dependência de desenvolvimento e escreva um script de QA (por exemplo, scripts/qa-responsivo.mjs).
- O script deve abrir a Home e a aplicação em cada viewport da lista, nos temas claro e escuro, checar a rolagem horizontal, tirar screenshots (salvar em /qa-screenshots/<pagina>-<largura>-<tema>.png) e imprimir um relatório de falhas.
- Olhe as screenshots, corrija o que estiver quebrado e rode de novo até zerar as falhas.
- Rode também o Lighthouse mobile e desktop, com meta >= 95 em Performance, Acessibilidade, Boas práticas e SEO.

# IDENTIDADE DO SITE (aplicar já nas pastas do frontend)
1. Ícones, a partir de /assets/icone-antecipe.svg: gerar favicon.svg, favicon.ico (32x32), apple-touch-icon.png (180x180), icon-192.png, icon-512.png e uma versão maskable de 512. Colocar na pasta pública e remover o favicon/ícone padrão do template (Vite, React, Next etc.).
2. <title> padrão: "Antecipe | Antecipação de recebíveis clara e explicada para pequenas empresas" (mantenha a palavra-chave no início e tente ficar perto de 60 caracteres).
3. Criar manifest.webmanifest (name "Antecipe", short_name "Antecipe", theme_color #0B2C20, background_color #0B2C20, ícones 192/512/maskable) e ligar no head. Adicionar <meta name="theme-color"> (atualizado conforme o tema, como descrito acima).

# SEO TÉCNICO
- <html lang="pt-BR">. Um único H1 por página, hierarquia H2/H3 correta, landmarks semânticos (header, nav, main, section com aria-labelledby, footer) e link "Pular para o conteúdo".
- Meta description (140 a 160 caracteres) com as palavras-chave: antecipação de recebíveis, duplicatas, notas fiscais, FIDC, pequenas empresas.
- Link canonical usando variável de ambiente para o domínio (por exemplo VITE_SITE_URL / NEXT_PUBLIC_SITE_URL), sem URL fixa no código.
- Open Graph (og:title, og:description, og:type, og:url, og:image 1200x630, og:locale pt_BR, og:site_name) e Twitter Card summary_large_image. Gerar a imagem og-image.png 1200x630 com a logo sobre o fundo verde #0B2C20 e o lema.
- JSON-LD no head: Organization, WebSite, SoftwareApplication (applicationCategory FinanceApplication), FAQPage (as mesmas perguntas do FAQ) e VideoObject para o vídeo da marca (name, description, thumbnailUrl, uploadDate, contentUrl).
- robots.txt e sitemap.xml (gerados ou estáticos, com URL base vinda da variável de ambiente). Se o framework tiver suporte nativo (ex.: Next metadata API, sitemap.ts), use-o.
- Se for SPA pura (Vite), gerencie metadados por rota com react-helmet-async (ou equivalente) e sugira pré-renderização/SSG para a Home; deixe um <noscript> com texto de apresentação do produto.
- Performance (Core Web Vitals): preload da fonte Inter e do poster do vídeo, preconnect para domínios de fontes, imagens com width/height e loading="lazy" (exceto o que estiver acima da dobra), sem layout shift.
- Acessibilidade: contraste AA nos dois temas, foco visível, navegação por teclado, alt descritivo na logo, aria-label nos botões de ícone, descrição textual junto ao vídeo (é só animação de marca; aria-hidden no vídeo é aceitável se houver texto ao redor).

# RESTRIÇÕES
- Não altere a lógica nem o visual da tela de aplicação no desktop e no tema escuro; as únicas mudanças permitidas nela são: navegação até ela, botão de tema, troca de cores fixas por tokens e correções de responsividade no mobile.
- Não invente números reais: os valores da prévia (100.000 notas, R$ 850.000,00 etc.) são fictícios e devem estar marcados como exemplo.
- Sem imports de assets quebrados e sem arquivos de template antigos (logo do Vite/React, favicon padrão).
- Código tipado se o projeto já usa TypeScript; componentes pequenos e reutilizáveis (Navbar, ThemeToggle, ThemeProvider, Hero, VideoCard, HowItWorks, Rules, Faq, Footer, SeoHead).

# ENTREGA
1. Lista dos arquivos criados e alterados.
2. Comandos para rodar o projeto, fazer o build e rodar o script de QA responsivo.
3. Checklist feito (favicon, título, manifest, OG, JSON-LD, robots, sitemap, tema claro/escuro, sem flash de tema, contraste AA) e o que ficou pendente (ex.: domínio real).
4. Tabela de resultado do QA: viewport x tema, com status (passou/falhou), e a pasta com as screenshots.
5. Resultado do Lighthouse mobile e desktop.
6. Qualquer decisão que você precisou tomar por falta de informação.