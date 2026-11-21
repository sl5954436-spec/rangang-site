# 染缸官网 · 一键发布到 GitHub Pages
# 用法：在后台导出新的 index.html 覆盖本目录后，双击运行本脚本（或在终端 .\deploy.ps1）

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$git   = "C:\Program Files\Git\cmd\git.exe"
$repo  = "sl5954436-spec/rangang-site"
$token = (Get-Content -LiteralPath (Join-Path $PSScriptRoot ".git-token") -Raw).Trim()
if (-not $token) { Write-Host "缺少 .git-token（GitHub 令牌），发布中止。" -ForegroundColor Red; exit 1 }

& $git add -A
$changes = & $git status --porcelain
if (-not $changes) {
  Write-Host "没有需要发布的新改动。" -ForegroundColor Yellow
  exit 0
}

$msg = "content: 更新官网内容 " + (Get-Date -Format "yyyy-MM-dd HH:mm")
& $git commit -m $msg | Out-Null

$b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
& $git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $b64" push "https://github.com/$repo.git" main:main

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "已推送，GitHub Pages 约 1 分钟后自动更新：" -ForegroundColor Green
  Write-Host "https://sl5954436-spec.github.io/rangang-site/" -ForegroundColor Cyan
} else {
  Write-Host "推送失败，请检查网络或令牌是否过期。" -ForegroundColor Red
}
