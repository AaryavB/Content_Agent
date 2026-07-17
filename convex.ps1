# Refreshes PATH and runs Convex. Use when `convex`/`npx` are not recognized.
$env:Path = "C:\Program Files\nodejs;" + [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
$env:NODE_OPTIONS = "--use-system-ca"

$convex = Join-Path $env:APPDATA "npm\convex.cmd"
if (-not (Test-Path $convex)) {
    Write-Error "Convex not found. Run: npm install -g convex"
    exit 1
}

& $convex @args
