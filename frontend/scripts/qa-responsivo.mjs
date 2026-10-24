import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.resolve('../qa-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const VIEWPORTS = [
  // Celulares
  { name: 'celular-320', width: 320, height: 568 },
  { name: 'celular-360', width: 360, height: 740 },
  { name: 'celular-390', width: 390, height: 844 },
  { name: 'celular-430', width: 430, height: 932 },
  { name: 'celular-paisagem-844', width: 844, height: 390 },
  // Tablets
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  // Desktop
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'ultrawide-2560', width: 2560, height: 1080 },
];

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'plataforma', path: '/plataforma' },
];

const THEMES = ['escuro', 'claro'];

async function runQA() {
  console.log('====================================================');
  console.log('   ANTECIPE QA RESPONSIVO & VISUAL AUTOMATIZADO     ');
  console.log(`   URL Base: ${BASE_URL}                            `);
  console.log(`   Screenshots salvas em: ${SCREENSHOTS_DIR}        `);
  console.log('====================================================\n');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error('Erro ao iniciar Chromium do Playwright:', err.message);
    process.exit(1);
  }

  const results = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const pageInfo of PAGES) {
    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        totalTests++;
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme === 'escuro' ? 'dark' : 'light',
        });

        const page = await context.newPage();

        try {
          // Pre-set theme in localStorage
          await page.addInitScript((t) => {
            window.localStorage.setItem('antecipe-theme', t === 'escuro' ? 'dark' : 'light');
          }, theme);

          await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 15000 });

          // Garante a classe correta no html
          await page.evaluate((t) => {
            if (t === 'escuro') {
              document.documentElement.classList.add('dark');
              document.documentElement.classList.remove('light');
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
            }
          }, theme);

          await page.waitForTimeout(400); // Aguarda transição visual

          // Checa rolagem horizontal
          const overflowInfo = await page.evaluate(() => {
            const scrollW = document.documentElement.scrollWidth;
            const clientW = document.documentElement.clientWidth;
            return {
              hasOverflow: scrollW > clientW,
              scrollW,
              clientW,
            };
          });

          const screenshotFilename = `${pageInfo.name}-${vp.width}-${theme}.png`;
          const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotFilename);

          await page.screenshot({ path: screenshotPath, fullPage: false });

          const status = !overflowInfo.hasOverflow ? 'PASSOU' : 'FALHOU';
          if (!overflowInfo.hasOverflow) {
            passedTests++;
          } else {
            failedTests++;
          }

          results.push({
            pagina: pageInfo.name,
            viewport: `${vp.width}x${vp.height} (${vp.name})`,
            tema: theme,
            scrollW: overflowInfo.scrollW,
            clientW: overflowInfo.clientW,
            status,
            screenshot: screenshotFilename,
          });

          console.log(
            `[${status}] ${pageInfo.name.padEnd(10)} | ${vp.width}px (${theme.padEnd(6)}) -> ${screenshotFilename}`
          );
        } catch (err) {
          failedTests++;
          console.error(`[ERRO] ${pageInfo.name} @ ${vp.width}px (${theme}):`, err.message);
          results.push({
            pagina: pageInfo.name,
            viewport: `${vp.width}x${vp.height}`,
            tema: theme,
            status: 'ERRO: ' + err.message,
          });
        } finally {
          await context.close();
        }
      }
    }
  }

  await browser.close();

  console.log('\n====================================================');
  console.log('              RELATÓRIO RESUMIDO DE QA              ');
  console.log('====================================================');
  console.log(`Total de testes: ${totalTests}`);
  console.log(`Aprovados:       ${passedTests}`);
  console.log(`Falhas:          ${failedTests}`);
  console.log('====================================================\n');

  // Salva relatório em markdown
  const mdReportPath = path.join(SCREENSHOTS_DIR, 'relatorio-qa.md');
  let md = '# Relatório de QA Visual e Responsivo — Antecipe\n\n';
  md += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;
  md += '| Página | Viewport | Tema | Largura Tela | Largura Scroll | Status | Screenshot |\n';
  md += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';
  for (const r of results) {
    md += `| ${r.pagina} | ${r.viewport} | ${r.tema} | ${r.clientW || '-'}px | ${r.scrollW || '-'}px | **${r.status}** | \`${r.screenshot}\` |\n`;
  }
  fs.writeFileSync(mdReportPath, md, 'utf-8');
  console.log(`Relatório salvo em: ${mdReportPath}`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runQA().catch((err) => {
  console.error(err);
  process.exit(1);
});
