param(
  [string]$Label = "snapshot",
  [string]$Metrics = "node,cmd,conhost",
  [string]$OutDir = "$env:USERPROFILE\.openclaw\logs",
  [string]$ProcessFilter = "",
  [int]$CommandLineLimit = 0
)

$ErrorActionPreference = "SilentlyContinue"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outPath = Join-Path $OutDir "metrics-snapshot-$Label-$stamp.json"

$metricNames = $Metrics -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
$counts = @{}
foreach ($n in $metricNames) {
  $procs = Get-Process -Name $n -ErrorAction SilentlyContinue
  $counts[$n] = @{
    count = @($procs).Count
    workingSetMB = [math]::Round((@($procs | Measure-Object WorkingSet64 -Sum).Sum / 1MB), 1)
  }
}

$processes = @()
if ($ProcessFilter) {
  $filterPattern = $ProcessFilter
} elseif ($metricNames.Count -gt 0) {
  $escaped = $metricNames | ForEach-Object { [regex]::Escape($_) }
  $filterPattern = '^(' + ($escaped -join '|') + ')\.exe$'
} else {
  $filterPattern = ''
}

if ($filterPattern) {
  $procs = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -match $filterPattern } |
    Select-Object -First $(if ($CommandLineLimit -gt 0) { $CommandLineLimit } else { 9999 }) `
      ProcessId, ParentProcessId, Name, CommandLine, CreationDate
  $processes = @($procs)
}

$payload = @{
  label = $Label
  ts = (Get-Date).ToUniversalTime().ToString("o")
  metrics = $metricNames
  counts = $counts
  processes = $processes
}

$payload | ConvertTo-Json -Depth 6 | Set-Content -Path $outPath -Encoding UTF8
Write-Output $outPath
