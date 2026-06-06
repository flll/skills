param(
  [string]$Label = "snapshot",
  [string]$OutDir = "$env:USERPROFILE\.openclaw\logs"
)

$ErrorActionPreference = "SilentlyContinue"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outPath = Join-Path $OutDir "process-snapshot-$Label-$stamp.json"

$procs = Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match '^(node|cmd|conhost|powershell|openclaw)' } |
  Select-Object ProcessId, ParentProcessId, Name, CommandLine, CreationDate

$counts = @{
  node = (@(Get-Process -Name node -ErrorAction SilentlyContinue)).Count
  cmd = (@(Get-Process -Name cmd -ErrorAction SilentlyContinue)).Count
  conhost = (@(Get-Process -Name conhost -ErrorAction SilentlyContinue)).Count
}

$payload = @{
  label = $Label
  ts = (Get-Date).ToUniversalTime().ToString("o")
  counts = $counts
  processes = @($procs)
}

$payload | ConvertTo-Json -Depth 6 | Set-Content -Path $outPath -Encoding UTF8
Write-Output $outPath
