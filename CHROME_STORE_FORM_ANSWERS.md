# Respuestas para el Formulario de Chrome Web Store

## 1. Descripción de la finalidad única* (0/1.000)

**Pajaritos de Guardia** es una herramienta de asistencia diseñada exclusivamente para ayudar a usuarios que responden publicaciones de Facebook sobre cuidado y rescate de aves. La extensión agrega un botón en cada publicación de Facebook que permite seleccionar respuestas predefinidas organizadas por tipo de ave, edad y situación (alimentación, primeros auxilios, enfermedades, etc.), personalizarlas y publicarlas como comentarios. Su única finalidad es agilizar y estandarizar las respuestas sobre cuidado de aves en Facebook, permitiendo que rescatistas y voluntarios respondan más rápido y con información precisa y consistente.

---

## 2. Justificación de storage* (0/1.000)

El permiso `storage` es esencial para guardar localmente en el navegador del usuario:
- El historial de comentarios publicados (para mostrarlo en el popup de la extensión)
- Las preferencias y configuraciones del formulario (textos editados, imágenes personalizadas, comentarios adicionales creados por el usuario)
- El estado de las respuestas seleccionadas

Toda esta información se almacena únicamente en el dispositivo del usuario usando `chrome.storage.local`, sin transmitir datos a servidores externos. Esto permite que el usuario mantenga sus personalizaciones y pueda ver su historial de actividad, mejorando la experiencia de uso sin comprometer la privacidad.

---

## 3. Justificación de activeTab* (0/1.000)

El permiso `activeTab` es necesario para acceder al contenido de la pestaña activa de Facebook únicamente cuando el usuario hace clic explícitamente en el botón de la extensión. Esto permite:
- Detectar las publicaciones de Facebook en la página actual
- Inyectar el botón "🐦" en cada publicación
- Acceder al contenido del post cuando el usuario hace clic en el botón para abrir el formulario
- Interactuar con los elementos de Facebook (campos de comentario, botones de publicación) solo cuando el usuario decide usar la extensión

Este permiso garantiza que la extensión solo accede a Facebook cuando el usuario la activa intencionalmente, respetando su privacidad y siguiendo las mejores prácticas de seguridad.

---

## 4. Justificación de Permiso de host* (0/1.000)

El permiso de host para `https://www.facebook.com/*` y `https://m.facebook.com/*` es absolutamente necesario porque:

**Finalidad específica**: La extensión está diseñada exclusivamente para funcionar en Facebook, donde los usuarios publican consultas sobre cuidado de aves. Sin acceso a Facebook, la extensión no puede cumplir su propósito.

**Funcionalidad requerida**: 
- Los content scripts deben ejecutarse en páginas de Facebook para detectar publicaciones y agregar el botón de respuesta
- La extensión necesita acceder al DOM de Facebook para inyectar el formulario modal y publicar comentarios
- Las imágenes de la extensión deben ser accesibles en el contexto de Facebook mediante `web_accessible_resources`

**Alcance limitado**: El permiso está restringido únicamente a los dominios de Facebook (www.facebook.com y m.facebook.com), no se solicita acceso a otros sitios web. La extensión no funciona ni accede a ningún otro dominio.

**Sin alternativas**: No existe una alternativa técnica que permita cumplir la finalidad de la extensión sin este permiso de host, ya que requiere interacción directa con la interfaz de Facebook.






