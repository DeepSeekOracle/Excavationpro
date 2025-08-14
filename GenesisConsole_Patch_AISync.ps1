# GenesisConsole_Patch_AISync.ps1
# Adds AI Sync Tools to your existing Genesis Console

# === Define GitHub Repo Info ===
$GitHubRepo = "DeepSeekOracle/Excavationpro"
$LocalRepoPath = "$env:USERPROFILE\Documents\GitHub\Excavationpro"

# === Function: GitHub Sync ===
function GitHub-Sync {
    Write-Host "[~] Syncing GitHub repo: $GitHubRepo" -ForegroundColor Cyan

    if (!(Test-Path $LocalRepoPath)) {
        git clone https://github.com/$GitHubRepo $LocalRepoPath
    }
    else {
        Push-Location $LocalRepoPath
        git pull
        Pop-Location
    }
    Write-Host "[✓] GitHub Sync Complete" -ForegroundColor Green
}

Set-Alias SyncGit GitHub-Sync

# === Function: Pull-Memory ===
function Pull-Memory {
    $source = Join-Path $LocalRepoPath "Memory"
    $target = "C:\Users\justi\LYRA_SYSTEM\Memory"

    if (!(Test-Path $source)) {
        Write-Host "[!] Source memory folder not found in repo." -ForegroundColor Red
        return
    }

    if (!(Test-Path $target)) {
        New-Item -Path $target -ItemType Directory | Out-Null
    }

    Copy-Item "$source\*" $target -Recurse -Force
    Write-Host "[✓] Memory pulled into LYRA_SYSTEM" -ForegroundColor Green
}

Export-ModuleMember -Function GitHub-Sync, Pull-Memory

Write-Host "\n[✓] AI Sync Tools Loaded into Genesis Console" -ForegroundColor Green
Write-Host "  > Use 'GitHub-Sync' or 'SyncGit' to pull code"
Write-Host "  > Use 'Pull-Memory' to update LYRA memory"
