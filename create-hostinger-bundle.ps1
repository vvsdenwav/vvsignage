# Helper script to create a lightweight deployment bundle for Hostinger Web Apps
$outputPath = Join-Path $PSScriptRoot "hostinger-deploy.zip"

if (Test-Path $outputPath) {
    Remove-Item $outputPath -Force
}

# Explicitly bundle only Next.js web app assets (excluding Android projects, node_modules, etc.)
$itemsToInclude = @(
    "src",
    "public",
    "prisma",
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.js",
    "Dockerfile",
    ".dockerignore"
)

$targetPaths = @()
foreach ($item in $itemsToInclude) {
    $fullPath = Join-Path $PSScriptRoot $item
    if (Test-Path $fullPath) {
        $targetPaths += $fullPath
    }
}

Write-Host "Creating clean hostinger-deploy.zip..." -ForegroundColor Cyan
Compress-Archive -Path $targetPaths -DestinationPath $outputPath -CompressionLevel Optimal
Write-Host "Deployment bundle created successfully at: $outputPath" -ForegroundColor Green
Write-Host "File size: $([math]::Round((Get-Item $outputPath).Length / 1MB, 2)) MB" -ForegroundColor Green
