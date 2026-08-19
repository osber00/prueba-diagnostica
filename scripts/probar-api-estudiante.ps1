# Prueba de extremo a extremo de la API del estudiante.
# Requiere que `npm run dev` esté corriendo.
#
#   npx wrangler d1 execute prueba-inferencial --local --file scripts/dev-seed-codigos.sql
#   pwsh scripts/probar-api-estudiante.ps1

param(
  [string]$BaseUrl = "http://localhost:5173",
  [string]$Code = "mac test aaaa"   # a propósito en minúsculas y sin guiones
)

$ErrorActionPreference = "Stop"
$fallos = 0

function Check($nombre, $condicion, $detalle = "") {
  if ($condicion) {
    Write-Host "  OK   $nombre" -ForegroundColor Green
  } else {
    Write-Host "  FALLO $nombre  $detalle" -ForegroundColor Red
    $script:fallos++
  }
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "`n[1] Canje del codigo (normalizacion de formato)" -ForegroundColor Cyan
$redeem = Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
  -Body (@{ code = $Code } | ConvertTo-Json) -ContentType "application/json" `
  -WebSession $session
Check "acepta el codigo sin guiones y en minusculas" ($redeem.ok -eq $true)
Check "devuelve el nombre del estudiante" ($redeem.label -eq "Estudiante de prueba 1") "label=$($redeem.label)"
Check "reporta la fase" ($redeem.phase -eq "pretest")

Write-Host "`n[2] Estado del intento" -ForegroundColor Cyan
$state = Invoke-RestMethod -Uri "$BaseUrl/api/attempt" -WebSession $session
Check "entrega 5 textos (4 + calentamiento)" (@($state.texts).Count -eq 5) "count=$(@($state.texts).Count)"
Check "entrega 17 items (16 + calentamiento)" (@($state.questions).Count -eq 17) "count=$(@($state.questions).Count)"
# PowerShell 5.1 no expone .Count de forma fiable cuando un pipeline devuelve
# un solo objeto, por eso cada conteo se envuelve en @( ).
Check "cada item trae 4 opciones" (@($state.questions | Where-Object { @($_.options).Count -ne 4 }).Count -eq 0)
Check "sin respuestas previas" (@($state.answers).Count -eq 0)

Write-Host "`n[3] La clave NO viaja al cliente (control critico)" -ForegroundColor Cyan
$json = $state | ConvertTo-Json -Depth 10
Check "no aparece 'correct'"     (-not ($json -match '(?i)"correct'))
Check "no aparece 'isCorrect'"   (-not ($json -match '(?i)isCorrect'))
Check "no aparece 'rationale'"   (-not ($json -match '(?i)rationale'))
Check "no aparece 'is_scored'"   (-not ($json -match '(?i)is_scored'))
Check "no aparecen letras canonicas" (-not ($json -match '(?i)\"letter\"|selectedOption'))

Write-Host "`n[4] Aleatorizacion de opciones" -ForegroundColor Cyan
$ordenA = ($state.questions | ForEach-Object { ($_.options | ForEach-Object { $_.content }) -join "||" }) -join "|"
$s2 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
  -Body (@{ code = "MAC-TEST-BBBB" } | ConvertTo-Json) -ContentType "application/json" `
  -WebSession $s2 | Out-Null
$state2 = Invoke-RestMethod -Uri "$BaseUrl/api/attempt" -WebSession $s2
$ordenB = ($state2.questions | ForEach-Object { ($_.options | ForEach-Object { $_.content }) -join "||" }) -join "|"
Check "dos estudiantes reciben ordenes distintos" ($ordenA -ne $ordenB)

$state1b = Invoke-RestMethod -Uri "$BaseUrl/api/attempt" -WebSession $session
$ordenA2 = ($state1b.questions | ForEach-Object { ($_.options | ForEach-Object { $_.content }) -join "||" }) -join "|"
Check "el orden es estable al recargar" ($ordenA -eq $ordenA2)

Write-Host "`n[5] Autoguardado" -ForegroundColor Cyan
# Se responde el instrumento completo: los pares se aciertan, los impares se fallan.
$correctas = @{
  1='Porque recibían más sol y el suelo perdía humedad con rapidez.'; 2='Porque la cobertura y el riego ayudaron a conservar mejor la humedad.'
  3='Las plantas del extremo soleado podrían marchitarse antes que las demás.'; 4='El suelo conservaría mejor la humedad y disminuiría el riesgo de marchitez.'
  5='Porque el agua acumulada y el camino deteriorado hicieron más lento el recorrido.'; 6='Porque anticiparon posibles dificultades y salieron de sus casas con mayor tiempo.'
  7='Podrían repetirse acumulaciones de agua y nuevos retrasos durante el recorrido.'; 8='El agua podría evacuar mejor y reducirse su acumulación sobre el camino.'
  9='La participación disminuyó cuando se eliminó el intercambio de ideas en parejas.'; 10='Porque se eliminó el espacio para comparar pistas antes de responder individualmente.'
  11='Cada estudiante formulará primero una idea propia antes de compararla con otra.'; 12='Más estudiantes podrían explicar y justificar sus conclusiones utilizando pistas del texto.'
  13='La lluvia arrastró tierra suelta desde la pendiente hasta el cauce del arroyo.'; 14='Parte de los residuos abandonados fue transportada por el agua hasta el arroyo.'
  15='Disminuiría la cantidad de suelo arrastrado hacia el arroyo durante las lluvias.'; 16='Los plásticos podrían seguir llegando al arroyo y acumulándose en algunos sectores.'
}
$esperado = 0
foreach ($q in ($state.questions | Where-Object { $_.number -ge 1 })) {
  $correcta = $correctas[[int]$q.number]
  if ($q.number % 2 -eq 0) {
    $elegida = $correcta; $esperado++
  } else {
    $elegida = @($q.options | Where-Object { $_.content -ne $correcta })[0].content
  }
  $pos = [array]::IndexOf(($q.options | ForEach-Object { $_.content }), $elegida)
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt/answer" -Method Put `
    -Body (@{ questionId = $q.id; displayedPosition = $pos
              timeSpentMs = 5000; elapsedMs = 60000 } | ConvertTo-Json) `
    -ContentType "application/json" -WebSession $session | Out-Null
}
$state3 = Invoke-RestMethod -Uri "$BaseUrl/api/attempt" -WebSession $session
Check "se guardaron 16 respuestas" (@($state3.answers).Count -eq 16) "count=$(@($state3.answers).Count)"
Check "la respuesta guardada no revela correccion" (-not (($state3 | ConvertTo-Json -Depth 10) -match '(?i)isCorrect'))

Write-Host "`n[6] Idempotencia del autoguardado" -ForegroundColor Cyan
$q1 = $state.questions | Where-Object { $_.number -eq 2 } | Select-Object -First 1
$q1Pos = [array]::IndexOf(($q1.options | ForEach-Object { $_.content }), $correctas[2])
Invoke-RestMethod -Uri "$BaseUrl/api/attempt/answer" -Method Put `
  -Body (@{ questionId = $q1.id; displayedPosition = $q1Pos
            timeSpentMs = 1000; elapsedMs = 61000 } | ConvertTo-Json) `
  -ContentType "application/json" -WebSession $session | Out-Null
$state4 = Invoke-RestMethod -Uri "$BaseUrl/api/attempt" -WebSession $session
Check "reenviar no duplica filas" (@($state4.answers).Count -eq 16) "count=$(@($state4.answers).Count)"

Write-Host "`n[6b] Retroalimentacion exclusiva del calentamiento" -ForegroundColor Cyan
$calentamiento = $state.questions | Where-Object { $_.number -eq 0 } | Select-Object -First 1
$contenidoCalentamiento = 'Porque vio que podía llover y fue a buscar una sombrilla.'
$posCorrecta = [array]::IndexOf(($calentamiento.options | ForEach-Object { $_.content }), $contenidoCalentamiento)
$respCalentamiento = Invoke-RestMethod -Uri "$BaseUrl/api/attempt/answer" -Method Put `
  -Body (@{ questionId = $calentamiento.id; displayedPosition = $posCorrecta
            timeSpentMs = 3000; elapsedMs = 65000 } | ConvertTo-Json) `
  -ContentType "application/json" -WebSession $session
Check "el calentamiento SI incluye feedback" ($null -ne $respCalentamiento.feedback)
Check "el feedback marca la respuesta como correcta" ($respCalentamiento.feedback.isCorrect -eq $true)
Check "el feedback identifica la posicion correcta" ($respCalentamiento.feedback.correctPosition -eq $posCorrecta)

# Se guarda el item 1 como INCORRECTO ('A', no 'B') a propósito: el bucle de
# autoguardado de la sección [5] ya decidió que el item 1 (impar) debía quedar
# incorrecto para que el puntaje final diera 8/16. Si aquí se guardara la
# respuesta correcta, el puntaje total subiría a 9 y rompería la aserción de
# `probar-api-gestor.ps1`, que espera exactamente 8.
$q1Real = $state.questions | Where-Object { $_.number -eq 1 } | Select-Object -First 1
$posIncorrecta = [array]::IndexOf(($q1Real.options | ForEach-Object { $_.content }), @($q1Real.options | Where-Object { $_.content -ne $correctas[1] })[0].content)
$respItemReal = Invoke-RestMethod -Uri "$BaseUrl/api/attempt/answer" -Method Put `
  -Body (@{ questionId = $q1Real.id; displayedPosition = $posIncorrecta
            timeSpentMs = 3000; elapsedMs = 66000 } | ConvertTo-Json) `
  -ContentType "application/json" -WebSession $session
Check "un item calificable NO incluye feedback" ($null -eq $respItemReal.feedback)

Write-Host "`n[7] Envio y calificacion en servidor" -ForegroundColor Cyan
$submit = Invoke-RestMethod -Uri "$BaseUrl/api/attempt/submit" -Method Post `
  -WebSession $session -ContentType "application/json"
Check "el envio responde ok" ($submit.ok -eq $true)
Check "no devuelve el puntaje al estudiante" ($null -eq $submit.score -and $null -eq $submit.scoreTotal)
Write-Host "     puntaje esperado en base de datos: $esperado de 16"

Write-Host "`n[8] Bloqueo de reintento" -ForegroundColor Cyan
$s3 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
    -Body (@{ code = "MAC-TEST-AAAA" } | ConvertTo-Json) -ContentType "application/json" `
    -WebSession $s3 | Out-Null
  Check "un codigo ya usado se rechaza" $false "no devolvio error"
} catch {
  Check "un codigo ya usado se rechaza" ($_.Exception.Response.StatusCode.value__ -eq 409) `
    "status=$($_.Exception.Response.StatusCode.value__)"
}

Write-Host "`n[9] Codigos invalidos" -ForegroundColor Cyan
foreach ($caso in @(
  @{ code = "MAC-TEST-OOOO"; nombre = "rechaza caracteres ambiguos (O)" },
  @{ code = "MAC-NOEXISTE1"; nombre = "rechaza formato incorrecto" }
)) {
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
      -Body (@{ code = $caso.code } | ConvertTo-Json) -ContentType "application/json" `
      -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession) | Out-Null
    Check $caso.nombre $false "acepto el codigo"
  } catch {
    Check $caso.nombre ($_.Exception.Response.StatusCode.value__ -in @(400, 404))
  }
}

Write-Host "`n[10] Acceso sin sesion" -ForegroundColor Cyan
try {
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt" `
    -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession) | Out-Null
  Check "exige sesion iniciada" $false "respondio sin cookie"
} catch {
  Check "exige sesion iniciada" ($_.Exception.Response.StatusCode.value__ -eq 401)
}

Write-Host ""
if ($fallos -eq 0) {
  Write-Host "TODAS LAS COMPROBACIONES PASARON" -ForegroundColor Green
  exit 0
} else {
  Write-Host "$fallos COMPROBACIONES FALLARON" -ForegroundColor Red
  exit 1
}
