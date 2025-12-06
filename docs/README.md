# Página de Instalación - Voluntarios de Guardia

Esta carpeta contiene los archivos necesarios para alojar una página web donde los usuarios pueden descargar e instalar la extensión de Chrome manualmente.

## Archivos

- `install.html` - Página principal de instalación con instrucciones paso a paso
- `index.html` - Página de política de privacidad
- `privacy-policy.md` - Política de privacidad en formato Markdown
- `voluntarios-de-guardia-v1.9.9.zip` - Archivo ZIP de la extensión para descarga

## Cómo usar

### Opción 1: Servidor Local (para pruebas)

```bash
# Desde la carpeta docs/
python3 -m http.server 8000
# O con Node.js
npx http-server -p 8000
```

Luego abre `http://localhost:8000/install.html` en tu navegador.

### Opción 2: Hosting Web

1. Sube todos los archivos de la carpeta `docs/` a tu servidor web
2. Asegúrate de que el archivo ZIP esté accesible
3. Los usuarios pueden visitar `https://tudominio.com/install.html`

### Opción 3: GitHub Pages

1. Crea un repositorio en GitHub
2. Sube los archivos de `docs/` a la rama `main` o `gh-pages`
3. Activa GitHub Pages en la configuración del repositorio
4. La página estará disponible en `https://tuusuario.github.io/repositorio/install.html`

## Actualizar la versión

Cuando tengas una nueva versión:

1. Actualiza el número de versión en `install.html` (busca "v1.9.9")
2. Copia el nuevo archivo ZIP a la carpeta `docs/`
3. Actualiza el enlace de descarga en `install.html` si el nombre del archivo cambió

## Notas importantes

- Los usuarios necesitarán activar el "Modo de desarrollador" en Chrome para instalar extensiones manualmente
- Chrome mostrará una advertencia sobre extensiones no verificadas (esto es normal)
- La extensión es completamente segura y no recopila datos

