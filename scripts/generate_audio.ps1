param(
    [string]$OutputDir = "tmp_media/audio"
)

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft David Desktop")
$synth.Rate = -1

$scenes = @(
    @{
        Id = "scene1"
        Text = "Urban air mobility is a confirmed 1.5-trillion-dollar frontier. Yet autonomy is paralyzed by a lethal vulnerability: commercial aviation rejects probabilistic cloud latency. A 200-millisecond delay over populated airspace is catastrophic hull loss. Aviation demands deterministic certifiability."
    },
    @{
        Id = "scene2"
        Text = "Enter AeroOps AI. Engineered to DO-178C Level A standards. At its base: a deterministic BlackBerry QNX 8.0 kernel evaluating physics, battery reserves, and aerodynamic vectors in sub-milliseconds. Above this airlock: Google Gemini 2.5 Flash translating dense aerospace telemetry into instant pilot briefings. Deterministic rules decide; explainable AI explains."
    },
    @{
        Id = "scene3"
        Text = "Three defensible enterprise moats. First: an FAA-grade cryptographic blackbox sealing every millisecond in an immutable SHA-256 Merkle ledger for forensic replay. Second: autonomous loss-of-link fail-safe executing off-grid diversions with zero cloud dependency. Third: native 10Hz MAVLink integration, fully verified across 163 continuous test suites."
    },
    @{
        Id = "scene4"
        Text = "Airframe manufacturers build hardware. Ride-shares sell tickets. AeroOps AI captures the mission-critical software layer: twenty-five thousand dollars annual ARR per tail plus continuous flight-hour telemetry fees. Software is validated; tests are green; the repository is locked on main. We are opening our Seed round to institutional partners building the infrastructure of flight."
    }
)

foreach ($s in $scenes) {
    $outPath = Join-Path $OutputDir ($s.Id + "_vo.wav")
    $synth.SetOutputToWaveFile($outPath)
    $synth.Speak($s.Text)
    Write-Output "Generated voiceover for $($s.Id): $outPath"
}

$synth.Dispose()
Write-Output "All voiceover tracks successfully rendered."
