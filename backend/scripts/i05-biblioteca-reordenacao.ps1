param([ValidateSet('Precheck', 'Simular', 'Aplicar')][string]$Modo = 'Precheck')

$ErrorActionPreference = 'Stop'
$taskBackend = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$taskNode = (Get-Command node -ErrorAction Stop).Source
$taskCli = Join-Path $taskBackend 'node_modules/supabase/dist/supabase.js'
$taskTarget = '20260917000100'

if (-not $env:SUPABASE_DB_URL) { throw 'Configure SUPABASE_DB_URL no ambiente, fora do Git.' }
$taskUri = [uri]$env:SUPABASE_DB_URL
if ($taskUri.Host -ne 'aws-1-us-east-2.pooler.supabase.com' -or
    ($taskUri.UserInfo -split ':', 2)[0] -ne 'postgres.lxzhdvhtujqydqndhiec' -or
    $taskUri.AbsolutePath -ne '/postgres' -or $taskUri.Port -ne 5432) {
  throw 'Conexão não corresponde ao projeto/endpoint autorizado.'
}
$taskSecret = [uri]::UnescapeDataString(($taskUri.UserInfo -split ':', 2)[1])
function Invoke-TaskCli([string[]]$Argumentos) {
  $taskOutput = & $taskNode $taskCli @Argumentos 2>&1
  $taskExit = $LASTEXITCODE
  $taskText = ($taskOutput | Out-String).Replace($env:SUPABASE_DB_URL, '[CONEXAO OCULTA]')
  if ($taskSecret) { $taskText = $taskText.Replace($taskSecret, '[OCULTO]') }
  Write-Host $taskText
  if ($taskExit -ne 0) { throw 'Operação interrompida; consulte a mensagem sanitizada acima.' }
  return $taskText
}

$null = Invoke-TaskCli @('db', 'query', '--db-url', $env:SUPABASE_DB_URL, '--file', (Join-Path $taskBackend 'supabase/prechecks/i05_biblioteca_reordenacao_precheck.sql'))
if ($Modo -eq 'Precheck') { exit 0 }

# A cópia temporária traz a cadeia completa; o plano deve conter exclusivamente I05.
$taskTmp = Join-Path ([IO.Path]::GetTempPath()) ('sistema-i05-' + [guid]::NewGuid())
$taskMigrations = Join-Path $taskTmp 'supabase/migrations'
$null = New-Item -ItemType Directory -Path $taskMigrations -Force
Copy-Item -LiteralPath (Join-Path $taskBackend 'supabase/config.toml') -Destination (Join-Path $taskTmp 'supabase/config.toml')
Copy-Item -Path (Join-Path $taskBackend 'supabase/migrations/*') -Destination $taskMigrations
$taskPlan = Invoke-TaskCli @('--workdir', $taskTmp, 'db', 'push', '--db-url', $env:SUPABASE_DB_URL, '--include-all', '--dry-run')
$taskVersions = @([regex]::Matches($taskPlan, '(?<!\d)20\d{12}(?=_|\b)') | ForEach-Object Value | Select-Object -Unique)
if ($taskVersions.Count -ne 1 -or $taskVersions[0] -ne $taskTarget) {
  throw 'Plano não enumera exclusivamente 20260917000100; não aplicar.'
}
if ($Modo -eq 'Simular') { exit 0 }

$null = Invoke-TaskCli @('--workdir', $taskTmp, 'db', 'push', '--db-url', $env:SUPABASE_DB_URL, '--include-all', '--yes')
$null = Invoke-TaskCli @('db', 'query', '--db-url', $env:SUPABASE_DB_URL, '--file', (Join-Path $taskBackend 'supabase/prechecks/i05_biblioteca_reordenacao_postcheck.sql'))
Write-Host 'I05 aplicada. Ainda é obrigatório conferir o dry-run final antes de atualizar a documentação.'
