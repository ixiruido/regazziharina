#!/usr/bin/env node

/**
 * Script para actualizar referencias de imágenes en archivos JSON
 * después de renombrarlas con hash
 *
 * Uso: node scripts/update-image-references.js
 */

const fs = require('fs');
const path = require('path');

const DIRECTORIOS_JSON = [
    'avisos',
    'catalogo'
];

const ARCHIVOS_JSON = [
    'avisos-index.json',
    'catalogo-index.json'
];

// Mapeo de nombres antiguos a nuevos (con hash)
function crearMapeoImagenes() {
    const mapeo = {};
    const directorios = ['imagenes', 'assets/uploads', 'images'];

    directorios.forEach(dir => {
        if (!fs.existsSync(dir)) return;

        const archivos = fs.readdirSync(dir);
        archivos.forEach(archivo => {
            const match = archivo.match(/^(.+)-([a-f0-9]{8})\.(.+)$/);
            if (match) {
                const [, nombreBase, hash, extension] = match;
                const nombreOriginal = `${nombreBase}.${extension}`;
                const rutaConHash = `${dir}/${archivo}`;
                const rutaOriginal = `${dir}/${nombreOriginal}`;

                mapeo[rutaOriginal] = rutaConHash;
                mapeo[nombreOriginal] = archivo;
                mapeo[`/${rutaOriginal}`] = `/${rutaConHash}`;
                mapeo[`./${rutaOriginal}`] = `./${rutaConHash}`;
            }
        });
    });

    return mapeo;
}

function actualizarReferenciasEnJSON(rutaArchivo, mapeo) {
    try {
        const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
        const datos = JSON.parse(contenido);
        let modificado = false;

        function actualizarRutas(objeto) {
            if (typeof objeto !== 'object' || objeto === null) return objeto;

            if (Array.isArray(objeto)) {
                return objeto.map(item => actualizarRutas(item));
            }

            const nuevoObjeto = {};
            Object.entries(objeto).forEach(([clave, valor]) => {
                if (typeof valor === 'string') {
                    // Verificar si es una ruta de imagen que necesita actualización
                    let nuevoValor = valor;
                    Object.entries(mapeo).forEach(([antiguo, nuevo]) => {
                        if (valor.includes(antiguo)) {
                            nuevoValor = valor.replace(antiguo, nuevo);
                            modificado = true;
                        }
                    });
                    nuevoObjeto[clave] = nuevoValor;
                } else if (typeof valor === 'object') {
                    nuevoObjeto[clave] = actualizarRutas(valor);
                } else {
                    nuevoObjeto[clave] = valor;
                }
            });

            return nuevoObjeto;
        }

        const datosActualizados = actualizarRutas(datos);

        if (modificado) {
            fs.writeFileSync(rutaArchivo, JSON.stringify(datosActualizados, null, 2));
            console.log(`✅ Actualizado: ${rutaArchivo}`);
            return true;
        }

        return false;
    } catch (e) {
        console.error(`❌ Error al procesar ${rutaArchivo}:`, e.message);
        return false;
    }
}

function main() {
    console.log('🔍 Creando mapeo de imágenes...\n');
    const mapeo = crearMapeoImagenes();

    if (Object.keys(mapeo).length === 0) {
        console.log('⚠️  No se encontraron imágenes con hash para mapear');
        return;
    }

    console.log(`📊 Mapeo creado con ${Object.keys(mapeo).length} entradas\n`);

    console.log('📝 Actualizando referencias en archivos JSON...\n');

    let contador = 0;

    // Actualizar archivos en carpetas
    DIRECTORIOS_JSON.forEach(dir => {
        if (!fs.existsSync(dir)) return;

        const archivos = fs.readdirSync(dir);
        archivos.forEach(archivo => {
            if (archivo.endsWith('.json')) {
                const ruta = path.join(dir, archivo);
                if (actualizarReferenciasEnJSON(ruta, mapeo)) {
                    contador++;
                }
            }
        });
    });

    // Actualizar archivos JSON individuales
    ARCHIVOS_JSON.forEach(archivo => {
        if (fs.existsSync(archivo)) {
            if (actualizarReferenciasEnJSON(archivo, mapeo)) {
                contador++;
            }
        }
    });

    console.log(`\n✨ Proceso completado. ${contador} archivos actualizados.`);
}

if (require.main === module) {
    main();
}
