# Script pour corriger automatiquement les erreurs eqeqeq
# Remplace == par === et != par !== dans les fichiers JS/TS

param(
    [switch]$DryRun = $false
)

$files = Get-ChildItem -Path "src" -Include "*.js","*.ts" -Recurse -File

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Remplacer != par !==
    $content = $content -replace '([^!])!=([^=])', '$1!==$2'
    
    # Remplacer == par ===
    $content = $content -replace '([^=!<>])==([^=])', '$1===$2'
    
    if ($content -ne $originalContent) {
        $changes = ($originalContent.Length - $content.Replace("===", "==").Replace("!==", "!=").Length)
        
        if (-not $DryRun) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "✓ Fixed: $($file.Name) " -ForegroundColor Green
        } else {
            Write-Host "Would fix: $($file.Name)" -ForegroundColor Yellow
        }
        
        $totalFiles++
        $totalReplacements++
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Files processed: $totalFiles" -ForegroundColor Cyan
Write-Host "Replacements made: $totalReplacements" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "`nThis was a dry run. Use without -DryRun to apply changes." -ForegroundColor Yellow
}
