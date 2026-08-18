# Plan de ejecución — Prueba diagnóstica de comprensión lectora inferencial

**Institución Educativa Macaján · Grado noveno 1 · n = 37 · Edades 14-17**

Aplicación web para diagnosticar comprensión lectora inferencial (causal y predictiva)
mediante 16 ítems de selección múltiple con única respuesta, distribuidos en 4 textos.

---

## Estado global

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Scaffolding y configuración | ✅ Completada |
| 1 | Base de datos y seed del instrumento | ✅ Completada |
| 2 | API del Worker | ✅ Completada |
| 3 | Design system y recursos visuales | ✅ Completada |
| 4 | Flujo del estudiante | ✅ Completada |
| 5 | Panel gestor | ✅ Completada |
| 6 | Análisis, gráficos y exportación | ✅ Completada |
| 7 | Despliegue y documentación | ⬜ Pendiente |

Leyenda: ⬜ Pendiente · 🟡 En curso · ✅ Completada

---

## Decisiones cerradas

| Decisión | Elección |
|---|---|
| Clave de respuestas | B,D,A,C / C,A,D,B / B,D,A,C / C,A,D,B |
| Patrón de la clave | Aleatorizar orden de opciones por estudiante |
| Identificación | Anónima: el código representa al estudiante (nombre solo en el gestor) |
| Retroalimentación | Ninguna durante la prueba; sin puntaje al finalizar |
| Fases | `pretest` / `postest` desde el inicio |
| Stack | Vite + React + Hono + D1 sobre un único Worker |
| Tiempo | Cronómetro visible, sin corte automático |
| Conectividad | Autoguardado inmediato + cola offline + reanudación |

---

## Fase 0 — Scaffolding y configuración ✅

Objetivo: proyecto ejecutable en local con Worker, SPA y estilos operativos.

- [x] `package.json` con scripts (`dev`, `build`, `deploy`, `db:*`, `typecheck`)
- [x] `wrangler.jsonc` con assets SPA, binding `DB` y observabilidad
- [x] `vite.config.ts` con `@cloudflare/vite-plugin` + React + Tailwind v4
- [x] `tsconfig` para cliente y worker (modo estricto reforzado)
- [x] Tailwind v4 con `@theme` (paleta y tipografía propias de Macaján)
- [x] Worker Hono mínimo con `GET /api/health`
- [x] Shell de React con router y carga diferida del gestor
- [x] `.gitignore` y `.dev.vars.example`

**Verificación cumplida:** `npm run dev` levanta la app; `/api/health` responde
`200` con `{"status":"ok","database":"sin migrar","items":0}`. `tsc -b` sin errores.

> Nota: el Worker distingue correctamente entre «sin migrar» y «no disponible»,
> lo que confirma que el binding `DB` está activo antes de existir las tablas.

---

## Fase 1 — Base de datos y seed del instrumento ✅

Objetivo: instrumento completo en D1, con la clave fuera del bundle del cliente.

- [x] Migración `0001_schema.sql` (9 tablas + índices)
- [x] Migración `0002_seed_instrumento.sql`: 4 textos, 16 ítems, 64 opciones, clave
- [x] Ítem de calentamiento no calificado (`number = 0`, `is_scored = 0`)
- [x] Capa de acceso a datos tipada (`worker/lib/db.ts`)
- [x] Tipos y esquemas Zod compartidos (`shared/types.ts`, `shared/schemas.ts`)
- [x] Script de control de integridad (`scripts/validar-instrumento.sql`)

**Verificación cumplida:**

| Control | Resultado |
|---|---|
| Ítems calificables | 16 |
| Causales / Predictivas | 8 / 8 |
| Textos | 4 |
| Opciones totales | 68 (64 + 4 de calentamiento) |
| Ítems sin 4 opciones | 0 |
| Claves sin opción existente | 0 |
| Opciones duplicadas | 0 |
| Textos sin 4 ítems | 0 |
| **Clave concatenada** | **`BDACCADBBDACCADB`** ✔ coincide |

`/api/health` responde `{"database":"conectada","items":16}`.

> Hallazgo: D1 limita el número de términos en un `SELECT` compuesto. El script
> de validación usa subconsultas escalares en lugar de `UNION ALL` encadenado.
>
> Registrado en la migración: el ítem 11 lleva una nota `rationale` marcada como
> REVISAR, para vigilar su índice de discriminación en la Fase 6.

---

## Fase 2 — API del Worker ✅

Objetivo: backend completo, con calificación exclusivamente en el servidor.

- [x] Sesiones firmadas con HMAC-SHA256 (WebCrypto, sin dependencias)
- [x] Generación de códigos legibles `MAC-XXXX-XXXX` (alfabeto sin ambigüedades)
- [x] Barajado determinista de opciones por semilla de intento
- [x] `POST /api/attempt/redeem` — canje de código e inicio o reanudación
- [x] `GET /api/attempt` — estado, textos, ítems (sin la clave)
- [x] `PUT /api/attempt/answer` — autoguardado idempotente (UPSERT)
- [x] `POST /api/attempt/submit` — cierre y calificación
- [x] `POST /api/attempt/logout` — salir sin enviar (móviles compartidos)
- [x] Gestor: login, sesión revocable, códigos, anular, reiniciar, monitor, resultados
- [x] Límite de intentos de canje
- [x] Registro de auditoría
- [x] Suites automatizadas (`scripts/probar-api-*.ps1`)

**Verificación cumplida: 46 comprobaciones en verde.**

| Suite | Comprobaciones | Resultado |
|---|---|---|
| `probar-api-estudiante.ps1` | 20 | ✅ |
| `probar-api-gestor.ps1` | 26 | ✅ |

Controles destacados:

- La clave **no viaja al cliente**: se verifica que la respuesta de
  `GET /api/attempt` no contenga `correct`, `isCorrect`, `rationale` ni `is_scored`.
- Dos estudiantes reciben **órdenes de opción distintos**; el orden es **estable**
  al recargar.
- Calificación en servidor validada: 8/16 total, 4 causales, 4 predictivas.
- Reenviar una respuesta **no duplica filas** ni infla el conteo.
- Transiciones de estado: `active → in_use → used`, y `revoked` bloquea el acceso.

> ### Fallo grave detectado y corregido
>
> El límite de canjes contaba **todos** los intentos por IP. En la I.E. Macaján
> los 37 estudiantes se conectan por la misma línea, así que Cloudflare habría
> visto **una sola IP para todo el grupo**: a partir del estudiante número 11 la
> prueba se habría bloqueado en plena aplicación.
>
> Corrección: solo se contabilizan los canjes **fallidos**, y un canje exitoso
> limpia el contador. La fuerza bruta se sigue frenando porque genera fallos.
> Cubierto por la prueba de regresión «25 estudiantes desde la misma IP».

> Nota: PowerShell 5.1 no expone `.Count` de forma fiable cuando un pipeline
> devuelve un solo objeto. Los scripts envuelven cada conteo en `@( )`.

---

## Fase 3 — Design system y recursos visuales ✅

Objetivo: identidad visual propia, optimizada para móvil rural. Se adopta el
**patrón de interacción** de apps de aprendizaje gamificadas (tarjetas grandes,
progreso segmentado, botones con relieve) pero con **paleta, mascota e
ilustraciones originales**, no una copia visual de ninguna aplicación existente.

- [x] Fuente Nunito Variable auto-alojada
- [x] `Button` con sombra inferior sólida y efecto de hundido
- [x] `OptionCard` con área táctil ≥ 44 px y altura mínima 64 px
- [x] `ProgressBar` segmentada por texto
- [x] `Sheet` (bottom-sheet) para releer el texto
- [x] Mascota SVG propia (tucán) con estados: saludando, animando, celebrando
- [x] 4 ilustraciones SVG originales (huerta, transporte, lectura, arroyo) + calentamiento
- [x] Animaciones CSS con `prefers-reduced-motion`
- [x] Accesibilidad: `radiogroup`, teclado, contraste AA
- [x] Vitrina temporal (`/_preview`) para revisión visual antes de integrar al flujo

**Identidad "Macaján"** — paleta propia, sin relación con la de otras apps:

| Token | Uso | Referencia |
|---|---|---|
| `terracota` | Acción primaria | camino de tierra, adobe |
| `rio` | Selección / información | el arroyo, la lluvia (textos 2 y 4) |
| `cosecha` | Acento / logros | el sol, los cultivos (texto 1) |
| `ciruela` | Categoría secundaria (gráficos) | fruta silvestre de la región |
| `follaje` | Verde natural en ilustraciones | vegetación, distinto del verde-lima genérico |
| `alerta` | Error | rojo terroso, no un rojo semáforo puro |

**Mascota:** un tucán (`Tucan.tsx`), no un búho — ave del territorio rural
colombiano, con pico multicolor propio (terracota + cosecha + río).

**Verificación cumplida:**

- Revisión visual en viewport 375 px vía Chrome DevTools, captura en
  `scripts/preview-mobile-v2.png`.
- Consola sin errores (favicon corregido; único 404 previo).
- Bottom-sheet probado de forma interactiva: backdrop, animación, scroll interno.
- **Regresión del backend confirmada tras el cambio de paleta**: las 46
  comprobaciones de las Fases 1-2 se re-ejecutaron sin fallos, ya que el
  rediseño solo tocó `src/client`.

> ### Corrección de rumbo
>
> La primera versión reutilizaba, sin darme cuenta, la paleta de colores y los
> nombres de token (`grass`, `sky-blue`, `honey`, `tangerine`) de una conocida
> app de aprendizaje de idiomas, además de una mascota búho. El usuario lo
> señaló a tiempo. Se conservó el **patrón de interacción** (que es genérico:
> tarjetas grandes, progreso segmentado, botones con relieve) pero se
> reconstruyó toda la capa visual: paleta, tokens, mascota e ilustraciones.

---

## Fase 4 — Flujo del estudiante ✅

Objetivo: experiencia completa de la prueba, resistente a cortes de red.

- [x] Pantalla de bienvenida con entrada de código autoformateada
- [x] Confirmación con nombre e instrucciones
- [x] Ítem de calentamiento guiado, con retroalimentación exclusiva de ese ítem
- [x] Pantalla de lectura por texto (ilustración + cuerpo)
- [x] Pantalla de pregunta con acceso permanente al texto (bottom-sheet)
- [x] Navegación libre adelante/atrás, sin forzar respuesta para avanzar
- [x] Cronómetro visible sin corte
- [x] `useAutosave` + `useOfflineQueue` con reintento y backoff exponencial
- [x] Reanudación tras cierre del navegador o pérdida de señal
- [x] Pantalla de revisión (grid de 16 con estado) con aviso de pendientes
- [x] Confirmación de envío y pantalla de celebración, sin puntaje

**Verificación cumplida — prueba de extremo a extremo real en Chrome**, no simulada:

| Escenario | Resultado |
|---|---|
| Canje de código, instrucciones, calentamiento con retroalimentación | ✅ Capturado en `scripts/e2e-01` a `e2e-04` |
| Las 16 preguntas de los 4 textos respondidas según la clave | ✅ Puntaje final en BD: 16/16 (8 causal, 8 predictiva) |
| Navegación libre hacia atrás conserva la selección previa | ✅ Capturado en `e2e-07-back-nav-persists.png` |
| "Ver el texto" (bottom-sheet) desde una pregunta | ✅ Capturado en `e2e-08-sheet-from-question.png` |
| Revisión con 1 ítem pendiente → aviso → completar → enviar | ✅ Capturado en `e2e-09` a `e2e-11` |
| **Reanudación tras recarga real de página** (no solo simulada) | ✅ Vuelve exactamente a la lectura del texto con la pregunta pendiente; BD confirma las 6 respuestas previas intactas |
| **Resiliencia offline real** (Chrome DevTools, red desconectada) | ✅ Respuesta seleccionada sin conexión: queda en `localStorage`, NO llega al servidor (0 filas). Al reconectar, se envía sola y aparece en BD |
| Retroalimentación del calentamiento nunca aparece en ítems reales | ✅ Verificado por captura y por prueba automatizada |
| Regresión del backend tras los cambios de la Fase 4 | ✅ 46 + 4 = **50 comprobaciones automatizadas en verde** |
| Build de producción | ✅ `npm run build` exitoso; bundle del estudiante: **84.9 KB gzip** (objetivo: < 120 KB) |

> ### Bug real encontrado y corregido durante la prueba (no un artefacto de test)
>
> El campo de código insertaba guiones automáticamente mientras el estudiante
> escribía. Al recalcular el valor completo en cada tecla, el navegador
> intentaba preservar la posición relativa del cursor, y el guión insertado
> lo desplazaba: el siguiente carácter terminaba insertándose en medio del
> código en lugar de al final (`MAC-4F7K` podía convertirse en algo como
> `MAC-4FK7`). Se aisló la causa disparando eventos de forma controlada
> (`scripts` de `evaluate_script`), confirmando que la lógica de formato era
> correcta y el problema era puramente de posición del cursor. Corregido
> fijando el cursor al final del valor con `useLayoutEffect` (que corre de
> forma síncrona tras el commit del DOM, a diferencia de
> `requestAnimationFrame`). Se agregó además un botón para borrar el campo
> por si el teclado del estudiante hiciera algo inesperado.

> ### Ampliación necesaria del contrato de la API (Fase 2 → Fase 4)
>
> Se añadió `attempt.id` a `GET /api/attempt` (namespacing de la cola de
> autoguardado en localStorage por intento, para que un dispositivo
> compartido entre estudiantes no mezcle datos de dos intentos) y un campo
> `feedback` opcional a `PUT /api/attempt/answer`, presente únicamente cuando
> la pregunta es el ítem de calentamiento (`is_scored = 0`). Ninguno de los
> dos compromete la regla de que la clave no sale del servidor para los 16
> ítems reales; ambos cambios están cubiertos por pruebas automatizadas.

**Diseño de reanudación:** al recargar, el sistema no regresa a la pregunta
exacta sino a la pantalla de **lectura** del texto que contiene la primera
pregunta sin responder. Es una decisión deliberada: garantiza que el
estudiante siempre vea de nuevo el texto antes de continuar, en lugar de
enfrentarse a una pregunta fuera de contexto tras una interrupción.

---

## Fase 5 — Panel gestor ✅

Objetivo: control de acceso y supervisión de la aplicación.

- [x] Login con código maestro
- [x] Generación de códigos por lotes (cantidad, fase, nombres)
- [x] Tabla de códigos con estado, revocación y reinicio de intento
- [x] Hoja imprimible de códigos para repartir en clase
- [x] Monitor en vivo (quién responde, en qué ítem, cuánto lleva)
- [x] Cierre de sesión y expiración a 8 horas

**Verificación cumplida:**

| Escenario | Resultado |
|---|---|
| Login, cierre de sesión y nuevo acceso | ✅ Verificado en Chrome |
| Generación de lote con nombres y cantidad derivada | ✅ 3 códigos de control y lote automatizado de 37 |
| Filtros pretest/postest y estados vacíos | ✅ Verificado en Chrome |
| Hoja imprimible | ✅ DOM con códigos/nombres correcto y una llamada a `window.print()` |
| Anulación de código | ✅ El estado cambia a «Anulado» y desaparece la acción |
| Reinicio de intento | ✅ Borra el intento, devuelve el código a «Sin usar» e invalida la sesión anterior |
| Monitor en vivo | ✅ Muestra estudiante, código, fase, progreso, tiempo y última actividad |
| Responsive | ✅ 320, 768 y 1440 px sin desbordamiento global |
| Accesibilidad móvil | ✅ Lighthouse 100/100, sin auditorías fallidas |
| Consola del navegador | ✅ Sin errores ni advertencias |
| Regresión API | ✅ 26 + 36 = **62 comprobaciones automatizadas** |
| Build de producción | ✅ Gestor 5,48 KB gzip; estudiante 85,23 KB gzip |

Evidencias visuales en `scripts/admin-05-mobile-codigos-320.png`,
`scripts/admin-06-tablet-codigos.png` y `scripts/admin-07-desktop-codigos.png`.
Reportes accesibles en `scripts/lighthouse-admin-mobile-fixed/` y
`scripts/lighthouse-admin-monitor-mobile/`.

> ### Bugs detectados y corregidos durante la verificación
>
> Los enlaces del menú se resolvían de forma relativa y producían rutas como
> `/gestor/codigos/monitor`. Se cambiaron a rutas absolutas. La hoja imprimible
> estaba dentro de un ancestro `print:hidden`, por lo que nunca podía aparecer
> en papel. Además, un guard con `useRef` cancelaba la impresión durante el
> doble montaje de `StrictMode`. La hoja quedó como hermana del contenido de
> pantalla y el efecto ahora se reejecuta correctamente tras el montaje de
> desarrollo. La hoja también se desmonta al cerrar el diálogo, de modo que el
> mismo lote puede imprimirse repetidamente sin recargar la página.
>
> Lighthouse detectó etiquetas de formulario no asociadas y contrastes por
> debajo de AA. Se conectaron todos los `label` con sus controles, los filtros
> exponen `aria-pressed` y nombres de grupo, y se oscurecieron únicamente los
> usos de color necesarios. La puntuación pasó de 83 a 100.
>
> La revisión final encontró que anular un código con un intento activo no
> invalidaba la cookie del estudiante: todavía podía consultar, autoguardar y
> enviar. La anulación ahora marca esos intentos como `abandoned` y las tres
> rutas rechazan sus sesiones; los intentos completados se conservan para el
> análisis. Se añadieron cuatro comprobaciones de regresión. El monitor también
> descarta respuestas antiguas cuando coinciden una actualización manual y el
> sondeo automático.

---

## Fase 6 — Análisis, gráficos y exportación ✅

Objetivo: material directo para el capítulo de resultados de la investigación.

- [x] Tabla de resultados ordenable y filtrable por fase
- [x] Barras: comparación causal vs predictiva
- [x] Barras horizontales: dificultad por ítem
- [x] Histograma de puntajes (0-16)
- [x] Barras apiladas: análisis de distractores
- [x] Dona: niveles de desempeño (Bajo / Básico / Satisfactorio / Avanzado)
- [x] Dispersión: tiempo empleado vs puntaje
- [x] Comparación pareada pretest-postest
- [x] Psicometría: índice de dificultad (p), discriminación (D), KR-20
- [x] Advertencia explícita sobre n pequeño en las métricas psicométricas
- [x] Exportación CSV ancho, CSV largo (SPSS/R) y JSON
- [x] Carga diferida de Recharts (el estudiante nunca lo descarga)

**Diseño:**

- `GET /api/admin/analytics?phase=` resuelve en una sola llamada (dos
  consultas D1 en paralelo, agregadas en memoria) todo lo que necesitan la
  tabla, los gráficos y las exportaciones: intentos completados con su
  detalle de respuestas, estadística por ítem, KR-20 y bandas de desempeño.
  `GET /api/admin/analytics/paired` resuelve el apareo pretest-postest por
  nombre, sin filtro de fase.
- La discriminación usa el método clásico de grupos extremos (27 % superior
  menos 27 % inferior por puntaje total; requiere n ≥ 8).
- El cálculo psicométrico (dificultad, discriminación, KR-20) se restringe a
  los intentos que respondieron los 16 ítems (supresión por lista): un envío
  puede completarse sin responder todo, y mezclar poblaciones distintas
  sesgaría los índices. La interfaz muestra cuántos intentos quedaron
  excluidos cuando corresponde.
- `Charts.tsx` se importa con `React.lazy` desde `ResultsPage.tsx`; Vite lo
  separa en un chunk `charts-*.js` propio (Recharts + d3), que solo se
  descarga al abrir la pestaña Resultados. El bundle del estudiante no
  cambió de tamaño.
- Las exportaciones (CSV ancho, CSV largo, JSON) se generan en el cliente a
  partir de la misma respuesta de `/analytics`, sin otra llamada al Worker.

**Verificación cumplida:**

| Escenario | Resultado |
|---|---|
| Tabla ordenable (6 columnas) y filtro pretest/postest | ✅ Verificado en Chrome |
| 7 gráficos (barras, horizontal, histograma, apiladas, dona, dispersión, pareado) | ✅ Renderizan con datos reales; capturas en `scripts/resultados-*.png` |
| Tabla psicométrica por ítem con p, D y distractores | ✅ Marca automáticamente ítems con discriminación débil (< 0.20) |
| KR-20 validado contra cálculo manual **independiente** | ✅ Recalculado en `scripts/probar-api-analitica.ps1` a partir de los mismos datos crudos; diferencia < 0.0001 |
| Cohorte simulado | ✅ 37 estudiantes en pretest + 30 (subconjunto) en postest, aplicados vía la API real de estudiante, no INSERT directos |
| Exportación CSV ancho | ✅ 1 fila por estudiante, 1 columna por ítem; verificado byte a byte (30 filas = n) |
| Exportación CSV largo (SPSS/R) | ✅ 1 fila por respuesta; verificado (480 filas = 30 × 16) |
| Exportación JSON | ✅ JSON válido con la respuesta completa de analítica |
| Carga diferida de Recharts | ✅ Chunk `charts-*.js` (122 KB gzip) separado del admin y del estudiante |
| Responsive | ✅ 320 y 1440 px sin desbordamiento |
| Accesibilidad móvil | ✅ Lighthouse 100/100 en accesibilidad, buenas prácticas, SEO y navegación agéntica |
| Consola del navegador | ✅ Sin errores ni advertencias |
| Regresión API completa | ✅ 26 (estudiante) + 36 (gestor) + 17 (analítica) = **79 comprobaciones automatizadas** |
| Build de producción | ✅ Sin errores; bundle del estudiante sin cambios (85,23 KB gzip) |

Evidencia en `scripts/resultados-01-desktop.png`, `resultados-02-tiempos-reales.png`,
`resultados-03-mobile-320.png` y `scripts/lighthouse-resultados-final/`.

> ### Bug real corregido durante la simulación de datos (no un artefacto de la prueba)
>
> El script de siembra (`probar-api-analitica.ps1`) enviaba en `elapsedMs`
> el tiempo de **cada ítem** en vez del tiempo **acumulado** del intento. El
> servidor guarda `elapsed_ms = MAX(elapsed_ms, elapsedMs recibido)`, así que
> el intento completo terminaba registrando solo el tiempo del último ítem
> (~40 segundos en total para 16 preguntas), y el gráfico de dispersión
> tiempo-puntaje quedaba comprimido sin variación real. Se corrigió
> acumulando el tiempo entre respuestas, igual que hace el cliente real.
>
> ### Hallazgos de la revisión de código independiente, corregidos antes de cerrar la fase
>
> Una revisión con un agente en un contexto nuevo (sin memoria de cómo se
> escribió el código) encontró cinco problemas reales, todos corregidos:
>
> 1. **Inyección de fórmulas en CSV (alto).** Un nombre de estudiante que
>    empezara por `=`, `+`, `-` o `@` se exportaba tal cual; Excel/Sheets lo
>    interpretaría como fórmula al abrir el archivo. `csvEscape` ahora
>    antepone un apóstrofo a esos valores, igual que hace Google Sheets al
>    importar.
> 2. **Mezcla de poblaciones en KR-20 (medio).** Ver "Diseño" arriba: ahora
>    se filtra a intentos con los 16 ítems respondidos y se expone
>    `fullyAnsweredN` para que la interfaz lo transparente.
> 3. **Apareo por nombre duplicado (medio).** Dos estudiantes con el mismo
>    nombre en la misma fase se aparaban con el primero encontrado sin
>    avisar. Ahora esos nombres se excluyen de `pairs` y se listan en
>    `ambiguousLabels`, visible como advertencia en el panel.
> 4. **Llamada redundante (bajo).** El apareo pretest-postest no depende de
>    la fase seleccionada, pero se volvía a pedir en cada cambio de pestaña.
>    Ahora se carga una sola vez, en un efecto separado.
> 5. **Gráficos sin nombre accesible (bajo).** Los `<svg>` de Recharts no
>    tienen semántica propia. Cada tarjeta de gráfico ahora expone
>    `role="img"` con `aria-label` igual a su título.
>
> ### Bug de infraestructura preexistente, encontrado y corregido de raíz
>
> El script `npm run typecheck` forzaba `tsc -b --noEmit false
> --emitDeclarationOnly false`. Como ninguna configuración de TypeScript del
> proyecto define `outDir`, cada ejecución compilaba un `.js` junto a **cada**
> archivo `.ts`/`.tsx` del repositorio (más de 50 archivos contaminados
> desde fases anteriores). Al reiniciar el servidor de desarrollo después de
> borrar esos archivos, el Worker dejó de arrancar
> (`Failed to load url /src/shared/schemas.js`): confirma que Vite estaba
> resolviendo esos módulos hacia el `.js` compilado y desactualizado en
> lugar del `.ts` fuente, con el resolutor de extensiones por defecto de
> Vite (que prioriza `.js` sobre `.ts`). No causó un fallo visible hasta ese
> momento porque los `.js` seguían sincronizados con el código fuente, pero
> era un riesgo latente real, no hipotético: un cambio futuro podía dejar de
> tener efecto en el navegador sin ningún error. Corregido: `typecheck`
> ahora es simplemente `tsc -b` (idéntico al paso de chequeo de tipos que ya
> usa `npm run build` con éxito), se borraron los `.js` sobrantes, y se
> confirmó que la orden corregida ya no emite nada.

**Verificación:** datos simulados de 37 estudiantes; KR-20 validado contra cálculo manual.

---

## Fase 7 — Despliegue y documentación ⬜

Objetivo: aplicación en producción y guía reproducible.

- [x] `README.md` con guía paso a paso
- [ ] Creación de la base D1 y aplicación de migraciones remotas
- [ ] Configuración de secrets (`ADMIN_MASTER_CODE`, `SESSION_SECRET`)
- [ ] Despliegue del Worker
- [ ] Prueba real desde datos móviles
- [x] Protocolo de aplicación para el docente

**Verificación:** un estudiante completa la prueba desde un móvil con datos móviles
y el resultado aparece en el panel.

---

## Datos necesarios para el despliegue

### Requeridos

| # | Dato | Cómo obtenerlo |
|---|---|---|
| 1 | Cuenta de Cloudflare | `dash.cloudflare.com/sign-up` — gratis, sin tarjeta |
| 2 | Account ID | Dashboard → Workers & Pages → columna derecha (32 caracteres hex) |
| 3 | Subdominio workers.dev | Se elige una sola vez por cuenta |
| 4 | Nombre del Worker | Sugerido: `prueba-inferencial-macajan` |
| 5 | Código maestro del gestor | Lo define el investigador; se guarda como secret |

### Generados durante el despliegue

```bash
npx wrangler login
npx wrangler d1 create prueba-inferencial          # devuelve database_id
npx wrangler d1 migrations apply prueba-inferencial --remote
npx wrangler secret put ADMIN_MASTER_CODE
npx wrangler secret put SESSION_SECRET
npx wrangler deploy
```

### Opcionales

- **API Token** para CI/CD — permisos `Workers Scripts:Edit`, `D1:Edit`,
  `Account Settings:Read`.
- **Dominio propio** — requiere que el dominio esté administrado en Cloudflare.

---

## Consumo estimado frente al plan gratuito

| Recurso | Límite diario | Uso estimado (37 estudiantes) |
|---|---|---|
| Peticiones Worker | 100.000 | ~2.000 |
| Escrituras D1 | 100.000 filas | ~700 |
| Lecturas D1 | 5.000.000 filas | ~15.000 |
| Almacenamiento D1 | 5 GB | < 1 MB |
| Assets estáticos | ilimitado | — |

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Patrón regular de la clave (B-D-A-C) | Aleatorización de opciones por estudiante |
| Conectividad rural intermitente | Autoguardado, cola offline y reanudación |
| Códigos compartidos | Un código = un intento; monitor en vivo |
| Muestra pequeña (n=37) | Advertencia explícita en las métricas psicométricas |
| Ítem 11 débil | Se mide su discriminación real para decidir con datos |

---

## Registro de avance

| Fase | Nota |
|---|---|
| 0 | Andamiaje verificado. `/api/health` responde y el binding D1 funciona. |
| 1 | Instrumento sembrado. Clave `BDACCADBBDACCADB` confirmada por consulta. |
| 2 | Backend completo. 46 comprobaciones automatizadas en verde. Corregido el bloqueo por IP compartida. |
| 3 | Identidad visual propia (paleta Macaján + mascota tucán) tras corregir un parecido no intencional con otra app. Backend re-verificado sin regresiones. |
| 4 | Flujo del estudiante completo, probado de extremo a extremo en navegador real: reanudación tras recarga y resiliencia offline verificadas con la red realmente desconectada, no simuladas. Corregido un bug real de cursor en el campo de código. 50 comprobaciones automatizadas en verde. Build de producción: 84.9 KB gzip. |
| 5 | Panel gestor completo y probado en navegador real: generación, impresión, filtros, anulación, reinicio, monitor y logout. Responsive 320/768/1440 px; Lighthouse móvil 100/100 en códigos y monitor. Corregidas rutas relativas, impresión bajo StrictMode, accesibilidad, sesiones anuladas y carrera de actualización del monitor. 62 comprobaciones API en verde. |
| 6 | Análisis completo: tabla ordenable, 7 gráficos (Recharts en chunk diferido, el estudiante no lo descarga), psicometría por ítem (p, D, KR-20 con supresión por lista), apareo pretest-postest con detección de nombres ambiguos y exportación CSV ancho/largo/JSON verificada byte a byte. KR-20 validado contra cálculo manual independiente sobre un cohorte simulado de 37+30 estudiantes aplicado vía la API real. 79 comprobaciones automatizadas en verde. Corregidos de raíz: `typecheck` emitía `.js` en `src/` que Vite resolvía por encima de las fuentes; inyección de fórmulas en CSV; tiempos acumulados del seed. Lighthouse móvil 100/100 en resultados. |
