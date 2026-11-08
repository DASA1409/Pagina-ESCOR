# ESCOR — Marketplace de vehículos con asistente IA

Marketplace digital de compra y venta de vehículos usados, con inventario administrado en PostgreSQL, buscador en lenguaje natural, comparador y un asistente conversacional integrado.

## Requisitos

- [Node.js](https://nodejs.org/) versión 20.19 o superior (o 22.12 o superior), requerido por Vite.

## Cómo arrancarlo

1. Clona el repositorio y entra a la carpeta:
   git clone <URL-DEL-REPO>
   cd <NOMBRE-DE-LA-CARPETA>

2. Instala las dependencias:
   **npm install**

3. Levanta el servidor de desarrollo:
   **npm run dev**

4. Abre en el navegador la URL que aparece en la terminal (normalmente `http://localhost:5173`).

### Catálogo PostgreSQL

El catálogo ahora se consulta desde PostgreSQL mediante el API local. Requiere Docker Desktop.

1. Levanta la base de datos: `docker compose up -d db`
2. El primer arranque ejecuta `schema.sql` y crea el Nissan Sentra de ejemplo.
3. Arranca el API en otra terminal: `npm run dev:api`
4. Arranca Vite: `npm run dev`

El API queda disponible en `http://localhost:3001`. La interfaz usa el proxy de Vite para consultar `/api/vehicles`.

### Documentación interactiva del API

Con el servidor API en marcha, abre `http://localhost:3001/api/docs` para explorar y ejecutar los endpoints desde Swagger UI. La especificación OpenAPI también está disponible en `http://localhost:3001/api/openapi.json`. Si estás usando Vite, puedes abrir `http://localhost:5173/api/docs`.

Las credenciales locales están en `.env` y el formato está documentado en `.env.example`. No deben publicarse ni llevarse al frontend.

### Despliegue en Vercel y Render

- En Vercel, usa `npm run build` como comando de compilación y `dist` como directorio de salida. El archivo `vercel.json` reenvía `/api/*` al servicio `https://pagina-escor.onrender.com`; deja `VITE_API_URL` sin definir para que el navegador use ese proxy y mantenga las llamadas en el mismo dominio.
- En Render, configura el servicio Node con `npm install` y `npm run server`. Define `DATABASE_URL` con la URL de conexión de PostgreSQL, además de `GEMINI_API_KEY` si se usa el chat. Render proporciona `PORT`.
- Para llamadas directas al API (sin el proxy de Vercel), configura `CORS_ORIGINS` en Render como una lista de orígenes exactos separados por comas, por ejemplo `https://pagina-escor.vercel.app,https://tu-preview.vercel.app`. No incluyas rutas ni una barra final.
- Al terminar el despliegue, comprueba `https://<servicio>.onrender.com/api/health` y `https://<sitio>.vercel.app/api/vehicles`.

### Prueba de usabilidad

El botón `Finalizar prueba` abre una encuesta de 10 preguntas para mayores de 18 años. Las respuestas se guardan como códigos numéricos en `usability_test_surveys` (edad: 2 = 18–29, 3 = 30–49, 4 = 50+; valoraciones: 0 = no encontré/no usé, 1–5 = escala). Incluye un comentario opcional de hasta 2.000 caracteres; no se deben incluir datos personales. Los hitos de búsqueda, selección y encuesta se mantienen en memoria y solo se guardan junto con la encuesta enviada tras confirmar la participación, en `usability_test_events`, con tiempo transcurrido e intervalo desde el hito anterior. Si la persona cierra la encuesta sin enviarla, no se persisten sus datos de prueba. No se guardan mensajes del chat, nombres, correos ni teléfonos. La base crea estas tablas al iniciar el API.

### Acceso inicial

Al ejecutar `npm run server` se crean automáticamente estas cuentas si todavía no existen:

- Admin: `admin@escor.com` / `admin123`
- Usuario: `usuario@escor.com` / `usuario123`

El admin verá el botón `Nuevo vehículo` y podrá crear tarjetas que quedan guardadas en PostgreSQL. Las contraseñas se guardan usando `scrypt`; las sesiones duran mientras el servidor permanezca activo.

Los visitantes pueden crear una cuenta desde `/register` con nombre, correo y contraseña. El registro asigna el rol `user` en el servidor e inicia sesión; el panel de administración continúa reservado para cuentas `admin`.
