Write-Host "Benchmark helper for High Throughput CP Page"
Write-Host "Make sure the backend is already running on http://localhost:5003"
Write-Host "Recommended benchmark env: RATE_LIMIT_MAX_REQUESTS=100000"
Write-Host ""

$backendDir = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
Set-Location -LiteralPath $backendDir

Write-Host "Warming cache with /api/profile/tourist..."
try {
  Invoke-RestMethod -Uri "http://localhost:5003/api/profile/tourist" -Method Get | Out-Null
  Write-Host "Cache warm request completed."
} catch {
  Write-Host "Cache warm request failed. Start the backend first, then rerun this script."
  exit 1
}

Write-Host ""
Write-Host "Running profile benchmark..."
npm run bench:profile

Write-Host ""
Write-Host "Running metrics benchmark..."
npm run bench:metrics

Write-Host ""
Write-Host "Record measured results in docs/load-test-results.md"
