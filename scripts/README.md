# Scripts de Gestión

Este directorio contiene scripts para gestionar el sitio web, incluyendo imágenes y generación de índices.

## Scripts Disponibles

### 1. generate-index.js
Genera automáticamente los archivos de índice (`avisos-index.json` y `catalogo-index.json`) basándose en los archivos JSON existentes en las carpetas `avisos/` y `catalogo/`.

**Uso:**
```bash
node scripts/generate-index.js
```

Este script también actualiza automáticamente las listas de archivos en `script.js` e `inmuebles/catalogo.js`.

**Automatización:**
Hay un GitHub Action (`.github/workflows/update-index.yml`) que ejecuta este script automáticamente cuando se hacen cambios en las carpetas de avisos o catálogo.

### 2. manage-images.js
Script principal para análisis y limpieza de imágenes.

**Uso:**
```bash
node scripts/manage-images.js [opciones]
```

**Opciones:**
- `--check-only` - Solo verificar, no realizar cambios
- `--clean-dupes` - Eliminar imágenes duplicadas
- `--clean-orphan` - Eliminar imágenes huérfanas (sin referencia en JSONs)
- `--dry-run` - Mostrar qué se haría sin ejecutar cambios

**Ejemplos:**
```bash
# Solo verificar duplicados y huérfanas
node scripts/manage-images.js --check-only

# Eliminar duplicados (modo seguro)
node scripts/manage-images.js --clean-dupes --dry-run

# Eliminar huérfanas
node scripts/manage-images.js --clean-orphan
```

### 3. rename-images-with-hash.js
Renombra imágenes agregando un hash basado en su contenido para evitar duplicados.

**Uso:**
```bash
node scripts/rename-images-with-hash.js [directorio]
```

**Ejemplos:**
```bash
# Renombrar imágenes en directorio imagenes
node scripts/rename-images-with-hash.js imagenes

# Renombrar imágenes en assets/uploads
node scripts/rename-images-with-hash.js assets/uploads
```

**Resultado:**
- `casa.jpg` → `casa-a1b2c3d4.jpg`
- `foto.png` → `foto-e5f6g7h8.png`

### 4. update-image-references.js
Actualiza las referencias de imágenes en archivos JSON después de renombrarlas.

**Uso:**
```bash
node scripts/update-image-references.js
```

Este script busca automáticamente todas las referencias a imágenes en los archivos JSON y las actualiza con los nuevos nombres con hash.

## Flujo de Trabajo Recomendado

### Cuando subes nuevas imágenes:

1. **Renombrar con hash:**
   ```bash
   node scripts/rename-images-with-hash.js imagenes
   ```

2. **Actualizar referencias:**
   ```bash
   node scripts/update-image-references.js
   ```

3. **Verificar limpieza:**
   ```bash
   node scripts/manage-images.js --check-only
   ```

### Cuando creas/eliminas avisos o propiedades:

1. **Generar índices:**
   ```bash
   node scripts/generate-index.js
   ```

   Esto actualiza automáticamente los archivos de índice y los scripts JS.

### Mantenimiento regular:

1. **Verificar duplicados y huérfanas:**
   ```bash
   node scripts/manage-images.js --check-only
   ```

2. **Limpiar si es necesario:**
   ```bash
   node scripts/manage-images.js --clean-dupes --clean-orphan --dry-run
   ```

## Automatización

El repositorio incluye GitHub Actions para automatizar tareas:

- **`.github/workflows/update-index.yml`**: Ejecuta `generate-index.js` automáticamente cuando hay cambios en las carpetas de avisos o catálogo.
- **`.github/workflows/cleanup-images.yml`**: Ejecuta el análisis de imágenes cada día a las 3 AM UTC. Por defecto, corre en modo `--dry-run` para no eliminar nada sin aprobación manual.

Para habilitar la limpieza automática de imágenes, edita el workflow y elimina la opción `--dry-run`.
