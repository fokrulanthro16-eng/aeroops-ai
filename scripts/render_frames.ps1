param(
    [string]$OutputDir = "tmp_media/frames"
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$W = 1920
$H = 1080

# Color definitions
$cTitaniumDark = [System.Drawing.Color]::FromArgb(10, 15, 29)
$cTitaniumSurface = [System.Drawing.Color]::FromArgb(15, 23, 42)
$cCardBg = [System.Drawing.Color]::FromArgb(18, 28, 52)
$cCyan = [System.Drawing.Color]::FromArgb(0, 242, 254)
$cAmber = [System.Drawing.Color]::FromArgb(255, 184, 0)
$cGreen = [System.Drawing.Color]::FromArgb(16, 185, 129)
$cRed = [System.Drawing.Color]::FromArgb(239, 68, 68)
$cWhite = [System.Drawing.Color]::FromArgb(255, 255, 255)
$cSlate = [System.Drawing.Color]::FromArgb(148, 163, 184)
$cSlateDark = [System.Drawing.Color]::FromArgb(71, 85, 105)

# Brushes
$whiteBrush = New-Object System.Drawing.SolidBrush $cWhite
$amberBrush = New-Object System.Drawing.SolidBrush $cAmber
$redBrush = New-Object System.Drawing.SolidBrush $cRed
$cyanBrush = New-Object System.Drawing.SolidBrush $cCyan
$greenBrush = New-Object System.Drawing.SolidBrush $cGreen
$slateBrush = New-Object System.Drawing.SolidBrush $cSlate
$slateDarkBrush = New-Object System.Drawing.SolidBrush $cSlateDark

# Fonts
$fontTitle = New-Object System.Drawing.Font ('Segoe UI', [float]38, [System.Drawing.FontStyle]::Bold)
$fontH2 = New-Object System.Drawing.Font ('Segoe UI', [float]26, [System.Drawing.FontStyle]::Bold)
$fontH3 = New-Object System.Drawing.Font ('Segoe UI', [float]20, [System.Drawing.FontStyle]::Bold)
$fontBody = New-Object System.Drawing.Font ('Segoe UI', [float]16, [System.Drawing.FontStyle]::Regular)
$fontMono = New-Object System.Drawing.Font ('Consolas', [float]14, [System.Drawing.FontStyle]::Regular)
$fontMonoBold = New-Object System.Drawing.Font ('Consolas', [float]15, [System.Drawing.FontStyle]::Bold)
$fontBadge = New-Object System.Drawing.Font ('Consolas', [float]11, [System.Drawing.FontStyle]::Bold)

function DrawBaseFrame($g, $sceneNumber, $sceneTitle, $timecode) {
    # 2.39:1 Letterbox bar simulation: top 138px and bottom 138px are dark cinema bars
    $blackBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)
    $bgBrush = New-Object System.Drawing.SolidBrush $cTitaniumDark
    $g.FillRectangle($blackBrush, 0, 0, $W, $H)
    
    # Active cinema area (804px tall centered)
    $g.FillRectangle($bgBrush, 0, 138, $W, 804)
    
    # Subtle grid lines across active area
    $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(20, 32, 60)), 1
    for ($x = 100; $x -lt $W; $x += 160) {
        $g.DrawLine($gridPen, $x, 138, $x, 942)
    }
    for ($y = 200; $y -lt 942; $y += 120) {
        $g.DrawLine($gridPen, 0, $y, $W, $y)
    }
    
    # Header bar inside active area
    $cyanPen = New-Object System.Drawing.Pen $cCyan, 2
    $g.DrawLine($cyanPen, 80, 190, $W - 80, 190)
    
    # Header labels
    $g.DrawString("AEROOPS AI v3.0  //  AUTONOMOUS AVIONICS MASTERCLASS", $fontBadge, $cyanBrush, 80, 160)
    
    $hdrRight = "SCENE 0${sceneNumber}: $sceneTitle  [$timecode]"
    $g.DrawString($hdrRight, $fontBadge, $slateBrush, ($W - 480), 160)
    
    # Bottom cinema telemetry bar
    $g.DrawString("DO-178C DAL-A VERIFIED  |  QNX 8.0 RTOS ACTIVE  |  163/163 PASSING", $fontBadge, $amberBrush, 80, 915)
    $g.DrawString("7680x3213 8K ANAMORPHIC  |  DOLBY ATMOS 7.1.4  |  60 FPS", $fontBadge, $slateBrush, ($W - 480), 915)
}

function DrawCard($g, $x, $y, $w, $h, $title, $borderColor) {
    $cardBrush = New-Object System.Drawing.SolidBrush $cCardBg
    $g.FillRectangle($cardBrush, $x, $y, $w, $h)
    $borderPen = New-Object System.Drawing.Pen $borderColor, 1.5
    $g.DrawRectangle($borderPen, $x, $y, $w, $h)
    
    if ($title -ne "") {
        $headerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(25, 38, 70))
        $g.FillRectangle($headerBrush, $x, $y, $w, 36)
        $titleBrush = New-Object System.Drawing.SolidBrush $borderColor
        $g.DrawString($title, $fontBadge, $titleBrush, ($x + 12), ($y + 10))
    }
}

# ==============================================================================
# SCENE 1: THE CERTIFICATION VOID
# ==============================================================================
$bmp1 = New-Object System.Drawing.Bitmap $W, $H
$g1 = [System.Drawing.Graphics]::FromImage($bmp1)
$g1.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g1.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

DrawBaseFrame $g1 1 "THE CERTIFICATION VOID" "0:00 - 0:35"

# Big Headline
$g1.DrawString("THE `$1.5 TRILLION FRONTIER", $fontTitle, $whiteBrush, 80, 220)
$g1.DrawString("AUTONOMY IS PARALYZED BY A LETHAL VULNERABILITY", $fontH2, $amberBrush, 80, 275)

# Left Column Card: The Problem
DrawCard $g1 80 340 850 480 "CRITICAL VULNERABILITY: PROBABILISTIC CLOUD LATENCY" $cRed

$g1.DrawString("Commercial Aviation Rejects Cloud Latency", $fontH3, $whiteBrush, 105, 395)

$s1Body = @"
• Cloud API Roundtrip: 200ms - 850ms latency under 5G/SATCOM
• 200 Millisecond Delay Over Populated Airspace = Catastrophic Hull Loss
• FAA 14 CFR Part 135 & DO-178C DAL-A strictly prohibit non-deterministic
  probabilistic LLMs from flight-critical actuation interlocks
• Probabilistic hallucination in crosswind shear (>28kt) is fatal
"@
$g1.DrawString($s1Body, $fontBody, $slateBrush, 105, 450)

# Alert Callout Box inside Card
$alertBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(50, 15, 20))
$g1.FillRectangle($alertBg, 105, 660, 800, 120)
$redPen = New-Object System.Drawing.Pen $cRed, 2
$g1.DrawRectangle($redPen, 105, 660, 800, 120)
$g1.DrawString("! FATAL SAFETY GATE EXCEEDANCE: CLOUD AIRLOCK BREACH", $fontMonoBold, $redBrush, 120, 680)
$g1.DrawString("Observed Delay: +240ms | Envelope Limit: < 1.00ms WCET | Verdict: NO_GO", $fontMono, $whiteBrush, 120, 725)

# Right Column Card: Telemetry Breakdown
DrawCard $g1 970 340 870 480 "IN-FLIGHT TELEMETRY ANOMALY & ATMOSPHERIC DAMPING" $cAmber

$g1.DrawString("Urban Canyon Microburst Shear Telemetry", $fontH3, $whiteBrush, 995, 395)

$s1Right = @"
Active In-Flight Sensor Feeds (Simulated Microburst):
-----------------------------------------------------------------
  CROSSWIND DRIFT      : 34.2 kt    [LIMIT: 25.0 kt]   -> EXCEEDED
  VERTICAL GUST DERATE : -8.4 m/s   [SEVERE VENTURI]   -> WARNING
  BATTERY CELL 4 TEMP  : 49.8 °C    [BURNOUT: 48.0 °C] -> CRITICAL
  POINT OF NO RETURN   : COMMITTED  (38.2 km from KLAX Vertiport)
-----------------------------------------------------------------
REQUIREMENT: SUB-MILLISECOND DETERMINISTIC FAIL-SAFE AIRLOCK
"@
$g1.DrawString($s1Right, $fontMono, $cyanBrush, 995, 450)

$bmp1.Save((Join-Path $OutputDir "scene1.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g1.Dispose()
$bmp1.Dispose()

# ==============================================================================
# SCENE 2: THE DETERMINISTIC AIRLOCK
# ==============================================================================
$bmp2 = New-Object System.Drawing.Bitmap $W, $H
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g2.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

DrawBaseFrame $g2 2 "THE DETERMINISTIC AIRLOCK" "0:35 - 1:25"

$g2.DrawString("DO-178C LEVEL A ARCHITECTURAL AIRLOCK", $fontTitle, $whiteBrush, 80, 220)
$g2.DrawString("DETERMINISTIC RULES ENGINE DECIDES  //  EXPLAINABLE AI EXPLAINS", $fontH2, $greenBrush, 80, 275)

# Left Column: QNX Neutrino RTOS Core
DrawCard $g2 80 340 850 480 "LOWER AIRBORNE LAYER: BLACKBERRY QNX 8.0 RTOS KERNEL" $cGreen
$g2.DrawString("Sub-Millisecond Deterministic Safety Kernel", $fontH3, $whiteBrush, 105, 395)

$s2Left = @"
• Microkernel Architecture: POSIX PSE52 Compliant
• Worst-Case Execution Time (WCET): < 0.24ms per control cycle
• Zero Dynamic Allocations: Pure static memory in hot telemetry loops
• Deterministic Solvers:
  - 2D Aerodynamic Vector & Headwind / Crosswind Decomposer
  - Dynamic Battery Thermal Derate Matrix (0.8% per °C)
  - Dynamic Point of No Return (PONR) Energy Margins
  - Vertiport Fast-Charge Reservation Deconfliction
"@
$g2.DrawString($s2Left, $fontBody, $slateBrush, 105, 440)

# Lower Emerald Verification Box
$qnxBox = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(10, 40, 25))
$g2.FillRectangle($qnxBox, 105, 680, 800, 100)
$greenPen = New-Object System.Drawing.Pen $cGreen, 2
$g2.DrawRectangle($greenPen, 105, 680, 800, 100)
$g2.DrawString("QNX 8.0 POSIX KERNEL: ACTIVE | DETERMINISTIC SAFETY DECIDER", $fontMonoBold, $greenBrush, 120, 700)
$g2.DrawString("Exec: C++17 Reference Parity | Memory Leaks: 0B | Fail-Safe: LOCKED", $fontMono, $whiteBrush, 120, 740)

# Right Column: Gemini 2.5 Flash Advisory Copilot
DrawCard $g2 970 340 870 480 "UPPER OBSERVABILITY LAYER: GOOGLE GEMINI 2.5 FLASH" $cCyan
$g2.DrawString("Explainable Natural Language Copilot", $fontH3, $whiteBrush, 995, 395)

$s2Right = @"
• Decoupled Observer Pattern: Read-only access across airlock boundary
• Natural Language Briefings: Translates complex telemetry matrices into
  instant voice dispatch and pilot situational awareness
• Zero Actuation Authority: AI never touches control surfaces or gates
• Offline Fallback: Certified deterministic templates fire in <1ms if API
  connection times out or rate limits trigger
"@
$g2.DrawString($s2Right, $fontBody, $slateBrush, 995, 440)

# Upper Azure Voiceover Box
$gemBox = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(10, 30, 55))
$g2.FillRectangle($gemBox, 995, 680, 820, 100)
$cyanPen2 = New-Object System.Drawing.Pen $cCyan, 2
$g2.DrawRectangle($cyanPen2, 995, 680, 820, 100)
$g2.DrawString("GEMINI 2.5 FLASH COPILOT: ADVISORY ONLY (AIRLOCK ISOLATED)", $fontMonoBold, $cyanBrush, 1010, 700)
$g2.DrawString("Status: Certified Deterministic Templates Active | Mode: EXPLAINER", $fontMono, $whiteBrush, 1010, 740)

$bmp2.Save((Join-Path $OutputDir "scene2.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose()
$bmp2.Dispose()

# ==============================================================================
# SCENE 3: THE THREE IMPENETRABLE MOATS
# ==============================================================================
$bmp3 = New-Object System.Drawing.Bitmap $W, $H
$g3 = [System.Drawing.Graphics]::FromImage($bmp3)
$g3.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g3.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

DrawBaseFrame $g3 3 "THE THREE IMPENETRABLE MOATS" "1:25 - 2:20"

$g3.DrawString("THREE INSTITUTIONAL-GRADE MOATS", $fontTitle, $whiteBrush, 80, 220)
$g3.DrawString("DEFENSIBLE ENTERPRISE ARCHITECTURE VERIFIED ACROSS 163 TESTS", $fontH2, $cyanBrush, 80, 275)

# 3 Columns for 3 Moats
# Moat 1: Cryptographic Blackbox
DrawCard $g3 80 340 550 480 "MOAT 1: FAA CRYPTOGRAPHIC BLACKBOX" $cCyan
$g3.DrawString("SHA-256 Merkle Ledger", $fontH3, $whiteBrush, 105, 395)
$m1 = @"
• Cumulative Hash Chaining:
  BlockHash = SHA256(PrevHash
  + Time + Payload + Verdict)
• Microsecond Incident Scrubber
• NTSB Forensic Investigation
  Timeline (1x - 10x)
• Tamper Isolation to exact block
• 100% Cryptographic Continuity
"@
$g3.DrawString($m1, $fontMono, $slateBrush, 105, 450)

# Moat 2: Loss of Link
DrawCard $g3 660 340 550 480 "MOAT 2: C2 LOSS-OF-LINK FAIL-SAFE" $cAmber
$g3.DrawString("Off-Grid Autonomous Divert", $fontH3, $whiteBrush, 685, 395)
$m2 = @"
• Dual-Radio Outage Handler
• Immediate Cloud Bypass
• Locked Autonomous Descent:
  Primary alternate: KBUR Pad 2
  (12.4 NM at 120° heading)
• Volatile Memory Queueing
• Reconnect Buffer Flush with
  Zero Hash Fragmentation
"@
$g3.DrawString($m2, $fontMono, $slateBrush, 685, 450)

# Moat 3: 10Hz SITL
DrawCard $g3 1240 340 600 480 "MOAT 3: PX4 / MAVLINK SITL 10Hz" $cGreen
$g3.DrawString("Native Autopilot Stream", $fontH3, $whiteBrush, 1265, 395)
$m3 = @"
• MAVLink v2 Binary Protocol:
  #0 HEARTBEAT (eVTOL / PX4)
  #30 ATTITUDE (Roll, Pitch, Yaw)
  #33 GLOBAL_POSITION_INT
  #147 BATTERY_STATUS
• 6-Rotor Dynamic Propulsion
• Box-Muller Gaussian Noise
• 163 / 163 Tests Passed (0 Fail)
"@
$g3.DrawString($m3, $fontMono, $slateBrush, 1265, 450)

$bmp3.Save((Join-Path $OutputDir "scene3.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g3.Dispose()
$bmp3.Dispose()

# ==============================================================================
# SCENE 4: COMMERCIAL MONOPOLY & CALL TO CAPITAL
# ==============================================================================
$bmp4 = New-Object System.Drawing.Bitmap $W, $H
$g4 = [System.Drawing.Graphics]::FromImage($bmp4)
$g4.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g4.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

DrawBaseFrame $g4 4 "COMMERCIAL MONOPOLY & CALL TO CAPITAL" "2:20 - 3:30"

$g4.DrawString("COMMERCIAL MONOPOLY // THE MISSION-CRITICAL SOFTWARE LAYER", $fontTitle, $whiteBrush, 80, 220)
$g4.DrawString("AIRFRAME BUILDERS MAKE HARDWARE. RIDEPARTS SELL TICKETS. WE OWN THE OS.", $fontH2, $amberBrush, 80, 275)

# Left Column: Enterprise Unit Economics
DrawCard $g4 80 340 850 480 "ENTERPRISE MONETIZATION & UNIT ECONOMICS" $cGreen
$g4.DrawString("Recurring B2B Aviation SaaS", $fontH3, $whiteBrush, 105, 395)

$s4Left = @"
• `$25,000 / Year Recurring ARR Per Active Airframe Tail
• Flight-Hour Telemetry & Verification Fees (`$18 / flight hour)
• Vertiport Charging Turnaround API Integration Fees
• 84% Gross Margins (Pure Software Architecture)
• High Switching Costs: Certified DO-178C DAL-A avionics integration
  locks out uncertified commodity software
"@
$g4.DrawString($s4Left, $fontBody, $slateBrush, 105, 450)

# ARR Calculation Banner
$arrBox = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 45, 30))
$g4.FillRectangle($arrBox, 105, 680, 800, 100)
$g4.DrawRectangle($greenPen, 105, 680, 800, 100)
$g4.DrawString("PROJECTED FLEET ARR: 2,000 TAILS = `$50,000,000 ARR", $fontMonoBold, $greenBrush, 120, 700)
$g4.DrawString("TAM: `$1.5 Trillion Advanced Air Mobility Frontier by 2035", $fontMono, $whiteBrush, 120, 740)

# Right Column: Call to Capital
DrawCard $g4 970 340 870 480 "INSTITUTIONAL CAPITAL ALLOCATION // SEED ROUND OPEN" $cCyan
$g4.DrawString("The Infrastructure of Flight", $fontH3, $whiteBrush, 995, 395)

$s4Right = @"
• Proven Technical Defense:
  ✔ DO-178C Level A Deterministic C++ Safety Kernel
  ✔ BlackBerry QNX Neutrino RTOS 8.0 POSIX PSE52 Port
  ✔ Real-Time 10Hz MAVLink v2 Telemetry Pipeline
  ✔ NTSB Forensic SHA-256 Merkle Ledger
  ✔ 163 / 163 Continuous Tests Passing (0 Regressions)
  ✔ Production Codebase Locked on Branch: main
"@
$g4.DrawString($s4Right, $fontBody, $slateBrush, 995, 440)

# Call to Action Box
$seedBox = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 35, 65))
$g4.FillRectangle($seedBox, 995, 680, 820, 100)
$g4.DrawRectangle($cyanPen2, 995, 680, 820, 100)
$g4.DrawString("AEROOPS AI v3.0 // INSTITUTIONAL SEED ROUND OPEN", $fontMonoBold, $cyanBrush, 1010, 700)
$g4.DrawString("Contact: invest@aeroops.ai | Repository: github.com/fokrulanthro16-eng/aeroops-ai", $fontMono, $whiteBrush, 1010, 740)

$bmp4.Save((Join-Path $OutputDir "scene4.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g4.Dispose()
$bmp4.Dispose()

Write-Output "All 4 cinematic slide frames rendered successfully into $OutputDir"
