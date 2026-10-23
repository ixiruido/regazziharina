const fs = require('fs');
const path = require('path');

const CATALOGO_DIR = path.join(__dirname, '..', 'catalogo');
const IMAGENES_DIR = path.join(__dirname, '..', 'inmuebles', 'imagenes');
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'uploads');

function buscarImagen(nombreArchivo) {
  const directorios = [IMAGENES_DIR, ASSETS_DIR];

  for (const directorio of directorios) {
    const ruta = path.join(directorio, nombreArchivo);

    if (fs.existsSync(ruta) && fs.statSync(ruta).isFile()) {
      return {
        ruta,
        directorio
      };
    }
  }

  return null;
}

function rutaPublicaOriginal(rutaOriginal, nuevoNombre) {
  const normalizada = rutaOriginal.replace(/\\/g, '/');
  const marcador = 'inmuebles/imagenes/';

  // Mantener la ruta relativa que ya usa Decap CMS.
  if (normalizada.includes(marcador)) {
    const indice = normalizada.lastIndexOf(marcador);
    return normalizada.slice(0, indice) + marcador + nuevoNombre;
  }

  // Si la imagen estaba en assets/uploads, actualizar su referencia
  // a la carpeta de imágenes del catálogo.
  return `../inmuebles/imagenes/${nuevoNombre}`;
}

function renamePropertyImages(propertyFile) {
  try {
    const property = JSON.parse(fs.readFileSync(propertyFile, 'utf8'));
    const propertyId = path.basename(propertyFile, '.json');

    if (!Array.isArray(property.fotos) || property.fotos.length === 0) {
      console.log(`ℹ️ La propiedad ${propertyId} no tiene fotos`);
      return;
    }

    let cambios = 0;
    const fotosActualizadas = [];
    const nombresReservados = new Set();

    for (let i = 0; i < property.fotos.length; i++) {
      const foto = property.fotos[i];
      const rutaOriginal = typeof foto === 'string'
        ? foto
        : foto && typeof foto.foto === 'string'
          ? foto.foto
          : null;

      if (!rutaOriginal) {
        console.warn(`⚠️ Foto ${i + 1} de ${propertyId}: formato no reconocido`);
        fotosActualizadas.push(foto);
        continue;
      }

      const nombreOriginal = path.posix.basename(
        rutaOriginal.replace(/\\/g, '/').split(/[?#]/)[0]
      );

      const extension = path.extname(nombreOriginal).toLowerCase();
      const archivoEncontrado = buscarImagen(nombreOriginal);

      if (!archivoEncontrado) {
        // Puede que una ejecución anterior ya haya renombrado la imagen.
        if (
          new RegExp(`^${propertyId}-\\d+${extension.replace('.', '\\.')}$`)
            .test(nombreOriginal) &&
          fs.existsSync(path.join(IMAGENES_DIR, nombreOriginal))
        ) {
          nombresReservados.add(nombreOriginal);
          fotosActualizadas.push(foto);
          continue;
        }

        console.warn(`⚠️ No se encontró ${nombreOriginal}; se conserva la referencia original`);
        fotosActualizadas.push(foto);
        continue;
      }

      // Numeración estable según la posición de cada foto en el JSON.
      let numero = i + 1;
      let nuevoNombre = `${propertyId}-${numero}${extension}`;
      let destino = path.join(archivoEncontrado.directorio, nuevoNombre);

      // Evitar sobrescribir otro archivo existente.
      while (
        fs.existsSync(destino) &&
        path.resolve(destino) !== path.resolve(archivoEncontrado.ruta)
      ) {
        numero++;
        nuevoNombre = `${propertyId}-${numero}${extension}`;
        destino = path.join(archivoEncontrado.directorio, nuevoNombre);
      }

      if (path.resolve(archivoEncontrado.ruta) !== path.resolve(destino)) {
        fs.renameSync(archivoEncontrado.ruta, destino);
        console.log(`✅ ${nombreOriginal} → ${nuevoNombre}`);
        cambios++;
      }

      nombresReservados.add(nuevoNombre);

      const nuevaRuta = rutaPublicaOriginal(rutaOriginal, nuevoNombre);

      if (typeof foto === 'string') {
        fotosActualizadas.push(nuevaRuta);
      } else {
        fotosActualizadas.push({
          ...foto,
          foto: nuevaRuta
        });
      }

      if (nuevaRuta !== rutaOriginal) {
        cambios++;
      }
    }

    // Guardar las nuevas referencias incluso si el archivo ya tenía
    // el nombre correcto, pero la ruta del JSON estaba desactualizada.
    property.fotos = fotosActualizadas;
    fs.writeFileSync(propertyFile, JSON.stringify(property, null, 2) + '\n');

    console.log(`📝 ${propertyId}: proceso completado (${cambios} cambios)`);
  } catch (error) {
    console.error(`❌ Error procesando ${propertyFile}: ${error.message}`);
    process.exitCode = 1;
  }
}

function processAllProperties() {
  console.log('🔍 Buscando propiedades en', CATALOGO_DIR);

  if (!fs.existsSync(CATALOGO_DIR)) {
    console.error('❌ La carpeta catalogo no existe');
    process.exitCode = 1;
    return;
  }

  const files = fs.readdirSync(CATALOGO_DIR)
    .filter(file => file.endsWith('.json') && file !== 'config.json')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  console.log(`📁 Encontradas ${files.length} propiedades`);

  for (const file of files) {
    console.log(`\n🔄 Procesando ${file}...`);
    renamePropertyImages(path.join(CATALOGO_DIR, file));
  }

  console.log('\n✨ Proceso completado');
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    const specificFile = args[0];
    const fullPath = path.join(CATALOGO_DIR, specificFile);

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      renamePropertyImages(fullPath);
    } else {
      console.error('❌ Archivo no encontrado:', fullPath);
      process.exitCode = 1;
    }
  } else {
    processAllProperties();
  }
}

module.exports = {
  renamePropertyImages,
  processAllProperties
};
