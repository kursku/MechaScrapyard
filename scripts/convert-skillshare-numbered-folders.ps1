param(
    [Parameter(Mandatory = $true)]
    [string]$Root,

    [switch]$DryRun,

    [switch]$RunSkillshare
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "[skillshare-fix] $Message"
}

function Get-SlugFromName {
    param([string]$Name)

    $slug = $Name.ToLowerInvariant()
    $slug = $slug -replace '\.md$', ''
    $slug = $slug -replace '[^a-z0-9]+', '-'
    $slug = $slug.Trim('-')
    if ([string]::IsNullOrWhiteSpace($slug)) {
        throw "Could not derive slug from name: $Name"
    }
    return $slug
}

function Get-TitleFromSlug {
    param([string]$Slug)

    $words = $Slug -split '-'
    $titled = foreach ($word in $words) {
        if ([string]::IsNullOrWhiteSpace($word)) { continue }
        if ($word.Length -eq 1) {
            $word.ToUpperInvariant()
        } else {
            $word.Substring(0, 1).ToUpperInvariant() + $word.Substring(1)
        }
    }
    return ($titled -join ' ')
}

function Get-DefaultDescription {
    param(
        [string]$SkillSlug,
        [string]$CategoryName
    )

    $title = Get-TitleFromSlug -Slug $SkillSlug
    $category = $CategoryName -replace '^\d{2}-', ''
    $category = $category -replace '-', ' '
    return "Use this skill when the user asks for $title tasks in the $category domain."
}

function Get-FrontmatterRange {
    param([string]$Content)

    if (-not $Content.StartsWith("---")) {
        return $null
    }

    $match = [regex]::Match($Content, "(?s)^---\r?\n(.*?)\r?\n---\r?\n?")
    if (-not $match.Success) {
        return $null
    }

    return $match
}

function Ensure-Frontmatter {
    param(
        [string]$SkillFile,
        [string]$SkillSlug,
        [string]$CategoryName,
        [switch]$DryRun
    )

    $content = Get-Content -Raw -LiteralPath $SkillFile
    $frontmatterMatch = Get-FrontmatterRange -Content $content
    $defaultDescription = Get-DefaultDescription -SkillSlug $SkillSlug -CategoryName $CategoryName
    $updated = $false

    if ($null -eq $frontmatterMatch) {
        $frontmatter = @(
            '---'
            "name: $SkillSlug"
            "description: $defaultDescription"
            '---'
            ''
        ) -join [Environment]::NewLine

        $newContent = $frontmatter + $content.TrimStart()
        $updated = $true
    } else {
        $frontmatterBody = $frontmatterMatch.Groups[1].Value
        $body = $content.Substring($frontmatterMatch.Length)

        if ($frontmatterBody -notmatch '(?m)^name\s*:') {
            $frontmatterBody = "name: $SkillSlug`r`n$frontmatterBody"
            $updated = $true
        }

        if ($frontmatterBody -notmatch '(?m)^description\s*:') {
            $frontmatterBody = "$frontmatterBody`r`ndescription: $defaultDescription"
            $updated = $true
        } else {
            $descMatch = [regex]::Match($frontmatterBody, '(?m)^description\s*:\s*(.*)$')
            if ($descMatch.Success) {
                $descValue = $descMatch.Groups[1].Value.Trim()
                if ([string]::IsNullOrWhiteSpace($descValue)) {
                    $frontmatterBody = [regex]::Replace(
                        $frontmatterBody,
                        '(?m)^description\s*:\s*$',
                        "description: $defaultDescription"
                    )
                    $updated = $true
                }
            }
        }

        $newContent = @(
            '---'
            $frontmatterBody.TrimEnd()
            '---'
            $body.TrimStart("`r", "`n")
        ) -join [Environment]::NewLine
    }

    if ($updated) {
        if ($DryRun) {
            Write-Step "Would patch frontmatter: $SkillFile"
        } else {
            Set-Content -LiteralPath $SkillFile -Value $newContent -NoNewline
            Write-Step "Patched frontmatter: $SkillFile"
        }
    }
}

function Validate-SkillFile {
    param([string]$SkillFile)

    $content = Get-Content -Raw -LiteralPath $SkillFile
    $frontmatterMatch = Get-FrontmatterRange -Content $content

    if ($null -eq $frontmatterMatch) {
        return "Missing frontmatter"
    }

    $frontmatterBody = $frontmatterMatch.Groups[1].Value
    if ($frontmatterBody -notmatch '(?m)^name\s*:') {
        return "Missing name"
    }
    if ($frontmatterBody -notmatch '(?m)^description\s*:') {
        return "Missing description"
    }

    return $null
}

$resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
Write-Step "Root: $resolvedRoot"
if ($DryRun) {
    Write-Step "Dry run enabled"
}

$numberedDirs = Get-ChildItem -LiteralPath $resolvedRoot -Directory |
    Where-Object { $_.Name -match '^\d{2}-' } |
    Sort-Object Name

if (-not $numberedDirs) {
    throw "No numbered folders matching ^\d{2}- found under $resolvedRoot"
}

$moved = 0
$patched = 0
$validated = 0
$errors = New-Object System.Collections.Generic.List[string]

foreach ($categoryDir in $numberedDirs) {
    Write-Step "Processing category: $($categoryDir.Name)"

    $markdownFiles = Get-ChildItem -LiteralPath $categoryDir.FullName -File -Filter *.md |
        Where-Object { $_.Name -ne 'README.md' -and $_.Name -ne 'SKILL.md' } |
        Sort-Object Name

    foreach ($file in $markdownFiles) {
        $skillSlug = Get-SlugFromName -Name $file.BaseName
        $skillDir = Join-Path $categoryDir.FullName $skillSlug
        $skillFile = Join-Path $skillDir 'SKILL.md'

        if (Test-Path -LiteralPath $skillFile) {
            Write-Step "Skipping existing skill: $skillFile"
            continue
        }

        if ($DryRun) {
            Write-Step "Would convert file to skill: $($file.FullName) -> $skillFile"
        } else {
            New-Item -ItemType Directory -Path $skillDir -Force | Out-Null
            Move-Item -LiteralPath $file.FullName -Destination $skillFile
            Write-Step "Converted file to skill: $skillFile"
        }

        $moved++
    }

    $skillFiles = Get-ChildItem -LiteralPath $categoryDir.FullName -Recurse -File -Filter SKILL.md |
        Sort-Object FullName

    foreach ($skill in $skillFiles) {
        $skillSlug = Split-Path -Leaf (Split-Path -Parent $skill.FullName)
        $before = Get-Content -Raw -LiteralPath $skill.FullName
        Ensure-Frontmatter -SkillFile $skill.FullName -SkillSlug $skillSlug -CategoryName $categoryDir.Name -DryRun:$DryRun
        $after = if ($DryRun) { $before } else { Get-Content -Raw -LiteralPath $skill.FullName }
        if ($before -ne $after) {
            $patched++
        }

        $validationError = Validate-SkillFile -SkillFile $skill.FullName
        $validated++
        if ($null -ne $validationError) {
            $errors.Add("$validationError :: $($skill.FullName)")
        }
    }
}

Write-Host ''
Write-Step "Summary"
Write-Host "  Converted files : $moved"
Write-Host "  Patched files   : $patched"
Write-Host "  Validated files : $validated"
Write-Host "  Errors          : $($errors.Count)"

if ($errors.Count -gt 0) {
    Write-Host ''
    Write-Step "Validation errors"
    foreach ($error in $errors) {
        Write-Host "  - $error"
    }
}

Write-Host ''
Write-Step "Next commands"
Write-Host "  cd `"$resolvedRoot`""
Write-Host "  skillshare install . --all --yes"
Write-Host "  skillshare sync"

if ($RunSkillshare) {
    if ($DryRun) {
        Write-Step "Dry run active, skipping skillshare install/sync"
    } else {
        Push-Location $resolvedRoot
        try {
            Write-Step "Running: skillshare install . --all --yes"
            & skillshare install . --all --yes
            Write-Step "Running: skillshare sync"
            & skillshare sync
        } finally {
            Pop-Location
        }
    }
}
