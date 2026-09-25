param([ValidateSet('Precheck', 'Simular', 'Aplicar')][string]$Modo = 'Precheck')
$ErrorActionPreference = 'Stop'
$taskBackend = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$taskNode = (Get-Command node -ErrorAction Stop).Source
$taskCli = Join-Path $taskBackend 'node_modules/supabase/dist/supabase.js'
if (-not $env:SUPABASE_DB_URL) { throw 'Configure SUPABASE_DB_URL no ambiente, fora do Git.' }
$taskUri = [uri]$env:SUPABASE_DB_URL
if ($taskUri.Host -ne 'aws-1-us-east-2.pooler.supabase.com' -or
    ($taskUri.UserInfo -split ':', 2)[0] -ne 'postgres.lxzhdvhtujqydqndhiec' -or
    $taskUri.AbsolutePath -ne '/postgres' -or $taskUri.Port -ne 5432) {
  throw 'Conexão não corresponde ao projeto/endpoint autorizado.'
}
$taskSecret = [uri]::UnescapeDataString(($taskUri.UserInfo -split ':', 2)[1])
function Invoke-TaskCli([string[]]$Argumentos) {
  # Invocar Node diretamente preserva percent-encoding de senhas no Windows.
  $taskOutput = & $taskNode $taskCli @Argumentos 2>&1
  $taskExit = $LASTEXITCODE
  $taskText = ($taskOutput | Out-String).Replace($env:SUPABASE_DB_URL, '[CONEXAO OCULTA]')
  if ($taskSecret) { $taskText = $taskText.Replace($taskSecret, '[OCULTO]') }
  Write-Host $taskText
  if ($taskExit -ne 0) { throw 'Operação interrompida; consulte a mensagem sanitizada acima.' }
  return $taskText
}
$null = Invoke-TaskCli @('db','query','--db-url',$env:SUPABASE_DB_URL,'--file',(Join-Path $taskBackend 'supabase/prechecks/v2_academico.sql'))
if ($Modo -eq 'Precheck') { exit 0 }

# A cadeia isolada contém o histórico anterior e somente os dois alvos.
# Não move/remove migrations do repositório e não copia credenciais.
$taskTmp = Join-Path ([IO.Path]::GetTempPath()) ('sistema-v2-academico-' + [guid]::NewGuid())
$taskMigrations = Join-Path $taskTmp 'supabase/migrations'
$null = New-Item -ItemType Directory -Path $taskMigrations -Force
Copy-Item -LiteralPath (Join-Path $taskBackend 'supabase/config.toml') -Destination (Join-Path $taskTmp 'supabase/config.toml')
$taskAllowed = @('20260917000200','20260917000300')
foreach ($taskFile in Get-ChildItem (Join-Path $taskBackend 'supabase/migrations') -Filter '*.sql') {
  $taskVersion = $taskFile.BaseName.Split('_')[0]
  if ($taskVersion -le '20260915000100' -or $taskVersion -in $taskAllowed) {
    Copy-Item -LiteralPath $taskFile.FullName -Destination $taskMigrations
  }
}
$taskPlan = Invoke-TaskCli @('--workdir',$taskTmp,'db','push','--db-url',$env:SUPABASE_DB_URL,'--dry-run')
$taskVersions = @([regex]::Matches($taskPlan, '(?<!\d)20\d{12}(?=_|\b)') | ForEach-Object Value | Select-Object -Unique)
if (($taskVersions | Where-Object { $_ -notin $taskAllowed }) -or
    ($taskAllowed | Where-Object { $_ -notin $taskVersions })) {
  throw 'Plano não enumera exclusivamente as duas versões autorizadas; revisar saída antes de aplicar.'
}
if ($Modo -eq 'Simular') { exit 0 }
# Modo Aplicar é explicitamente mutável e pressupõe reset/testes/revisão locais aprovados.
$null = Invoke-TaskCli @('--workdir',$taskTmp,'db','push','--db-url',$env:SUPABASE_DB_URL,'--yes')
$null = Invoke-TaskCli @('db','query','--db-url',$env:SUPABASE_DB_URL,
  "SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('20260917000100','20260917000200','20260917000300') ORDER BY version;")
# Diretório temporário contém somente config pública/SQL, preservado para auditoria.
Write-Host 'Aplicação terminou. Conferir RLS/GRANTs/schema e atualizar documentação antes da UI dependente.'
