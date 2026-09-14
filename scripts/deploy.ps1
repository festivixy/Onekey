# Build and publish the site to Cloudflare Pages. Needs: npx wrangler login (once).
Set-Location "$PSScriptRoot/.."
$env:REACT_APP_PHOTO_BASE = 'https://pub-767f818a967f4e3a91b629fde082c689.r2.dev/site'
npm run build
npx wrangler pages deploy build --project-name onekey --branch main --commit-dirty=true
