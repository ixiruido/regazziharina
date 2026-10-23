const fs = require('fs');
const path = require('path');

const CATALOGO_DIR = path.join(__dirname, '..', 'catalogo');

/**
 * Asigna un número secuencial a archivos de propiedades que no tienen formato
 * Se usa para archivos creados desde Decap CMS que necesitan numeración
 */
function assignPropertyNumbers() {
  console.log('🔄 Asignando números secuenciales a propiedades...\n');

  if (!fs.existsSync(CATALOGO_DIR)) {
    console.error('❌ La carpeta catalogo no existe');
    return;
  }

  const files = fs.readdirSync(CATALOGO_DIR).filter(f => f.endsWith('.json') && f !== 'config.json');

  // Separar archivos que ya tienen el formato propiedad-X.json
  const formattedFiles = files.filter(f => f.match(/^propiedad-\d+\.json$/));
  const otherFiles = files.filter(f => !f.match(/^propiedad-\d+\.json$/));

  if (otherFiles.length === 0) {
    console.log('✅ Todos los archivos ya tienen el formato correcto');
    return;
  }

  console.log(`📁 Archivos por numerar: ${otherFiles.length}\n`);

  // Obtener el siguiente número disponible
  let nextNumber = 1;
  if (formattedFiles.length > 0) {
    const maxNumber = formattedFiles.reduce((max, file) => {
      const match = file.match(/propiedad-(\d+)\.json$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    nextNumber = maxNumber + 1;
  }

  console.log(`🔢 Iniciando numeración desde: ${nextNumber}\n`);

  // Procesar archivos que no tienen el formato correcto
  for (const file of otherFiles) {
    const filePath = path.join(CATALOGO_DIR, file);
    const newFileName = `propiedad-${nextNumber}.json`;
    const newFilePath = path.join(CATALOGO_DIR, newFileName);

    try {
      // Renombrar el archivo
      fs.renameSync(filePath, newFilePath);
      console.log(`📝 Renombrado: ${file} → ${newFileName}`);

      nextNumber++;
    } catch (error) {
      console.error(`❌ Error procesando ${file}:`, error.message);
    }
  }

  console.log('\n✨ Numeración completada');
  console.log('\n💡 Sugerencia: Ejecuta "node scripts/generate-index.js" para actualizar los índices');
}

// Ejecutar el script
if (require.main === module) {
  assignPropertyNumbers();
}

module.exports = { assignPropertyNumbers };
