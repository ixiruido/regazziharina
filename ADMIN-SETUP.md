# Configuración de Static CMS para Gestión Inmobiliaria

## Resumen

Este proyecto utiliza **Static CMS** (antes Netlify CMS) para gestionar el catálogo inmobiliario y los avisos de forma segura mediante autenticación OAuth de GitHub. Esta solución es mucho más segura que un sistema de login personalizado porque utiliza el flujo OAuth estándar de GitHub.

## Arquitectura

```
┌─────────────────┐
│   Sitio Web     │
│   (index.html)  │
└────────┬────────┘
         │
         │ Botón "Administrar"
         ▼
┌─────────────────┐
│  Static CMS     │
│  (/admin/)      │
└────────┬────────┘
         │
         │ OAuth Flow
         ▼
┌─────────────────┐
│ Cloudflare      │
│ Worker (Auth)   │
└────────┬────────┘
         │
         │ Token Exchange
         ▼
┌─────────────────┐
│   GitHub API    │
│   (Auth & Repo) │
└─────────────────┘
```

## Componentes

### 1. Configuración de Static CMS (`admin/config.yml`)

El archivo `config.yml` define cómo Static CMS interactúa con GitHub y qué colecciones gestionar.

#### Backend Configuration

```yaml
backend:
  name: github
  repo: <TU-USUARIO>/<TU-REPOSITORIO>  # Reemplazar con tus datos
  branch: main
  site_domain: <TU-DOMINIO>  # ej: regazziharina.com
  base_url: https://<TU-WORKER-AUTH>.workers.dev  # Worker de Cloudflare
  auth_endpoint: auth
```

**Campos a configurar:**
- `repo`: `usuario/repositorio` de GitHub
- `site_domain`: Dominio de tu sitio
- `base_url`: URL del worker de Cloudflare para autenticación

#### Colecciones

El archivo define dos colecciones:

**Inmuebles:** Gestiona `inmuebles.json`
- WhatsApp y mensaje de contacto
- Lista de propiedades con todos los campos
- Widgets: select, string, number, text, image

**Avisos:** Gestiona `avisos.json`
- Lista de avisos con título, fecha, autor, texto y adjunto

### 2. Worker de Cloudflare (`admin/auth-worker.js`)

El worker actúa como intermediario en el flujo OAuth de GitHub.

#### Funciones

1. **`/auth`**: Inicia el flujo OAuth
   - Genera un estado aleatorio para seguridad
   - Redirige a GitHub para autorización
   - Guarda el estado en cookie

2. **`/auth/callback`**: Procesa el callback de GitHub
   - Verifica el estado de la cookie
   - Intercambia el código por un token de acceso
   - Obtiene información del usuario
   - Genera un token JWT simplificado
   - Redirige de vuelta al CMS con el token

#### Configuración Necesaria

En `auth-worker.js`, reemplazar:

```javascript
const GITHUB_CLIENT_ID = '<TU-GITHUB-CLIENT-ID>';
const GITHUB_CLIENT_SECRET = '<TU-GITHUB-CLIENT-SECRET>';
const REDIRECT_URI = '<TU-WORKER-URL>/auth/callback';
const CMS_ORIGIN = '<TU-DOMINIO>';
```

### 3. Deploy del Worker (`admin/wrangler.toml`)

Archivo de configuración para desplegar el worker con Wrangler CLI.

```toml
name = "static-cms-auth"
main = "auth-worker.js"
compatibility_date = "2024-01-01"
```

## Pasos de Configuración

### Paso 1: Crear GitHub OAuth App

1. Ir a GitHub Settings > Developer settings > OAuth Apps
2. Hacer clic en "New OAuth App"
3. Completar:
   - **Application name**: "Static CMS Auth" (o similar)
   - **Homepage URL**: `https://<TU-DOMINIO>`
   - **Authorization callback URL**: `https://<TU-WORKER-URL>/auth/callback`
4. Guardar y copiar:
   - **Client ID**
   - **Client Secret** (solo visible una vez)

### Paso 2: Configurar el Worker

1. Editar `admin/auth-worker.js`:
   ```javascript
   const GITHUB_CLIENT_ID = 'tu-client-id';
   const GITHUB_CLIENT_SECRET = 'tu-client-secret';
   const REDIRECT_URI = 'https://tu-worker.workers.dev/auth/callback';
   const CMS_ORIGIN = 'https://tu-dominio.com';
   ```

2. Opcional: Usar secrets de Cloudflare para mayor seguridad:
   ```bash
   wrangler secret put CLIENT_ID
   wrangler secret put CLIENT_SECRET
   wrangler secret put REDIRECT_URI
   wrangler secret put CMS_ORIGIN
   ```

### Paso 3: Desplegar el Worker

```bash
# Instalar Wrangler CLI si no está instalado
npm install -g wrangler

# Login en Cloudflare
wrangler login

# Desplegar el worker
cd admin
wrangler deploy
```

Copiar la URL del worker desplegado (ej: `https://static-cms-auth.tu-subdominio.workers.dev`)

### Paso 4: Configurar Static CMS

Editar `admin/config.yml`:

```yaml
backend:
  name: github
  repo: ixiruido/regazziharina-main  # Reemplazar con tu repo
  branch: main
  site_domain: regazziharina.com  # Reemplazar con tu dominio
  base_url: https://static-cms-auth.tu-subdominio.workers.dev  # URL del worker
  auth_endpoint: auth
```

### Paso 5: Configurar Permisos en GitHub

El usuario que se autentique debe tener permisos de escritura en el repositorio.

1. Asegurarse de que el repositorio exista
2. Verificar que el usuario tenga permisos `Write` o `Admin`
3. Si es privado, agregar al usuario como colaborador

### Paso 6: Probar la Configuración

1. Abrir `https://<TU-DOMINIO>/admin/`
2. Hacer clic en "Login with GitHub"
3. Autorizar la aplicación OAuth
4. Debería aparecer el panel de Static CMS con las colecciones

## Uso de Static CMS

### Editar Inmuebles

1. En el panel de Static CMS, seleccionar "Catálogo de Inmuebles"
2. Editar los campos del archivo JSON
3. Hacer clic en "Save" en la esquina superior derecha
4. Static CMS hará un commit automático a GitHub

### Editar Avisos

1. Seleccionar "Avisos"
2. Editar la lista de avisos
3. Hacer clic en "Save"
4. El cambio se guardará en GitHub

### Agregar Nuevos Elementos

Static CMS está configurado para editar archivos existentes. Para agregar:

**Inmuebles:**
- Editar el campo "Propiedades" (lista)
- Hacer clic en "Add item" en la lista
- Completar los campos
- Guardar

**Avisos:**
- Editar el campo "Avisos" (lista)
- Hacer clic en "Add item"
- Completar los campos
- Guardar

## Ventajas de esta Solución

### Seguridad

✅ **Autenticación OAuth estándar**: Utiliza el flujo OAuth 2.0 de GitHub
✅ **Sin credenciales en el frontend**: No hay usuarios/contraseñas en JavaScript
✅ **Token de GitHub gestionado por OAuth**: No se exponen secrets
✅ **Intermediario seguro**: Worker de Cloudflare como mediador
✅ **State parameter**: Protección contra CSRF

### Mantenibilidad

✅ **Sin backend necesario**: Static CMS corre en el navegador
✅ **Commits automáticos**: Los cambios se guardan directamente en GitHub
✅ **Historial completo**: Git mantiene todo el historial de cambios
✅ **Rollback fácil**: Puedes revertir cualquier cambio desde GitHub

### Experiencia de Usuario

✅ **Login familiar**: Los usuarios usan su cuenta de GitHub
✅ **Interfaz moderna**: Static CMS tiene una UI intuitiva
✅ **Preview en vivo**: Ver cambios antes de guardar
✅ **Multi-plataforma**: Funciona en cualquier navegador

## Troubleshooting

### Error: "Failed to load config"

**Causa:** El archivo `config.yml` no se puede cargar
**Solución:**
- Verificar que `/admin/config.yml` sea accesible
- Verificar el MIME type (debe ser `text/yaml` o `application/x-yaml`)

### Error: "OAuth callback error"

**Causa:** URL de callback incorrecta o worker no desplegado
**Solución:**
- Verificar que el worker esté desplegado y accesible
- Verificar que la URL de callback en GitHub coincida con la del worker
- Revisar logs del worker en Cloudflare Dashboard

### Error: "Repository not found"

**Causa:** Usuario no tiene acceso al repositorio
**Solución:**
- Verificar que el usuario tenga permisos en el repositorio
- Verificar que el formato `usuario/repo` sea correcto
- Si es privado, agregar al usuario como colaborador

### Error: "Invalid state"

**Causa:** Error en la verificación de estado OAuth
**Solución:**
- Verificar que las cookies estén habilitadas
- Limpiar cookies y volver a intentar
- Revisar logs del worker

### Los cambios no se reflejan en el sitio

**Causa:** GitHub Pages necesita tiempo para reconstruir
**Solución:**
- Esperar 1-2 minutos
- Verificar que el commit se haya realizado en GitHub
- Si usa CI/CD personalizado, verificar que esté funcionando

## Alternativas sin Worker de Cloudflare

Si no quieres usar Cloudflare Workers, puedes usar:

### Opción 1: Netlify Identity

```yaml
backend:
  name: git-gateway
  branch: main
```

Requiere alojar en Netlify.

### Opción 2: Backend Local (solo desarrollo)

```yaml
backend:
  name: file-system
```

Solo funciona en localhost.

### Opción 3: Otras plataformas

Static CMS soporta:
- GitLab
- Bitbucket
- Azure DevOps
- Gitea

Ver documentación oficial: https://www.staticcms.org/docs/backends-overview

## Recursos

- **Static CMS Docs**: https://www.staticcms.org/
- **GitHub OAuth Docs**: https://docs.github.com/en/developers/apps/building-oauth-apps
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

## Soporte

Para problemas específicos:
1. Revisar logs del worker en Cloudflare Dashboard
2. Revisar consola del navegador para errores de Static CMS
3. Verificar que los archivos JSON tengan el formato correcto
4. Consultar documentación de Static CMS
