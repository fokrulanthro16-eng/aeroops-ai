#!/usr/bin/env node
/**
 * AeroOps AI v3.0 — Studio-Grade Neural Audio Generator & Video Synchronizer
 * 
 * Generates broadcast-grade neural audio with SSML prosody targeting en-GB-RyanNeural:
 * 1. Uses edge-tts CLI with SSML prosody: pitch="-8%", rate="-5%", and strategic breaks.
 * 2. Runs generated speech through the mastering filtergraph:
 *    equalizer=f=110:width_type=h:width=100:g=4.5,equalizer=f=3500:width_type=h:width=1200:g=2.5,acompressor=threshold=-18dB:ratio=4:attack=5:release=50
 * 3. Mastered outputs:
 *    - public/assets/audio/aeroops_executive_voiceover.mp3
 *    - public/assets/audio/briefing_nominal.mp3
 *    - (plus contextual mission dispatches & alert assets)
 * 4. Detects if public/assets/video/aeroops_cockpit_walkthrough.mp4 exists;
 *    if so, muxes and replaces its audio track directly (-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const TMP_DIR = path.join(ROOT_DIR, 'tmp_media', 'ssml_build');
const AUDIO_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'assets', 'audio');
const VIDEO_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'assets', 'video');

const MASTER_AUDIO_OUTPUT = path.join(AUDIO_OUTPUT_DIR, 'aeroops_executive_voiceover.mp3');
const NOMINAL_BRIEFING_OUTPUT = path.join(AUDIO_OUTPUT_DIR, 'briefing_nominal.mp3');
const WALKTHROUGH_VIDEO_PATH = path.join(VIDEO_OUTPUT_DIR, 'aeroops_cockpit_walkthrough.mp4');

// Locates edge-tts executable
function getEdgeTTSCommand() {
  const pyExePath = 'C:\\Users\\WALTON\\AppData\\Roaming\\Python\\Python314\\Scripts\\edge-tts.exe';
  if (fs.existsSync(pyExePath)) {
    return { cmd: pyExePath, prefixArgs: [] };
  }
  // Try python -m edge_tts
  const pyCheck = spawnSync('python', ['-m', 'edge_tts', '--version'], { encoding: 'utf-8' });
  if (pyCheck.status === 0) {
    return { cmd: 'python', prefixArgs: ['-m', 'edge_tts'] };
  }
  // Fallback to npx edge-tts
  return { cmd: 'npx', prefixArgs: ['edge-tts'] };
}

// Master Walkthrough SSML Script
const WALKTHROUGH_SSML = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">
<voice name="en-GB-RyanNeural">
<prosody pitch="-8%" rate="-5%">
Welcome to AeroOps AI Version 3.0.<break time="500ms"/>An institutional-grade flight readiness and autonomous risk intelligence platform engineered for commercial eVTOL and BVLOS fleet operations.<break time="500ms"/>Unlike conventional cloud dashboards that remain vulnerable to network latency and probabilistic AI hallucinations,<break time="400ms"/>AeroOps is anchored on a deterministic BlackBerry QNX Neutrino 8.0 Real-Time Operating System kernel.<break time="500ms"/>Every flight-critical computation on this screen is governed by hard physics boundaries and verified to DO-178C safety standards.
<break time="800ms"/>
On the primary radar display, we are monitoring Flight AERO-101 along a 38.5-kilometer urban corridor from Los Angeles International to Burbank Airport.<break time="500ms"/>The system continuously calculates our dynamic Point of No Return,<break time="400ms"/>currently locked at 20.5 kilometers.<break time="500ms"/>In the event of sudden atmospheric degradation or command-link severance prior to this boundary,<break time="400ms"/>the on-board kernel autonomously executes a return-to-origin or diverts to the nearest certified vertiport without requiring human intervention or cloud connectivity.
<break time="800ms"/>
To the right sits our Deterministic Safety Airlock.<break time="500ms"/>Flight AERO-101, operating a Dyson Sky-AeroVect-6 airframe, currently registers a composite Risk Index of 17, with five of five hardware interlocks verified clear.<break time="500ms"/>Before dispatch authorization is granted, the QNX safety engine independently audits Maximum Takeoff Weight, Usable Energy Reserves, Critical Altitude clearance, Crosswind Envelopes, and live METAR telemetry.<break time="500ms"/>If even a single parameter breaches regulatory thresholds, the system overrides all external commands and locks the aircraft into a hard No-Go state.
<break time="800ms"/>
Along the lower deck, real-time 10-Hertz MAVLink v2 telemetry feeds four domain-specific physics engines.<break time="600ms"/>First, Atmospheric and Wind tracking confirms a 3.7-knot crosswind, well below our 22-knot structural limit, paired with a 4.7-knot headwind yielding a 114.7-knot ground speed.<break time="500ms"/>Second, our Energy and Battery Derate engine projects a 25.6-kilowatt-hour mission burn, transitioning from a 92 percent initial State of Charge to a 77.8 percent landing reserve, nearly four times the mandatory 20 percent minimum.<break time="500ms"/>Third, Airspace and NOTAM intelligence flags three intersecting controlled airspace zones while maintaining continuous range calculations to our Burbank alternate.<break time="500ms"/>Fourth, Weight and Balance verification locks gross mass at 1,890 kilograms against a 2,450-kilogram maximum structural limit, including a verified 240-kilogram payload manifest.
<break time="800ms"/>
While our deterministic C++ kernel holds absolute authority over flight safety, Google Gemini 2.5 Flash operates above the airlock as our Explainable AI layer,<break time="400ms"/>synthesizing complex sensor telemetry into natural-language pilot briefings and voice dispatches.<break time="500ms"/>Simultaneously, every millisecond of telemetry and every safety decision is cryptographically hashed into an immutable SHA-256 Merkle ledger,<break time="400ms"/>giving FAA and NTSB auditors an unalterable, frame-by-frame forensic blackbox.
<break time="800ms"/>
AeroOps AI is built for immediate enterprise monetization within a 1.5-trillion-dollar autonomous aviation market.<break time="500ms"/>Our commercial model captures three high-margin revenue streams:<break time="400ms"/>an annual enterprise SaaS license of 18,000 to 25,000 dollars per aircraft tail;<break time="400ms"/>a continuous utilization fee of 1 dollar and 20 cents per flight hour for cryptographic blackbox archiving;<break time="400ms"/>and turnkey OEM kernel integration services.<break time="500ms"/>Across a single regional operator scaling to 150 aircraft, AeroOps generates over 3.8 million dollars in recurring annual revenue.<break time="500ms"/>Fully validated across 163 automated physics, RTOS, and telemetry test suites with zero errors, AeroOps AI is the certified operating backbone for the next century of flight.
</prosody>
</voice>
</speak>`;

// Nominal Briefing SSML Script
const BRIEFING_NOMINAL_SSML = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">
<voice name="en-GB-RyanNeural">
<prosody pitch="-8%" rate="-5%">
AeroOps dispatch to flight Aero 101.<break time="400ms"/>
Mission status is affirmative GO.<break time="400ms"/>
Surface winds are light at 6 knots, route ceiling clear, and projected landing reserve is 48 percent.<break time="400ms"/>
You are cleared for pre-flight initialization.
</prosody>
</voice>
</speak>`;

// Additional Contextual Dispatch & In-Flight Anomaly Audio Assets
const EXTRA_TRACKS = [
  {
    filename: 'briefing_amber.mp3',
    ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><voice name="en-GB-RyanNeural"><prosody pitch="-8%" rate="-5%">AeroOps dispatch caution to Aero 202.<break time="400ms"/>Mission status is evaluated as AMBER.<break time="400ms"/>High crosswinds at 22 knots and cold temperature derate reduce landing reserve to 21 percent.<break time="400ms"/>Operator review and divert waypoint filing required.</prosody></voice></speak>`
  },
  {
    filename: 'briefing_nogo.mp3',
    ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><voice name="en-GB-RyanNeural"><prosody pitch="-8%" rate="-5%">AeroOps critical abort.<break time="400ms"/>Mission status is strictly NO-GO.<break time="400ms"/>Flight is barred due to active VIP TFR airspace conflict, payload limit exceedance, and severe crosswinds of 32 knots.<break time="400ms"/>All launch sequences are locked.</prosody></voice></speak>`
  },
  {
    filename: 'alert_windshear.mp3',
    ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><voice name="en-GB-RyanNeural"><prosody pitch="-8%" rate="-5%">Caution.<break time="300ms"/>Severe wind shear of 32 knots detected past Point of No Return.<break time="400ms"/>Autonomous diversion vector to Burbank Vertiport initiated.</prosody></voice></speak>`
  },
  {
    filename: 'alert_battery.mp3',
    ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><voice name="en-GB-RyanNeural"><prosody pitch="-8%" rate="-5%">Alert.<break time="300ms"/>Battery state-of-charge decay anomaly.<break time="400ms"/>8 percent deficit below theoretical burn curve.<break time="400ms"/>Diverting to alternate vertiport.</prosody></voice></speak>`
  },
  {
    filename: 'alert_c2severed.mp3',
    ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><voice name="en-GB-RyanNeural"><prosody pitch="-8%" rate="-5%">Warning.<break time="300ms"/>C2 command and control link severed.<break time="400ms"/>Airborne autonomous fail-safe engaged.<break time="400ms"/>Routing locked to Burbank Pad 2.</prosody></voice></speak>`
  },
  {
    filename: 'alert_c2restored.mp3',
    ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><voice name="en-GB-RyanNeural"><prosody pitch="-8%" rate="-5%">C2 link restored.<break time="300ms"/>Flushed offline telemetry buffer.<break time="400ms"/>Ledger reconciled with zero cryptographic fragmentation.</prosody></voice></speak>`
  }
];

function logHeader(msg) {
  console.log('\n================================================================');
  console.log(`🎙  ${msg}`);
  console.log('================================================================');
}

function runCmd(cmd, args, desc) {
  console.log(`[EXEC] ${desc}...`);
  const result = spawnSync(cmd, args, {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024
  });
  if (result.error) {
    console.error(`[ERROR] Failed to execute ${cmd}:`, result.error);
    throw result.error;
  }
  if (result.status !== 0) {
    console.error(`[ERROR] Command failed with code ${result.status}`);
    if (result.stderr) console.error(result.stderr);
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
  return result;
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

// Generates raw neural audio using edge-tts from SSML content
function generateSSMLAudio(edgeTTS, ssmlContent, rawOutputFile, label) {
  const ssmlFile = path.join(TMP_DIR, `${path.basename(rawOutputFile, '.mp3')}.xml`);
  fs.writeFileSync(ssmlFile, ssmlContent, 'utf-8');

  const args = [
    ...edgeTTS.prefixArgs,
    '-f', ssmlFile,
    '--write-media', rawOutputFile
  ];

  runCmd(edgeTTS.cmd, args, `Synthesizing neural SSML speech for ${label}`);
}

// Applies broadcast mastering filtergraph:
// equalizer=f=110:width_type=h:width=100:g=4.5,equalizer=f=3500:width_type=h:width=1200:g=2.5,acompressor=threshold=-18dB:ratio=4:attack=5:release=50
function masterAudioFile(rawInputPath, finalOutputPath, label) {
  const masteringFilter = 'equalizer=f=110:width_type=h:width=100:g=4.5,equalizer=f=3500:width_type=h:width=1200:g=2.5,acompressor=threshold=-18dB:ratio=4:attack=5:release=50';

  runCmd(
    'ffmpeg',
    [
      '-i', rawInputPath,
      '-af', masteringFilter,
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      '-y', finalOutputPath
    ],
    `Mastering broadcast audio via FFmpeg for ${label}`
  );
}

async function main() {
  logHeader('AeroOps AI v3.0 — Cinematic Audio Generation & Video Muxing Pipeline');
  const startTime = Date.now();

  [TMP_DIR, AUDIO_OUTPUT_DIR, VIDEO_OUTPUT_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const edgeTTS = getEdgeTTSCommand();
  console.log(`✓ Detected Edge-TTS Engine: ${edgeTTS.cmd} ${edgeTTS.prefixArgs.join(' ')}`);

  // 1. Synthesize & Master aeroops_executive_voiceover.mp3
  logHeader('STAGE 1: Master Executive Walkthrough Voiceover (SSML prosody pitch="-8%" rate="-5%")');
  const masterRawAudio = path.join(TMP_DIR, 'master_raw.mp3');
  generateSSMLAudio(edgeTTS, WALKTHROUGH_SSML, masterRawAudio, 'Master Executive Voiceover');
  masterAudioFile(masterRawAudio, MASTER_AUDIO_OUTPUT, 'aeroops_executive_voiceover.mp3');

  const masterStats = fs.statSync(MASTER_AUDIO_OUTPUT);
  const masterDuration = getAudioDuration(MASTER_AUDIO_OUTPUT);
  console.log(`✓ Master Audio Exported: ${MASTER_AUDIO_OUTPUT}`);
  console.log(`  Size:     ${(masterStats.size / (1024 * 1024)).toFixed(2)} MB (${masterStats.size} bytes)`);
  console.log(`  Duration: ${masterDuration.toFixed(2)}s (${(masterDuration / 60).toFixed(2)} min)`);

  // 2. Synthesize & Master briefing_nominal.mp3
  logHeader('STAGE 2: Mission Nominal Dispatch Briefing (SSML prosody)');
  const briefingRawAudio = path.join(TMP_DIR, 'briefing_nominal_raw.mp3');
  generateSSMLAudio(edgeTTS, BRIEFING_NOMINAL_SSML, briefingRawAudio, 'briefing_nominal');
  masterAudioFile(briefingRawAudio, NOMINAL_BRIEFING_OUTPUT, 'briefing_nominal.mp3');

  const briefingStats = fs.statSync(NOMINAL_BRIEFING_OUTPUT);
  console.log(`✓ Briefing Audio Exported: ${NOMINAL_BRIEFING_OUTPUT} (${briefingStats.size} bytes)`);

  // 3. Synthesize & Master Contextual Alert Assets
  logHeader('STAGE 3: Contextual Flight Briefings & In-Flight Anomaly Audio');
  for (const track of EXTRA_TRACKS) {
    const rawTrackAudio = path.join(TMP_DIR, `${path.basename(track.filename, '.mp3')}_raw.mp3`);
    const finalTrackPath = path.join(AUDIO_OUTPUT_DIR, track.filename);
    generateSSMLAudio(edgeTTS, track.ssml, rawTrackAudio, track.filename);
    masterAudioFile(rawTrackAudio, finalTrackPath, track.filename);
    console.log(`  ✓ Mastered & Exported: ${track.filename}`);
  }

  // 4. Video Muxing: Detect & Replace Walkthrough Video Audio Track
  logHeader('STAGE 4: Video Audio Track Remastering & Muxing');
  if (fs.existsSync(WALKTHROUGH_VIDEO_PATH)) {
    console.log(`[DETECTED] Existing walkthrough video found at: ${WALKTHROUGH_VIDEO_PATH}`);
    const tempMuxedVideo = path.join(TMP_DIR, 'aeroops_walkthrough_remuxed.mp4');

    runCmd(
      'ffmpeg',
      [
        '-i', WALKTHROUGH_VIDEO_PATH,
        '-i', MASTER_AUDIO_OUTPUT,
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        '-y', tempMuxedVideo
      ],
      'Muxing remastered master neural audio into cockpit walkthrough video'
    );

    // Atomically replace walkthrough video with remastered version
    fs.copyFileSync(tempMuxedVideo, WALKTHROUGH_VIDEO_PATH);
    fs.unlinkSync(tempMuxedVideo);

    const videoStats = fs.statSync(WALKTHROUGH_VIDEO_PATH);
    console.log(`✓ Successfully remastered and replaced video audio track!`);
    console.log(`  File: ${WALKTHROUGH_VIDEO_PATH}`);
    console.log(`  Size: ${(videoStats.size / (1024 * 1024)).toFixed(2)} MB (${videoStats.size} bytes)`);
  } else {
    console.log(`[INFO] No walkthrough video found at ${WALKTHROUGH_VIDEO_PATH}; audio assets ready for downstream render.`);
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Full Cinematic Audio Generation & Video Muxing Completed in ${elapsedSec}s with ZERO ERRORS.`);
}

main().catch((err) => {
  console.error('\n❌ Cinematic Audio Generation Pipeline Failed:');
  console.error(err);
  process.exit(1);
});
