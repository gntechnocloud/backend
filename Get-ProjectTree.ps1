function Get-ProjectTree {
    param (
        [string]$Path = (Get-Location).Path,
        [string[]]$Exclude = @("node_modules", "dist", "build", "coverage", "out", ".git", ".vscode", ".idea", "logs", "hooks", "scripts", "test", "tests", "__tests__", "__mocks__", "__fixtures__")
    )

    $projectRoot = $Path
    $items = Get-ChildItem -Path $projectRoot -Recurse -Force | Where-Object {
        $include = $true
        foreach ($excludeDir in $Exclude) {
            # Use -inotlike for case-insensitive comparison
            if ($_.FullName -inotlike "*\$excludeDir\*") {
                # This logic was inverted, it should be if it *does* contain an excluded dir, set $include to false
            }
            else {
                $include = $false
                break
            }
        }
        $include
    } | Sort-Object FullName # Sort by full path to process in order

    # Initialize a hash table to store paths for drawing lines
    $lastDirPrefix = @{}

    foreach ($item in $items) {
        $relativePath = $item.FullName.Substring($projectRoot.Length)
        if ($relativePath.StartsWith("\")) {
            $relativePath = $relativePath.Substring(1)
        }

        # Skip the root path itself if it's not a direct item
        if ($relativePath -eq "") { continue }

        $segments = $relativePath.Split('\')
        $depth = $segments.Count - 1 # Depth is number of segments minus 1 for the file/folder itself

        $prefix = ""
        $currentPath = $projectRoot
        for ($i = 0; $i -lt $depth; $i++) {
            $parentSegment = $segments[$i]
            $parentPath = Join-Path $currentPath $parentSegment
            $currentPath = $parentPath

            # Check if this parent is the last child of its own parent
            if ($lastDirPrefix.ContainsKey($parentPath)) {
                $prefix += $lastDirPrefix[$parentPath]
            }
            else {
                $prefix += "|   " # Vertical line for non-last children
            }
        }

        $isLastChild = $false
        # Determine if the current item is the last child of its parent
        if ($item.PSIsContainer) {
            $parentPath = $item.FullName
        }
        else {
            $parentPath = Split-Path $item.FullName
        }

        # Get siblings of the current item within the parent directory
        $siblings = Get-ChildItem -Path $parentPath -Force | Where-Object {
            $include = $true
            # Exclude current item itself for sibling check
            if ($_.Name -eq $item.Name) {
                $include = $false
            }
            else {
                foreach ($excludeDir in $Exclude) {
                    if ($_.FullName -inotlike "*\$excludeDir\*") {
                        # No change needed if it's not an excluded directory
                    }
                    else {
                        $include = $false
                        break
                    }
                }
            }
            $include
        } | Sort-Object Name # Sort siblings by name for consistent last child determination

        # A small adjustment to how siblings are determined to be "next"
        # We need to find the actual next item that would be displayed, not just any sibling.
        $nextDisplayedItem = $null
        foreach ($sibling in $siblings) {
            if ($sibling.Name -gt $item.Name) {
                # Found a sibling that comes after the current item in alphabetical order
                # and is not an excluded folder
                $isSiblingExcluded = $false
                foreach ($excludeDir in $Exclude) {
                    if ($sibling.PSIsContainer -and $sibling.Name -eq $excludeDir) {
                        $isSiblingExcluded = $true
                        break
                    }
                }
                if (-not $isSiblingExcluded) {
                    $nextDisplayedItem = $sibling
                    break
                }
            }
        }

        if (-not $nextDisplayedItem) {
            $isLastChild = $true
        }

        $branchPrefix = ""
        if ($isLastChild) {
            $branchPrefix = "`--- " # Last item: L-shape
            if ($item.PSIsContainer) {
                $lastDirPrefix[$item.FullName] = "    " # No vertical line for children of this last directory
            }
        }
        else {
            $branchPrefix = "|--- " # Intermediate item: T-shape
            if ($item.PSIsContainer) {
                $lastDirPrefix[$item.FullName] = "|   " # Vertical line for children of this directory
            }
        }

        $displayName = $item.Name
        if ($item.PSIsContainer) {
            $displayName += "\" # Add a backslash for directories
            Write-Host "$prefix$branchPrefix$displayName" -ForegroundColor Cyan
        }
        else {
            Write-Host "$prefix$branchPrefix$displayName"
        }
    }
}

# --- How to use ---
# 1. Save the script: Save this code as 'show-project-tree.ps1' in your project's root.
#    Make sure to save it with UTF-8 encoding (usually the default in VS Code).
# 2. Open PowerShell in VS Code (Ctrl+`).
# 3. Navigate to your project root if you're not already there:
#    cd C:\path\to\your\react-vite-app
# 4. Run the function:
Get-ProjectTree