# Original Google Fonts WOFF2 binaries, unchanged. Licenses live in assets/fonts.
# Run from any directory with: powershell -File tools/download-fonts.ps1
$ErrorActionPreference = 'Stop'
$fontAssetDirectory = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../assets/fonts'))
$fontDownloads = [ordered]@{
  'dm-mono-400-latin.woff2' = 'https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBA.woff2'
  'dm-mono-400-latin-ext.woff2' = 'https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthSQBLyM.woff2'
  'dm-mono-500-latin.woff2' = 'https://fonts.gstatic.com/s/dmmono/v16/aFTR7PB1QTsUX8KYvumzEYOtbQ.woff2'
  'dm-mono-500-latin-ext.woff2' = 'https://fonts.gstatic.com/s/dmmono/v16/aFTR7PB1QTsUX8KYvumzEY2tbZX9.woff2'
  'manrope-latin.woff2' = 'https://fonts.gstatic.com/s/manrope/v20/xn7gYHE41ni1AdIRggexSg.woff2'
  'manrope-latin-ext.woff2' = 'https://fonts.gstatic.com/s/manrope/v20/xn7gYHE41ni1AdIRggmxSuXd.woff2'
  'playfair-display-latin.woff2' = 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff2'
  'playfair-display-latin-ext.woff2' = 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFiD-vYSZviVYUb_rj3ij__anPXDTLYgFE_.woff2'
  'playfair-display-600-italic-latin.woff2' = 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_naUXtHA-Q.woff2'
  'playfair-display-600-italic-latin-ext.woff2' = 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_naUXt_A-W2r.woff2'
}
foreach ($fontDownload in $fontDownloads.GetEnumerator()) {
  $fontOutput = Join-Path $fontAssetDirectory $fontDownload.Key
  if (Test-Path -LiteralPath $fontOutput) {
    Write-Output ('Already present: ' + $fontDownload.Key)
    continue
  }
  Invoke-WebRequest -Uri $fontDownload.Value -OutFile $fontOutput -UseBasicParsing
  $fontData = [IO.File]::ReadAllBytes($fontOutput)
  if ([Text.Encoding]::ASCII.GetString($fontData, 0, 4) -ne 'wOF2') {
    throw ('Unexpected non-WOFF2 download: ' + $fontDownload.Key)
  }
  Write-Output ($fontDownload.Key + ': ' + $fontData.Length + ' bytes')
}
