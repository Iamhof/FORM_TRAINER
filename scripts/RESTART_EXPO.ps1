# Restart Expo Server with Clean Cache
# Run this script after applying the Supabase migration

Write-Host "Stopping any running Expo processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*expo*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

Write-Host "Starting Expo server..." -ForegroundColor Green
bun run start
