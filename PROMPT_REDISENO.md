# Prompt para rediseño completo de ESCOR (Haute Automotive Atelier)

Copia y pega todo lo de abajo en la otra IA.

---

Tengo un proyecto React 19 + Vite llamado **ESCOR**: un marketplace de compra y venta de vehículos usados, funcional a nivel de lógica de negocio, pero con una interfaz visual básica que necesito reconstruir **desde cero** siguiendo al pie de la letra un sistema de diseño que ya tengo definido (adjunto abajo, generado con Google Stitch: `DESIGN.md` con los tokens y `code.html` con el layout de referencia en Tailwind).

## Lo que NO debes tocar (lógica ya funcional, no reescribir)

- `server/index.js` — proxy Node hacia OpenAI/Gemini (chat) y hacia eBay Motors Browse API (inventario real).
- `src/services/*.js` — `vehicleCatalogService.js` (consulta el API del inventario en PostgreSQL), `priceEstimate.js` / `vehicleSimulation.js` (utilidades heredadas), `llmClient.js`.
- `src/chat/*.js` y `src/utils/chatStateMachine.js`, `nlpParser.js`, `mergeChatFilters.js` — motor de intenciones y NLP local que interpreta lenguaje natural ("SUV familiar bajo 30000") sin depender de ningún LLM.
- `src/utils/documentGenerator.js` — generación de PDFs (ficha técnica, info legal, compraventa).
- `src/data/*.js`, `src/context/VehicleCatalogContext.jsx`.

Estos archivos exponen funciones/props ya usadas por los componentes actuales (`filters`, `setFilters`, `vehicles`, `source`, `loading`, `onApplyFilters`, `onOpenVehicle`, `onCompareVehicles`, etc.). **Puedes leerlos para entender el contrato de datos, pero la tarea es rehacer SOLO la capa visual** (componentes `.jsx` de presentación + CSS), sin romper esas integraciones.

## Lo que SÍ debes rehacer desde cero

Todo `src/components/*.jsx` (estructura JSX y clases, no la lógica de datos que reciben por props) y todo el CSS (`src/index.css`, `src/App.css`), aplicando el sistema de diseño de forma **literal**, no como inspiración vaga:

### Sistema de diseño (ver `DESIGN.md` adjunto para todos los tokens exactos)
- **Nombre**: "Haute Automotive Atelier" — showroom digital de alta costura automotriz.
- **Tipografía**: Bodoni Moda (serif editorial) para headlines, nombres de vehículo y titulares de galería; Manrope (300/400 para cuerpo, 600/700 tracking amplio para labels/badges en mayúsculas).
- **Color**: base carbón obsidiana `#0B0C10`, superficies elevadas `#12141A` / `#181B22`, dorado champán `#C5A059` (primary) y `#E5C158` (hover/secondary) usados con moderación quirúrgica, texto blanco óptico `#F4F5F7`, texto técnico gris `#8E939E`.
- **Geometría**: **radio de borde CERO en absolutamente todo** (botones, cards, inputs, modales, chips). Solo se permite geometría circular en indicadores mecánicos funcionales (dot de estado, spinner).
- **Profundidad**: nada de sombras difusas/glow. La profundidad se logra con capas de superficie, hairlines de 1px (`rgba(255,255,255,0.08)` o `rgba(197,160,89,0.35)` en dorado) y glassmorphism oscuro sutil (blur 20-40px al 80% opacidad) solo en overlays flotantes (nav sticky, drawer del chat IA).
- **Layout**: grid de 12 columnas, márgenes generosos (`4rem` desktop, `1.5rem` mobile), espaciado en múltiplos de 8px, mucho espacio negativo — nada de layouts apretados.
- **Componentes de referencia** (ver `code.html` completo adjunto): navbar sticky con buscador integrado, hero cinematográfico con imagen de fondo + gradiente + métricas de prestigio, panel de búsqueda avanzada tipo "Smart Vehicle Concierge Search" con grid de filtros + chips rápidos, cards de vehículo con "vitrina" de imagen 16:10, matriz de specs tipo ficha técnica con divisores horizontales, drawer de chat IA con borde dorado hairline.

### Adaptación de contenido (importante)
`code.html` está escrito con copy de una marca ficticia de superdeportivos ultra-lujo ("AURA ATELIER", Ferrari/Lamborghini/Bentley, textos en euros). **No copies ese contenido literal.** Usa la MISMA estructura visual, jerarquía, componentes y tokens de diseño, pero con:
- Marca real: **ESCOR**.
- Vehículos reales del catálogo (Toyota, Honda, Ford, marcas de mercado masivo — no superdeportivos), en USD.
- Copys ajustados a un marketplace de vehículos usados accesible, no a un concesionario de coleccionistas milmillonarios.
- Todas las funcionalidades reales existentes deben tener un lugar claro en la nueva UI: búsqueda en lenguaje natural, filtros por tipo/marca/presupuesto/año, comparador de 2 vehículos, ficha de detalle con galería + specs + info legal simulada + botones de descarga de PDF, chat flotante tipo concierge y badges basados en el origen de los datos guardados.

## Stack técnico (mantener)

- React 19 + Vite 5, `lucide-react` para iconos, `jspdf` para PDFs.
- CSS plano con custom properties (`:root` / `[data-theme]`), sin Tailwind (el proyecto no usa Tailwind — si prefieres proponer migrar a Tailwind para implementar `code.html` más fielmente, pregúntamelo primero, es una decisión grande).
- Estructura de archivos actual (no la cambies, solo reescribe el contenido de `src/components/*.jsx` y los `.css`):

```
src/
  components/  (rehacer JSX + estilos)
  services/    (no tocar)
  chat/        (no tocar)
  utils/       (no tocar)
  data/        (no tocar)
  context/     (no tocar)
  App.jsx, App.css, index.css  (App.jsx: puedes reorganizar composición de componentes; App.css/index.css: reescribir)
```

## Entregable

1. Nuevo `src/index.css` con los design tokens exactos como custom properties (colores, tipografía, espaciado, radio=0).
2. Nuevos componentes de presentación en `src/components/` que consuman las mismas props que ya usan (revisa el código actual antes de escribir, para no romper el contrato de datos).
3. `src/App.jsx` reorganizado si hace falta para reflejar las secciones del layout de referencia (header, hero, panel de búsqueda inteligente, catálogo, comparador, footer).
4. Verifica visualmente en un navegador real que el resultado se parece a `screen.png` (adjunto) antes de darlo por terminado — no asumas que compila y se ve bien solo porque no hay errores de build.

## Adjuntos que debes usar como fuente de verdad

- `DESIGN.md` — tokens de color, tipografía, espaciado y reglas de componentes.
- `code.html` — HTML/Tailwind de referencia con la estructura de secciones y clases exactas a imitar (adaptando el copy, no el sistema visual).
- `screen.png` — captura de cómo se ve el resultado final esperado.
