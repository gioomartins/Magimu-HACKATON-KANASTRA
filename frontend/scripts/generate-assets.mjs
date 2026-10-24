import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = path.resolve('..');
const assetsDir = path.join(rootDir, 'assets');
const logosDir = path.join(assetsDir, 'logos');
const publicDir = path.resolve('public');

async function main() {
  console.log('Gerando e copiando assets...');

  // 1. Remover placeholders antigos do template
  const arquivosRemover = [
    'placeholder-logo.png',
    'placeholder-logo.svg',
    'placeholder-user.jpg',
    'placeholder.jpg',
    'placeholder.svg',
    'icon-light-32x32.png',
    'icon-dark-32x32.png',
    'icon.svg',
    'apple-icon.png',
  ];
  for (const arq of arquivosRemover) {
    const p = path.join(publicDir, arq);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`Removido template placeholder: ${arq}`);
    }
  }

  // 2. Copiar arquivos base para public/
  fs.copyFileSync(path.join(assetsDir, 'animacao-logo-antecipe.mp4'), path.join(publicDir, 'animacao-logo-antecipe.mp4'));
  fs.copyFileSync(path.join(logosDir, 'logo-antecipe-claro.svg'), path.join(publicDir, 'logo-antecipe-claro.svg'));
  fs.copyFileSync(path.join(logosDir, 'logo-antecipe-claro.png'), path.join(publicDir, 'logo-antecipe-claro.png'));
  fs.copyFileSync(path.join(logosDir, 'logo-antecipe-escuro.svg'), path.join(publicDir, 'logo-antecipe-escuro.svg'));
  fs.copyFileSync(path.join(logosDir, 'logo-antecipe-escuro.png'), path.join(publicDir, 'logo-antecipe-escuro.png'));
  fs.copyFileSync(path.join(logosDir, 'icone-antecipe.svg'), path.join(publicDir, 'icone-antecipe.svg'));
  fs.copyFileSync(path.join(logosDir, 'icone-antecipe.png'), path.join(publicDir, 'icone-antecipe.png'));
  fs.copyFileSync(path.join(logosDir, 'icone-antecipe.svg'), path.join(publicDir, 'favicon.svg'));

  const iconeSrc = path.join(logosDir, 'icone-antecipe.png');

  // 3. Gerar favicon.ico (32x32 png/ico), apple-touch-icon.png (180x180), icon-192, icon-512
  await sharp(iconeSrc)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(publicDir, 'favicon.ico'));

  await sharp(iconeSrc)
    .resize(180, 180, { fit: 'contain', background: { r: 11, g: 44, b: 32, alpha: 1 } })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(iconeSrc)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(publicDir, 'icon-192.png'));

  await sharp(iconeSrc)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(publicDir, 'icon-512.png'));

  // Maskable 512x512 com fundo verde institucional e safe-area
  const iconeMaskableInner = await sharp(iconeSrc)
    .resize(380, 380, { fit: 'contain', background: { r: 11, g: 44, b: 32, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 11, g: 44, b: 32, alpha: 1 },
    },
  })
    .composite([{ input: iconeMaskableInner, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'icon-512-maskable.png'));

  // 4. Gerar poster para o vídeo (fundo #0B2C20 com logo escuro)
  const logoEscuroBuf = await sharp(path.join(logosDir, 'logo-antecipe-escuro.png'))
    .resize(720, 240, { fit: 'contain', background: { r: 11, g: 44, b: 32, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 1280,
      height: 720,
      channels: 4,
      background: { r: 11, g: 44, b: 32, alpha: 1 },
    },
  })
    .composite([{ input: logoEscuroBuf, gravity: 'center' }])
    .jpeg({ quality: 90 })
    .toFile(path.join(publicDir, 'animacao-logo-antecipe-poster.jpg'));

  // 5. Gerar og-image.png (1200x630) com fundo #0B2C20, logo e lema
  const svgText = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0B2C20" />
          <stop offset="100%" stop-color="#103B2C" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <circle cx="600" cy="315" r="450" fill="#154d3a" opacity="0.25" />
      <text x="600" y="440" font-family="Inter, sans-serif" font-size="34" font-weight="600" fill="#F8F6F1" text-anchor="middle" letter-spacing="1.5">
        Importar. Decidir. Explicar. Simular.
      </text>
      <text x="600" y="490" font-family="Inter, sans-serif" font-size="20" font-weight="400" fill="#A7F3D0" text-anchor="middle" letter-spacing="0.8">
        Antecipação de recebíveis com regras claras para pequenas empresas
      </text>
      <rect x="520" y="530" width="160" height="32" rx="16" fill="#10B981" opacity="0.2" />
      <text x="600" y="552" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#34D399" text-anchor="middle" letter-spacing="2">
        HACKATHON KANASTRA
      </text>
    </svg>
  `;

  const ogLogoBuf = await sharp(path.join(logosDir, 'logo-antecipe-escuro.png'))
    .resize(600, 180, { fit: 'contain', background: { r: 11, g: 44, b: 32, alpha: 0 } })
    .toBuffer();

  const svgTextBuf = Buffer.from(svgText);

  await sharp(svgTextBuf)
    .composite([{ input: ogLogoBuf, top: 140, left: 300 }])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));

  console.log('Assets gerados com sucesso em /public!');
}

main().catch(console.error);
