# Prescrip deploy helper
# Usage:  $env:GITHUB_TOKEN="ghp_..."; $env:VERCEL_TOKEN="..."; .\deploy.ps1
# Optional: -RepoName / -GithubUser

param(
  [string]$GithubUser = "ranakashifzahoor",
  [string]$RepoName   = "prescrip"
)

$ErrorActionPreference = "Stop"
$root = "D:\doctor"

if (-not $env:GITHUB_TOKEN) { throw "Set GITHUB_TOKEN first (https://github.com/settings/tokens, scope: repo)" }
if (-not $env:VERCEL_TOKEN) { throw "Set VERCEL_TOKEN first (https://vercel.com/account/tokens)" }

# ---------- 1. GitHub ----------
Write-Host "==> Creating/updating GitHub repo $GithubUser/$RepoName" -ForegroundColor Cyan
$headers = @{ Authorization = "token $env:GITHUB_TOKEN"; "User-Agent" = "prescrip-deploy" }
try {
  Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers `
    -Body (@{ name = $RepoName; private = $false; description = "Prescrip - doctor appointment booking system (MERN)" } | ConvertTo-Json) | Out-Null
  Write-Host "    repo created"
} catch {
  Write-Host "    repo already exists (or create failed) - continuing"
}

Set-Location $root
if (-not (Test-Path "$root\.git")) { git init; git branch -M main }
git add .
git -c user.name="deploy" -c user.email="deploy@local" commit -m "Prescrip - doctor appointment booking system" 2>$null | Out-Null
git remote remove origin 2>$null | Out-Null
git remote add origin "https://$($env:GITHUB_TOKEN)@github.com/$GithubUser/$RepoName.git"
git push -u origin main --force
Write-Host "    pushed to https://github.com/$GithubUser/$RepoName" -ForegroundColor Green

# ---------- 2. Vercel: API ----------
Write-Host "==> Deploying API (backend)" -ForegroundColor Cyan
Set-Location "$root\backend"
npx --yes vercel@latest --prod --yes --token $env:VERCEL_TOKEN --name prescrip-api
Write-Host "    NOTE: add MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, PAYMENT_DEMO, PAYMENT_CURRENCY, BACKEND_URL"
Write-Host "          in Vercel -> prescrip-api -> Settings -> Environment Variables, then redeploy."

# ---------- 3. Vercel: patient site ----------
Write-Host "==> Deploying patient site (frontend)" -ForegroundColor Cyan
Set-Location "$root\frontend"
npx --yes vercel@latest --prod --yes --token $env:VERCEL_TOKEN --name prescrip-patient
Write-Host "    NOTE: set VITE_BACKEND_URL to the API URL, then redeploy."

# ---------- 4. Vercel: doctor panel ----------
Write-Host "==> Deploying doctor panel (admin)" -ForegroundColor Cyan
Set-Location "$root\admin"
npx --yes vercel@latest --prod --yes --token $env:VERCEL_TOKEN --name prescrip-doctor
Write-Host "    NOTE: set VITE_BACKEND_URL to the API URL, then redeploy."

Set-Location $root
Write-Host "`nDone. See DEPLOY.md for the environment variables to paste into each Vercel project." -ForegroundColor Green
