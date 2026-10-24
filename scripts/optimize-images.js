const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'inmuebles', 'imagenes');

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1600;
const JPEG_QUALITY = 82;
const SUPPORTED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
]);

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    console.warn(`Aviso de Git: ${error.message}`);
    return '';
  }
}

function addPaths(set, output) {
  output
    .split('\0')
    .filter(Boolean)
    .forEach(file => {
      set.add(path.resolve(ROOT, file));
    });
}

function getImagesToOptimize() {
  const files = new Set();

  const before =
    process.env.EVENT_BEFORE ||
    process.env.GITHUB_EVENT_BEFORE;

  const current =
    process.env.EVENT_SHA ||
    process.env.GITHUB_SHA;

  if (current && before && !/^0+$/.test(before)) {
    addPaths(
      files,
      git([
        'diff',
        '--name-only',
        '-z',
        before,
        current,
        '--',
        'inmuebles/imagenes'
      ])
    );
  } else if (current) {
    addPaths(
      files,
      git([
        'diff-tree',
        '--no-commit-id',
        '--name-only',
        '-r',
        '-z',
        current,
        '--',
        'inmuebles/imagenes'
      ])
    );
  }

  // Incluye imágenes nuevas generadas por otros scripts.
  addPaths(
    files,
    git([
      'ls-files',
      '--others',
      '--exclude-standard',
      '-z'
    ])
  );

  // Incluye cambios locales en archivos rastreados.
  addPaths(
    files,
    git(['diff', '--name-only', '-z'])
  );

  return [...files].filter(file => {
    const relative = path.relative(IMAGES_DIR, file);

    return (
      relative !== '' &&
      !relative.startsWith('..' + path.sep) &&
      !path.isAbsolute(relative) &&
      SUPPORTED_EXTENSIONS.has(
        path.extname(file).toLowerCase()
      ) &&
      fs.existsSync(file) &&
      fs.statSync(file).isFile()
    );
  });
}

async function optimizeImage(file) {
  const extension = path.extname(file).toLowerCase();
  const temporary = `${file}.optimizing-${process.pid}`;

  try {
    const original = fs.statSync(file);

    const image = sharp(file, { failOn: 'error' });
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('No se pudieron leer las dimensiones.');
    }

    let processed = image
      .rotate()
      .resize({
        width: MAX_WIDTH,
        height: MAX_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true
      });

    if (extension === '.jpg' || extension === '.jpeg') {
      processed = processed.jpeg({
        quality: JPEG_QUALITY,
        mozjpeg: true
      });
    } else if (extension === '.png') {
      processed = processed.png({
        compressionLevel: 9,
        adaptiveFiltering: true
      });
    } else if (extension === '.webp') {
      processed = processed.webp({
        quality: JPEG_QUALITY
      });
    }

    const buffer = await processed.toBuffer();

    // Nunca reemplaza una imagen si el resultado pesa más.
    if (buffer.length >= original.size) {
      console.log(
        `Sin mejora: ${path.basename(file)} ` +
        `(${(original.size / 1024).toFixed(0)} KB)`
      );
      return;
    }

    fs.writeFileSync(temporary, buffer, { flag: 'wx' });
    fs.renameSync(temporary, file);

    const savings = (
      (1 - buffer.length / original.size) * 100
    ).toFixed(1);

    console.log(
      `Optimizada: ${path.basename(file)} | ` +
      `${(original.size / 1024).toFixed(0)} KB → ` +
      `${(buffer.length / 1024).toFixed(0)} KB | ` +
      `ahorro ${savings}%`
    );
  } catch (error) {
    console.error(
      `Error al optimizar ${path.basename(file)}: ${error.message}`
    );
    process.exitCode = 1;
  } finally {
    if (fs.existsSync(temporary)) {
      fs.unlinkSync(temporary);
    }
  }
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('No existe la carpeta inmuebles/imagenes.');
    return;
  }

  const files = getImagesToOptimize();

  console.log(`Imágenes candidatas: ${files.length}`);

  for (const file of files) {
    await optimizeImage(file);
  }

  console.log('Proceso de optimización finalizado.');
}

main().catch(error => {
  console.error('Error general:', error);
  process.exitCode = 1;
});
