# API on http://localhost:8788 + React on http://localhost:3000.
# Open http://localhost:3000. Admin login (local only): admin / admin123
Set-Location $PSScriptRoot
npm install
if (-not (Test-Path .dev.vars)) { "JWT_SECRET=$([guid]::NewGuid().ToString('N'))$([guid]::NewGuid().ToString('N'))" | Set-Content .dev.vars }
npx wrangler d1 execute onekey-db --local --file=schema.sql
node scripts/dev-seed.mjs "$env:TEMP\onekey-dev-seed.sql"
npx wrangler d1 execute onekey-db --local --file="$env:TEMP\onekey-dev-seed.sql"
if (-not (Test-Path build)) { New-Item -ItemType Directory build | Out-Null }
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$PSScriptRoot'; npx wrangler pages dev --port 8788"
npm start
