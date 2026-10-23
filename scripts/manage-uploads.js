#!/usr/bin/env node

/**
 * Gestiona archivos de inmuebles/imagenes:
 * 1. Detecta referencias en los JSON de avisos y catalogo.
 * 2. Identifica archivos sin referencias.
 * 3. Elimina únicamente archivos sin referencias.
 *
 * Uso:
 * node scripts/manage-images.js --check-only
 * node scripts/manage-images.js --clean-orphan
 * node scripts/manage-images.js --clean-orphan --dry-run
 */

const fs = require('fs');
const path = require('path');

// Configuración
const DIRECTORIOS_IMAGENES = [
    'inmuebles/imagenes'
];

const ARCHIVOS_JSON = [
    'avisos-index.json',
    'catalogo-index.json',
    'inmuebles/config.json'
];

const CARPETAS_JSON = [
    'avisos',
    'catalogo'
];

// Obtener todos los archivos, de cualquier extensión,
// incluidos los que estén en subdirectorios.
function obtenerArchivos(directorio) {
    const archivosEncontrados = [];

    if (!fs.existsSync(directorio)) {
        return archivosEncontrados;
    }

    function recorrer(rutaActual) {
        const elementos = fs.readdirSync(rutaActual, {
            withFileTypes: true
        });

        elementos.forEach(elemento => {
            const rutaCompleta = path.join(
                rutaActual,
                elemento.name
            );

            if (elemento.isDirectory()) {
                recorrer(rutaCompleta);
            } else if (elemento.isFile()) {
                const stats = fs.statSync(rutaCompleta);

                archivosEncontrados.push({
                    ruta: rutaCompleta,
                    nombre: elemento.name,
                    tamano: stats.size
                });
            }
        });
    }

    recorrer(directorio);
    return archivosEncontrados;
}

// Normalizar una referencia y obtener el nombre del archivo.
// Admite rutas relativas, absolutas, URL y cualquier extensión.
function normalizarReferencia(valor) {
    let referencia = valor.trim().replace(/\\/g, '/');

    if (!referencia) return '';

    // Eliminar parámetros y fragmentos de URL.
    referencia = referencia.split(/[?#]/)[0];

    try {
        referencia = decodeURIComponent(referencia);
    } catch (e) {
        // Mantener el texto original si la codificación es inválida.
    }

    return path.posix.basename(referencia);
}

// Extraer recursivamente referencias a archivos desde un JSON.
function extraerRutasImagenes(objeto, referencias, nombresArchivos) {
    if (typeof objeto === 'string') {
        const nombreReferencia = normalizarReferencia(objeto);

        // Solo registrar referencias que coincidan con archivos
        // existentes dentro de los directorios que se van a limpiar.
        if (nombresArchivos.has(nombreReferencia)) {
            referencias.add(nombreReferencia);
        }

        return;
    }

    if (typeof objeto !== 'object' || objeto === null) {
        return;
    }

    if (Array.isArray(objeto)) {
        objeto.forEach(item => {
            extraerRutasImagenes(
                item,
                referencias,
                nombresArchivos
            );
        });

        return;
    }

    Object.values(objeto).forEach(valor => {
        extraerRutasImagenes(
            valor,
            referencias,
            nombresArchivos
        );
    });
}

// Leer las referencias de todos los JSON configurados.
function obtenerReferenciasImagenes(nombresArchivos) {
    const referencias = new Set();
    const errores = [];

    function leerJSON(rutaArchivo) {
        if (!fs.existsSync(rutaArchivo)) {
            console.warn(`⚠️ Archivo no encontrado: ${rutaArchivo}`);
            return;
        }

        try {
            const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
            const datos = JSON.parse(contenido);

            extraerRutasImagenes(
                datos,
                referencias,
                nombresArchivos
            );

            console.log(`✅ Leído: ${rutaArchivo}`);
        } catch (e) {
            const mensaje = `Error al leer ${rutaArchivo}: ${e.message}`;

            console.error(`❌ ${mensaje}`);
            errores.push(mensaje);
        }
    }

    // Analizar JSON dentro de avisos y catalogo, incluidos
    // sus subdirectorios.
    CARPETAS_JSON.forEach(carpeta => {
        if (!fs.existsSync(carpeta)) {
            const mensaje = `Carpeta no encontrada: ${carpeta}`;

            console.error(`❌ ${mensaje}`);
            errores.push(mensaje);
            return;
        }

        function recorrerJSON(rutaActual) {
            const elementos = fs.readdirSync(rutaActual, {
                withFileTypes: true
            });

            elementos.forEach(elemento => {
                const rutaCompleta = path.join(
                    rutaActual,
                    elemento.name
                );

                if (elemento.isDirectory()) {
                    recorrerJSON(rutaCompleta);
                } else if (
                    elemento.isFile() &&
                    elemento.name.endsWith('.json') &&
                    elemento.name !== 'index.json'
                ) {
                    leerJSON(rutaCompleta);
                }
            });
        }

        recorrerJSON(carpeta);
    });

    // Analizar también los archivos JSON adicionales configurados.
    ARCHIVOS_JSON.forEach(leerJSON);

    return { referencias, errores };
}

// Función principal.
function main() {
    const args = process.argv.slice(2);

    const checkOnly = args.includes('--check-only');
    const cleanOrphan = args.includes('--clean-orphan');
    const dryRun = args.includes('--dry-run');

    console.log('🔍 Analizando archivos de inmuebles/imagenes...\n');

    // Obtener todos los archivos, sin filtrar por extensión.
    let todosLosArchivos = [];

    DIRECTORIOS_IMAGENES.forEach(directorio => {
        todosLosArchivos = todosLosArchivos.concat(
            obtenerArchivos(directorio)
        );
    });

    console.log(
        `📊 Total de archivos encontrados: ${todosLosArchivos.length}\n`
    );

    // Crear un índice de nombres de archivos para detectar referencias.
    const nombresArchivos = new Set(
        todosLosArchivos.map(archivo => archivo.nombre)
    );

    console.log('📖 Analizando referencias en archivos JSON...\n');

    const resultado = obtenerReferenciasImagenes(nombresArchivos);
    const referencias = resultado.referencias;

    console.log(`\n📊 Referencias encontradas: ${referencias.size}`);

    // Si algún JSON no pudo leerse, no eliminar nada.
    // Así se evita borrar archivos que podrían seguir utilizándose.
    if (resultado.errores.length > 0) {
        console.error(
            '\n⛔ Limpieza cancelada: hay archivos JSON que no pudieron analizarse.'
        );
        console.error(
            'Corrige los errores antes de volver a ejecutar la limpieza.'
        );
        process.exitCode = 1;
        return;
    }

    // Identificar archivos que no tienen referencias.
    const archivosHuerfanos = todosLosArchivos.filter(archivo => {
        return !referencias.has(archivo.nombre);
    });

    if (archivosHuerfanos.length > 0) {
        console.log('\n🗑️ Archivos sin referencias:');

        archivosHuerfanos.forEach(archivo => {
            console.log(
                `  - ${archivo.ruta} (${archivo.tamano} bytes)`
            );
        });
    } else {
        console.log('\n✅ No se encontraron archivos sin referencias.');
    }

    if (checkOnly) {
        console.log('\n🔎 Modo de comprobación: no se realizaron cambios.');
        return;
    }

    if (!cleanOrphan) {
        console.log(
            '\nℹ️ No se solicitó la eliminación. Usa --clean-orphan para limpiar.'
        );
        return;
    }

    if (archivosHuerfanos.length > 0) {
        console.log('\n🧹 Limpiando archivos sin referencias...\n');

        archivosHuerfanos.forEach(archivo => {
            if (dryRun) {
                console.log(`  [DRY RUN] Se eliminaría: ${archivo.ruta}`);
                return;
            }

            fs.unlinkSync(archivo.ruta);
            console.log(`  ✗ Eliminado: ${archivo.ruta}`);
        });
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
    normalizarReferencia
};
