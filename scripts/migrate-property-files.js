const fs = require('fs');
const path = require('path');

const CATALOGO_DIR = path.join(__dirname, '..', 'catalogo');

/**
 * Migración: Renombrar archivos JSON a formato propiedad-X.json y eliminar campo id
 */
function migratePropertyFiles() {
  console.log('🔄 Iniciando migración de archivos de propiedades...\n');

  if (!fs.existsSync(CATALOGO_DIR)) {
    console.error('❌ La carpeta catalogo no existe');
    return;
  }

  const files = fs.readdirSync(CATALOGO_DIR).filter(f => f.endsWith('.json') && f !== 'config.json');

  console.log(`📁 Encontrados ${files.length} archivos para migrar\n`);

  // Separar archivos que ya tienen el formato propiedad-X.json
  const formattedFiles = files.filter(f => f.match(/^propiedad-\d+\.json$/));
  const otherFiles = files.filter(f => !f.match(/^propiedad-\d+\.json$/));

  console.log(`ℹ️  Archivos ya formateados: ${formattedFiles.length}`);
  console.log(`ℹ️  Archivos por migrar: ${otherFiles.length}\n`);

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
      // Leer el archivo
      let content = fs.readFileSync(filePath, 'utf8');
      let property = JSON.parse(content);

      // Eliminar el campo id si existe
      if (property.id !== undefined) {
        delete property.id;
        console.log(`✅ Eliminado campo 'id' de ${file}`);
      }

      // Guardar el archivo modificado con el nuevo nombre
      fs.writeFileSync(newFilePath, JSON.stringify(property, null, 2));

      // Eliminar el archivo original
      fs.unlinkSync(filePath);

      console.log(`📝 Renombrado: ${file} → ${newFileName}\n`);

      nextNumber++;
    } catch (error) {
      console.error(`❌ Error procesando ${file}:`, error.message);
    }
  }

  // Procesar archivos ya formateados para eliminar el campo id
  for (const file of formattedFiles) {
    const filePath = path.join(CATALOGO_DIR, file);

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let property = JSON.parse(content);

      // Eliminar el campo id si existe
      if (property.id !== undefined) {
        delete property.id;
        fs.writeFileSync(filePath, JSON.stringify(property, null, 2));
        console.log(`✅ Eliminado campo 'id' de ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error procesando ${file}:`, error.message);
    }
  }

  console.log('\n✨ Migración completada');
  console.log('\n💡 Sugerencia: Ejecuta "node scripts/generate-index.js" para actualizar los índices');
}

// Ejecutar el script
if (require.main === module) {
  migratePropertyFiles();
}

module.exports = { migratePropertyFiles };
