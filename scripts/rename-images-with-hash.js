#!/usr/bin/env node

/**
 * Script para renombrar imágenes con hash basado en su contenido
 * Este script debe ejecutarse después de subir nuevas imágenes al repositorio
 *
 * Uso: node scripts/rename-images-with-hash.js [directorio]
 *
 * Ejemplos:
 *   node scripts/rename-images-with-hash.js imagenes
 *   node scripts/rename-images-with-hash.js assets/uploads
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const directorio = process.argv[2] || 'imagenes';

if (!fs.existsSync(directorio)) {
    console.error(`❌ El directorio "${directorio}" no existe`);
    process.exit(1);
}

console.log(`🔍 Procesando imágenes en: ${directorio}\n`);

const archivos = fs.readdirSync(directorio);
const extensionesImagen = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

let contador = 0;

archivos.forEach(archivo => {
    const ext = path.extname(archivo).toLowerCase();

    if (!extensionesImagen.includes(ext)) return;

    // Ignorar archivos que ya tienen hash (patrón: nombre-xxxx1234.ext)
    if (archivo.match(/-[a-f0-9]{8}\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        console.log(`⏭️  Ya tiene hash: ${archivo}`);
        return;
    }

    const rutaCompleta = path.join(directorio, archivo);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(rutaCompleta)).digest('hex');
    const hashCorto = hash.substring(0, 8);

    const nombreSinExt = path.basename(archivo, ext);
    const nuevoNombre = `${nombreSinExt}-${hashCorto}${ext}`;
    const nuevaRuta = path.join(directorio, nuevoNombre);

    if (fs.existsSync(nuevaRuta)) {
        console.log(`⚠️  Ya existe: ${nuevoNombre} (posible duplicado)`);
        return;
    }

    try {
        fs.renameSync(rutaCompleta, nuevaRuta);
        console.log(`✅ Renombrado: ${archivo} → ${nuevoNombre}`);
        contador++;
    } catch (e) {
        console.error(`❌ Error al renombrar ${archivo}:`, e.message);
    }
});

console.log(`\n✨ Proceso completado. ${contador} imágenes renombradas.`);

// Mostrar instrucciones para actualizar referencias
if (contador > 0) {
    console.log('\n📝 IMPORTANTE: Debes actualizar las referencias en los archivos JSON:');
    console.log('   - Ejecuta: node scripts/update-image-references.js');
}
