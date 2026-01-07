# Changelog - Versión 3.0.3

## Mejoras y Correcciones

### 🐛 Correcciones de Errores
- **Corregido el icono roto en el popup**: Se solucionó el problema del icono que no se cargaba correctamente en la ventana emergente de la extensión
- **Mejorado el manejo de errores del botón principal**: El botón principal ahora maneja correctamente los casos donde el contexto de la extensión se invalida, mostrando un emoji como respaldo
- **Eliminado error de Content Security Policy**: Se movió el código inline del popup a un archivo externo para cumplir con las políticas de seguridad de Chrome

### ✨ Nuevas Características
- **Aumentado el historial de comentarios**: El historial ahora guarda hasta 1000 comentarios (anteriormente 50)
- **Nueva imagen SOS**: Se agregó `sos_2.png` a la configuración de SOS
- **Información adicional en el popup**: Se agregó una sección "Importante" con información relevante sobre el uso de la extensión
- **Mejoras en la interfaz del popup**: 
  - Se reorganizó el orden de las secciones (Importante aparece primero)
  - Se actualizó el texto del historial para reflejar "modificados/agregados" en lugar de "publicados"
  - Se agregó información sobre cuándo aparece el botón

### 📝 Cambios en la Interfaz
- El popup ahora muestra información más clara sobre cómo usar la extensión
- Se agregaron instrucciones sobre cuándo aparece el botón (al seleccionar "Comentar" en una publicación)
- Mejor organización visual de la información importante

### 🔧 Mejoras Técnicas
- Mejor manejo de errores cuando el contexto de la extensión se invalida
- Código más robusto para la carga de iconos
- Actualización de la versión de almacenamiento para migración de datos

## Archivos Modificados
- `manifest.json` - Versión actualizada a 3.0.3
- `background.js` - Versión de almacenamiento actualizada
- `popup.html` - Nuevas secciones de información y mejoras visuales
- `popup.js` - Manejo mejorado del icono y aumento del límite de historial
- `content.js` - Mejoras en el manejo de errores del botón principal
- `config/sos.js` - Agregada nueva imagen sos_2.png

