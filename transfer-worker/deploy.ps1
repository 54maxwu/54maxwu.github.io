param([switch]$DryRun)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$assetRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('quick-transfer-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path (Join-Path $assetRoot 'transfer'), (Join-Path $assetRoot 'qrcode') | Out-Null
try {
    foreach ($file in @('transfer/index.html', 'transfer/app.js', 'transfer/style.css', 'qrcode/jquery-3.7.1.min.js', 'qrcode/jquery.qrcode.min.js')) {
        Copy-Item -LiteralPath (Join-Path $repo $file) -Destination (Join-Path $assetRoot $file)
    }
    $options = @('deploy', '--config', (Join-Path $PSScriptRoot 'wrangler.toml'), '--assets', $assetRoot)
    if ($DryRun) { $options += '--dry-run' }
    wrangler @options
    if ($LASTEXITCODE -ne 0) { throw "Wrangler exited with code $LASTEXITCODE" }
} finally {
    $temp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd([char]92, [char]47)
    $resolved = (Resolve-Path -LiteralPath $assetRoot).Path
    if ((Split-Path -Parent $resolved) -eq $temp -and (Split-Path -Leaf $resolved) -match '^quick-transfer-[0-9a-f-]{36}$') {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
