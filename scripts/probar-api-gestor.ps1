# Prueba de extremo a extremo de la API del panel gestor.
# Requiere que `npm run dev` esté corriendo y .dev.vars cargado.
#
#   pwsh scripts/probar-api-gestor.ps1

param(
  [string]$BaseUrl = "http://localhost:5173",
  [string]$MasterCode = "GESTOR-LOCAL-2026"
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

function StatusDe($err) { return $err.Exception.Response.StatusCode.value__ }

Write-Host "`n[1] Proteccion de rutas" -ForegroundColor Cyan
foreach ($ruta in @("/api/admin/codes", "/api/admin/results", "/api/admin/live", "/api/admin/me")) {
  try {
    Invoke-RestMethod -Uri "$BaseUrl$ruta" `
      -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession) | Out-Null
    Check "$ruta exige sesion" $false "respondio sin cookie"
  } catch { Check "$ruta exige sesion" ((StatusDe $_) -eq 401) "status=$(StatusDe $_)" }
}

Write-Host "`n[2] Login" -ForegroundColor Cyan
try {
  Invoke-RestMethod -Uri "$BaseUrl/api/admin/login" -Method Post `
    -Body (@{ code = "codigo-equivocado-largo" } | ConvertTo-Json) -ContentType "application/json" `
    -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession) | Out-Null
  Check "rechaza codigo incorrecto" $false "acepto el codigo"
} catch { Check "rechaza codigo incorrecto" ((StatusDe $_) -eq 401) "status=$(StatusDe $_)" }

$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = Invoke-RestMethod -Uri "$BaseUrl/api/admin/login" -Method Post `
  -Body (@{ code = $MasterCode } | ConvertTo-Json) -ContentType "application/json" -WebSession $s
Check "acepta el codigo maestro" ($login.ok -eq $true)

$me = Invoke-RestMethod -Uri "$BaseUrl/api/admin/me" -WebSession $s
Check "la sesion queda activa" ($me.ok -eq $true)

$adminFrenado = $false
for ($i = 0; $i -lt 10; $i++) {
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/admin/login" -Method Post `
      -Headers @{ "cf-connecting-ip" = "198.51.100.20" } `
      -Body (@{ code = "CODIGO-INCORRECTO" } | ConvertTo-Json) -ContentType "application/json" `
      -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession) | Out-Null
  } catch { if ((StatusDe $_) -eq 429) { $adminFrenado = $true; break } }
}
Check "frena la fuerza bruta contra el gestor" $adminFrenado

Write-Host "`n[3] Generacion de codigos" -ForegroundColor Cyan
$gen = Invoke-RestMethod -Uri "$BaseUrl/api/admin/codes" -Method Post -WebSession $s `
  -ContentType "application/json" -Body (@{
    quantity = 37; phase = "pretest"
    labels = @("Ana Gomez", "Luis Perez", "Maria Diaz")
    notes = "Aplicacion piloto noveno 1"
  } | ConvertTo-Json)
# PowerShell 5.1 no expone .Count de forma fiable cuando un pipeline devuelve
# un solo objeto, por eso cada conteo se envuelve en @( ).
Check "genera 37 codigos" (@($gen.codes).Count -eq 37) "count=$(@($gen.codes).Count)"
Check "todos son unicos" (@($gen.codes | Select-Object -Unique).Count -eq 37)
Check "respetan el formato MAC-XXXX-XXXX" (@($gen.codes | Where-Object { $_ -notmatch '^MAC-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$' }).Count -eq 0)
Check "sin caracteres ambiguos (O,0,I,1,L)" (@($gen.codes | Where-Object { $_.Substring(4) -match '[O0I1L]' }).Count -eq 0)
Check "devuelve identificador de lote" ($null -ne $gen.batchId)

Write-Host "`n[4] Listado y asignacion de nombres" -ForegroundColor Cyan
$lista = Invoke-RestMethod -Uri "$BaseUrl/api/admin/codes?phase=pretest" -WebSession $s
$delLote = @($lista.codes | Where-Object { $_.batch_id -eq $gen.batchId })
Check "lista los 37 del lote" ($delLote.Count -eq 37) "count=$($delLote.Count)"
Check "asigna los nombres dados" (@($delLote | Where-Object { $_.label -eq "Ana Gomez" }).Count -eq 1) "count=$(@($delLote | Where-Object { $_.label -eq 'Ana Gomez' }).Count)"
Check "deja sin nombre los demas" (@($delLote | Where-Object { $null -eq $_.label }).Count -eq 34)
Check "filtra por fase" (@($lista.codes | Where-Object { $_.phase -ne "pretest" }).Count -eq 0)

Write-Host "`n[5] Monitor en vivo" -ForegroundColor Cyan
$live = Invoke-RestMethod -Uri "$BaseUrl/api/admin/live" -WebSession $s
Check "responde con hora del servidor" ($null -ne $live.serverTime)
Check "muestra el intento en curso de la prueba anterior" (@($live.attempts | Where-Object { $_.code -eq "MAC-TEST-BBBB" }).Count -eq 1) "attempts=$(@($live.attempts | ForEach-Object { $_.code }) -join ',')"

Write-Host "`n[6] Resultados" -ForegroundColor Cyan
$res = Invoke-RestMethod -Uri "$BaseUrl/api/admin/results" -WebSession $s
$completado = $res.results | Where-Object { $_.code -eq "MAC-TEST-AAAA" } | Select-Object -First 1
Check "incluye el intento completado" ($null -ne $completado)
Check "reporta puntaje total 8" ($completado.score_total -eq 8) "valor=$($completado.score_total)"
Check "reporta causal 4"        ($completado.score_causal -eq 4) "valor=$($completado.score_causal)"
Check "reporta predictiva 4"    ($completado.score_predictive -eq 4) "valor=$($completado.score_predictive)"
Check "cuenta 16 items respondidos" ($completado.answered -eq 16) "valor=$($completado.answered)"
Check "excluye los intentos en curso" (@($res.results | Where-Object { $_.status -ne "completed" }).Count -eq 0)

Write-Host "`n[7] Anular y reiniciar" -ForegroundColor Cyan
$objetivo = $delLote | Select-Object -First 1
$sesionConsultaAnulada = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$sesionRespuestaAnulada = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$sesionEnvioAnulada = New-Object Microsoft.PowerShell.Commands.WebRequestSession
foreach ($sesionAnulada in @($sesionConsultaAnulada, $sesionRespuestaAnulada, $sesionEnvioAnulada)) {
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
    -Body (@{ code = $objetivo.code } | ConvertTo-Json) -ContentType "application/json" `
    -WebSession $sesionAnulada | Out-Null
}
$estadoAntesDeAnular = Invoke-RestMethod -Uri "$BaseUrl/api/attempt" -WebSession $sesionConsultaAnulada
$preguntaAnulada = $estadoAntesDeAnular.questions | Where-Object { $_.number -eq 1 } | Select-Object -First 1

Invoke-RestMethod -Uri "$BaseUrl/api/admin/codes/$($objetivo.id)/revoke" -Method Post -WebSession $s | Out-Null
$lista2 = Invoke-RestMethod -Uri "$BaseUrl/api/admin/codes" -WebSession $s
$anulado = $lista2.codes | Where-Object { $_.id -eq $objetivo.id } | Select-Object -First 1
Check "el codigo queda anulado" ($anulado.status -eq "revoked") "status=$($anulado.status)"
Check "el intento activo queda abandonado" ($anulado.attempt_status -eq "abandoned") "status=$($anulado.attempt_status)"

try {
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt" -WebSession $sesionConsultaAnulada | Out-Null
  Check "la sesion anulada no puede consultar el intento" $false "respondio con la sesion vigente"
} catch { Check "la sesion anulada no puede consultar el intento" ((StatusDe $_) -eq 403) "status=$(StatusDe $_)" }

try {
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt/answer" -Method Put `
    -Body (@{ questionId = $preguntaAnulada.id; displayedPosition = 0
              timeSpentMs = 1000; elapsedMs = 1000 } | ConvertTo-Json) `
    -ContentType "application/json" -WebSession $sesionRespuestaAnulada | Out-Null
  Check "la sesion anulada no puede guardar respuestas" $false "guardo una respuesta"
} catch { Check "la sesion anulada no puede guardar respuestas" ((StatusDe $_) -eq 403) "status=$(StatusDe $_)" }

try {
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt/submit" -Method Post `
    -ContentType "application/json" -WebSession $sesionEnvioAnulada | Out-Null
  Check "la sesion anulada no puede enviar la prueba" $false "envio la prueba"
} catch { Check "la sesion anulada no puede enviar la prueba" ((StatusDe $_) -eq 403) "status=$(StatusDe $_)" }

try {
  Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
    -Body (@{ code = $objetivo.code } | ConvertTo-Json) -ContentType "application/json" `
    -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession) | Out-Null
  Check "un codigo anulado no permite entrar" $false "acepto el canje"
} catch { Check "un codigo anulado no permite entrar" ((StatusDe $_) -eq 403) "status=$(StatusDe $_)" }

$usado = $lista2.codes | Where-Object { $_.code -eq "MAC-TEST-AAAA" } | Select-Object -First 1
Invoke-RestMethod -Uri "$BaseUrl/api/admin/codes/$($usado.id)/reset" -Method Post -WebSession $s | Out-Null
$lista3 = Invoke-RestMethod -Uri "$BaseUrl/api/admin/codes" -WebSession $s
$reiniciado = $lista3.codes | Where-Object { $_.code -eq "MAC-TEST-AAAA" } | Select-Object -First 1
Check "reiniciar devuelve el codigo a activo" ($reiniciado.status -eq "active") "status=$($reiniciado.status)"
Check "reiniciar borra el intento" ($null -eq $reiniciado.attempt_id)

$s4 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$rehecho = Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
  -Body (@{ code = "MAC-TEST-AAAA" } | ConvertTo-Json) -ContentType "application/json" -WebSession $s4
Check "el estudiante puede volver a entrar" ($rehecho.ok -eq $true)

Write-Host "`n[8] Red compartida: 25 estudiantes desde la misma IP" -ForegroundColor Cyan
# Regresion del escenario real: en la I.E. Macajan todo el grupo se conecta por
# la misma linea, asi que Cloudflare ve una unica IP para los 37 estudiantes.
# Ningun canje legitimo debe devolver 429.
$activos = @($delLote | Where-Object { $_.status -eq "active" } | Select-Object -First 25)
$bloqueados = 0
foreach ($cod in $activos) {
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
      -Body (@{ code = $cod.code } | ConvertTo-Json) -ContentType "application/json" `
      -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession) | Out-Null
  } catch { if ((StatusDe $_) -eq 429) { $bloqueados++ } }
}
Check "los 25 entran sin bloqueo por limite de IP" ($bloqueados -eq 0) "bloqueados=$bloqueados"

# En cambio, un ataque de fuerza bruta (codigos inexistentes) si debe frenarse.
$frenado = $false
for ($i = 0; $i -lt 40; $i++) {
  $azar = -join (1..8 | ForEach-Object { "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[(Get-Random -Max 31)] })
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/attempt/redeem" -Method Post `
      -Headers @{ "cf-connecting-ip" = "198.51.100.77" } `
      -Body (@{ code = "MAC-$($azar.Substring(0,4))-$($azar.Substring(4,4))" } | ConvertTo-Json) `
      -ContentType "application/json" `
      -WebSession (New-Object Microsoft.PowerShell.Commands.WebRequestSession) | Out-Null
  } catch { if ((StatusDe $_) -eq 429) { $frenado = $true; break } }
}
Check "la fuerza bruta si se bloquea" $frenado

Write-Host "`n[9] Cierre de sesion" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$BaseUrl/api/admin/logout" -Method Post -WebSession $s | Out-Null
try {
  Invoke-RestMethod -Uri "$BaseUrl/api/admin/me" -WebSession $s | Out-Null
  Check "la sesion queda invalidada" $false "siguio respondiendo"
} catch { Check "la sesion queda invalidada" ((StatusDe $_) -eq 401) "status=$(StatusDe $_)" }

Write-Host ""
if ($fallos -eq 0) {
  Write-Host "TODAS LAS COMPROBACIONES PASARON" -ForegroundColor Green
  exit 0
} else {
  Write-Host "$fallos COMPROBACIONES FALLARON" -ForegroundColor Red
  exit 1
}
