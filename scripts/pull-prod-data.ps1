# Copy production content (team, events, photos, settings) into the LOCAL dev database,
# plus any uploaded files that content references (prod R2 -> local R2).
# One-way: prod -> local. Local logins are kept. Never touches production.
# Needs a logged-in wrangler (npx wrangler login).
Set-Location "$PSScriptRoot/.."
$keys = @()
foreach ($t in @('team_members', 'events', 'photos', 'settings')) {
  $dump = "$env:TEMP\onekey-$t.sql"
  npx wrangler d1 export onekey-db --remote --no-schema --table $t --output $dump
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $dump)) {
    Write-Warning "export of $t failed - local table left unchanged"
    continue
  }
  $found = Select-String -Path $dump -Pattern '/api/files/([^''" ]+)' -AllMatches
  if ($found) { $keys += $found.Matches | ForEach-Object { $_.Groups[1].Value } }
  npx wrangler d1 execute onekey-db --local --command "DELETE FROM $t;"
  npx wrangler d1 execute onekey-db --local --file $dump
  Remove-Item $dump -ErrorAction SilentlyContinue
}

foreach ($k in ($keys | Sort-Object -Unique)) {
  $tmp = "$env:TEMP\onekey-r2-object"
  npx wrangler r2 object get "onekey-assets/$k" --remote --file $tmp
  if ($LASTEXITCODE -eq 0) {
    $ct = switch -Regex ($k) {
      '\.png$'  { 'image/png' }
      '\.webp$' { 'image/webp' }
      '\.gif$'  { 'image/gif' }
      default   { 'image/jpeg' }
    }
    npx wrangler r2 object put "onekey-assets/$k" --local --file $tmp --content-type $ct
  }
  Remove-Item $tmp -ErrorAction SilentlyContinue
}
