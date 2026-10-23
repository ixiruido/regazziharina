#!/usr/bin/env node

/**
 * Gestiona archivos de inmuebles/imagenes.
 *
 * 1. Lee referencias en los JSON de avisos y catalogo.
 * 2. Lee avisos-index.json, catalogo-index.json e inmuebles/config.json.
 * 3. Conserva archivos referenciados.
 * 4. Elimina archivos no utilizados solo si el análisis es válido.
 *
 * Uso:
 * node scripts/manage-uploads.js --check-only
 * node scripts/manage-uploads.js --clean-orphan --dry-run
 * node scripts/manage-uploads.js --clean-orphan
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const DIRECTORIOS_IMAGENES = [
    path.join(ROOT, 'inmuebles', 'imagenes')
];

const ARCHIVOS_JSON = [
    path.join(ROOT, 'avisos-index.json'),
    path.join(ROOT, 'catalogo-index.json'),
    path.join(ROOT, 'inmuebles', 'config.json')
];

const CARPETAS_JSON = [
    path.join(ROOT, 'avisos'),
    path.join(ROOT, 'catalogo')
];

const EXTENSIONES_IMAGEN = new Set([
    '.jpg', '.jpeg', '.png', '.webp',
    '.gif', '.avif', '.svg', '.bmp', '.tif', '.tiff'
]);

function normalizarRuta(ruta) {
    return path.posix.normalize(
        ruta.replace(/\\/g, '/').replace(/^\.\/+/, '')
    );
}

// Obtiene todos los archivos físicos, incluidos subdirectorios.
function obtenerArchivos(directorio) {
    const encontrados = [];

    if (!fs.existsSync(directorio)) {
        return encontrados;
    }

    function recorrer(actual) {
        for (const elemento of fs.readdirSync(actual, {
            withFileTypes: true
        })) {
            const completa = path.join(actual, elemento.name);

            if (elemento.isDirectory()) {
                recorrer(completa);
            } else if (elemento.isFile()) {
                encontrados.push({
                    ruta: completa,
                    rutaRelativa: normalizarRuta(
                        path.relative(ROOT, completa)
                    ),
                    nombre: elemento.name,
                    tamano: fs.statSync(completa).size
                });
            }
        }
    }

    recorrer(directorio);
    return encontrados;
}

// Convierte una ruta de referencia a una ruta relativa al repositorio.
// Admite, por ejemplo:
// ../inmuebles/imagenes/foto.jpg
// inmuebles/imagenes/foto.jpg
// /inmuebles/imagenes/foto.jpg
function resolverReferencia(valor) {
    if (typeof valor !== 'string') return null;

    let referencia = valor.trim().replace(/\\/g, '/');
    if (!referencia) return null;

    referencia = referencia.split(/[?#]/)[0];

    try {
        referencia = decodeURIComponent(referencia);
    } catch (_) {
        // Mantener la ruta si contiene codificación inválida.
    }

    const marcador = 'inmuebles/imagenes/';
    const indice = referencia.indexOf(marcador);

    if (indice === -1) return null;

    // Extrae la ruta a partir de la carpeta de imágenes.
    const parte = referencia.slice(indice);
    const normalizada = normalizarRuta(parte);

    if (!normalizada.startsWith(marcador)) return null;

    return normalizada;
}

// Lee recursivamente todos los valores de un JSON.
// Conserva solo referencias que coincidan con archivos existentes.
function extraerRutasImagenes(objeto, referencias, archivosPorRuta) {
    if (typeof objeto === 'string') {
        const ruta = resolverReferencia(objeto);

        if (ruta && archivosPorRuta.has(ruta)) {
            referencias.add(ruta);
        }

        return;
    }

    if (objeto === null || typeof objeto !== 'object') {
        return;
    }

    if (Array.isArray(objeto)) {
        for (const elemento of objeto) {
            extraerRutasImagenes(
                elemento,
                referencias,
                archivosPorRuta
            );
        }

        return;
    }

    for (const valor of Object.values(objeto)) {
        extraerRutasImagenes(valor, referencias, archivosPorRuta);
    }
}

function obtenerReferenciasImagenes(archivosPorRuta) {
    const referencias = new Set();
    const errores = [];
    const jsonLeidos = new Set();

    function leerJSON(archivo) {
        if (!fs.existsSync(archivo)) {
            // Los índices pueden no existir en repositorios nuevos.
            if (
                CARPETAS_JSON.some(carpeta =>
                    archivo.startsWith(carpeta + path.sep)
                )
            ) {
                errores.push(`No se encontró el archivo: ${archivo}`);
                console.error(`❌ No se encontró: ${archivo}`);
            }
            return;
        }

        try {
            const contenido = fs.readFileSync(archivo, 'utf8');
            const datos = JSON.parse(contenido);

            const antes = referencias.size;

            extraerRutasImagenes(
                datos,
                referencias,
                archivosPorRuta
            );

            jsonLeidos.add(archivo);

            console.log(
                `✅ Leído: ${path.relative(ROOT, archivo)} ` +
                `(${referencias.size - antes} referencias nuevas)`
            );
        } catch (error) {
            const mensaje =
                `Error leyendo ${path.relative(ROOT, archivo)}: ${error.message}`;

            errores.push(mensaje);
            console.error(`❌ ${mensaje}`);
        }
    }

    // Leer JSON en avisos/ y catalogo/, incluyendo subdirectorios.
    for (const carpeta of CARPETAS_JSON) {
        if (!fs.existsSync(carpeta)) {
            errores.push(`No existe la carpeta: ${carpeta}`);
            console.error(`❌ No existe la carpeta: ${carpeta}`);
            continue;
        }

        function recorrer(actual) {
            for (const elemento of fs.readdirSync(actual, {
                withFileTypes: true
            })) {
                const completa = path.join(actual, elemento.name);

                if (elemento.isDirectory()) {
                    recorrer(completa);
                } else if (
                    elemento.isFile() &&
                    elemento.name.toLowerCase().endsWith('.json')
                ) {
                    leerJSON(completa);
                }
            }
        }

        recorrer(carpeta);
    }

    // Leer índices y configuración.
    for (const archivo of ARCHIVOS_JSON) {
        leerJSON(archivo);
    }

    return { referencias, errores, jsonLeidos };
}

function main() {
    const args = process.argv.slice(2);
    const checkOnly = args.includes('--check-only');
    const cleanOrphan = args.includes('--clean-orphan');
    const dryRun = args.includes('--dry-run');

    console.log('🔍 Analizando imágenes y referencias...\n');

    let todosLosArchivos = [];

    for (const directorio of DIRECTORIOS_IMAGENES) {
        todosLosArchivos = todosLosArchivos.concat(
            obtenerArchivos(directorio)
        );
    }

    // Los archivos físicos se identifican por su ruta completa.
    const archivosPorRuta = new Set(
        todosLosArchivos.map(archivo => archivo.rutaRelativa)
    );

    console.log(`📁 Archivos encontrados: ${todosLosArchivos.length}`);
    console.log('\n📖 Analizando referencias en JSON...\n');

    const resultado = obtenerReferenciasImagenes(archivosPorRuta);
    const referencias = resultado.referencias;

    console.log(`\n📊 Referencias coincidentes: ${referencias.size}`);

    // No borrar si hubo errores leyendo JSON.
    if (resultado.errores.length > 0) {
        console.error(
            '\n⛔ Limpieza cancelada: hubo errores leyendo los JSON.'
        );
        process.exitCode = 1;
        return;
    }

    // Protección contra el borrado masivo si no se detecta ninguna referencia.
    if (todosLosArchivos.length > 0 && referencias.size === 0) {
        console.error(
            '\n⛔ Limpieza cancelada: hay archivos, pero ninguna referencia ' +
            'coincide. No se eliminará nada.'
        );
        console.error(
            'Revisá el formato de las rutas en los JSON antes de continuar.'
        );
        process.exitCode = 1;
        return;
    }

    const archivosHuerfanos = todosLosArchivos.filter(
        archivo => !referencias.has(archivo.rutaRelativa)
    );

    if (archivosHuerfanos.length === 0) {
        console.log('\n✅ No se encontraron archivos sin referencias.');
    } else {
        console.log('\n🗑️ Archivos sin referencias:');

        for (const archivo of archivosHuerfanos) {
            console.log(
                `  - ${archivo.rutaRelativa} (${archivo.tamano} bytes)`
            );
        }
    }

    if (checkOnly) {
        console.log('\n🔎 Modo de comprobación: no se realizaron cambios.');
        return;
    }

    if (!cleanOrphan) {
        console.log(
            '\nℹ️ No se solicitó la eliminación. ' +
            'Usá --clean-orphan para limpiar.'
        );
        return;
    }

    for (const archivo of archivosHuerfanos) {
        if (dryRun) {
            console.log(`🧪 [DRY RUN] Se eliminaría: ${archivo.rutaRelativa}`);
            continue;
        }

        fs.unlinkSync(archivo.ruta);
        console.log(`🗑️ Eliminado: ${archivo.rutaRelativa}`);
    }

    console.log('\n✨ Análisis completado.');
}

if (require.main === module) {
    main();
}

module.exports = {
    obtenerArchivos,
    obtenerReferenciasImagenes,
    extraerRutasImagenes,
    resolverReferencia,
    normalizarRuta
};
