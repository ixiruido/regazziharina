#!/usr/bin/env node

/**
 * Script para generar automáticamente los archivos de índice
 * de avisos y propiedades basándose en los archivos JSON existentes
 *
 * Uso: node scripts/generate-index.js
 */

const fs = require('fs');
const path = require('path');

function generarIndiceAvisos() {
    const directorio = 'avisos';
    const archivoSalida = 'avisos-index.json';

    if (!fs.existsSync(directorio)) {
        console.log(`⚠️  El directorio ${directorio} no existe`);
        return;
    }

    const archivos = fs.readdirSync(directorio);
    const archivosJson = archivos
        .filter(archivo => archivo.endsWith('.json'))
        .sort();

    const indice = {
        avisos: archivosJson
    };

    fs.writeFileSync(archivoSalida, JSON.stringify(indice, null, 2));
    console.log(`✅ Generado ${archivoSalida} con ${archivosJson.length} avisos`);
}

function generarIndiceCatalogo() {
    const directorio = 'catalogo';
    const archivoSalida = 'catalogo-index.json';

    if (!fs.existsSync(directorio)) {
        console.log(`⚠️  El directorio ${directorio} no existe`);
        return;
    }

    const archivos = fs.readdirSync(directorio);
    const archivosJson = archivos
        .filter(archivo => archivo.endsWith('.json') && archivo !== 'config.json')
        .sort();

    const indice = {
        propiedades: archivosJson
    };

    fs.writeFileSync(archivoSalida, JSON.stringify(indice, null, 2));
    console.log(`✅ Generado ${archivoSalida} con ${archivosJson.length} propiedades`);
}

function actualizarScriptJS() {
    const archivo = 'script.js';
    if (!fs.existsSync(archivo)) return;

    let contenido = fs.readFileSync(archivo, 'utf-8');

    // Buscar la línea con la lista de archivos
    const match = contenido.match(/const archivosAvisos = \[([\s\S]*?)\];/);
    if (!match) return;

    const directorio = 'avisos';
    if (!fs.existsSync(directorio)) return;

    const archivos = fs.readdirSync(directorio)
        .filter(archivo => archivo.endsWith('.json'))
        .sort();

    const nuevaLista = archivos.map(archivo => `            '${archivo}'`).join(',\n');
    const nuevoArray = `const archivosAvisos = [\n${nuevaLista}\n        ];`;

    contenido = contenido.replace(/const archivosAvisos = \[[\s\S]*?\];/, nuevoArray);
    fs.writeFileSync(archivo, contenido);
    console.log(`✅ Actualizado ${archivo} con ${archivos.length} avisos`);
}

function actualizarCatalogoJS() {
    const archivo = 'inmuebles/catalogo.js';
    if (!fs.existsSync(archivo)) return;

    let contenido = fs.readFileSync(archivo, 'utf-8');

    // Buscar la línea con la lista de archivos
    const match = contenido.match(/const archivosPropiedades = \[([\s\S]*?)\];/);
    if (!match) return;

    const directorio = 'catalogo';
    if (!fs.existsSync(directorio)) return;

    const archivos = fs.readdirSync(directorio)
        .filter(archivo => archivo.endsWith('.json') && archivo !== 'config.json')
        .sort();

    const nuevaLista = archivos.map(archivo => `            '${archivo}'`).join(',\n');
    const nuevoArray = `const archivosPropiedades = [\n${nuevaLista}\n        ];`;

    contenido = contenido.replace(/const archivosPropiedades = \[[\s\S]*?\];/, nuevoArray);
    fs.writeFileSync(archivo, contenido);
    console.log(`✅ Actualizado ${archivo} con ${archivos.length} propiedades`);
}

function main() {
    console.log('🔄 Generando índices...\n');

    generarIndiceAvisos();
    generarIndiceCatalogo();

    console.log('\n📝 Actualizando archivos JS...\n');

    actualizarScriptJS();
    actualizarCatalogoJS();

    console.log('\n✨ Proceso completado');
    console.log('\n💡 Sugerencia: Agrega este script como pre-commit hook o GitHub Action');
}

if (require.main === module) {
    main();
}
