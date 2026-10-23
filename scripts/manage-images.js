#!/usr/bin/env node

/**
 * Script para gestionar imágenes del sitio:
 * 1. Detectar y renombrar imágenes duplicadas usando hash
 * 2. Identificar imágenes sin referencia en JSONs (huérfanas)
 * 3. Limpiar imágenes duplicadas y huérfanas
 *
 * Uso: node scripts/manage-images.js [options]
 * Options:
 *   --check-only    Solo verificar, no realizar cambios
 *   --clean-dupes   Eliminar imágenes duplicadas
 *   --clean-orphan  Eliminar imágenes huérfanas
 *   --dry-run       Mostrar qué se haría sin ejecutar cambios
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuración
const DIRECTORIOS_IMAGENES = [
    'inmuebles/imagenes'
];

const ARCHIVOS_JSON = [
    'avisos-index.json',
    'catalogo-index.json',
    'catalogo/config.json'
];

const CARPETAS_JSON = [
    'avisos',
    'catalogo'
];

// Función para calcular hash SHA-256 de un archivo
function calcularHash(rutaArchivo) {
    const contenido = fs.readFileSync(rutaArchivo);
    return crypto.createHash('sha256').update(contenido).digest('hex');
}

// Función para obtener todas las imágenes de un directorio
function obtenerImagenes(directorio) {
    const imagenes = [];
    if (!fs.existsSync(directorio)) return imagenes;

    const archivos = fs.readdirSync(directorio);
    const extensionesImagen = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    archivos.forEach(archivo => {
        const ext = path.extname(archivo).toLowerCase();
        if (extensionesImagen.includes(ext)) {
            const rutaCompleta = path.join(directorio, archivo);
            const stats = fs.statSync(rutaCompleta);
            imagenes.push({
                ruta: rutaCompleta,
                nombre: archivo,
                extension: ext,
                tamano: stats.size,
                hash: calcularHash(rutaCompleta)
            });
        }
    });

    return imagenes;
}

// Función para obtener todas las rutas de imágenes referenciadas en JSONs
function obtenerReferenciasImagenes() {
    const referencias = new Set();

    // Leer archivos JSON individuales en carpetas
    CARPETAS_JSON.forEach(carpeta => {
        if (!fs.existsSync(carpeta)) {
            console.log(`  ⚠️  Carpeta no encontrada: ${carpeta}`);
            return;
        }

        const archivos = fs.readdirSync(carpeta);
        console.log(`  📂 Escaneando carpeta: ${carpeta} (${archivos.length} archivos)`);
        
        archivos.forEach(archivo => {
            if (archivo.endsWith('.json') && archivo !== 'index.json') {
                const rutaArchivo = path.join(carpeta, archivo);
                try {
                    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
                    const datos = JSON.parse(contenido);
                    console.log(`    ✅ Leído: ${archivo}`);
                    extraerRutasImagenes(datos, referencias);
                } catch (e) {
                    console.error(`    ❌ Error al leer ${rutaArchivo}:`, e.message);
                }
            }
        });
    });

    // Leer archivos JSON individuales
    ARCHIVOS_JSON.forEach(archivo => {
        if (!fs.existsSync(archivo)) {
            console.log(`  ⚠️  Archivo no encontrado: ${archivo}`);
            return;
        }

        try {
            const contenido = fs.readFileSync(archivo, 'utf-8');
            const datos = JSON.parse(contenido);
            extraerRutasImagenes(datos, referencias);
        } catch (e) {
            console.error(`  ❌ Error al leer ${archivo}:`, e.message);
        }
    });

    return referencias;
}

// Función recursiva para extraer rutas de imágenes de un objeto JSON
function extraerRutasImagenes(objeto, referencias) {
    if (typeof objeto !== 'object' || objeto === null) return;

    if (Array.isArray(objeto)) {
        objeto.forEach(item => extraerRutasImagenes(item, referencias));
        return;
    }

    Object.values(objeto).forEach(valor => {
        if (typeof valor === 'string') {
            // Detectar rutas de imágenes
            if (valor.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                // Normalizar la ruta
                let rutaNormalizada = valor.trim();
                
                // Eliminar prefijos de ruta relativos y absolutos
                if (rutaNormalizada.startsWith('../')) {
                    rutaNormalizada = rutaNormalizada.substring(3);
                }
                if (rutaNormalizada.startsWith('./')) {
                    rutaNormalizada = rutaNormalizada.substring(2);
                }
                if (rutaNormalizada.startsWith('/')) {
                    rutaNormalizada = rutaNormalizada.substring(1);
                }
                
                // Reemplazar backslashes con forward slashes
                rutaNormalizada = rutaNormalizada.replace(/\\/g, '/');
                
                referencias.add(rutaNormalizada);
                console.log(`      🔍 Referencia encontrada: ${valor} → ${rutaNormalizada}`);
            }
        } else if (typeof valor === 'object') {
            extraerRutasImagenes(valor, referencias);
        }
    });
}

// Función para normalizar nombre de archivo con hash
function generarNombreConHash(imagen) {
    const nombreSinExt = path.basename(imagen.nombre, imagen.extension);
    const hash = imagen.hash.substring(0, 8); // Usar primeros 8 caracteres del hash
    return `${nombreSinExt}-${hash}${imagen.extension}`;
}

// Función principal
function main() {
    const args = process.argv.slice(2);
    const checkOnly = args.includes('--check-only');
    const cleanDupes = args.includes('--clean-dupes');
    const cleanOrphan = args.includes('--clean-orphan');
    const dryRun = args.includes('--dry-run');

    console.log('🔍 Escaneando imágenes...\n');

    // Obtener todas las imágenes
    let todasLasImagenes = [];
    DIRECTORIOS_IMAGENES.forEach(dir => {
        const imagenes = obtenerImagenes(dir);
        todasLasImagenes = [...todasLasImagenes, ...imagenes];
    });

    console.log(`📊 Total de imágenes encontradas: ${todasLasImagenes.length}\n`);

    // Detectar duplicados por contenido (mismo hash)
    const imagenesPorHash = {};
    todasLasImagenes.forEach(img => {
        if (!imagenesPorHash[img.hash]) {
            imagenesPorHash[img.hash] = [];
        }
        imagenesPorHash[img.hash].push(img);
    });

    const duplicados = Object.entries(imagenesPorHash)
        .filter(([hash, imgs]) => imgs.length > 1)
        .map(([hash, imgs]) => ({ hash, imagenes: imgs }));

    if (duplicados.length > 0) {
        console.log('🔗 Imágenes duplicadas (mismo contenido):');
        duplicados.forEach(({ hash, imagenes }) => {
            console.log(`  Hash: ${hash.substring(0, 16)}...`);
            imagenes.forEach(img => {
                console.log(`    - ${img.ruta} (${img.tamano} bytes)`);
            });
        });
        console.log('');
    } else {
        console.log('✅ No se encontraron imágenes duplicadas\n');
    }

    // Obtener referencias de imágenes en JSONs
    console.log('📖 Escaneando referencias en archivos JSON...\n');
    const referencias = obtenerReferenciasImagenes();
    console.log(`\n📊 Total de referencias encontradas: ${referencias.size}\n`);
    console.log('📋 Referencias detectadas:');
    Array.from(referencias).forEach(ref => console.log(`  - ${ref}`));
    console.log('');

    // Detectar imágenes huérfanas
    const imagenesHuérfanas = todasLasImagenes.filter(img => {
        // Extraer el nombre del archivo de la imagen
        const nombreArchivo = img.nombre;
        
        // Verificar si el nombre del archivo está en alguna referencia
        const referida = Array.from(referencias).some(ref => {
            const refNormalizada = ref.replace(/\\/g, '/');
            // Extraer el nombre del archivo de la referencia
            const nombreRef = path.basename(refNormalizada);
            // Match por nombre exacto del archivo
            return nombreArchivo === nombreRef;
        });
        return !referida;
    });

    if (imagenesHuérfanas.length > 0) {
        console.log('🗑️  Imágenes huérfanas (sin referencia):');
        imagenesHuérfanas.forEach(img => {
            console.log(`  - ${img.ruta} (${img.tamano} bytes)`);
        });
        console.log('');
    } else {
        console.log('✅ No se encontraron imágenes huérfanas\n');
    }

    // Ejecutar acciones si se solicitan
    if (!checkOnly) {
        if (cleanDupes && duplicados.length > 0) {
            console.log('🧹 Limpiando duplicados...\n');
            const imagenesEliminadas = new Set();
            duplicados.forEach(({ hash, imagenes }) => {
                // Mantener la primera imagen, eliminar el resto
                const [mantener, ...eliminar] = imagenes;
                eliminar.forEach(img => {
                    if (!dryRun) {
                        fs.unlinkSync(img.ruta);
                        imagenesEliminadas.add(img.ruta);
                        console.log(`  ✗ Eliminado: ${img.ruta}`);
                    } else {
                        console.log(`  [DRY RUN] Se eliminaría: ${img.ruta}`);
                    }
                });
            });
            console.log('');

            // Filtrar huérfanas para excluir las que ya fueron eliminadas como duplicados
            if (cleanOrphan) {
                imagenesHuérfanas = imagenesHuérfanas.filter(img => !imagenesEliminadas.has(img.ruta));
            }
        }

        if (cleanOrphan && imagenesHuérfanas.length > 0) {
            console.log('🧹 Limpiando imágenes huérfanas...\n');
            imagenesHuérfanas.forEach(img => {
                if (!dryRun) {
                    fs.unlinkSync(img.ruta);
                    console.log(`  ✗ Eliminado: ${img.ruta}`);
                } else {
                    console.log(`  [DRY RUN] Se eliminaría: ${img.ruta}`);
                }
            });
            console.log('');
        }
    }

    console.log('✨ Análisis completado');
}

if (require.main === module) {
    main();
}

module.exports = {
    calcularHash,
    obtenerImagenes,
    obtenerReferenciasImagenes,
    generarNombreConHash
};
