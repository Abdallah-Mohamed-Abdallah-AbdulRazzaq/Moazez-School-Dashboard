param(
  [string]$ArchivePath = ".\\hero-journey-badges.zip"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$targetDir = Join-Path $repoRoot "public\\assets\\hero-journey\\badges"
$tempDir = Join-Path $env:TEMP ("hero-journey-badges-" + [guid]::NewGuid().ToString())

if (-not (Test-Path -LiteralPath $ArchivePath)) {
  Write-Error "Archive not found: $ArchivePath"
  exit 1
}

if ([System.IO.Path]::GetExtension($ArchivePath).ToLowerInvariant() -ne ".zip") {
  Write-Error "Only .zip archives are supported by this helper. Extract non-zip archives manually, then copy images into $targetDir."
  exit 1
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

try {
  Expand-Archive -LiteralPath $ArchivePath -DestinationPath $tempDir -Force

  Get-ChildItem -LiteralPath $tempDir -Recurse -File |
    Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|svg|webp)$' } |
    ForEach-Object {
      $slug = $_.BaseName.ToLowerInvariant() -replace '[^a-z0-9]+', '-' -replace '(^-+|-+$)', ''
      $destination = Join-Path $targetDir ($slug + $_.Extension.ToLowerInvariant())
      Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
      Write-Host "Imported $($_.Name) -> $(Split-Path -Leaf $destination)"
    }
}
finally {
  if (Test-Path -LiteralPath $tempDir) {
    Remove-Item -LiteralPath $tempDir -Recurse -Force
  }
}
