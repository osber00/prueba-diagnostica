# Postest implementado — fuente y comprobaciones

## Instrumento autorizado

La fuente es **`docs/POSTEST-INFERENCIAL-MACAJAN.pdf`**, de seis páginas,
revisado por el equipo investigador. No se utiliza la propuesta anterior
`postest-para-revision.docx` / `postest-para-revision.pdf`.

Los textos y los 16 enunciados se conservan. Solo se normalizaron espacios,
cortes artificiales de palabras al extraer el PDF y la separación en párrafos.
Las alternativas tienen ajustes de extensión que mantienen el sentido de
la opción y su posición canónica. El PDF original no se modifica.

| Fase | Versión para nuevos intentos | Textos |
|---|---:|---|
| Pretest | 2 | Tanque, generador, caminos y mangos |
| Postest | 3 | Corrales, maíz, portátiles y filtro de agua |

La migración `0004_postest_inferencial_macajan.sql` solo inserta el postest.
No actualiza ni elimina instrumentos anteriores, códigos, intentos o respuestas.
El ejemplo de práctica se conserva, duplicado como ítem no calificable.
Se utiliza una ilustración genérica de lectura, sin pistas sobre las respuestas.

## Extensión y clave — uso del investigador

El PDF no contiene una clave explícita. La siguiente clave se ha establecido
contrastando las alternativas con las evidencias de cada texto. Las
justificaciones quedan registradas en la migración, exclusivamente en el servidor.

| Ítem | Inferencia | Clave | Palabras por alternativa | Alternativas ajustadas |
|---|---|:---:|---:|---|
| 1 | Causal | B | 16 | A, D |
| 2 | Causal | D | 16 | A, B, C, D |
| 3 | Predictiva | C | 16 | A |
| 4 | Predictiva | A | 16 | A, B |
| 5 | Causal | C | 17 | A, C, D |
| 6 | Causal | A | 17 | B, C, D |
| 7 | Predictiva | D | 16 | A, C, D |
| 8 | Predictiva | B | 16 | A, B, C |
| 9 | Causal | D | 17 | A, B, C |
| 10 | Causal | B | 18 | A, C, D |
| 11 | Predictiva | A | 17 | A, B, D |
| 12 | Predictiva | C | 17 | A, B, D |
| 13 | Causal | A | 17 | C, D |
| 14 | Causal | C | 16 | B, D |
| 15 | Predictiva | B | 17 | D |
| 16 | Predictiva | D | 18 | A, B, D |

Clave: `BDCACADBDBACACBD` (cuatro A, cuatro B, cuatro C y cuatro D).
El conteo excluye las letras A–D y toma como palabra cada unidad separada por
espacios. La igualdad se comprueba por ítem, no entre ítems distintos.
Las opciones siguen barajándose por intento y la clave no viaja al estudiante.

## Operación del postest

1. Publicar la migración y el código antes de entregar los códigos a estudiantes.
2. Comprobar `/api/health`: pretest v2 y postest v3, ambos con 16 ítems.
3. En **Códigos**, generar un lote nuevo de fase **Postest**, con los mismos nombres
   usados en el pretest. Los códigos postest aún sin usar también reciben v3 al canjearse.
4. **No reiniciar códigos del pretest:** el reinicio elimina el intento y sus respuestas.
5. Si un código ya había iniciado el antiguo postest v2, se pide uno nuevo;
   sus datos se conservan. No se sustituye su contenido silenciosamente.
6. Los 45 minutos son una duración **estimada**, sin cierre automático.
7. El servidor exige las 16 respuestas antes de aceptar el envío.

La psicometría se calcula separadamente: pretest v2 y postest v3. Los postests
antiguos v2 no se mezclan con el revisado; el endpoint general de resultados
conserva el acceso a intentos históricos. La comparación pareada usa nombres no
ambiguos y puntajes totales y por dimensión; no equipara preguntas por su número.
La misma estructura no demuestra por sí sola equivalencia de dificultad.

## Verificación

```powershell
npm test
npm run build
npx wrangler d1 execute prueba-inferencial --local --file scripts/validar-instrumento.sql
npx wrangler d1 execute prueba-inferencial --local --file scripts/validar-postest.sql
```

Las pruebas utilizan una D1 efímera con Miniflare, no la base local ni producción.
Verifican conservación de datos, fidelidad al PDF, longitud de alternativas,
clave, asignación por fase, reanudación, privacidad, rechazo de respuestas
cruzadas, envío completo, puntajes y comparación v2–v3.

SHA-256 del PDF de referencia:
`dc69fbda9b893cda95b08b40dc94ada8f3fe3a7c176a3e417f9fee4f705df418`.

## Publicación segura

Con una cuenta autorizada para Workers y D1, respaldar fuera del repositorio,
aplicar la migración y después publicar:

```powershell
# Renovar antes la autenticación si falta el permiso d1:write:
npx wrangler login
# El respaldo contiene datos: no subirlo a Git.
npx wrangler d1 export prueba-inferencial --remote --output "$env:TEMP\macajan-antes-postest.sql"
npm run db:migrate:remote
npm run deploy
$consulta = ((Get-Content scripts/validar-postest.sql) | Where-Object { $_ -notmatch '^\s*--' }) -join ' '
npx wrangler d1 execute prueba-inferencial --remote --command $consulta --json
```

No ejecutar `dev-reset-*` ni suites que siembran datos simulados contra producción.
Si las comprobaciones fallan, no iniciar la prueba con estudiantes hasta resolverlo.

## Publicación verificada

Publicado el **11 de noviembre de 2026**, aplicación **0.4.0**.
Identificador de versión del Worker: `930bb2c9-e79f-4d98-bffe-d1592b363596`.

- Producción: <https://prueba-inferencial-macajan.osber00.workers.dev>.
- Panel: <https://prueba-inferencial-macajan.osber00.workers.dev/gestor>.
- `/api/health` confirma pretest v2 y postest v3, con 16 ítems cada uno.
- La validación remota confirma 8 causales, 8 predictivas y todos los campos
  `err_*` en cero, incluido el control de extensión.
- Los instrumentos anteriores, códigos, intentos y respuestas de pretest se
  compararon fila por fila contra el respaldo previo: sin cambios.
- El respaldo y la comprobación privada se guardaron fuera del repositorio.
- No se generaron intentos simulados en producción ni se alteró la información
  del grupo para verificar el despliegue.

Para la aplicación, generar códigos de fase **Postest** con los mismos nombres
del pretest. No reiniciar los códigos anteriores.
