# Sistema de Gestión Inmobiliaria - Documentación

## Resumen de Implementación

Se ha implementado un sistema completo de gestión inmobiliaria en la web del Estudio Jurídico Regazzi Harina, que incluye:

1. **Sección de Catálogo Inmobiliario**: Nueva sección que muestra las propiedades desde `inmuebles.json`
2. **Static CMS**: Sistema de administración seguro con autenticación OAuth de GitHub
3. **Worker de Cloudflare**: Intermediario seguro para el flujo OAuth
4. **Integración con GitHub**: Los cambios se guardan automáticamente como commits

## Arquitectura del Sistema

El sistema utiliza **Static CMS** (antes Netlify CMS) para gestionar el contenido de forma segura:

- **Frontend**: Sitio web con catálogo de propiedades
- **CMS**: Static CMS en `/admin/` con autenticación OAuth
- **Auth**: Worker de Cloudflare como intermediario OAuth
- **Backend**: GitHub como repositorio de datos

## Uso del Sistema

### 1. Ver el Catálogo

- Navegue a la sección "Catálogo" en el menú de navegación
- Haga clic en el botón "Explorar Catálogo"
- Las propiedades se cargarán desde `inmuebles.json`
- Cada tarjeta muestra: tipo, categoría, ubicación, dirección, detalles, tamaño, precio
- **Haga clic en cualquier propiedad** para ver más detalles en un modal con:
  - Imagen grande
  - Información completa
  - Mapa de Google con la ubicación
  - Botón de contacto por WhatsApp al número del estudio (+54 9 298 509-6108)

### 2. Acceder al Panel de Administración

1. Navegue directamente a `/admin/` en el navegador
2. Haga clic en "Login with GitHub"
3. Autorice la aplicación OAuth de GitHub
4. Aparecerá el panel de Static CMS

**Nota:** Si `/admin` aparece en blanco, ver `ADMIN-TRUBLESHOOTING.md` para soluciones.

### 3. Gestionar Inmuebles con Static CMS

**Editar Propiedades:**
1. En Static CMS, seleccionar "Catálogo de Inmuebles"
2. Editar los campos del JSON
3. Hacer clic en "Save" para guardar los cambios
4. Static CMS hará un commit automático a GitHub

**Agregar Nuevas Propiedades:**
1. En el campo "Propiedades" (lista), hacer clic en "Add item"
2. Completar todos los campos del formulario
3. Hacer clic en "Save"

**Eliminar Propiedades:**
1. En la lista de propiedades, hacer clic en el ícono de eliminar
2. Confirmar la acción
3. Guardar los cambios

### 4. Gestionar Avisos con Static CMS

**Editar Avisos:**
1. Seleccionar "Avisos" en el panel lateral
2. Editar el campo "Avisos" (lista)
3. Hacer clic en "Add item" para agregar nuevos avisos
4. Completar los campos: título, fecha, autor, texto, adjunto (opcional)
5. Hacer clic en "Save"

## Configuración

Para configurar el sistema, siga las instrucciones detalladas en `ADMIN-SETUP.md`.

Resumen rápido:

1. **Crear GitHub OAuth App** en GitHub Settings
2. **Configurar el Worker** en `admin/auth-worker.js` con tus credenciales
3. **Desplegar el Worker** con `wrangler deploy`
4. **Actualizar config.yml** con la URL del worker y tu repositorio
5. **Probar** accediendo a `/admin/`

## Estructura de Archivos

### Archivos Principales

- **index.html**: Sitio web con sección de catálogo
- **style.css**: Estilos para tarjetas de propiedades
- **script.js**: Funcionalidad de carga de catálogo
- **inmuebles.json**: Datos de propiedades (gestionado por Static CMS)
- **avisos.json**: Datos de avisos (gestionado por Static CMS)

### Archivos de Administración

- **admin/index.html**: Punto de entrada de Static CMS
- **admin/config.yml**: Configuración de Static CMS
- **admin/auth-worker.js**: Worker de Cloudflare para OAuth
- **admin/wrangler.toml**: Configuración de despliegue del worker

## Características Implementadas

### Catálogo Inmobiliario
- Carga dinámica desde JSON
- Tarjetas con información completa de propiedades
- Enlace directo a WhatsApp para contacto
- Diseño responsivo
- Animaciones de revelación

### Static CMS
- Autenticación OAuth segura con GitHub
- Interfaz moderna e intuitiva
- Edición de archivos JSON directamente
- Commits automáticos a GitHub
- Historial completo de cambios

### Worker de Cloudflare
- Intermediario seguro para OAuth
- Verificación de state parameter
- Token exchange con GitHub
- Protección contra CSRF

## Ventajas de esta Solución

### Seguridad
✅ Autenticación OAuth estándar de GitHub
✅ Sin credenciales en el frontend
✅ Intermediario seguro (Cloudflare Worker)
✅ Token gestionado por OAuth
✅ Protección CSRF con state parameter

### Mantenibilidad
✅ Sin backend necesario
✅ Commits automáticos
✅ Historial completo en Git
✅ Rollback fácil desde GitHub

### Experiencia de Usuario
✅ Login con cuenta de GitHub
✅ Interfaz moderna
✅ Preview en vivo
✅ Multi-plataforma

## Troubleshooting

### El catálogo no carga
- Verifique que `inmuebles.json` exista y tenga el formato correcto
- Revise la consola del navegador para errores

### Static CMS no carga
- Verifique que `/admin/config.yml` sea accesible
- Verifique el MIME type del archivo YAML
- Revise la consola para errores de Static CMS

### Error de OAuth
- Verifique que el worker esté desplegado
- Verifique que la URL de callback coincida en GitHub
- Revisar logs del worker en Cloudflare Dashboard

### Los cambios no se reflejan
- Verifique que el commit se haya realizado en GitHub
- Espere 1-2 minutos (GitHub Pages necesita tiempo)
- Verifique que la rama sea la correcta

## Documentación Adicional

Para configuración detallada, consulte:
- **ADMIN-SETUP.md**: Guía completa de configuración de Static CMS y Cloudflare Worker
- **Static CMS Docs**: https://www.staticcms.org/
- **GitHub OAuth Docs**: https://docs.github.com/en/developers/apps/building-oauth-apps

## Contacto

Para soporte o consultas sobre esta implementación, consulte `ADMIN-SETUP.md` o contacte al equipo de desarrollo.

