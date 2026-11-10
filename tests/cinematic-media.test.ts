import fs from "fs";
import path from "path";
import { MASTERCLASS_SCENES } from "../src/lib/media/cinematic-audio";

/**
 * ==============================================================================
 * AEROOPS AI v3.0 — 8K MASTERCLASS CINEMATIC VIDEO & VOICEOVER ASSETS VERIFICATION
 * ==============================================================================
 */

export function runCinematicMediaTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${message}`);
    } else {
      failed++;
      errors.push(message);
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  console.log("\n[RUNNING 8K MASTERCLASS CINEMATIC VIDEO & AUDIO PIPELINE TESTS]");

  // 1. Storyboard Manifest Verification
  const manifestPath = path.join(process.cwd(), "public", "assets", "video", "storyboard-manifest.json");
  assert(fs.existsSync(manifestPath), "public/assets/video/storyboard-manifest.json must exist");

  try {
    const rawManifest = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(rawManifest);

    assert(manifest.project.aspectRatio === "2.39:1", "Manifest aspect ratio must be 2.39:1 Anamorphic");
    assert(manifest.project.resolution.width === 7680, "Manifest resolution width must be 8K (7680 px)");
    assert(manifest.project.frameRate === 60, "Manifest frame rate must be 60 FPS");
    assert(manifest.project.totalDurationSec === 210, "Total duration must be 210 seconds (03:30)");
    assert(Array.isArray(manifest.scenes) && manifest.scenes.length === 4, "Manifest must contain exactly 4 cinematic scenes");

    // Check Scene 1
    const s1 = manifest.scenes[0];
    assert(s1.sceneId === "SCENE-01-CERTIFICATION-VOID", "Scene 1 ID must match SCENE-01-CERTIFICATION-VOID");
    assert(s1.voiceover.transcript.includes("1.5-trillion-dollar"), "Scene 1 voiceover includes 1.5-trillion-dollar frontier");
    assert(s1.videoPrompts.midjourney.includes("--ar 2.39:1"), "Scene 1 Midjourney prompt includes --ar 2.39:1 flag");
    assert(s1.videoPrompts.sora2.length > 50, "Scene 1 Sora 2 prompt must be detailed (>50 chars)");

    // Check Scene 2
    const s2 = manifest.scenes[1];
    assert(s2.sceneId === "SCENE-02-DETERMINISTIC-AIRLOCK", "Scene 2 ID must match SCENE-02-DETERMINISTIC-AIRLOCK");
    assert(s2.voiceover.transcript.includes("BlackBerry QNX 8.0 kernel"), "Scene 2 voiceover includes BlackBerry QNX 8.0 kernel");
    assert(s2.voiceover.transcript.includes("Google Gemini 2.5 Flash"), "Scene 2 voiceover includes Google Gemini 2.5 Flash");

    // Check Scene 3
    const s3 = manifest.scenes[2];
    assert(s3.sceneId === "SCENE-03-THREE-MOATS", "Scene 3 ID must match SCENE-03-THREE-MOATS");
    assert(s3.voiceover.transcript.includes("Three defensible enterprise moats"), "Scene 3 voiceover specifies three moats");
    assert(s3.voiceover.transcript.includes("135 continuous test suites"), "Scene 3 voiceover cites 135 continuous test suites");

    // Check Scene 4
    const s4 = manifest.scenes[3];
    assert(s4.sceneId === "SCENE-04-COMMERCIAL-MONOPOLY", "Scene 4 ID must match SCENE-04-COMMERCIAL-MONOPOLY");
    assert(s4.voiceover.transcript.includes("twenty-five thousand dollars annual ARR"), "Scene 4 voiceover states $25,000/yr per tail ARR");
    assert(s4.voiceover.transcript.includes("infrastructure of flight"), "Scene 4 voiceover concludes with infrastructure of flight");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    assert(false, `Manifest JSON parse error: ${message}`);
  }

  // 2. Generate Prompts Bank Verification
  const promptsPath = path.join(process.cwd(), "public", "assets", "video", "generate-prompts.txt");
  assert(fs.existsSync(promptsPath), "public/assets/video/generate-prompts.txt must exist");

  const promptsText = fs.readFileSync(promptsPath, "utf-8");
  assert(promptsText.includes("PART 1: MIDJOURNEY v6.1"), "Prompts file must contain Midjourney v6.1 section");
  assert(promptsText.includes("PART 2: OPENAI SORA 2"), "Prompts file must contain OpenAI Sora 2 section");
  assert(promptsText.includes("PART 3: RUNWAY GEN-3 ALPHA"), "Prompts file must contain Runway Gen-3 section");
  assert(promptsText.includes("PART 4: ELEVENLABS"), "Prompts file must contain ElevenLabs voiceover section");
  assert(promptsText.includes("PART 5: FOLEY & SOUND DESIGN"), "Prompts file must contain Foley & Sound Design cue sheet");

  // 3. Audio Pipeline In-Memory Scene Data
  assert(MASTERCLASS_SCENES.length === 4, "MASTERCLASS_SCENES array must contain 4 scenes");
  const totalSceneDuration = MASTERCLASS_SCENES.reduce((acc, s) => acc + s.durationSec, 0);
  assert(totalSceneDuration === 210, `Total masterclass duration must equal 210 seconds (Got ${totalSceneDuration}s)`);

  const allScenesHaveFoley = MASTERCLASS_SCENES.every((s) => s.foleyTriggers.length >= 3);
  assert(allScenesHaveFoley, "All 4 masterclass scenes must have at least 3 procedural foley sound triggers");

  return { passed, failed, errors };
}

// Direct execution via tsx
if (require.main === module) {
  const res = runCinematicMediaTests();
  console.log(`\nCinematic Media Tests: ${res.passed} passed, ${res.failed} failed.`);
  if (res.failed > 0) process.exit(1);
}
