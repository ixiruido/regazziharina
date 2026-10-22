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
- **Configuración**: `catalogo/config.json` contiene configuración general (WhatsApp, mensaje)
- **Índice**: `catalogo-index.json` contiene la lista de archivos de propiedades
- **CMS**: Decap CMS configurado en `admin/config.yml` para gestionar propiedades via `/admin`
- **Visualización**: La página `inmuebles/index.html` muestra el catálogo completo
- **Script**: `inmuebles/catalogo.js` carga las propiedades desde `catalogo-index.json` y los archivos individuales

## Scripts de Automatización

### scripts/generate-index.js
Genera automáticamente los archivos de índice cuando se crean o eliminan avisos/propiedades.
- Ejecuta automáticamente via GitHub Action cuando hay cambios en las carpetas
- Actualiza tanto los archivos de índice como los scripts JS

### scripts/manage-images.js
Analiza y limpia imágenes duplicadas y huérfanas.
- Opciones: `--check-only`, `--clean-dupes`, `--clean-orphan`, `--dry-run`
- Escanea carpetas: `inmuebles/imagenes`, `assets/uploads`, `images`
- Ejecuta automáticamente via GitHub Action diario para limpiar imágenes huérfanas

### scripts/rename-images-with-hash.js
Renombra imágenes con hash basado en contenido para evitar duplicados.
- Patrones de renombrado: `nombre.ext` → `nombre-hash8chars.ext`

### scripts/update-image-references.js
Actualiza referencias de imágenes en JSONs después de renombrarlas.

### scripts/rename-property-images.js
Renombra automáticamente las imágenes de una propiedad con el prefijo del ID.
- Patrón de renombrado: `imagen.jpg` → `propiedad-{id}-imagen.jpg`
- Busca imágenes en `inmuebles/imagenes` y `assets/uploads`
- Actualiza las referencias en el JSON de la propiedad
- Ejecuta automáticamente via GitHub Action cuando se actualiza el catálogo

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
