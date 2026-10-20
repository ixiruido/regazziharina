# Solución de Problemas - /admin en Blanco

## Problema: `/admin` aparece como página en blanco

### Causas Posibles

#### 1. Contenedor Incorrecto
Static CMS v4 usa `#cms-root` como contenedor principal, no `#nc-root`.

**Solución aplicada:** Se cambió el ID del contenedor en `admin/index.html`:
```html
<!-- Antes -->
<div id="nc-root"></div>

<!-- Después -->
<div id="cms-root"></div>
```

#### 2. Ruta de Config.yml Incorrecta
La ruta relativa debe ser `./config.yml` no `/admin/config.yml`.

**Solución aplicada:** Se cambió en `admin/index.html`:
```html
<!-- Antes -->
<link href="/admin/config.yml" type="text/yaml" rel="cms-config-url" />

<!-- Después -->
<link href="./config.yml" type="text/yaml" rel="cms-config-url" />
```

#### 3. Config.yml Incompleto o Incorrecto
El archivo `config.yml` debe tener marcadores de posición reemplazados:
- `<TU-USUARIO>/<TU-REPOSITORIO>`
- `<TU-DOMINIO>`
- `<TU-WORKER-AUTH>.workers.dev`

**Solución:** Reemplazar estos marcadores con tus datos reales.

#### 4. Sin Backend Configurado
Static CMS necesita un backend configurado para funcionar. Si no está configurado correctamente, aparecerá en blanco.

**Solución:**
- Verificar que el backend esté configurado en `config.yml`
- Si estás en desarrollo local, puedes usar backend de archivos:
  ```yaml
  backend:
    name: file-system
  ```

#### 5. Error de Carga de JavaScript
Verificar que el CDN de Static CMS sea accesible:
```html
<script src="https://unpkg.com/@staticcms/core@^4.0.0/dist/static-cms-core.js"></script>
```

**Solución:**
- Abrir la consola del navegador (F12)
- Verificar si hay errores de carga de script
- Verificar la conexión a internet

### Pasos para Depurar

1. **Abrir la consola del navegador** (F12 > Console)
2. **Buscar errores de JavaScript**
3. **Verificar la red** (F12 > Network)
   - Ver si `config.yml` se carga correctamente
   - Ver si `static-cms-core.js` se carga
4. **Verificar el HTML renderizado**
   - Inspeccionar el elemento `#cms-root`
   - Ver si tiene contenido

### Solución Rápida para Desarrollo Local

Si solo quieres probar el CMS localmente sin configurar GitHub:

1. Editar `admin/config.yml`:
```yaml
backend:
  name: file-system
```

2. Abrir `admin/index.html` en el navegador
3. Debería aparecer la interfaz de Static CMS

### Nota Importante

Para que Static CMS funcione con GitHub y guarde cambios, necesitas:
- Configurar el backend de GitHub
- Desplegar el worker de Cloudflare para OAuth
- Reemplazar los marcadores en `config.yml`

Ver `ADMIN-SETUP.md` para instrucciones completas.

### Verificación de Configuración

Para verificar que tu configuración es correcta:

```bash
# Verificar que config.yml es accesible
curl http://localhost:5500/admin/config.yml

# Verificar el contenido
cat admin/config.yml
```

### Recursos Adicionales

- [Static CMS Documentation](https://www.staticcms.org/docs/)
- [Troubleshooting Guide](https://www.staticcms.org/docs/troubleshooting)
- [Backend Configuration](https://www.staticcms.org/docs/backends-overview)
