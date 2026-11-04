param(
  [Parameter(Mandatory = $true)]
  [string] $DatabaseUrl
)

$ErrorActionPreference = 'Stop'
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) { throw 'psql belum tersedia. Tidak ada instalasi otomatis dilakukan.' }

$uri = [Uri]$DatabaseUrl
if ($uri.Scheme -notin @('postgres', 'postgresql') -or $uri.Host -notin @('localhost', '127.0.0.1', '::1')) {
  throw 'Ditolak: runner hanya menerima URL PostgreSQL localhost/loopback; jangan arahkan ke Supabase.'
}
if ($uri.AbsolutePath.Trim('/') -ne 'jala_mutu_rpc_test') {
  throw 'Ditolak: nama database mesti tepat jala_mutu_rpc_test.'
}

$root = Split-Path -Parent $PSScriptRoot
$runScript = Join-Path $PSScriptRoot 'survei-rpc-isolated.run.sql'

Write-Host 'Target dibatasi ke loopback lokal. Fixture membuat skema subset dan data sintetis.'
$serverAddress = & $psql.Source $DatabaseUrl --no-password --tuples-only --no-align --command "select coalesce(inet_server_addr()::text, '')"
if ($LASTEXITCODE -ne 0) { throw 'Tidak dapat memverifikasi alamat server PostgreSQL.' }
try { $ip = [System.Net.IPAddress]::Parse(([string]$serverAddress).Trim()) }
catch { throw 'Alamat server tidak dapat diverifikasi sebagai alamat loopback.' }
if (-not [System.Net.IPAddress]::IsLoopback($ip)) { throw 'Ditolak: server PostgreSQL tidak melaporkan alamat loopback.' }

& $psql.Source $DatabaseUrl --set ON_ERROR_STOP=1 --file $runScript
if ($LASTEXITCODE -ne 0) { throw "Fixture, kompilasi proposal, atau assertion RPC gagal (psql exit $LASTEXITCODE)." }

Write-Host 'Selesai: seluruh skrip hanya diarahkan ke database loopback.'
