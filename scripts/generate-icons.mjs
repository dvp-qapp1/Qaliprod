#!/usr/bin/env node
/**
 * 🎨 Qalia Icon Generator
 * 
 * Genera todos los iconos PNG necesarios desde el logo SVG base.
 * Incluye iconos para PWA, favicon, Apple Touch, y Open Graph.
 * 
 * Uso: 
 *   npx ts-node scripts/generate-icons.mjs
 *   # o
 *   node scripts/generate-icons.mjs
 * 
 * Requiere: sharp (se instala automáticamente si no existe)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const ICONS_DIR = join(PUBLIC_DIR, 'icons');

// Configuración de iconos a generar
const ICON_CONFIGS = [
    // PWA Icons
    { name: 'icon-72.png', size: 72, purpose: 'pwa' },
    { name: 'icon-96.png', size: 96, purpose: 'pwa' },
    { name: 'icon-128.png', size: 128, purpose: 'pwa' },
    { name: 'icon-144.png', size: 144, purpose: 'pwa' },
    { name: 'icon-152.png', size: 152, purpose: 'pwa' },
    { name: 'icon-192.png', size: 192, purpose: 'pwa' },
    { name: 'icon-384.png', size: 384, purpose: 'pwa' },
    { name: 'icon-512.png', size: 512, purpose: 'pwa' },

    // Apple Touch Icons
    { name: 'apple-touch-icon.png', size: 180, purpose: 'apple' },
    { name: 'apple-touch-icon-152.png', size: 152, purpose: 'apple' },
    { name: 'apple-touch-icon-120.png', size: 120, purpose: 'apple' },

    // Favicon
    { name: 'favicon-32.png', size: 32, purpose: 'favicon' },
    { name: 'favicon-16.png', size: 16, purpose: 'favicon' },
];

// Configuración de imagen OG
const OG_IMAGE_CONFIG = {
    name: 'og-image.png',
    width: 1200,
    height: 630,
};

// Logo SVG base (el que ya existe en el proyecto)
const SVG_SOURCE = join(ICONS_DIR, 'icon-512.svg');

// Colores de marca
const BRAND_COLORS = {
    primary: '#10B981',
    background: '#0A0A0A',
    backgroundGradientEnd: '#1A1A2E',
    white: '#FFFFFF',
};

async function loadSharp() {
    try {
        const sharp = await import('sharp');
        return sharp.default;
    } catch (error) {
        console.error('❌ Sharp no está instalado. Instalando...');
        const { execSync } = await import('child_process');
        execSync('npm install sharp --save-dev', {
            cwd: ROOT_DIR,
            stdio: 'inherit'
        });
        const sharp = await import('sharp');
        return sharp.default;
    }
}

async function generatePWAIcons(sharp) {
    console.log('\n📱 Generando iconos PWA...\n');

    const svgBuffer = readFileSync(SVG_SOURCE);

    for (const config of ICON_CONFIGS) {
        const outputPath = join(ICONS_DIR, config.name);

        await sharp(svgBuffer)
            .resize(config.size, config.size, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparente
            })
            .png({ quality: 100, compressionLevel: 9 })
            .toFile(outputPath);

        console.log(`  ✅ ${config.name} (${config.size}x${config.size})`);
    }
}

async function generateOGImage(sharp) {
    console.log('\n🖼️  Generando imagen Open Graph...\n');

    const { width, height, name } = OG_IMAGE_CONFIG;
    const outputPath = join(PUBLIC_DIR, name);

    // Leer el logo SVG
    const svgBuffer = readFileSync(SVG_SOURCE);

    // Tamaño del logo en la imagen OG
    const logoSize = 200;

    // Crear el logo redimensionado
    const logoBuffer = await sharp(svgBuffer)
        .resize(logoSize, logoSize)
        .png()
        .toBuffer();

    // Crear SVG para el fondo con gradiente y texto
    const backgroundSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${BRAND_COLORS.background};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${BRAND_COLORS.backgroundGradientEnd};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${BRAND_COLORS.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#34D399;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg-gradient)"/>
      
      <!-- Decorative circles -->
      <circle cx="1100" cy="100" r="200" fill="${BRAND_COLORS.primary}" opacity="0.1"/>
      <circle cx="100" cy="530" r="150" fill="${BRAND_COLORS.primary}" opacity="0.08"/>
      
      <!-- Title -->
      <text x="600" y="380" 
            font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
            font-size="72" 
            font-weight="800" 
            fill="url(#text-gradient)" 
            text-anchor="middle">
        QALIA
      </text>
      
      <!-- Subtitle -->
      <text x="600" y="440" 
            font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
            font-size="32" 
            font-weight="500" 
            fill="${BRAND_COLORS.white}" 
            text-anchor="middle"
            opacity="0.9">
        Nutrición Inteligente con IA
      </text>
      
      <!-- Tagline -->
      <text x="600" y="500" 
            font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
            font-size="24" 
            font-weight="400" 
            fill="${BRAND_COLORS.white}" 
            text-anchor="middle"
            opacity="0.7">
        Tu coach nutricional personal impulsado por inteligencia artificial
      </text>
      
      <!-- Bottom accent line -->
      <rect x="500" y="550" width="200" height="4" rx="2" fill="${BRAND_COLORS.primary}" opacity="0.8"/>
    </svg>
  `;

    // Crear imagen base desde el SVG
    const baseImage = await sharp(Buffer.from(backgroundSvg))
        .png()
        .toBuffer();

    // Componer la imagen final con el logo
    await sharp(baseImage)
        .composite([
            {
                input: logoBuffer,
                top: 100,
                left: Math.floor((width - logoSize) / 2),
            }
        ])
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outputPath);

    console.log(`  ✅ ${name} (${width}x${height})`);
}

async function generateFavicon(sharp) {
    console.log('\n🔷 Generando favicon.ico...\n');

    const svgBuffer = readFileSync(SVG_SOURCE);

    // Generar PNG de 32x32 para favicon
    const favicon32 = await sharp(svgBuffer)
        .resize(32, 32)
        .png()
        .toBuffer();

    // Guardar como PNG (los navegadores modernos lo aceptan)
    writeFileSync(join(PUBLIC_DIR, 'favicon.png'), favicon32);
    console.log('  ✅ favicon.png (32x32)');

    // También crear una versión ICO-compatible
    // Nota: Para un .ico real necesitarías una librería adicional
    // Por ahora usamos el PNG que Next.js puede manejar
}

async function updateManifest() {
    console.log('\n📋 Actualizando manifest.json...\n');

    const manifestPath = join(PUBLIC_DIR, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    // Actualizar iconos a PNG
    manifest.icons = [
        {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
        },
        {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
        },
        {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
        },
        {
            src: '/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
        },
        {
            src: '/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
        },
        {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
        },
        {
            src: '/icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
        },
        {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
        },
        {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
        }
    ];

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('  ✅ manifest.json actualizado con iconos PNG');
}

async function main() {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                 🎨 Qalia Icon Generator                   ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  Genera iconos PNG para PWA, OG, y favicon                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    // Verificar que existe el SVG fuente
    if (!existsSync(SVG_SOURCE)) {
        console.error(`\n❌ No se encontró el archivo SVG fuente: ${SVG_SOURCE}`);
        process.exit(1);
    }

    // Asegurar que existe el directorio de iconos
    if (!existsSync(ICONS_DIR)) {
        mkdirSync(ICONS_DIR, { recursive: true });
    }

    try {
        const sharp = await loadSharp();

        await generatePWAIcons(sharp);
        await generateOGImage(sharp);
        await generateFavicon(sharp);
        await updateManifest();

        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║              ✅ ¡Generación completada!                   ║');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log('║                                                           ║');
        console.log('║  Archivos generados:                                      ║');
        console.log('║  • public/icons/*.png (iconos PWA)                        ║');
        console.log('║  • public/og-image.png (Open Graph)                       ║');
        console.log('║  • public/favicon.png                                     ║');
        console.log('║  • public/manifest.json (actualizado)                     ║');
        console.log('║                                                           ║');
        console.log('║  Próximos pasos:                                          ║');
        console.log('║  1. Actualizar layout.tsx con los nuevos iconos           ║');
        console.log('║  2. Hacer deploy                                          ║');
        console.log('║  3. Probar en redes sociales                              ║');
        console.log('║                                                           ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log('');

    } catch (error) {
        console.error('\n❌ Error durante la generación:', error);
        process.exit(1);
    }
}

main();
