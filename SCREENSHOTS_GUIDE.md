# Guía para Screenshots de Chrome Web Store

## Dónde Subir los Screenshots

Los screenshots se suben en el **Chrome Web Store Developer Dashboard** durante el proceso de publicación:

1. Ve a: https://chrome.google.com/webstore/devconsole
2. Haz clic en "New Item" o selecciona tu extensión en desarrollo
3. En el formulario de publicación, busca la sección **"Store listing"** o **"Listado de la tienda"**

## Sección de Screenshots

En el formulario encontrarás una sección llamada:

**"Screenshots"** o **"Capturas de pantalla"**

Esta sección generalmente aparece después de:
- Información básica (nombre, descripción)
- Iconos
- Categoría

## Requisitos de Screenshots

### Cantidad
- **Mínimo**: 1 screenshot (requerido)
- **Recomendado**: 2-5 screenshots
- **Máximo**: 5 screenshots

### Tamaños Aceptados
- **1280x800 píxeles** (recomendado)
- **640x400 píxeles** (mínimo aceptable)
- Formato: PNG o JPEG

### Contenido Recomendado

1. **Screenshot 1 (Principal)**: 
   - El popup de la extensión abierto
   - Muestra "Actividad Reciente" y "Cómo usar"
   - Tamaño: 1280x800

2. **Screenshot 2**:
   - Un post de Facebook con el botón "🐦" visible
   - Muestra cómo se ve la extensión en acción
   - Tamaño: 1280x800

3. **Screenshot 3** (Opcional):
   - El formulario modal abierto con opciones de respuesta
   - Muestra la funcionalidad principal
   - Tamaño: 1280x800

4. **Screenshot 4** (Opcional):
   - Ejemplo de respuesta publicada
   - Muestra el resultado final
   - Tamaño: 1280x800

## Cómo Tomar los Screenshots

### Método 1: Captura de Pantalla Directa

1. **Para el Popup**:
   - Abre Chrome
   - Carga la extensión (chrome://extensions → Load unpacked)
   - Haz clic en el icono de la extensión
   - Toma screenshot del popup (Cmd+Shift+4 en Mac, o herramienta de captura)

2. **Para Facebook**:
   - Abre Facebook en Chrome
   - Busca un post
   - Deberías ver el botón "🐦"
   - Toma screenshot de toda la página o del área relevante

3. **Para el Formulario**:
   - Haz clic en el botón "🐦" en un post
   - Se abre el formulario modal
   - Toma screenshot del formulario

### Método 2: Herramientas de Captura

**En macOS:**
- Cmd+Shift+4: Seleccionar área
- Cmd+Shift+3: Captura completa
- Cmd+Shift+4 + Space: Capturar ventana específica

**En Windows:**
- Windows+Shift+S: Herramienta de recorte
- Snipping Tool: Herramienta de recorte clásica

### Método 3: Extensiones de Captura

Puedes usar extensiones como:
- "Awesome Screenshot"
- "Nimbus Screenshot"
- "Lightshot"

## Redimensionar Screenshots (si es necesario)

Si tus screenshots no tienen el tamaño correcto, puedes redimensionarlos:

**En macOS:**
```bash
# Redimensionar a 1280x800
sips -z 800 1280 screenshot.png --out screenshot_1280x800.png
```

**Herramientas online:**
- https://www.iloveimg.com/resize-image
- https://imageresizer.com/

## Pasos en Chrome Web Store

1. En el formulario de publicación, ve a la sección **"Store listing"**
2. Busca **"Screenshots"** o **"Capturas de pantalla"**
3. Haz clic en **"Upload"** o **"Subir"**
4. Selecciona tus archivos de imagen
5. Arrastra y suelta para reordenar (el primero será el principal)
6. Guarda los cambios

## Ubicación Exacta en el Formulario

El formulario generalmente tiene esta estructura:

```
┌─────────────────────────────────┐
│ Información básica               │
│ - Nombre                         │
│ - Descripción                    │
├─────────────────────────────────┤
│ Iconos                          │
│ - Icono 128x128                  │
├─────────────────────────────────┤
│ Screenshots ← AQUÍ              │
│ - [Upload] Screenshot 1          │
│ - [Upload] Screenshot 2          │
│ - [Upload] Screenshot 3          │
│ - [Upload] Screenshot 4          │
│ - [Upload] Screenshot 5          │
├─────────────────────────────────┤
│ Categoría                       │
│ - Seleccionar categoría          │
└─────────────────────────────────┘
```

## Tips Importantes

✅ **Buenas Prácticas:**
- Usa screenshots de alta calidad
- Muestra la funcionalidad principal claramente
- Asegúrate de que el texto sea legible
- El primer screenshot es el más importante (se muestra en la tienda)

❌ **Evitar:**
- Screenshots borrosos o de baja calidad
- Texto ilegible
- Contenido personal/sensible visible
- Screenshots que no muestran la funcionalidad

## Verificación Final

Antes de publicar, verifica que:
- [ ] Tienes al menos 1 screenshot
- [ ] Los screenshots tienen el tamaño correcto (1280x800 recomendado)
- [ ] El contenido es claro y muestra la funcionalidad
- [ ] No hay información personal visible
- [ ] El primer screenshot es el más representativo






