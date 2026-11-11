#!/usr/bin/env node
/**
 * AeroOps AI v3.0 — Studio-Grade Neural Audio Generator
 * Powered by Microsoft Edge Neural Read Aloud Engine (en-GB-RyanNeural)
 * 
 * Replaces robotic browser TTS with an ultra-realistic, broadcast-grade
 * British Aerospace Executive voiceover with subtle cockpit atmospheric drone (-24dB).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const ROOT_DIR = path.resolve(__dirname, '..');
const TMP_DIR = path.join(ROOT_DIR, 'tmp_media', 'neural_raw');
const AUDIO_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'assets', 'audio');
const MASTER_OUTPUT = path.join(AUDIO_OUTPUT_DIR, 'aeroops_executive_voiceover.mp3');

// 6-Step Cockpit Walkthrough Narration Script
const WALKTHROUGH_SCRIPT = [
  "Welcome to AeroOps AI Version 3.0—an institutional-grade flight readiness and autonomous risk intelligence platform engineered for commercial eVTOL and BVLOS fleet operations. Unlike conventional cloud dashboards that remain vulnerable to network latency and probabilistic AI hallucinations, AeroOps is anchored on a deterministic BlackBerry QNX Neutrino 8.0 Real-Time Operating System kernel. Every flight-critical computation on this screen is governed by hard physics boundaries and verified to DO-178C safety standards.",
  "On the primary radar display, we are monitoring Flight AERO-101 along a 38.5-kilometer urban corridor from Los Angeles International to Burbank Airport. The system continuously calculates our dynamic Point of No Return—currently locked at 20.5 kilometers. In the event of sudden atmospheric degradation or command-link severance prior to this boundary, the on-board kernel autonomously executes a return-to-origin or diverts to the nearest certified vertiport without requiring human intervention or cloud connectivity.",
  "To the right sits our Deterministic Safety Airlock. Flight AERO-101, operating a Dyson Sky-AeroVect-6 airframe, currently registers a composite Risk Index of 17, with five of five hardware interlocks verified clear. Before dispatch authorization is granted, the QNX safety engine independently audits Maximum Takeoff Weight, Usable Energy Reserves, Critical Altitude clearance, Crosswind Envelopes, and live METAR telemetry. If even a single parameter breaches regulatory thresholds, the system overrides all external commands and locks the aircraft into a hard No-Go state.",
  "Along the lower deck, real-time 10-Hertz MAVLink v2 telemetry feeds four domain-specific physics engines: First, Atmospheric and Wind tracking confirms a 3.7-knot crosswind—well below our 22-knot structural limit—paired with a 4.7-knot headwind yielding a 114.7-knot ground speed. Second, our Energy and Battery Derate engine projects a 25.6-kilowatt-hour mission burn, transitioning from a 92 percent initial State of Charge to a 77.8 percent landing reserve—nearly four times the mandatory 20 percent minimum. Third, Airspace and NOTAM intelligence flags three intersecting controlled airspace zones while maintaining continuous range calculations to our Burbank alternate. Fourth, Weight and Balance verification locks gross mass at 1,890 kilograms against a 2,450-kilogram maximum structural limit, including a verified 240-kilogram payload manifest.",
  "While our deterministic C++ kernel holds absolute authority over flight safety, Google Gemini 2.5 Flash operates above the airlock as our Explainable AI layer—synthesizing complex sensor telemetry into natural-language pilot briefings and voice dispatches. Simultaneously, every millisecond of telemetry and every safety decision is cryptographically hashed into an immutable SHA-256 Merkle ledger, giving FAA and NTSB auditors an unalterable, frame-by-frame forensic blackbox.",
  "AeroOps AI is built for immediate enterprise monetization within a 1.5-trillion-dollar autonomous aviation market. Our commercial model captures three high-margin revenue streams: an annual enterprise SaaS license of 18,000 to 25,000 dollars per aircraft tail; a continuous utilization fee of 1 dollar and 20 cents per flight hour for cryptographic blackbox archiving; and turnkey OEM kernel integration services. Across a single regional operator scaling to 150 aircraft, AeroOps generates over 3.8 million dollars in recurring annual revenue. Fully validated across 163 automated physics, RTOS, and telemetry test suites with zero errors, AeroOps AI is the certified operating backbone for the next century of flight."
].join("\n\n");

// Contextual Radio & Dispatch Audio Assets
const AUDIO_TRACKS = [
  {
    filename: 'briefing_nominal.mp3',
    text: 'AeroOps dispatch to flight Aero 101. Mission status is affirmative GO. Surface winds are light at 6 knots, route ceiling clear, and projected landing reserve is 48 percent. You are cleared for pre-flight initialization.'
  },
  {
    filename: 'briefing_amber.mp3',
    text: 'AeroOps dispatch caution to Aero 202. Mission status is evaluated as AMBER. High crosswinds at 22 knots and cold temperature derate reduce landing reserve to 21 percent. Operator review and divert waypoint filing required.'
  },
  {
    filename: 'briefing_nogo.mp3',
    text: 'AeroOps critical abort. Mission status is strictly NO-GO. Flight is barred due to active VIP TFR airspace conflict, payload limit exceedance, and severe crosswinds of 32 knots. All launch sequences are locked.'
  },
  {
    filename: 'alert_windshear.mp3',
    text: 'Caution. Severe wind shear of 32 knots detected past Point of No Return. Autonomous diversion vector to Burbank Vertiport initiated.'
  },
  {
    filename: 'alert_battery.mp3',
    text: 'Alert. Battery state-of-charge decay anomaly. 8 percent deficit below theoretical burn curve. Diverting to alternate vertiport.'
  },
  {
    filename: 'alert_c2severed.mp3',
    text: 'Warning. C2 command and control link severed. Airborne autonomous fail-safe engaged. Routing locked to Burbank Pad 2.'
  },
  {
    filename: 'alert_c2restored.mp3',
    text: 'C2 link restored. Flushed offline telemetry buffer. Ledger reconciled with zero cryptographic fragmentation.'
  }
];

function logHeader(msg) {
  console.log('\n================================================================');
  console.log(`🎙  ${msg}`);
  console.log('================================================================');
}

function getAudioDuration(filePath) {
  const result = spawnSync('ffmpeg', ['-i', filePath], {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    windowsHide: true
  });
  const output = result.stderr || result.stdout || '';
  const match = output.match(/Duration:\s*(\d+):(\d+):([\d\.]+)/);
  if (!match) return 0;
  const hours = parseFloat(match[1]);
  const minutes = parseFloat(match[2]);
  const seconds = parseFloat(match[3]);
  return hours * 3600 + minutes * 60 + seconds;
}

function runCmd(cmd, args, desc) {
  console.log(`[EXEC] ${desc}...`);
  const result = spawnSync(cmd, args, {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024
  });
  if (result.status !== 0) {
    console.error(`[ERROR] Command failed with code ${result.status}`);
    if (result.stderr) console.error(result.stderr);
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
  return result;
}

async function synthesizeText(tts, text, targetFolder) {
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }
  const result = await tts.toFile(targetFolder, text, {
    rate: '-3%',
    pitch: '-2Hz'
  });
  return result.audioFilePath;
}

async function main() {
  logHeader('AeroOps AI v3.0 — Studio Neural Audio Synthesis (edge-tts)');
  const startTime = Date.now();

  [TMP_DIR, AUDIO_OUTPUT_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const tts = new MsEdgeTTS();
  await tts.setMetadata('en-GB-RyanNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  console.log('✓ Initialized Neural Voice: en-GB-RyanNeural (Rate: -3%, Pitch: -2Hz)');

  // 1. Synthesize Master 6-Step Walkthrough Voiceover
  logHeader('STEP 1: Synthesizing Master Executive Walkthrough Voiceover');
  const masterRawFolder = path.join(TMP_DIR, 'master_raw');
  const masterRawAudio = await synthesizeText(tts, WALKTHROUGH_SCRIPT, masterRawFolder);
  const rawDuration = getAudioDuration(masterRawAudio);
  console.log(`✓ Master speech generated: ${rawDuration.toFixed(2)}s (${(rawDuration / 60).toFixed(2)} min)`);

  // 2. Mix with Atmospheric Cockpit Drone at -24dB via FFmpeg
  logHeader('STEP 2: Mixing Volume Normalization & Atmospheric Cockpit Drone (-24dB)');
  const totalDuration = Math.ceil(rawDuration);
  const lavfiFilter = `sine=frequency=48:duration=${totalDuration}[d1];sine=frequency=96:duration=${totalDuration}[d2];[d1][d2]amix=inputs=2:weights='0.7 0.3',lowpass=f=220,volume=-24dB[drone];[0:a]volume=1.0[vo];[vo][drone]amix=inputs=2:duration=first[outa]`;

  runCmd(
    'ffmpeg',
    [
      '-i', masterRawAudio,
      '-filter_complex', lavfiFilter,
      '-map', '[outa]',
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      '-y', MASTER_OUTPUT
    ],
    'Muxing voiceover + atmospheric cockpit drone'
  );

  const masterStats = fs.statSync(MASTER_OUTPUT);
  const finalDuration = getAudioDuration(MASTER_OUTPUT);
  console.log(`✓ Master Executive Voiceover Exported: ${MASTER_OUTPUT}`);
  console.log(`  Size:     ${(masterStats.size / (1024 * 1024)).toFixed(2)} MB (${masterStats.size} bytes)`);
  console.log(`  Duration: ${finalDuration.toFixed(2)}s (${(finalDuration / 60).toFixed(2)} min)`);

  // 3. Synthesize Contextual Dispatch & Alert Audio Files
  logHeader('STEP 3: Synthesizing Contextual Dispatch & In-Flight Anomaly Audio');
  for (const track of AUDIO_TRACKS) {
    const trackFolder = path.join(TMP_DIR, path.basename(track.filename, '.mp3'));
    const rawTrackAudio = await synthesizeText(tts, track.text, trackFolder);
    const finalTrackPath = path.join(AUDIO_OUTPUT_DIR, track.filename);

    // Mix subtle radio chime envelope into each alert track
    const trackDur = Math.ceil(getAudioDuration(rawTrackAudio) + 0.5);
    const trackFilter = `sine=frequency=55:duration=${trackDur},lowpass=f=240,volume=-26dB[drone];[0:a]volume=1.0[vo];[vo][drone]amix=inputs=2:duration=first[outa]`;

    runCmd(
      'ffmpeg',
      [
        '-i', rawTrackAudio,
        '-filter_complex', trackFilter,
        '-map', '[outa]',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
        '-y', finalTrackPath
      ],
      `Exporting ${track.filename}`
    );
    console.log(`  ✓ Exported: ${track.filename}`);
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Studio Neural Audio Pipeline Completed in ${elapsedSec}s with ZERO ERRORS.`);
}

main().catch((err) => {
  console.error('\n❌ Neural Audio Pipeline Failed:');
  console.error(err);
  process.exit(1);
});
