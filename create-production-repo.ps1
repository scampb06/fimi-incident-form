# 1) Define source/target
$SourceRoot = (Get-Location).Path
$TargetRoot = Join-Path (Split-Path $SourceRoot -Parent) "fimi-incident-form-client"

# 2) Create target folder
New-Item -ItemType Directory -Path $TargetRoot -Force | Out-Null

# 3) Files required for live index-compact path
$RequiredFiles = @(
  "CDN report generator style.css",
  "config.js",
  "main.js",
  "pdf-ai-summarizer.js",
  "form-data-processing.js",
  "disarm-framework-integration.js",
  "objectives-ttps-management.js",
  "urls-management.js",
  "url-validation.js",
  "ui-interactions.js",
  "image-handling.js",
  "json-generator.js",
  "docx-generator.js",
  "docx-header-tables.js",
  "docx-summary-table.js",
  "docx-content-tables.js",
  "docx-footer-tables.js",
  "country-selector.html",
  "countries.json",
  "disarm_red_framework_clickable_no_checkboxes.html",
  "disarm-technique-selector.html",
  "disarm-techniques.json"
)

# 4) Copy index-compact.html as index.html
Copy-Item -LiteralPath (Join-Path $SourceRoot "index-compact.html") `
          -Destination (Join-Path $TargetRoot "index.html") -Force

# 5) Copy required files
$Missing = @()
foreach ($file in $RequiredFiles) {
  $src = Join-Path $SourceRoot $file
  $dst = Join-Path $TargetRoot $file
  if (Test-Path -LiteralPath $src) {
    Copy-Item -LiteralPath $src -Destination $dst -Force
  } else {
    $Missing += $file
  }
}

# 6) Report copy status
Write-Host "Target folder: $TargetRoot"
if ($Missing.Count -gt 0) {
  Write-Warning "Missing files:"
  $Missing | ForEach-Object { Write-Warning " - $_" }
} else {
  Write-Host "All required files copied successfully."
}

# 7) Optional: initialize git in new repo
Set-Location $TargetRoot
git init
git add .
git commit -m "Initial clean client-only import from index-compact flow"
git branch -M main