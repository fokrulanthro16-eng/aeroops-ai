const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDIO_DIR = path.join(__dirname, '../public/assets/audio');
const VIDEO_DIR = path.join(__dirname, '../public/assets/video');

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

// PURE PLAIN TEXT SCRIPT (No XML tags, natural punctuation for pauses)
const walkthroughText = `Welcome to AeroOps AI Version 3.0. An institutional-grade flight readiness and autonomous risk intelligence platform engineered for commercial eVTOL and BVLOS fleet operations.

Unlike conventional cloud dashboards that remain vulnerable to network latency and probabilistic AI hallucinations, AeroOps is anchored on a deterministic BlackBerry QNX Neutrino 8.0 Real-Time Operating System kernel. Every flight-critical computation on this screen is governed by hard physics boundaries and verified to DO-178C Level A safety standards.

On the primary radar display, we are monitoring Flight AERO-101 along a 38.5-kilometer urban corridor from Los Angeles International to Burbank Airport. The system continuously calculates our dynamic Point of No Return, currently locked at 20.5 kilometers. In the event of sudden atmospheric degradation or command-link severance prior to this boundary, the on-board kernel autonomously executes a return-to-origin or diverts to the nearest certified vertiport without requiring human intervention or cloud connectivity.

To the right sits our Deterministic Safety Airlock. Flight AERO-101, operating a Dyson Sky-AeroVect-6 airframe, currently registers a composite Risk Index of 17, with five of five hardware interlocks verified clear. Before dispatch authorization is granted, the QNX safety engine independently audits Maximum Takeoff Weight, Usable Energy Reserves, Critical Altitude clearance, Crosswind Envelopes, and live METAR telemetry. If even a single parameter breaches regulatory thresholds, the system overrides all external commands and locks the aircraft into a hard No-Go state.

Along the lower deck, real-time 10-Hertz MAVLink v2 telemetry feeds four domain-specific physics engines. First, Atmospheric and Wind tracking confirms a 3.7-knot crosswind, well below our 22-knot structural limit, paired with a 4.7-knot headwind yielding a 114.7-knot ground speed. Second, our Energy and Battery Derate engine projects a 25.6-kilowatt-hour mission burn, transitioning from a 92 percent initial State of Charge to a 77.8 percent landing reserve, nearly four times the mandatory 20 percent minimum. Third, Airspace and NOTAM intelligence flags three intersecting controlled airspace zones while maintaining continuous range calculations to our Burbank alternate. Fourth, Weight and Balance verification locks gross mass at 1,890 kilograms against a 2,450-kilogram maximum structural limit, including a verified 240-kilogram payload manifest.

While our deterministic C++ kernel holds absolute authority over flight safety, Google Gemini 2.5 Flash operates above the airlock as our Explainable AI layer, synthesizing complex sensor telemetry into natural-language pilot briefings and voice dispatches. Simultaneously, every millisecond of telemetry and every safety decision is cryptographically hashed into an immutable SHA-256 Merkle ledger, giving FAA and NTSB auditors an unalterable, frame-by-frame forensic blackbox.

AeroOps AI is built for immediate enterprise monetization within a 1.5-trillion-dollar autonomous aviation market. Our commercial model captures three high-margin revenue streams: an annual enterprise SaaS license of 18,000 to 25,000 dollars per aircraft tail; a continuous utilization fee of 1 dollar and 20 cents per flight hour for cryptographic blackbox archiving; and turnkey OEM kernel integration services. Across a single regional operator scaling to 150 aircraft, AeroOps generates over 3.8 million dollars in recurring annual revenue. Fully validated across 178 automated physics, RTOS, and telemetry test suites with zero errors, AeroOps AI is the certified operating backbone for the next century of flight.`;

const briefingText = `AeroOps Dispatch Authorization confirmed. All five deterministic safety gates verified nominal under QNX 8.0 RTOS. Point of no return locked at 20.5 kilometers. Mission cleared for departure.`;

const alertTracks = [
  {
    filename: 'briefing_amber.mp3',
    text: 'Caution. Marginal meteorological conditions detected. Crosswind components approaching structural threshold. Energy reserves remain nominal. Advisory hold recommended.'
  },
  {
    filename: 'briefing_nogo.mp3',
    text: 'Warning. Deterministic safety interlock tripped. Maximum structural envelope exceeded. Autonomous dispatch lock engaged. Flight status set to hard No-Go.'
  },
  {
    filename: 'alert_windshear.mp3',
    text: 'Attention. Severe low-altitude microburst detected at 32 knots. Instantaneous Point of No Return breached. Autonomous diversion initiated to Burbank vertiport.'
  },
  {
    filename: 'alert_battery.mp3',
    text: 'Advisory. Battery cell temperature derate active. Available discharge capacity re-indexed to 78 percent. Energy envelope verified nominal for destination approach.'
  },
  {
    filename: 'alert_c2severed.mp3',
    text: 'Alert. Primary and secondary C2 command links severed. QNX autonomous airlock activated. Executing DO-178C deterministic fail-safe diversion route.'
  },
  {
    filename: 'alert_c2restored.mp3',
    text: 'Telemetry link restored. Cryptographic ledger verified zero hash fragmentation. Resuming active ground monitoring.'
  }
];

function getEdgeTTSBin() {
  const pyExePath = 'C:\\Users\\WALTON\\AppData\\Roaming\\Python\\Python314\\Scripts\\edge-tts.exe';
  if (fs.existsSync(pyExePath)) {
    return `"${pyExePath}"`;
  }
  try {
    execSync('edge-tts --version', { stdio: 'ignore' });
    return 'edge-tts';
  } catch (e) {}
  try {
    execSync('python -m edge_tts --version', { stdio: 'ignore' });
    return 'python -m edge_tts';
  } catch (e) {}
  return 'npx edge-tts';
}

function runCommand(cmd, desc) {
  console.log(`\x1b[36m[AeroOps Pipeline]\x1b[0m ${desc}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\x1b[31m[Error]\x1b[0m Failed during: ${desc}`);
    throw err;
  }
}

async function main() {
  const edgeTTS = getEdgeTTSBin();
  console.log(`[AeroOps Engine] Using Edge-TTS binary: ${edgeTTS}`);

  const txtWalkthrough = path.join(AUDIO_DIR, 'script_walkthrough.txt');
  const txtBriefing = path.join(AUDIO_DIR, 'script_briefing.txt');
  const rawWalkthrough = path.join(AUDIO_DIR, 'raw_walkthrough.mp3');
  const rawBriefing = path.join(AUDIO_DIR, 'raw_briefing.mp3');
  const finalWalkthrough = path.join(AUDIO_DIR, 'aeroops_executive_voiceover.mp3');
  const finalBriefing = path.join(AUDIO_DIR, 'briefing_nominal.mp3');

  fs.writeFileSync(txtWalkthrough, walkthroughText, 'utf8');
  fs.writeFileSync(txtBriefing, briefingText, 'utf8');

  // 1. Synthesize using pure edge-tts flags without XML tags
  runCommand(
    `${edgeTTS} --voice en-GB-RyanNeural --rate="-3%" --pitch="-2Hz" --file "${txtWalkthrough}" --write-media "${rawWalkthrough}"`,
    'Synthesizing Pure Executive British Voiceover'
  );

  runCommand(
    `${edgeTTS} --voice en-GB-RyanNeural --rate="-3%" --pitch="-2Hz" --file "${txtBriefing}" --write-media "${rawBriefing}"`,
    'Synthesizing Briefing Audio'
  );

  // 2. FFmpeg Studio Mastering Filtergraph
  const audioFilter = 'equalizer=f=120:width_type=h:width=100:g=4,equalizer=f=3200:width_type=h:width=1000:g=2,acompressor=threshold=-18dB:ratio=3.5:attack=5:release=50';

  runCommand(
    `ffmpeg -y -i "${rawWalkthrough}" -af "${audioFilter}" -b:a 192k "${finalWalkthrough}"`,
    'Mastering Audio with Studio Warmth and Compression'
  );

  runCommand(
    `ffmpeg -y -i "${rawBriefing}" -af "${audioFilter}" -b:a 192k "${finalBriefing}"`,
    'Mastering Briefing Audio'
  );

  // 2b. Synthesize and master pure plain-text alert tracks
  for (const track of alertTracks) {
    const txtAlert = path.join(AUDIO_DIR, `script_${track.filename}.txt`);
    const rawAlert = path.join(AUDIO_DIR, `raw_${track.filename}`);
    const finalAlert = path.join(AUDIO_DIR, track.filename);

    fs.writeFileSync(txtAlert, track.text, 'utf8');
    runCommand(
      `${edgeTTS} --voice en-GB-RyanNeural --rate="-3%" --pitch="-2Hz" --file "${txtAlert}" --write-media "${rawAlert}"`,
      `Synthesizing ${track.filename}`
    );
    runCommand(
      `ffmpeg -y -i "${rawAlert}" -af "${audioFilter}" -b:a 192k "${finalAlert}"`,
      `Mastering ${track.filename}`
    );

    if (fs.existsSync(txtAlert)) fs.unlinkSync(txtAlert);
    if (fs.existsSync(rawAlert)) fs.unlinkSync(rawAlert);
  }

  // 3. Mux into Walkthrough Video
  const videoInput = path.join(VIDEO_DIR, 'aeroops_cockpit_walkthrough.mp4');
  const videoOutput = path.join(VIDEO_DIR, 'aeroops_cockpit_walkthrough_temp.mp4');

  if (fs.existsSync(videoInput)) {
    runCommand(
      `ffmpeg -y -i "${videoInput}" -i "${finalWalkthrough}" -c:v copy -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 -shortest "${videoOutput}"`,
      'Muxing Mastered Audio into Walkthrough MP4'
    );

    try {
      if (fs.existsSync(videoOutput)) {
        fs.copyFileSync(videoOutput, videoInput);
        fs.unlinkSync(videoOutput);
      }
    } catch (e) {
      if (fs.existsSync(videoInput)) fs.unlinkSync(videoInput);
      fs.renameSync(videoOutput, videoInput);
    }
    console.log(`\x1b[32m✔ Video successfully updated with clear human executive voice!\x1b[0m`);
  }

  // Cleanup temporary synthesis files
  [rawWalkthrough, rawBriefing, txtWalkthrough, txtBriefing].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  console.log(`\x1b[32m✔ Audio generation and video remastering completed successfully with ZERO XML tags!\x1b[0m`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
