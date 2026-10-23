const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CATALOGO_DIR = path.join(__dirname, '..', 'catalogo');
const IMAGENES_DIR = path.join(__dirname, '..', 'inmuebles', 'imagenes');
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'uploads');

function buscarImagen(nombreArchivo) {
  const directorios = [IMAGENES_DIR, ASSETS_DIR];

  for (const directorio of directorios) {
    const ruta = path.join(directorio, nombreArchivo);

    if (fs.existsSync(ruta) && fs.statSync(ruta).isFile()) {
      return { ruta, directorio };
    }
  }

  return null;
}

function rutaPublicaOriginal(_rutaOriginal, nuevoNombre) {
  return `../inmuebles/imagenes/${nuevoNombre}`;
}

function hashArchivo(ruta) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(ruta))
    .digest('hex')
    .slice(0, 8);
}

function archivosIguales(rutaA, rutaB) {
  if (!fs.existsSync(rutaA) || !fs.existsSync(rutaB)) {
    return false;
  }

  const statA = fs.statSync(rutaA);
  const statB = fs.statSync(rutaB);

  if (statA.size !== statB.size) {
    return false;
  }

  return hashArchivo(rutaA) === hashArchivo(rutaB);
}

function crearCopiaExclusiva(origen, propertyId, numero, extension) {
  const nombreBase = `${propertyId}-${numero}${extension}`;
  let destino = path.join(IMAGENES_DIR, nombreBase);

  // Si el destino es el propio archivo de origen, ya está asignado.
  if (path.resolve(origen) === path.resolve(destino)) {
    return nombreBase;
  }

  // Si la copia ya existe y tiene el mismo contenido, reutilizarla.
  if (fs.existsSync(destino)) {
    if (archivosIguales(origen, destino)) {
      console.log(`♻️ Copia existente reutilizada: ${nombreBase}`);
      return nombreBase;
    }

    // No sobrescribir una imagen diferente.
    // Usar un nombre alternativo estable basado en el contenido.
    const hash = hashArchivo(origen);
    const nombreAlternativo = `${propertyId}-${numero}-${hash}${extension}`;
    destino = path.join(IMAGENES_DIR, nombreAlternativo);

    if (path.resolve(origen) === path.resolve(destino)) {
      return nombreAlternativo;
    }

    if (fs.existsSync(destino)) {
      if (archivosIguales(origen, destino)) {
        console.log(`♻️ Copia existente reutilizada: ${nombreAlternativo}`);
        return nombreAlternativo;
      }

      throw new Error(
        `Conflicto: existe ${nombreAlternativo} con contenido diferente`
      );
    }

    fs.copyFileSync(origen, destino, fs.constants.COPYFILE_EXCL);
    console.log(`📄 Copia creada: ${path.basename(origen)} → ${nombreAlternativo}`);
    return nombreAlternativo;
  }

  // Crear la carpeta de destino si hace falta.
  fs.mkdirSync(IMAGENES_DIR, { recursive: true });

  // COPYFILE_EXCL evita sobrescribir archivos existentes.
  fs.copyFileSync(origen, destino, fs.constants.COPYFILE_EXCL);

  console.log(`📄 Copia creada: ${path.basename(origen)} → ${nombreBase}`);

  return nombreBase;
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
    let errores = 0;

    const fotosActualizadas = property.fotos.map((foto, index) => {
      const rutaOriginal =
        typeof foto === 'string'
          ? foto
          : foto && typeof foto.foto === 'string'
            ? foto.foto
            : null;

      if (!rutaOriginal) {
        console.warn(
          `⚠️ Foto ${index + 1} de ${propertyId}: formato no reconocido`
        );
        errores++;
        return foto;
      }

      const rutaLimpia = rutaOriginal
        .replace(/\\/g, '/')
        .split(/[?#]/)[0];

      const nombreOriginal = path.posix.basename(rutaLimpia);
      const extension = path.extname(nombreOriginal).toLowerCase();

      if (!extension) {
        console.warn(
          `⚠️ ${propertyId}, foto ${index + 1}: no se reconoce la extensión de ${nombreOriginal}`
        );
        errores++;
        return foto;
      }

      const archivoEncontrado = buscarImagen(nombreOriginal);

      if (!archivoEncontrado) {
        console.warn(
          `⚠️ No se encontró ${nombreOriginal}; se conserva la referencia original`
        );
        errores++;
        return foto;
      }

      try {
        // Cada posición de la lista obtiene un archivo exclusivo.
        // Por ejemplo: propiedad-12-1.jpg, propiedad-12-2.jpg.
        const numero = index + 1;

        const nuevoNombre = crearCopiaExclusiva(
          archivoEncontrado.ruta,
          propertyId,
          numero,
          extension
        );

        const nuevaRuta = rutaPublicaOriginal(rutaOriginal, nuevoNombre);

        if (nuevaRuta !== rutaOriginal) {
          cambios++;
        }

        if (typeof foto === 'string') {
          return nuevaRuta;
        }

        return {
          ...foto,
          foto: nuevaRuta
        };
      } catch (error) {
        console.error(
          `❌ Error con ${nombreOriginal} en ${propertyId}: ${error.message}`
        );
        errores++;
        return foto;
      }
    });

    if (cambios > 0) {
      property.fotos = fotosActualizadas;

      fs.writeFileSync(
        propertyFile,
        JSON.stringify(property, null, 2) + '\n'
      );

      console.log(`📝 ${propertyId}: JSON actualizado (${cambios} referencias)`);
    } else {
      console.log(`ℹ️ ${propertyId}: no hubo referencias que actualizar`);
    }

    if (errores > 0) {
      console.warn(`⚠️ ${propertyId}: ${errores} foto(s) requieren revisión`);
      process.exitCode = 1;
    }
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

  if (!fs.existsSync(IMAGENES_DIR)) {
    fs.mkdirSync(IMAGENES_DIR, { recursive: true });
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
