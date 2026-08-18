# Prueba diagnóstica de comprensión lectora inferencial

**Institución Educativa Macaján · Grado noveno 1 · n = 37 · Edades 14-17**

Aplicación web para diagnosticar comprensión lectora inferencial (causal y
predictiva) mediante 16 ítems de selección múltiple distribuidos en 4 textos,
con fases pretest y postest, pensada para aplicarse en aula con conectividad
rural intermitente y para producir directamente el material del capítulo de
resultados de la investigación (tablas, gráficos, psicometría y exportación a
SPSS/R).

- **Estudiantes:** entran con un código impreso (`MAC-XXXX-XXXX`), responden
  en el móvil, pueden perder señal o cerrar el navegador y continuar después;
  nunca ven puntajes ni retroalimentación (salvo en el ítem de calentamiento).
- **Docente/investigador:** panel gestor para generar e imprimir códigos,
  monitor en vivo durante la aplicación, y resultados con análisis psicométrico
  (dificultad, discriminación, KR-20) y exportación CSV/JSON.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Vite 7 + React 19 + TypeScript + Tailwind CSS v4 |
| Backend | Hono sobre Cloudflare Workers (un solo Worker sirve API y SPA) |
| Base de datos | Cloudflare D1 (SQLite) |
| Gráficos | Recharts 3 (solo en el panel gestor, con carga diferida) |
| Costo | $0 — todo dentro del plan gratuito de Cloudflare |

## Estructura del proyecto

```
prueba-diagnostica/
├── migrations/              # Esquema D1 y seed del instrumento (4 textos, 16 ítems)
├── src/
│   ├── client/              # SPA (estudiante + panel gestor)
│   │   ├── routes/student/  # Flujo de la prueba
│   │   ├── routes/admin/    # Panel gestor (códigos, monitor, resultados)
│   │   └── lib/             # Clientes HTTP, CSV, utilidades
│   ├── worker/              # API Hono (sesiones HMAC, calificación, analítica)
│   └── shared/              # Tipos y esquemas Zod compartidos
├── scripts/                 # Suites de regresión y utilidades de datos
└── PLAN.md                  # Plan de ejecución con verificaciones por fase
```

## Desarrollo local

Requisitos: Node.js 20.19+ (o 22.12+) y npm.

```bash
npm install

# 1. Variables de entorno locales (la plantilla ya trae valores de desarrollo)
cp .dev.vars.example .dev.vars        # Windows: copy .dev.vars.example .dev.vars

# 2. Base de datos local (crea tablas y siembra el instrumento)
npm run db:migrate:local

# 3. (Opcional) Códigos de prueba MAC-TEST-AAAA/BBBB/CCCC
npx wrangler d1 execute prueba-inferencial --local --file scripts/dev-seed-codigos.sql

# 4. Servidor de desarrollo → http://localhost:5173
npm run dev
```

Puntos de entrada en local:

| Ruta | Qué es |
|---|---|
| `/` | Flujo del estudiante (con los códigos sembrados: `MAC-TEST-AAAA`, etc.) |
| `/gestor` | Panel gestor (código maestro local: `GESTOR-LOCAL-2026`) |
| `/api/health` | Sonda: estado de la base y conteo de ítems |

### Verificación automatizada

Tres suites PowerShell cubren la API de extremo a extremo
(79 comprobaciones en total). Requieren el servidor de desarrollo corriendo:

```bash
# Datos base requeridos por las dos primeras suites
npx wrangler d1 execute prueba-inferencial --local --file scripts/dev-reset-todo.sql
npx wrangler d1 execute prueba-inferencial --local --file scripts/dev-seed-codigos.sql

powershell -NoProfile -ExecutionPolicy Bypass -File scripts/probar-api-estudiante.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/probar-api-gestor.ps1

# Analítica: siembra un cohorte simulado de 37 + 30 estudiantes y valida
# KR-20 contra un cálculo manual independiente (tarda varios minutos)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/probar-api-analitica.ps1
```

Utilidades de datos locales:

```bash
# Vaciar todos los datos de prueba (conserva el instrumento: 16 ítems, 5 textos)
npx wrangler d1 execute prueba-inferencial --local --file scripts/dev-reset-todo.sql

# Validar la integridad del instrumento sembrado (16 ítems, clave, opciones)
npx wrangler d1 execute prueba-inferencial --local --file scripts/validar-instrumento.sql
```

Comprobaciones de código:

```bash
npm run typecheck    # tsc -b, sin emitir archivos
npm run build        # typecheck + build de producción (Worker + SPA)
```

## Despliegue en Cloudflare (gratis)

Una sola vez, en una terminal con esta carpeta como directorio de trabajo:

```bash
# 1. Autenticarse (abre el navegador para el OAuth de Cloudflare)
npx wrangler login

# 2. Crear la base de datos remota. La salida muestra el `database_id`:
npx wrangler d1 create prueba-inferencial
```

Edita `wrangler.jsonc` y reemplaza el valor provisional:

```jsonc
"database_id": "REEMPLAZAR_TRAS_EJECUTAR_wrangler_d1_create",
```

por el `database_id` real devuelto en el paso anterior. Después:

```bash
# 3. Aplicar el esquema y sembrar el instrumento en la base remota
npx wrangler d1 migrations apply prueba-inferencial --remote

# 4. Cargar los secretos (cada comando pide el valor por teclado)
#    ADMIN_MASTER_CODE: el código que usarás para entrar al panel gestor.
#    SESSION_SECRET: cadena aleatoria de 32+ bytes para firmar sesiones.
npx wrangler secret put ADMIN_MASTER_CODE
npx wrangler secret put SESSION_SECRET
#    Sugerencia para SESSION_SECRET:
#    node -e "console.log(crypto.randomUUID() + crypto.randomUUID())"

# 5. Compilar y desplegar
npm run deploy
```

La aplicación queda en
`https://prueba-inferencial-macajan.<tu-subdominio>.workers.dev`.

Verificación posterior al despliegue:

```bash
curl https://prueba-inferencial-macajan.<tu-subdominio>.workers.dev/api/health
# → {"status":"ok","database":"conectada","items":16,...}
```

### Consumo frente al plan gratuito

| Recurso | Límite diario | Uso estimado (37 estudiantes) |
|---|---|---|
| Peticiones Worker | 100.000 | ~2.000 |
| Escrituras D1 | 100.000 filas | ~700 |
| Lecturas D1 | 5.000.000 filas | ~15.000 |
| Almacenamiento D1 | 5 GB | < 1 MB |

## Protocolo de aplicación para el docente

### Antes de la sesión (10 minutos)

1. Entra a `https://<tu-worker>.workers.dev/gestor` con el código maestro.
2. En la pestaña **Códigos**:
   - Fase: **Pretest**.
   - Pega los nombres de los 37 estudiantes, **uno por línea**, con la
     ortografía exacta que volverás a usar en el postest (la comparación
     pareada pretest-postest se hace por nombre; dos estudiantes con el
     mismo nombre quedan excluidos del apareo y el panel lo advierte).
   - La cantidad se deriva sola de los nombres. Pulsa **Generar**.
3. Pulsa **Imprimir esta hoja**: obtienes una hoja con una tarjeta por
   estudiante (nombre + código). Recórtala y reparte una tarjeta a cada uno.

> Consejo: si quieres ensayar el panel antes de la aplicación real, ejecuta
> en local `scripts/probar-api-analitica.ps1` — siembra 37 estudiantes
> simulados con resultados completos para revisar todos los gráficos.

### Durante la sesión

1. Cada estudiante abre la URL del Worker en su móvil y escribe su código
   (no importan mayúsculas ni los guiones).
2. La prueba: instrucciones → un ítem de ejemplo con retroalimentación →
   4 textos con 4 preguntas cada uno → revisión → envío.
   - Puede volver a leer cada texto en cualquier momento.
   - Puede avanzar, retroceder y cambiar respuestas antes de enviar.
   - No hay límite de tiempo; el cronómetro solo registra.
3. **Si se cae la señal o se cierra el navegador:** las respuestas quedan
   guardadas; al reabrir la URL y volver a escribir el mismo código, el
   estudiante continúa donde quedó (en la lectura del texto pendiente).
4. Supervisa desde la pestaña **Monitor en vivo**: quién está respondiendo,
   cuántas preguntas lleva, cuánto tiempo y su última actividad
   (se actualiza solo cada 10 segundos).

### Casos especiales

| Situación | Acción en el panel |
|---|---|
| Un estudiante envió por accidente o hubo un problema técnico | Códigos → **Reiniciar**: borra sus respuestas y puede empezar de nuevo con el mismo código |
| Un código se compartió o se filtró | Códigos → **Anular**: bloquea el código y, si estaba en curso, abandona el intento |
| Estudiante sin código | Genera un lote nuevo con su nombre e imprime solo esa tarjeta |

### Después de la sesión

1. Pestaña **Resultados** → fase **Pretest**:
   - Tabla ordenable con puntaje total, causal, predictiva, tiempo y
     respondidos por estudiante.
   - **Psicometría por ítem**: dificultad (p), discriminación (D) y
     distribución de distractores. Los ítems con D < 0.20 se marcan como
     débiles. KR-20 del instrumento con su interpretación.
   - Gráficos: causal vs. predictiva, dificultad por ítem, histograma de
     puntajes, distractores, niveles de desempeño, tiempo vs. puntaje.
   - **Exportar**: CSV ancho (1 fila por estudiante, ideal para KR-20/alfa
     en SPSS), CSV largo (1 fila por respuesta, ideal para R) o JSON.
2. Para el **postest** (semanas después, según el diseño de la
   investigación): repite el proceso generando códigos de fase **Postest**
   con **exactamente los mismos nombres**. El gráfico de comparación
   pareada pretest-postest aparecerá automáticamente en Resultados.

> **Advertencia metodológica que muestra el propio panel:** con n = 37 los
> índices psicométricos (p, D, KR-20) son inestables y solo ilustrativos;
> úsalos como evidencia complementaria, no como propiedades definitivas del
> instrumento. La comparación pretest-postest con este tamaño de muestra
> admite estadística descriptiva y pruebas no paramétricas (p. ej. Wilcoxon),
> calculables en SPSS/R a partir del CSV largo exportado.

## Privacidad y seguridad

- **Anonimato hacia el estudiante:** el código es su única identidad; el
  nombre solo existe en el panel gestor y en la hoja impresa.
- **La clave de respuestas nunca sale del servidor:** la calificación ocurre
  en el Worker; el cliente jamás recibe la opción correcta de los 16 ítems
  (verificado por pruebas automatizadas).
- **Sesiones firmadas (HMAC-SHA256)** con expiración: 8 horas en el gestor;
  la del estudiante queda ligada a su intento.
- **Protección anti fuerza bruta:** solo los canjes fallidos consumen cuota
  (un aula entera compartiendo la misma IP del colegio no se bloquea).
- **Sin puntaje ni retroalimentación** al terminar: es una prueba
  diagnóstica, no un juego.

## Licencia y uso

Material de investigación educativa de la I.E. Macaján. Uso libre con fines
pedagógicos citando la fuente.
