const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CATALOGO_DIR = path.join(__dirname, '..', 'catalogo');
const IMAGENES_DIR = path.join(__dirname, '..', 'inmuebles', 'imagenes');
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'uploads');

// Busca la imagen original por nombre en las carpetas conocidas.
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

// Conserva el formato de ruta que utiliza Decap CMS.
function rutaPublicaOriginal(rutaOriginal, nuevoNombre) {
  const normalizada = rutaOriginal.replace(/\\/g, '/');
  const marcador = 'inmuebles/imagenes/';

  if (normalizada.includes(marcador)) {
    const indice = normalizada.lastIndexOf(marcador);
    return normalizada.slice(0, indice) + marcador + nuevoNombre;
  }

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

// Copia la imagen sin mover ni borrar el archivo de origen.
function copiarImagen(origen, propertyId, numero, extension) {
  fs.mkdirSync(IMAGENES_DIR, { recursive: true });

  const nombreBase = `${propertyId}-${numero}${extension}`;
  let nombreDestino = nombreBase;
  let destino = path.join(IMAGENES_DIR, nombreDestino);

  // Si origen y destino son el mismo archivo, ya está correctamente nombrado.
  if (path.resolve(origen) === path.resolve(destino)) {
    return nombreDestino;
  }

  // Si el destino existe, comprobar si contiene la misma imagen.
  if (fs.existsSync(destino)) {
    if (archivosIguales(origen, destino)) {
      console.log(`♻️ Copia existente reutilizada: ${nombreDestino}`);
      return nombreDestino;
    }

    // No sobrescribir archivos diferentes: usar un nombre alternativo estable.
    const hash = hashArchivo(origen);
    nombreDestino = `${propertyId}-${numero}-${hash}${extension}`;
    destino = path.join(IMAGENES_DIR, nombreDestino);

    if (path.resolve(origen) === path.resolve(destino)) {
      return nombreDestino;
    }

    if (fs.existsSync(destino)) {
      if (archivosIguales(origen, destino)) {
        console.log(`♻️ Copia existente reutilizada: ${nombreDestino}`);
        return nombreDestino;
      }

      throw new Error(
        `Conflicto: ${nombreDestino} ya existe con contenido diferente`
      );
    }
  }

  // COPYFILE_EXCL impide sobrescribir un archivo existente.
  fs.copyFileSync(origen, destino, fs.constants.COPYFILE_EXCL);

  console.log(
    `📄 Copia creada: ${path.basename(origen)} → ${nombreDestino}`
  );

  return nombreDestino;
}

function renamePropertyImages(propertyFile) {
  try {
    const property = JSON.parse(
      fs.readFileSync(propertyFile, 'utf8')
    );

    // La identidad se obtiene del nombre del JSON, no del campo id.
    const propertyId = path.basename(propertyFile, '.json');

    if (!Array.isArray(property.fotos) || property.fotos.length === 0) {
      console.log(`ℹ️ La propiedad ${propertyId} no tiene fotos`);
      return;
    }

    let cambios = 0;
    let errores = 0;
    const fotosActualizadas = [];

    for (let i = 0; i < property.fotos.length; i++) {
      const foto = property.fotos[i];

      const rutaOriginal =
        typeof foto === 'string'
          ? foto
          : foto && typeof foto.foto === 'string'
            ? foto.foto
            : null;

      if (!rutaOriginal) {
        console.warn(
          `⚠️ ${propertyId}, foto ${i + 1}: formato no reconocido; se conserva`
        );
        fotosActualizadas.push(foto);
        continue;
      }

      const rutaLimpia = rutaOriginal
        .replace(/\\/g, '/')
        .split(/[?#]/)[0];

      const nombreOriginal = path.posix.basename(rutaLimpia);
      const extension = path.extname(nombreOriginal).toLowerCase();

      if (!extension) {
        console.warn(
          `⚠️ ${propertyId}, foto ${i + 1}: extensión no reconocida (${nombreOriginal})`
        );
        fotosActualizadas.push(foto);
        continue;
      }

      const archivoEncontrado = buscarImagen(nombreOriginal);

      console.log(
        `[DEBUG] ${propertyId}, foto ${i + 1}: ${nombreOriginal}`,
        archivoEncontrado
          ? `✅ENCONTRADA: ${archivoEncontrado.ruta}`
          : '❌NO ENCONTRADA'
      );

      if (!archivoEncontrado) {
        // Mantiene el comportamiento del script anterior:
        // una imagen faltante se informa, pero no detiene todo el workflow.
        console.warn(
          `⚠️ No se encontró ${nombreOriginal}; se conserva la referencia original`
        );

        fotosActualizadas.push(foto);
        continue;
      }

      try {
        const numero = i + 1;

        const nuevoNombre = copiarImagen(
          archivoEncontrado.ruta,
          propertyId,
          numero,
          extension
        );

        const nuevaRuta = rutaPublicaOriginal(
          rutaOriginal,
          nuevoNombre
        );

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
      } catch (error) {
        console.error(
          `❌ Error copiando ${nombreOriginal} para ${propertyId}: ${error.message}`
        );

        errores++;
        fotosActualizadas.push(foto);
      }
    }

    // Guardar las referencias nuevas en el JSON.
    if (cambios > 0) {
      property.fotos = fotosActualizadas;

      fs.writeFileSync(
        propertyFile,
        JSON.stringify(property, null, 2) + '\n'
      );

      console.log(
        `📝 ${propertyId}: JSON actualizado (${cambios} referencias)`
      );
    } else {
      console.log(
        `ℹ️ ${propertyId}: no hubo referencias que actualizar`
      );
    }

    // Los errores reales de copia sí deben detener el workflow.
    if (errores > 0) {
      console.error(
        `❌ ${propertyId}: ${errores} error(es) al copiar imágenes`
      );
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      `❌ Error procesando ${propertyFile}: ${error.message}`
    );
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

  fs.mkdirSync(IMAGENES_DIR, { recursive: true });

  const files = fs.readdirSync(CATALOGO_DIR)
    .filter(file => file.endsWith('.json') && file !== 'config.json')
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

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
