const fs = require('fs');
const path = require('path');

const CATALOGO_DIR = path.join(__dirname, '..', 'catalogo');
const IMAGENES_DIR = path.join(__dirname, '..', 'inmuebles', 'imagenes');
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'uploads');

/**
 * Renombra las imágenes de una propiedad con el prefijo del ID
 * @param {string} propertyFile - Ruta al archivo JSON de la propiedad
 */
function renamePropertyImages(propertyFile) {
  try {
    const property = JSON.parse(fs.readFileSync(propertyFile, 'utf8'));
    const propertyId = property.id;

    if (!propertyId) {
      console.log(`⚠️  La propiedad ${propertyFile} no tiene ID`);
      return;
    }

    if (!property.fotos || !Array.isArray(property.fotos)) {
      console.log(`ℹ️  La propiedad ${propertyId} no tiene fotos`);
      return;
    }

    let renamedCount = 0;
    const updatedFotos = [];

    for (const foto of property.fotos) {
      const fotoPath = foto.foto || foto;

      // Extraer el nombre del archivo de la ruta
      let fileName = path.basename(fotoPath);
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);

      // Si ya tiene el prefijo del ID, no renombrar
      if (nameWithoutExt.startsWith(`propiedad-${propertyId}-`)) {
        updatedFotos.push(foto);
        continue;
      }

      // Buscar el archivo en ambas carpetas
      let sourcePath = null;
      let targetDir = null;

      const possiblePaths = [
        { dir: IMAGENES_DIR, file: fileName },
        { dir: ASSETS_DIR, file: fileName }
      ];

      for (const { dir, file } of possiblePaths) {
        const fullPath = path.join(dir, file);
        if (fs.existsSync(fullPath)) {
          sourcePath = fullPath;
          targetDir = dir;
          break;
        }
      }

      if (!sourcePath) {
        console.log(`⚠️  No se encontró el archivo ${fileName} en ninguna carpeta`);
        updatedFotos.push(foto);
        continue;
      }

      // Generar nuevo nombre con prefijo del ID
      const newFileName = `propiedad-${propertyId}-${nameWithoutExt}${ext}`;
      const targetPath = path.join(targetDir, newFileName);

      // Renombrar el archivo
      fs.renameSync(sourcePath, targetPath);
      console.log(`✅ Renombrado: ${fileName} → ${newFileName}`);

      // Actualizar la referencia en el array de fotos
      if (typeof foto === 'object' && foto.foto) {
        foto.foto = path.join(path.dirname(foto.foto), newFileName).replace(/\\/g, '/');
      } else {
        updatedFotos.push(path.join(path.dirname(fotoPath), newFileName).replace(/\\/g, '/'));
        continue;
      }

      updatedFotos.push(foto);
      renamedCount++;
    }

    // Actualizar el archivo JSON de la propiedad con las nuevas rutas
    if (renamedCount > 0) {
      property.fotos = updatedFotos;
      fs.writeFileSync(propertyFile, JSON.stringify(property, null, 2));
      console.log(`📝 Actualizado archivo de propiedad ${propertyId} con ${renamedCount} imágenes renombradas`);
    }

  } catch (error) {
    console.error(`❌ Error procesando ${propertyFile}:`, error.message);
  }
}

/**
 * Procesa todas las propiedades en la carpeta catalogo
 */
function processAllProperties() {
  console.log('🔍 Buscando propiedades en', CATALOGO_DIR);

  if (!fs.existsSync(CATALOGO_DIR)) {
    console.error('❌ La carpeta catalogo no existe');
    return;
  }

  const files = fs.readdirSync(CATALOGO_DIR).filter(f => f.endsWith('.json'));

  console.log(`📁 Encontradas ${files.length} propiedades`);

  for (const file of files) {
    const filePath = path.join(CATALOGO_DIR, file);
    console.log(`\n🔄 Procesando ${file}...`);
    renamePropertyImages(filePath);
  }

  console.log('\n✨ Proceso completado');
}

// Ejecutar el script
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Procesar un archivo específico
    const specificFile = args[0];
    const fullPath = path.join(CATALOGO_DIR, specificFile);
    if (fs.existsSync(fullPath)) {
      renamePropertyImages(fullPath);
    } else {
      console.error('❌ Archivo no encontrado:', fullPath);
    }
  } else {
    // Procesar todas las propiedades
    processAllProperties();
  }
}

module.exports = { renamePropertyImages, processAllProperties };
