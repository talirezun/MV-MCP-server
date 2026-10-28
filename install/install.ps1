# MV Travel MCP installer (Windows PowerShell).
#   irm https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/install/install.ps1 | iex
# Pass options through $env:MV_TRAVEL_ARGS, e.g.  $env:MV_TRAVEL_ARGS = '--yes'
# The API key can be given as $env:MV_TRAVEL_API_KEY (or entered at the prompt).
# (or run the downloaded file directly:  .\install.ps1 --key XXX)
# Everything lives in a function so a truncated download cannot run half a script.

function Install-MvTravel {
  param([string[]]$PassThru)
  $ErrorActionPreference = 'Stop'
  # Windows PowerShell 5.1 may default to old TLS versions.
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

  $base = if ($env:MV_TRAVEL_INSTALL_BASE) { $env:MV_TRAVEL_INSTALL_BASE.TrimEnd('/') } else { 'https://raw.githubusercontent.com/talirezun/MV-MCP-server/main' }

  function Stop-NeedNode {
    Write-Host 'MV Travel MCP installer needs Node.js 18 or newer.'
    Write-Host 'Please install it from https://nodejs.org and run this command again.'
    throw 'Node.js 18+ required'
  }

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Stop-NeedNode }
  $major = 0
  try {
    $v = (& node --version) -replace '^v', ''
    $major = [int]($v.Split('.')[0])
  } catch { }
  if ($major -lt 18) { Stop-NeedNode }

  $tmp = Join-Path ([IO.Path]::GetTempPath()) ('mv-travel-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $tmp | Out-Null
  $exit = 1
  try {
    $file = Join-Path $tmp 'install.js'
    Invoke-WebRequest -UseBasicParsing -Uri "$base/install/install.js" -OutFile $file

    $passArgs = @()
    if ($env:MV_TRAVEL_ARGS) { $passArgs += ($env:MV_TRAVEL_ARGS -split '\s+' | Where-Object { $_ }) }
    if ($PassThru) { $passArgs += $PassThru }

    & node $file @passArgs
    $exit = $LASTEXITCODE
  } finally {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    # Do not leave arguments or the key behind in the session.
    Remove-Item Env:MV_TRAVEL_ARGS -ErrorAction SilentlyContinue
    Remove-Item Env:MV_TRAVEL_API_KEY -ErrorAction SilentlyContinue
  }
  if ($exit -ne 0) { throw "Installer exited with code $exit" }
}

Install-MvTravel @args
