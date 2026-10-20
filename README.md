# Estudio Jurídico Regazzi Harina - Sitio Web

Sitio web del Estudio Jurídico Regazzi Harina en Villa Regina, Río Negro, Argentina.

## Características

- **Servicios Jurídicos**: Información sobre áreas de práctica (Laboral, Civil, Familia, Penal, etc.)
- **Catálogo Inmobiliario**: Sección de gestión inmobiliaria con propiedades
- **Avisos**: Sistema de avisos y comunicados
- **Consultas Online**: Atención por videollamada y WhatsApp
- **Panel de Administración**: Gestión de contenido vía Static CMS

## Estructura del Proyecto

```
regazziharina-main/
├── index.html          # Página principal
├── style.css           # Estilos
├── script.js           # Funcionalidad JavaScript
├── inmuebles.json      # Datos del catálogo inmobiliario
├── avisos.json         # Datos de avisos
├── images/             # Imágenes del sitio
├── admin/              # Configuración de Static CMS
│   ├── index.html      # Punto de entrada del CMS
│   ├── config.yml      # Configuración de Static CMS
│   ├── auth-worker.js  # Worker de Cloudflare para OAuth
│   └── wrangler.toml   # Configuración de despliegue
├── AGENTS.md           # Documentación del sistema
└── ADMIN-SETUP.md     # Guía de configuración de Static CMS
```

## Uso del Catálogo Inmobiliario

El catálogo se muestra de forma interactiva:

1. **Explorar Catálogo**: Haga clic en el botón "Explorar Catálogo" para cargar las propiedades
2. **Ver Detalles**: Haga clic en cualquier propiedad para ver:
   - Imagen grande
   - Información completa
   - Mapa de Google con la ubicación
   - Botón de contacto por WhatsApp al estudio (+54 9 298 509-6108)

El catálogo se carga desde `inmuebles.json` y muestra:
- Tipo de propiedad (Casa, Terreno, Local, Departamento)
- Categoría (Venta, Alquiler, Alquiler Comercial)
- Ubicación y dirección
- Detalles completos
- Tamaño y precio

## Administración del Contenido

Para gestionar el contenido (inmuebles y avisos), el proyecto utiliza **Static CMS** con autenticación OAuth de GitHub.

### Acceso al Panel de Administración

1. Ir a la sección "Catálogo" en el sitio
2. Hacer clic en "Administrar Catálogo"
3. Será redirigido a `/admin/`
4. Autenticarse con GitHub (OAuth)
5. Editar inmuebles y avisos desde la interfaz de Static CMS

### Configuración

Para configurar el sistema de administración, consulte `ADMIN-SETUP.md` para instrucciones detalladas sobre:

- Creación de GitHub OAuth App
- Configuración del Worker de Cloudflare
- Despliegue del worker
- Configuración de Static CMS

## Desarrollo

### Archivos de Datos

- **inmuebles.json**: Contiene la lista de propiedades del catálogo
- **avisos.json**: Contiene los avisos y comunicados del estudio

Estos archivos se gestionan a través de Static CMS y se guardan automáticamente en GitHub como commits.

### Estilos

El sitio utiliza un diseño oscuro con acentos dorados:

- Colores definidos en variables CSS
- Fuentes: Montserrat (texto) y Merriweather (títulos)
- Animaciones suaves de revelación
- Diseño responsivo para móviles

## Requisitos para Despliegue

1. **GitHub Pages** u otro hosting estático
2. **Cloudflare Workers** (para autenticación OAuth - opcional, ver alternativas en ADMIN-SETUP.md)
3. **GitHub OAuth App** (para autenticación)
4. **Wrangler CLI** (para desplegar el worker)

## Documentación

- **AGENTS.md**: Documentación general del sistema de gestión
- **ADMIN-SETUP.md**: Guía completa de configuración de Static CMS y Cloudflare Worker

## Soporte

Para consultas sobre configuración o uso del sistema de administración, consulte `ADMIN-SETUP.md`.

## Licencia

© 2026 Estudio Jurídico Regazzi Harina. Todos los derechos reservados.
