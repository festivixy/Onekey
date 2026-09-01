# Upload every local photo to the onekey-assets R2 bucket (run again after adding new photos).
# Needs a logged-in wrangler (npx wrangler login). Photos go under site/pics/... and site/slideshow/...
Set-Location "$PSScriptRoot/.."
foreach ($dir in @('pics', 'slideshow')) {
  Get-ChildItem "public/$dir" -File | ForEach-Object {
    npx wrangler r2 object put "onekey-assets/site/$dir/$($_.Name)" --file $_.FullName --remote --content-type image/jpeg
  }
}
