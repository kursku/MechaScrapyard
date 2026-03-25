param(
    [string]$SourceRoot = 'C:\Users\nicol\AppData\Roaming\skillshare\skills'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Replace-Literal {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Old,
        [Parameter(Mandatory = $true)][string]$New
    )

    $content = Get-Content -Raw -LiteralPath $Path
    if ($content.Contains($Old)) {
        $updated = $content.Replace($Old, $New)
        Set-Content -LiteralPath $Path -Value $updated -NoNewline
        Write-Host "Updated: $Path"
    } else {
        Write-Host "No match: $Path"
    }
}

function Replace-Regex {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Pattern,
        [Parameter(Mandatory = $true)][string]$Replacement
    )

    $content = Get-Content -Raw -LiteralPath $Path
    $updated = [regex]::Replace($content, $Pattern, $Replacement)
    if ($updated -ne $content) {
        Set-Content -LiteralPath $Path -Value $updated -NoNewline
        Write-Host "Updated: $Path"
    } else {
        Write-Host "No match: $Path"
    }
}

$skillignore = Join-Path $SourceRoot '.skillignore'
$ignoreEntries = @(
    'docs',
    'game-balance-workspace',
    'game-content-workspace',
    'learned'
)

if (Test-Path $skillignore) {
    $existing = Get-Content -LiteralPath $skillignore
    $merged = @($existing + $ignoreEntries | Select-Object -Unique)
    Set-Content -LiteralPath $skillignore -Value $merged
} else {
    Set-Content -LiteralPath $skillignore -Value $ignoreEntries
}
Write-Host "Updated: $skillignore"

$kitRoot = Join-Path $SourceRoot 'kit-510-skills-claude'

Replace-Regex `
    -Path (Join-Path $kitRoot '01-conteudo-copy\bio-writer\SKILL.md') `
    -Pattern '"[^"]*Especialista em Marketing Digital \| Ajudo negócios a crescerem online"' `
    -Replacement '"Especialista em Marketing Digital | Ajudo negócios a crescerem online"'

Replace-Regex `
    -Path (Join-Path $kitRoot '08-lancamento-growth\churn-reduction\SKILL.md') `
    -Pattern '"Sentimos sua falta, \[Nome\]![^"]*Seu desafio semanal está esperando\. Que tal um treino rápido hoje para retomar o ritmo\?"' `
    -Replacement '"Sentimos sua falta, [Nome]! Seu desafio semanal está esperando. Que tal um treino rápido hoje para retomar o ritmo?"'

Replace-Literal `
    -Path (Join-Path $kitRoot '08-lancamento-growth\launch-day-checklist\SKILL.md') `
    -Old 'Executar `purge everything` no painel da Cloudflare. Usar ferramentas como `whatsmydns.net` ou `dig @8.8.8.8 nomedodominio.com.br` para confirmar que os registros A, CNAME e outros estão apontando para os IPs corretos do novo ambiente de produção em diversas localidades.' `
    -New 'Executar a purga de cache no painel da CDN. Usar ferramentas de verificação de DNS e checagem de propagação para confirmar que os registros A, CNAME e outros estão apontando para os destinos corretos do novo ambiente de produção em diferentes localidades.'

Replace-Literal `
    -Path (Join-Path $kitRoot '11-operacoes-sistemas\incident-response-plan\SKILL.md') `
    -Old '(Ex: `dd if=/dev/sda of=/mnt/forensics/srv-financeiro-01.img bs=4M conv=noerror,sync`).' `
    -New '(Ex: gerar uma imagem forense com a ferramenta aprovada pela equipe de resposta a incidentes e armazená-la em repositório de evidências com cadeia de custódia registrada).'

Replace-Literal `
    -Path (Join-Path $kitRoot '12-ia-automacao\ai-translation\SKILL.md') `
    -Old "    import anthropic`r`n`r`n    client = anthropic.Anthropic(api_key=`"YOUR_ANTHROPIC_API_KEY`")" `
    -New "    import os`r`n    import anthropic`r`n`r`n    client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])"

Replace-Literal `
    -Path (Join-Path $kitRoot 'know-me\memory-operations.md') `
    -Old 'Update MEMORY.md if the correction affects a summary line' `
    -New 'Update the central memory summary file if the correction affects its summary line'

Replace-Literal `
    -Path (Join-Path $kitRoot 'know-me\memory-operations.md') `
    -Old 'Update MEMORY.md summary line' `
    -New 'Update the central memory summary line'

Replace-Literal `
    -Path (Join-Path $kitRoot 'self-healing\memory-management.md') `
    -Old 'Update MEMORY.md index when topic files change' `
    -New 'Update the central memory index when topic files change'

Replace-Literal `
    -Path (Join-Path $kitRoot 'self-healing\skill-creation-guide.md') `
    -Old 'Add to CLAUDE.md or memory' `
    -New 'Add it to the lightweight local guidance or session memory'

Replace-Literal `
    -Path (Join-Path $kitRoot 'security\SKILL.md') `
    -Old 'Use spawn() with array args, never exec() with strings' `
    -New 'Use argument arrays for process launching and avoid string-based shell execution'

Replace-Literal `
    -Path (Join-Path $kitRoot 'security\desktop-security.md') `
    -Old 'require(''child_process'').exec()' `
    -New 'system command execution'

Replace-Literal `
    -Path (Join-Path $kitRoot 'security\desktop-security.md') `
    -Old 'No `eval()` or `Function()` in renderer' `
    -New '- [ ] No runtime code generation primitives in renderer'
