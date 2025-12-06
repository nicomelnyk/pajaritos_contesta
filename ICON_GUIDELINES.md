# Directrices de Icono para Chrome Web Store

## Requisitos Técnicos

### Tamaño
- **128x128 píxeles** (exactamente)
- Formato: PNG
- Sin transparencia (fondo sólido recomendado)

### Directrices de Diseño

1. **Claridad y Legibilidad**
   - El icono debe ser reconocible incluso en tamaño pequeño
   - Evitar texto pequeño que no se lea
   - Usar formas simples y claras

2. **Contraste**
   - Buen contraste entre elementos
   - Evitar colores muy similares
   - El icono debe verse bien sobre fondo claro y oscuro

3. **Sin Elementos Prohibidos**
   - ❌ No usar marcas comerciales de Google/Chrome
   - ❌ No usar logos de otras empresas sin permiso
   - ❌ No usar contenido ofensivo o inapropiado
   - ❌ No usar imágenes de personas sin permiso

4. **Diseño Único**
   - Debe representar claramente la funcionalidad de la extensión
   - No debe ser genérico o confundirse con otros iconos

## Para Pajaritos de Guardia

### Recomendaciones Específicas

✅ **Buenas Prácticas:**
- Usar un diseño de pájaro/paloma simple y reconocible
- Colores que representen naturaleza/cuidado (verdes, azules suaves)
- Icono limpio sin demasiados detalles
- Si incluye texto, que sea mínimo y legible

✅ **Tu icono actual (icon128.png):**
- Ya está en el tamaño correcto (128x128)
- Ya está en formato PNG
- Debe tener buen contraste
- Debe ser reconocible

### Verificación Final

Antes de subir, verifica que tu icono:

1. ✅ Tiene exactamente 128x128 píxeles
2. ✅ Es un PNG válido
3. ✅ Se ve claro y reconocible
4. ✅ Tiene buen contraste
5. ✅ No viola ninguna marca comercial
6. ✅ Representa la funcionalidad de la extensión

## Cómo Verificar el Tamaño

Si necesitas verificar o ajustar el tamaño de tu icono:

```bash
# Verificar dimensiones (macOS)
sips -g pixelWidth -g pixelHeight icon128.png

# Redimensionar si es necesario (macOS)
sips -z 128 128 icon128.png --out icon128_resized.png
```

## Nota Importante

Chrome Web Store puede rechazar iconos que:
- Son demasiado genéricos
- No representan la funcionalidad
- Tienen mala calidad
- Violan derechos de autor
- Son ofensivos o inapropiados

Tu icono actual (con la paloma) debería cumplir con todos los requisitos si:
- Es de buena calidad
- Es reconocible
- No usa marcas comerciales protegidas






