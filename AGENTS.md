# Información del Proyecto

## Estructura del Sistema

### Sistema de Avisos
- **Carpeta**: `avisos/`
- **Formato**: Cada aviso es un archivo JSON individual
- **Índice**: `avisos-index.json` contiene la lista de archivos de avisos
- **CMS**: Decap CMS configurado en `admin/config.yml` para gestionar avisos via `/admin`
- **Visualización**: La sección de avisos en `index.html` se oculta automáticamente cuando no hay avisos
- **Script**: `script.js` carga los avisos desde `avisos-index.json` y los archivos individuales

### Sistema de Catálogo de Inmuebles
- **Carpeta**: `catalogo/`
- **Formato**: Cada propiedad es un archivo JSON individual
- **Identificador**: El nombre del archivo JSON (ej: `propiedad-1.json`) es el identificador único de la propiedad
- **Configuración**: `catalogo/config.json` contiene configuración general (WhatsApp, mensaje)
- **Índice**: `catalogo-index.json` contiene la lista de archivos de propiedades
- **CMS**: Decap CMS configurado en `admin/config.yml` para gestionar propiedades via `/admin`
  - Los nuevos archivos se crean con el formato `propiedad-{slug}.json`
  - El campo `id` ha sido eliminado; el identificador es el nombre del archivo
- **Visualización**: La página `inmuebles/index.html` muestra el catálogo completo
- **Script**: `inmuebles/catalogo.js` carga las propiedades desde `catalogo-index.json` y los archivos individuales
  - Usa `nombreArchivo` (nombre del archivo sin extensión) como identificador

## GitHub Actions

### .github/workflows/property-workflow.yml
Workflow maestro que coordina todo el proceso de gestión de propiedades en orden secuencial:
1. **assign-numbers**: Asigna números secuenciales a archivos de propiedades sin formato
2. **rename-images**: Renombra imágenes con el prefijo del nombre del archivo JSON
3. **cleanup-images**: Limpia imágenes huérfanas después del renombrado
- Se activa cuando hay cambios en `catalogo/*.json`
- Cada job espera a que el anterior termine antes de ejecutarse

## Scripts de Automatización

### scripts/assign-property-number.js
Asigna números secuenciales a archivos de propiedades creados desde Decap CMS.
- Para archivos que no tienen el formato `propiedad-X.json`
- Automáticamente asigna el siguiente número disponible
- Se ejecuta automáticamente como primer paso del workflow maestro de propiedades
- Uso: `node scripts/assign-property-number.js`

### scripts/generate-index.js
Genera automáticamente los archivos de índice cuando se crean o eliminan avisos/propiedades.
- Ejecuta automáticamente via GitHub Action cuando hay cambios en las carpetas
- Actualiza tanto los archivos de índice como los scripts JS

### scripts/manage-images.js
Analiza y limpia imágenes duplicadas y huérfanas.
- Opciones: `--check-only`, `--clean-dupes`, `--clean-orphan`, `--dry-run`
- Escanea carpetas: `inmuebles/imagenes`, `assets/uploads`, `images`
- Ejecuta automáticamente via GitHub Action después de renombrar imágenes para limpiar imágenes huérfanas

### scripts/rename-images-with-hash.js
Renombra imágenes con hash basado en contenido para evitar duplicados.
- Patrones de renombrado: `nombre.ext` → `nombre-hash8chars.ext`

### scripts/update-image-references.js
Actualiza referencias de imágenes en JSONs después de renombrarlas.

### scripts/rename-property-images.js
Renombra automáticamente las imágenes de una propiedad con el prefijo del nombre del archivo JSON.
- Patrón de renombrado: `imagen.jpg` → `{nombre-archivo-json}-imagen.jpg`
- Ejemplo: `casa.jpg` → `propiedad-1-casa.jpg`
- Busca imágenes en `inmuebles/imagenes` y `assets/uploads`
- Actualiza las referencias en el JSON de la propiedad
- Se ejecuta automáticamente via GitHub Action como parte del workflow maestro de propiedades

### scripts/migrate-property-files.js
Script de migración para convertir archivos JSON al nuevo formato sin campo `id`.
- Renombra archivos JSON a formato `propiedad-X.json` con numeración secuencial
- Elimina el campo `id` de todos los archivos JSON
- Uso: `node scripts/migrate-property-files.js`

### scripts/assign-property-number.js
Asigna números secuenciales a archivos de propiedades creados desde Decap CMS.
- Para archivos que no tienen el formato `propiedad-X.json`
- Automáticamente asigna el siguiente número disponible
- Uso: `node scripts/assign-property-number.js`

## Comandos Útiles

### Generar índices manualmente
```bash
node scripts/generate-index.js
```

### Verificar imágenes
```bash
node scripts/manage-images.js --check-only
```

### Renombrar imágenes con hash
```bash
node scripts/rename-images-with-hash.js imagenes
```

### Actualizar referencias de imágenes
```bash
node scripts/update-image-references.js
```

## Configuración de Decap CMS

- **Backend**: GitHub
- **Repo**: ixiruido/regazziharina
- **Branch**: main
- **Media Folder**: assets/uploads
- **Colecciones**:
  - `avisos`: Carpeta `avisos/` con archivos JSON individuales
  - `configuracion_catalogo`: Archivo `catalogo/config.json` para configuración general
  - `catalogo`: Carpeta `catalogo/` con archivos JSON individuales para propiedades

## Archivos Importantes

- `admin/config.yml`: Configuración de Decap CMS
- `script.js`: Carga y muestra avisos, oculta sección si no hay avisos
- `inmuebles/catalogo.js`: Carga y muestra propiedades del catálogo
- `avisos-index.json`: Índice de archivos de avisos
- `catalogo-index.json`: Índice de archivos de propiedades
- `catalogo/config.json`: Configuración general del catálogo
