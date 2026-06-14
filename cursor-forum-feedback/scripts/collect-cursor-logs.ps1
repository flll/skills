#Requires -Version 5.1
<#
.SYNOPSIS
  Cursor フォーラム投稿用の Windows ログバンドルを収集して zip 化する。
.PARAMETER OutputDir
  出力先。未指定時は ~/brain/forum-drafts または %TEMP%
.PARAMETER MaxFileBytes
  単一ログファイルの最大コピーサイズ(既定 2MB)
#>
param(
  [string]$OutputDir = "",
  [int]$MaxFileBytes = 2097152
)

$ErrorActionPreference = "SilentlyContinue"

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$brainDrafts = Join-Path $env:USERPROFILE "brain\forum-drafts"
if (-not $OutputDir) {
  $OutputDir = if (Test-Path (Split-Path $brainDrafts -Parent)) { $brainDrafts } else { $env:TEMP }
}
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$bundleName = "cursor-forum-bundle-$ts"
$bundleDir = Join-Path $OutputDir $bundleName
$logsOut = Join-Path $bundleDir "logs"
New-Item -ItemType Directory -Force -Path $logsOut | Out-Null

function Get-CursorVersion {
  $paths = @(
    Join-Path $env:LOCALAPPDATA "Programs\cursor\resources\app\bin\cursor.cmd"
    "C:\Program Files\cursor\resources\app\bin\cursor.cmd"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) {
      $v = & $p --version 2>&1
      if ($v) { return ($v -join "`n") }
    }
  }
  $v2 = & cursor --version 2>&1
  if ($v2) { return ($v2 -join "`n") }
  return "unknown"
}

function Get-LatestLogSession {
  $logRoot = Join-Path $env:APPDATA "Cursor\logs"
  if (-not (Test-Path $logRoot)) { return $null }
  Get-ChildItem $logRoot -Directory |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

function Copy-LogTail {
  param([string]$Src, [string]$Dest, [int]$MaxBytes)
  if (-not (Test-Path $Src)) { return }
  $fi = Get-Item $Src
  if ($fi.Length -le $MaxBytes) {
    Copy-Item $Src $Dest -Force
    return
  }
  # 大きいファイル: 末尾 + エラー行
  $lines = Get-Content $Src -Tail 500 -ErrorAction SilentlyContinue
  $errors = Select-String -Path $Src -Pattern "error|oom|-536870904|terminated|crash" -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty Line -Unique
  $out = @("--- tail 500 lines ---") + $lines + @("--- error-related lines ---") + $errors
  $out | Set-Content $Dest -Encoding UTF8
}

# Environment
$cursorVer = Get-CursorVersion
$extList = @()
foreach ($p in @(
  Join-Path $env:LOCALAPPDATA "Programs\cursor\resources\app\bin\cursor.cmd"
  "cursor"
)) {
  try {
    if ($p -eq "cursor") { $extList = & cursor --list-extensions 2>&1 }
    elseif (Test-Path $p) { $extList = & $p --list-extensions 2>&1 }
    if ($extList) { break }
  } catch {}
}

$stateDb = Join-Path $env:APPDATA "Cursor\User\globalStorage\state.vscdb"
$stateSize = if (Test-Path $stateDb) { (Get-Item $stateDb).Length } else { 0 }
$corrupted = Get-ChildItem (Join-Path $env:APPDATA "Cursor\User\globalStorage") -Filter "state.vscdb.corrupted*" -ErrorAction SilentlyContinue

$envText = @"
Collected: $(Get-Date -Format o)
OS: $([System.Environment]::OSVersion.VersionString)
Computer: $env:COMPUTERNAME

Cursor version:
$cursorVer

state.vscdb size bytes: $stateSize
state.vscdb.corrupted files: $($corrupted.Count)
$(if ($corrupted) { ($corrupted | ForEach-Object { "  $($_.Name) $($_.Length) bytes" }) -join "`n" })

Extensions:
$(($extList | ForEach-Object { "  $_" }) -join "`n")
"@
$envText | Set-Content (Join-Path $bundleDir "environment.txt") -Encoding UTF8

# Logs
$session = Get-LatestLogSession
$sessionPath = if ($session) { $session.FullName } else { "none" }
if ($session) {
  Copy-LogTail (Join-Path $session.FullName "main.log") (Join-Path $logsOut "main.log") $MaxFileBytes
  Get-ChildItem $session.FullName -Recurse -File -Include "*.log" -ErrorAction SilentlyContinue |
    ForEach-Object {
      $rel = $_.FullName.Substring($session.FullName.Length).TrimStart("\")
      $dest = Join-Path $logsOut $rel
      New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
      Copy-LogTail $_.FullName $dest $MaxFileBytes
    }
}

$manifest = @{
  collectedAt = (Get-Date -Format o)
  sessionPath = $sessionPath
  stateVscdbBytes = $stateSize
  corruptedCount = $corrupted.Count
  bundleDir = $bundleDir
} | ConvertTo-Json -Depth 3
$manifest | Set-Content (Join-Path $bundleDir "manifest.json") -Encoding UTF8

@"
Cursor Forum Log Bundle
=======================
1. Run redact: node .../redact-logs.mjs "$bundleDir"
2. Attach the .zip to your forum post OR paste log excerpts from logs/main.log
3. Do NOT upload state.vscdb (chat history) — only sizes are in environment.txt
"@ | Set-Content (Join-Path $bundleDir "README.txt") -Encoding UTF8

# Zip
$zipPath = Join-Path $OutputDir "$bundleName.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $bundleDir -DestinationPath $zipPath -Force

Write-Output "BUNDLE_DIR=$bundleDir"
Write-Output "ZIP_PATH=$zipPath"
Write-Output "SESSION=$sessionPath"
