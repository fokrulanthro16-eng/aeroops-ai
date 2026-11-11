param(
    [string]$JsonFile = "tmp_media/walkthrough_texts.json",
    [string]$OutputDir = "tmp_media/walkthrough_audio"
)

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$rawJson = Get-Content -Path $JsonFile -Raw -Encoding UTF8
$steps = ConvertFrom-Json $rawJson

Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft David Desktop")
$synth.Rate = -1

foreach ($s in $steps) {
    $outPath = Join-Path $OutputDir ($s.id + "_vo.wav")
    $synth.SetOutputToWaveFile($outPath)
    $synth.Speak($s.text)
    Write-Output "Rendered $($s.id) -> $outPath"
}

$synth.Dispose()
Write-Output "All 6 walkthrough voiceovers generated."
