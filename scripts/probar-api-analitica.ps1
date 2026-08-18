# Prueba de extremo a extremo de la API de análisis (Fase 6).
#
# Genera un cohorte simulado de estudiantes (pretest y un subconjunto en
# postest, con los mismos nombres para que la comparación pareada funcione),
# responde cada intento con una probabilidad de acierto creciente por
# estudiante (para poblar las 4 bandas de desempeño), y valida:
#   - la forma de `GET /api/admin/analytics` (n, ítems, bandas, KR-20)
#   - que KR-20 coincide con un cálculo manual INDEPENDIENTE hecho en este
#     mismo script (no reutiliza la fórmula del servidor)
#   - `GET /api/admin/analytics/paired`
#
# Requiere que `npm run dev` esté corriendo.
#
#   pwsh scripts/probar-api-analitica.ps1

param(
  [string]$BaseUrl = "http://localhost:5173",
  [string]$MasterCode = "GESTOR-LOCAL-2026",
  [int]$PretestCount = 37,
  [int]$PostestCount = 30
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

# Clave documentada del instrumento (PLAN.md: "BDACCADBBDACCADB"). Se usa
# aquí exactamente como en probar-api-estudiante.ps1: es un script de
# prueba que simula estudiantes, no el cliente real, que nunca la recibe.
$clave = @{ 1='B';2='D';3='A';4='C';5='C';6='A';7='D';8='B';9='B';10='D';11='A';12='C';13='C';14='A';15='D';16='B' }
$opciones = @('A','B','C','D')

function Elegir-Opcion($numero, $acierto) {
  $correcta = $clave[[int]$numero]
  if ($acierto) { return $correcta }
  return ($opciones | Where-Object { $_ -ne $correcta } | Get-Random)
}

# Curva de habilidad: reparte el cohorte entre 25% y 90% de probabilidad de
# acierto según su posición, para que el histograma, la dona de bandas y
# KR-20 tengan variación real en lugar de puntajes idénticos.
function Probabilidad-Acierto($indice, $total) {
  $posicion = $indice / [double]$total
  return 0.25 + ($posicion * 0.65)
}

function Responder-Intento($session, $preguntas, $probabilidad) {
  # `elapsedMs` es el tiempo acumulado desde el inicio del intento (así lo
  # calcula el cliente real), no el tiempo de un solo ítem: debe crecer en
  # cada llamada para que el intento final refleje varios minutos de prueba
  # y el gráfico de dispersión tiempo-puntaje tenga variación real.
  $acumulado = 0
  foreach ($q in ($preguntas | Where-Object { $_.number -ge 1 })) {
    $acierto = (Get-Random -Minimum 0.0 -Maximum 1.0) -lt $probabilidad
    $letra = Elegir-Opcion $q.number $acierto
    $pos = [array]::IndexOf(($q.options | ForEach-Object { $_.letter }), $letra)
    $tiempoItem = Get-Random -Minimum 8000 -Maximum 45000
    $acumulado += $tiempoItem
    Invoke-RestMethod -Uri "$BaseUrl/api/attempt/answer" -Method Put `
      -Body (@{ questionId = $q.id; selectedOption = $letra; displayedPosition = $pos
                timeSpentMs = $tiempoItem; elapsedMs = $acumulado } | ConvertTo-Json) `
      -ContentType "application/json" -WebSession $session | Out-Null
  }
}

Write-Host "`n[1] Login del gestor" -ForegroundColor Cyan
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = Invoke-RestMethod -Uri "$BaseUrl/api/admin/login" -Method Post `
  -Body (@{ code = $MasterCode } | ConvertTo-Json) -ContentType "application/json" -WebSession $s
Check "acepta el codigo maestro" ($login.ok -eq $true)

Write-Host "`n[2] Generacion del cohorte simulado" -ForegroundColor Cyan
$nombresPretest = 1..$PretestCount | ForEach-Object { "Estudiante Demo {0:D2}" -f $_ }
$genPre = Invoke-RestMethod -Uri "$BaseUrl/api/admin/codes" -Method Post -WebSession $s `
  -ContentType "application/json" -Body (@{
    quantity = $PretestCount; phase = "pretest"; labels = $nombresPretest
    notes = "Datos simulados Fase 6"
  } | ConvertTo-Json)
Check "genera el pretest simulado" (@($genPre.codes).Count -eq $PretestCount) "count=$(@($genPre.codes).Count)"

$nombresPostest = 1..$PostestCount | ForEach-Object { "Estudiante Demo {0:D2}" -f $_ }
$genPost = Invoke-RestMethod -Uri "$BaseUrl/api/admin/codes" -Method Post -WebSession $s `
  -ContentType "application/json" -Body (@{
    quantity = $PostestCount; phase = "postest"; labels = $nombresPostest
    notes = "Datos simulados Fase 6"
  } | ConvertTo-Json)
Check "genera el postest simulado" (@($genPost.codes).Count -eq $PostestCount) "count=$(@($genPost.codes).Count)"

Write-Host "`n[3] Aplicando el pretest a $PretestCount estudiantes simulados" -ForegroundColor Cyan
for ($i = 0; $i -lt $genPre.codes.Count; $i++) {
  $sesion = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
    -Body (@{ code = $genPre.codes[$i] } | ConvertTo-Json) -ContentType "application/json" `
    -WebSession $sesion | Out-Null
  $estado = Invoke-RestMethod -Uri "$BaseUrl/api/attempt" -WebSession $sesion
  Responder-Intento $sesion $estado.questions (Probabilidad-Acierto $i $PretestCount)
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt/submit" -Method Post -WebSession $sesion `
    -ContentType "application/json" | Out-Null
}
Check "aplica los $PretestCount intentos de pretest" $true

Write-Host "`n[4] Aplicando el postest a $PostestCount estudiantes (con mejora simulada)" -ForegroundColor Cyan
for ($i = 0; $i -lt $genPost.codes.Count; $i++) {
  $sesion = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
    -Body (@{ code = $genPost.codes[$i] } | ConvertTo-Json) -ContentType "application/json" `
    -WebSession $sesion | Out-Null
  $estado = Invoke-RestMethod -Uri "$BaseUrl/api/attempt" -WebSession $sesion
  # Mejora simulada respecto al pretest, con algo de ruido (no todos mejoran).
  $prob = [Math]::Min(0.95, (Probabilidad-Acierto $i $PostestCount) + 0.12)
  Responder-Intento $sesion $estado.questions $prob
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt/submit" -Method Post -WebSession $sesion `
    -ContentType "application/json" | Out-Null
}
Check "aplica los $PostestCount intentos de postest" $true

Write-Host "`n[5] Endpoint de analitica (pretest)" -ForegroundColor Cyan
$analiticaPre = Invoke-RestMethod -Uri "$BaseUrl/api/admin/analytics?phase=pretest" -WebSession $s
Check "reporta n = $PretestCount" ($analiticaPre.n -eq $PretestCount) "n=$($analiticaPre.n)"
Check "reporta 16 items" (@($analiticaPre.items).Count -eq 16) "count=$(@($analiticaPre.items).Count)"
Check "cada item tiene dificultad entre 0 y 1" `
  (@($analiticaPre.items | Where-Object { $_.difficulty -lt 0 -or $_.difficulty -gt 1 }).Count -eq 0)
Check "cada item con n suficiente reporta discriminacion" `
  (@($analiticaPre.items | Where-Object { $null -eq $_.discrimination }).Count -eq 0)
Check "kr20 no es nulo con n grande" ($null -ne $analiticaPre.kr20) "kr20=$($analiticaPre.kr20)"
Check "las bandas suman el total de estudiantes" `
  (($analiticaPre.bands | Measure-Object -Property count -Sum).Sum -eq $PretestCount)
Check "fullyAnsweredN coincide con n cuando todos respondieron todo" `
  ($analiticaPre.fullyAnsweredN -eq $PretestCount) "fullyAnsweredN=$($analiticaPre.fullyAnsweredN)"

# --- Verificacion independiente de KR-20 (formula recalculada aqui, sin
#     reutilizar el codigo del servidor) ---
$k = @($analiticaPre.items).Count
$puntajes = @($analiticaPre.attempts | ForEach-Object { $_.scoreTotal })
$n = $puntajes.Count
$media = ($puntajes | Measure-Object -Average).Average
$varianza = (($puntajes | ForEach-Object { [Math]::Pow($_ - $media, 2) } | Measure-Object -Sum).Sum) / $n
$sumaPQ = 0.0
foreach ($item in $analiticaPre.items) { $sumaPQ += $item.difficulty * (1 - $item.difficulty) }
$kr20Manual = ($k / ($k - 1)) * (1 - ($sumaPQ / $varianza))
$diferencia = [Math]::Abs($kr20Manual - $analiticaPre.kr20)
Check "KR-20 coincide con el calculo manual independiente" ($diferencia -lt 0.0001) `
  "servidor=$($analiticaPre.kr20) manual=$kr20Manual diff=$diferencia"

Write-Host "`n[6] Endpoint de analitica (postest)" -ForegroundColor Cyan
$analiticaPost = Invoke-RestMethod -Uri "$BaseUrl/api/admin/analytics?phase=postest" -WebSession $s
Check "reporta n = $PostestCount" ($analiticaPost.n -eq $PostestCount) "n=$($analiticaPost.n)"

Write-Host "`n[7] Comparacion pareada" -ForegroundColor Cyan
$pareado = Invoke-RestMethod -Uri "$BaseUrl/api/admin/analytics/paired" -WebSession $s
Check "aparea los $PostestCount estudiantes con pretest y postest" `
  (@($pareado.pairs).Count -eq $PostestCount) "count=$(@($pareado.pairs).Count)"
Check "no reporta nombres ambiguos (todos los nombres simulados son unicos)" `
  (@($pareado.ambiguousLabels).Count -eq 0) "count=$(@($pareado.ambiguousLabels).Count)"

Write-Host ""
if ($fallos -eq 0) {
  Write-Host "TODAS LAS COMPROBACIONES PASARON" -ForegroundColor Green
  exit 0
} else {
  Write-Host "$fallos COMPROBACIONES FALLARON" -ForegroundColor Red
  exit 1
}
