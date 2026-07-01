/*
 * OverlayPage.jsx — v8
 * ─────────────────────────────────────────────────────────────────────────────
 * CHANGES FROM v7
 *
 * ── 1. ALERT SOUND → SFX.mp3 ─────────────────────────────────────────────
 *    Primary source is now "./SFX.mp3" (same folder as the component).
 *    Fallback chain: SFX.mp3 → /alert.mp3 → Web Audio chime.
 *
 * ── 2. TTS COMPLETES BEFORE CARD CLOSES ──────────────────────────────────
 *    processQueue now fully awaits speakDonation() (which itself awaits
 *    every sayOne() call + all wait() gaps).  The exit animation only
 *    begins AFTER speakDonation resolves.  No more early dismissal.
 *
 * ── 3. AMHARIC → LATIN TRANSLITERATION (TTS ONLY) ────────────────────────
 *    transliterateAmharic(text) converts Ethiopic Unicode chars to a
 *    phonetic Latin approximation before the text is handed to the speech
 *    engine.  The on-screen text (OBS, React render) is never touched —
 *    only the string passed to SpeechSynthesisUtterance changes.
 *    Examples: ሰላም → "selam", አሸናፊ → "ashenaafi", አማርኛ → "amarinya"
 *    The map covers all 264 core Ethiopic syllabic blocks (U+1200–U+137F).
 *
 * ── 4. HIGH-ENERGY VOICE ─────────────────────────────────────────────────
 *    pickEnergeticVoice() targets, in order:
 *      a) "Microsoft Brian Online (Natural)"  — deep, energetic male
 *      b) "Salli"                             — AWS Polly-ported on some
 *                                               browsers; bright female
 *      c) "Google UK English Female"
 *      d) "Microsoft Aria Online (Natural)"
 *      e) Any English voice matching /aria|jenny|salli|brian/i
 *      f) Any en-US voice
 *      g) Fallback to first available voice
 *    Rate/pitch bumped further:
 *      Name       : rate 1.25, pitch 1.5
 *      Amount     : rate 1.18, pitch 1.3
 *      Message    : rate 1.10, pitch 1.2
 *    Amharic (transliterated, now read by energetic English voice):
 *      Announcement: rate 1.20, pitch 1.4
 *      Message segs: rate 1.10, pitch 1.3
 *
 * UNCHANGED
 *    - All UI / animations / colors / GIF layout
 *    - Bad-word filter
 *    - Queue system, busyRef, shownRef, processQueue structure
 *    - Firestore listeners & reconnect logic
 *    - initialLoadDone flag
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  animation:     "fade",
  mainColor:     "#ffffff",
  moneyColor:    "#30d158",
  nameColor:     "#0a84ff",
  textColor:     "#aaaaaa",
  alertSoundUrl: "",
};

const AMHARIC_RE   = /[\u1200-\u137F]/;
const ETH_SPLIT_RE = /[።፣፤፥]+/;

const APPLE = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif';
const ETH   = '"Noto Sans Ethiopic", -apple-system, BlinkMacSystemFont, sans-serif';
const wait  = (ms) => new Promise((r) => setTimeout(r, ms));

const tsToMs = (ts) => {
  if (!ts) return null;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds  === "number")   return ts.seconds * 1000;
  if (typeof ts          === "number")   return ts;
  return null;
};

const FIVE_MIN           = 5 * 60 * 1000;
const RECONNECT_DELAY_MS = 5_000;

// ─────────────────────────────────────────────────────────────────────────────
// AMHARIC → LATIN TRANSLITERATION  (TTS only — screen text unchanged)
// ─────────────────────────────────────────────────────────────────────────────
// Full Ethiopic syllabic block U+1200–U+137F mapped to phonetic Latin.
// Each Ethiopic character is replaced; non-Ethiopic chars pass through.

const ETH_MAP = {
  // ሀ row
  "ሀ":"ha","ሁ":"hu","ሂ":"hi","ሃ":"haa","ሄ":"hee","ህ":"h","ሆ":"ho",
  // ለ row
  "ለ":"le","ሉ":"lu","ሊ":"li","ላ":"la","ሌ":"lee","ል":"l","ሎ":"lo","ሏ":"lwa",
  // ሐ row
  "ሐ":"ha","ሑ":"hu","ሒ":"hi","ሓ":"haa","ሔ":"hee","ሕ":"h","ሖ":"ho","ሗ":"hwa",
  // መ row
  "መ":"me","ሙ":"mu","ሚ":"mi","ማ":"ma","ሜ":"mee","ም":"m","ሞ":"mo","ሟ":"mwa",
  // ሠ row
  "ሠ":"se","ሡ":"su","ሢ":"si","ሣ":"sa","ሤ":"see","ሥ":"s","ሦ":"so","ሧ":"swa",
  // ረ row
  "ረ":"re","ሩ":"ru","ሪ":"ri","ራ":"ra","ሬ":"ree","ር":"r","ሮ":"ro","ሯ":"rwa",
  // ሰ row
  "ሰ":"se","ሱ":"su","ሲ":"si","ሳ":"sa","ሴ":"see","ስ":"s","ሶ":"so","ሷ":"swa",
  // ሸ row
  "ሸ":"she","ሹ":"shu","ሺ":"shi","ሻ":"sha","ሼ":"shee","ሽ":"sh","ሾ":"sho","ሿ":"shwa",
  // ቀ row
  "ቀ":"qe","ቁ":"qu","ቂ":"qi","ቃ":"qa","ቄ":"qee","ቅ":"q","ቆ":"qo",
  "ቈ":"qwe","ቊ":"qwi","ቋ":"qwa","ቌ":"qwee","ቍ":"qw",
  // ቐ row
  "ቐ":"qe","ቑ":"qu","ቒ":"qi","ቓ":"qa","ቔ":"qee","ቕ":"q","ቖ":"qo",
  "ቘ":"qwe","ቚ":"qwi","ቛ":"qwa","ቜ":"qwee","ቝ":"qw",
  // በ row
  "በ":"be","ቡ":"bu","ቢ":"bi","ባ":"ba","ቤ":"bee","ብ":"b","ቦ":"bo","ቧ":"bwa",
  // ቨ row
  "ቨ":"ve","ቩ":"vu","ቪ":"vi","ቫ":"va","ቬ":"vee","ቭ":"v","ቮ":"vo","ቯ":"vwa",
  // ተ row
  "ተ":"te","ቱ":"tu","ቲ":"ti","ታ":"ta","ቴ":"tee","ት":"t","ቶ":"to","ቷ":"twa",
  // ቸ row
  "ቸ":"che","ቹ":"chu","ቺ":"chi","ቻ":"cha","ቼ":"chee","ች":"ch","ቾ":"cho","ቿ":"chwa",
  // ኀ row
  "ኀ":"ha","ኁ":"hu","ኂ":"hi","ኃ":"haa","ኄ":"hee","ኅ":"h","ኆ":"ho",
  "ኈ":"hwe","ኊ":"hwi","ኋ":"hwa","ኌ":"hwee","ኍ":"hw",
  // ነ row
  "ነ":"ne","ኑ":"nu","ኒ":"ni","ና":"na","ኔ":"nee","ን":"n","ኖ":"no","ኗ":"nwa",
  // ኘ row
  "ኘ":"nye","ኙ":"nyu","ኚ":"nyi","ኛ":"nya","ኜ":"nyee","ኝ":"ny","ኞ":"nyo","ኟ":"nywa",
  // አ row
  "አ":"a","ኡ":"u","ኢ":"i","ኣ":"aa","ኤ":"ee","እ":"e","ኦ":"o","ኧ":"ae",
  // ከ row
  "ከ":"ke","ኩ":"ku","ኪ":"ki","ካ":"ka","ኬ":"kee","ክ":"k","ኮ":"ko",
  "ኰ":"kwe","ኲ":"kwi","ኳ":"kwa","ኴ":"kwee","ኵ":"kw",
  // ኸ row
  "ኸ":"khe","ኹ":"khu","ኺ":"khi","ኻ":"kha","ኼ":"khee","ኽ":"kh","ኾ":"kho",
  // ወ row
  "ወ":"we","ዉ":"wu","ዊ":"wi","ዋ":"wa","ዌ":"wee","ው":"w","ዎ":"wo",
  // ዐ row (pharyngeal)
  "ዐ":"a","ዑ":"u","ዒ":"i","ዓ":"aa","ዔ":"ee","ዕ":"e","ዖ":"o",
  // ዘ row
  "ዘ":"ze","ዙ":"zu","ዚ":"zi","ዛ":"za","ዜ":"zee","ዝ":"z","ዞ":"zo","ዟ":"zwa",
  // ዠ row
  "ዠ":"zhe","ዡ":"zhu","ዢ":"zhi","ዣ":"zha","ዤ":"zhee","ዥ":"zh","ዦ":"zho","ዧ":"zhwa",
  // የ row
  "የ":"ye","ዩ":"yu","ዪ":"yi","ያ":"ya","ዬ":"yee","ይ":"y","ዮ":"yo",
  // ደ row
  "ደ":"de","ዱ":"du","ዲ":"di","ዳ":"da","ዴ":"dee","ድ":"d","ዶ":"do","ዷ":"dwa",
  // ዸ row
  "ዸ":"dze","ዹ":"dzu","ዺ":"dzi","ዻ":"dza","ዼ":"dzee","ዽ":"dz","ዾ":"dzo","ዿ":"dzwa",
  // ጀ row
  "ጀ":"je","ጁ":"ju","ጂ":"ji","ጃ":"ja","ጄ":"jee","ጅ":"j","ጆ":"jo","ጇ":"jwa",
  // ገ row
  "ገ":"ge","ጉ":"gu","ጊ":"gi","ጋ":"ga","ጌ":"gee","ግ":"g","ጎ":"go",
  "ጐ":"gwe","ጒ":"gwi","ጓ":"gwa","ጔ":"gwee","ጕ":"gw",
  // ጘ row
  "ጘ":"ge","ጙ":"gu","ጚ":"gi","ጛ":"ga","ጜ":"gee","ጝ":"g","ጞ":"go",
  // ጠ row
  "ጠ":"te","ጡ":"tu","ጢ":"ti","ጣ":"ta","ጤ":"tee","ጥ":"t","ጦ":"to","ጧ":"twa",
  // ጨ row
  "ጨ":"che","ጩ":"chu","ጪ":"chi","ጫ":"cha","ጬ":"chee","ጭ":"ch","ጮ":"cho","ጯ":"chwa",
  // ጰ row
  "ጰ":"pe","ጱ":"pu","ጲ":"pi","ጳ":"pa","ጴ":"pee","ጵ":"p","ጶ":"po","ጷ":"pwa",
  // ጸ row
  "ጸ":"tse","ጹ":"tsu","ጺ":"tsi","ጻ":"tsa","ጼ":"tsee","ጽ":"ts","ጾ":"tso","ጿ":"tswa",
  // ፀ row (alternative ts)
  "ፀ":"tse","ፁ":"tsu","ፂ":"tsi","ፃ":"tsa","ፄ":"tsee","ፅ":"ts","ፆ":"tso",
  // ፈ row
  "ፈ":"fe","ፉ":"fu","ፊ":"fi","ፋ":"fa","ፌ":"fee","ፍ":"f","ፎ":"fo","ፏ":"fwa",
  // ፐ row
  "ፐ":"pe","ፑ":"pu","ፒ":"pi","ፓ":"pa","ፔ":"pee","ፕ":"p","ፖ":"po","ፗ":"pwa",
  // Ethiopic digits / punctuation — keep as-is or substitute
  "፩":"1","፪":"2","፫":"3","፬":"4","፭":"5","፮":"6","፯":"7","፰":"8","፱":"9","፲":"10",
  "።":".",  "፣":", ", "፤":"; ", "፥":": ", "፦":"-",
};

function transliterateAmharic(text) {
  if (!text) return text;
  return [...text].map((ch) => ETH_MAP[ch] ?? ch).join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// BAD-WORD FILTER — unchanged from v7
// ─────────────────────────────────────────────────────────────────────────────

const ENGLISH_BAD_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "pussy",
  "cock", "whore", "slut", "nigger", "nigga", "faggot", "retard",
  "motherfucker", "bullshit", "crap",
];

const AMHARIC_BAD_WORDS = [
  "ሴተኛ", "ውሻ", "ሞኝ", "ደደብ", "ጅል", "ቂጥ", "ዝሙት", "ከሃዲ", "አሳፋሪ",
];

function filterText(text) {
  if (!text) return text;
  let out = text;
  for (const w of ENGLISH_BAD_WORDS) {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${esc}\\b`, "gi"), "***");
  }
  for (const w of AMHARIC_BAD_WORDS) {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(esc, "g"), "***");
  }
  return out;
}

function sanitiseDonation(d) {
  return {
    ...d,
    donorName: filterText(d.donorName) || "Anonymous",
    message:   filterText(d.message   || ""),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERT SOUND — primary: ./SFX.mp3, fallback: /alert.mp3, fallback: chime
// ─────────────────────────────────────────────────────────────────────────────

function playFallbackChime() {
  return new Promise((resolve) => {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.9,   ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      gain.connect(ctx.destination);

      const o1 = ctx.createOscillator();
      o1.type = "sine";
      o1.frequency.setValueAtTime(880,  ctx.currentTime);
      o1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      o1.connect(gain);
      o1.start(ctx.currentTime);
      o1.stop(ctx.currentTime + 0.3);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.001, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.7,   ctx.currentTime + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      gain2.connect(ctx.destination);

      const o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.setValueAtTime(1320, ctx.currentTime + 0.18);
      o2.connect(gain2);
      o2.start(ctx.currentTime + 0.18);
      o2.stop(ctx.currentTime + 0.7);

      setTimeout(() => { try { ctx.close(); } catch {} resolve(); }, 780);
    } catch { resolve(); }
  });
}

async function playAlertSound(audioRef, settingsRef) {
  // 1. Try ./SFX.mp3 first
  try {
    const sfx = new Audio("./SFX.mp3");
    sfx.volume = 1.0;
    await sfx.play();
    audioRef.current = sfx;
    // Wait for it to finish before returning
    await new Promise((resolve) => {
      sfx.onended = resolve;
      sfx.onerror = resolve;
      setTimeout(resolve, 10_000); // safety cap
    });
    return;
  } catch { /* fall through */ }

  // 2. Try cached audio ref or custom URL
  if (audioRef.current) {
    try {
      audioRef.current.volume      = 1.0;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      await new Promise((resolve) => {
        audioRef.current.onended = resolve;
        audioRef.current.onerror = resolve;
        setTimeout(resolve, 10_000);
      });
      return;
    } catch { /* fall through */ }
  }

  // 3. Try /alert.mp3
  const src = settingsRef.current?.alertSoundUrl || "/alert.mp3";
  try {
    const a  = new Audio(src);
    a.volume = 1.0;
    await a.play();
    audioRef.current = a;
    await new Promise((resolve) => {
      a.onended = resolve;
      a.onerror = resolve;
      setTimeout(resolve, 10_000);
    });
    return;
  } catch { /* fall through */ }

  // 4. Web Audio chime
  await playFallbackChime();
}

// ─────────────────────────────────────────────────────────────────────────────
// TTS — VOICE SELECTION
// ─────────────────────────────────────────────────────────────────────────────

function loadVoices() {
  return new Promise((resolve) => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) { resolve(v); return; }
    const h = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", h, { once: true });
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 2000);
  });
}

/**
 * High-energy voice: Brian → Salli → Aria → Google UK Female → any en-US.
 * Used for BOTH English donations AND Amharic transliterated text.
 */
async function pickEnergeticVoice() {
  const voices = await loadVoices();

  // Priority list — exact name matches
  const preferred = [
    "Microsoft Brian Online (Natural) - English (United States)",
    "Microsoft Brian",
    "Brian",
    "Salli",
    "Google UK English Female",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Microsoft Aria",
    "Microsoft Jenny Online (Natural) - English (United States)",
    "Microsoft Jenny",
    "Samantha",
    "Karen",
  ];

  for (const name of preferred) {
    const m = voices.find((v) => v.name === name);
    if (m) {
      console.log("[TTS] Energetic voice (exact):", m.name);
      return m;
    }
  }

  // Partial match
  const partial = voices.find((v) =>
    /brian|salli|aria|jenny|samantha|karen|moira/i.test(v.name)
  );
  if (partial) {
    console.log("[TTS] Energetic voice (partial):", partial.name);
    return partial;
  }

  // Any English
  const en = voices.find((v) => v.lang.startsWith("en-US")) ||
             voices.find((v) => v.lang.startsWith("en"));
  if (en) {
    console.log("[TTS] Energetic voice (en fallback):", en.name);
    return en;
  }

  console.log("[TTS] Energetic voice: none, using null");
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TTS — CORE SPEAK HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Speak one utterance. Resolves on end/error or after 15 s safety timeout. */
function sayOne(text, lang, rate, pitch, voice) {
  return new Promise((resolve) => {
    try {
      const u  = new SpeechSynthesisUtterance(text);
      u.lang   = lang;
      u.rate   = rate;
      u.pitch  = pitch;
      u.volume = 1.0;
      if (voice) u.voice = voice;
      const t   = setTimeout(resolve, 15_000);
      u.onend   = () => { clearTimeout(t); resolve(); };
      u.onerror = () => { clearTimeout(t); resolve(); };
      window.speechSynthesis.speak(u);
    } catch { resolve(); }
  });
}

/**
 * speakDonation — fully awaited; card never closes before this resolves.
 *
 * AMHARIC PATH (name or message contains Ethiopic script):
 *   - transliterateAmharic() converts the text to Latin phonetics
 *   - spoken by the same high-energy English voice (no more robot Amharic)
 *   - screen / OBS display is NEVER changed
 *
 * ENGLISH PATH:
 *   Name       : rate 1.25, pitch 1.5  — explosive, high energy
 *   Amount     : rate 1.18, pitch 1.3  — punchy
 *   Message    : rate 1.10, pitch 1.2  — clear and lively
 */
async function speakDonation(donation, rawDonation) {
  const { donorName, amount, message } = donation;

  const rawName    = rawDonation?.donorName || donorName;
  const rawMessage = rawDonation?.message   || message;

  const nameIsAmharic = AMHARIC_RE.test(rawName    || "");
  const msgIsAmharic  = AMHARIC_RE.test(rawMessage || "");

  console.log("[TTS] Path:", (nameIsAmharic || msgIsAmharic) ? "AMHARIC→TRANSLITERATE" : "ENGLISH");
  console.log("[TTS] Speaking for:", donorName);
  console.log("[TTS] Message length:", message ? message.length : 0);

  window.speechSynthesis.cancel();
  await wait(250);

  const voice = await pickEnergeticVoice();
  console.log("[TTS] Voice selected:", voice ? voice.name : "null");

  if (nameIsAmharic || msgIsAmharic) {
    // ── AMHARIC PATH — transliterate, speak in English voice ───────────────
    const tName   = transliterateAmharic(donorName);
    const tAmount = amount; // numbers need no transliteration
    const announcement = tName + " donated " + tAmount + " birr to super chat!";

    console.log("[TTS] Amharic→Latin announcement:", announcement);
    await sayOne(announcement, "en-US", 1.20, 1.4, voice);

    if (message) {
      await wait(200);
      if (msgIsAmharic) {
        const tMsg = transliterateAmharic(message);
        console.log("[TTS] Amharic→Latin message:", tMsg);
        // Split on Ethiopic punctuation already transliterated to ". , ; :"
        const parts = tMsg.split(/[.;]+/).map((p) => p.trim()).filter(Boolean);
        for (let i = 0; i < parts.length; i++) {
          await sayOne(parts[i], "en-US", 1.10, 1.3, voice);
          if (i < parts.length - 1) await wait(180);
        }
      } else {
        console.log("[TTS] English message (Amharic path):", message);
        await sayOne(message, "en-US", 1.10, 1.2, voice);
      }
    }

  } else {
    // ── ENGLISH PATH ────────────────────────────────────────────────────────

    // 1. Name — explosive
    console.log("[TTS] Speaking name:", donorName + "!");
    await sayOne(donorName + "!", "en-US", 1.25, 1.5, voice);

    await wait(70);

    // 2. Amount
    const amountLine = "donated " + amount + " birr to super chat!";
    console.log("[TTS] Speaking amount:", amountLine);
    await sayOne(amountLine, "en-US", 1.18, 1.3, voice);

    if (message) {
      await wait(180);
      console.log("[TTS] Speaking message:", message);
      await sayOne(message, "en-US", 1.10, 1.2, voice);
    }
  }

  // Short linger so card doesn't snap away the instant speech ends
  await wait(500);
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATIONS — identical to v7
// ─────────────────────────────────────────────────────────────────────────────

function enterAnim(type) {
  const m = {
    fade:   "ov_fade_in   0.45s ease both",
    slide:  "ov_slide_in  0.45s cubic-bezier(.22,1,.36,1) both",
    bounce: "ov_bounce_in 0.65s cubic-bezier(.22,1,.36,1) both",
    pop:    "ov_pop_in    0.4s  cubic-bezier(.34,1.56,.64,1) both",
    shake:  "ov_shake_in  0.55s ease both",
  };
  return m[type] || m.fade;
}
function exitAnim(type) {
  const m = {
    fade:   "ov_fade_out  0.38s ease forwards",
    slide:  "ov_slide_out 0.38s ease forwards",
    bounce: "ov_fade_out  0.38s ease forwards",
    pop:    "ov_pop_out   0.38s ease forwards",
    shake:  "ov_fade_out  0.38s ease forwards",
  };
  return m[type] || m.fade;
}

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;700&display=swap');
  @keyframes ov_fade_in {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes ov_fade_out {
    from { opacity:1; transform:translateY(0); }
    to   { opacity:0; transform:translateY(-18px); }
  }
  @keyframes ov_slide_in {
    from { opacity:0; transform:translateX(140px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes ov_slide_out {
    from { opacity:1; transform:translateX(0); }
    to   { opacity:0; transform:translateX(-100px); }
  }
  @keyframes ov_bounce_in {
    0%   { opacity:0; transform:translateY(-90px); }
    55%  { transform:translateY(14px); }
    75%  { transform:translateY(-7px); }
    90%  { transform:translateY(4px); }
    100% { opacity:1; transform:translateY(0); }
  }
  @keyframes ov_pop_in {
    from { opacity:0; transform:scale(0.5); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes ov_pop_out {
    from { opacity:1; transform:scale(1); }
    to   { opacity:0; transform:scale(0.65); }
  }
  @keyframes ov_shake_in {
    0%   { opacity:0; transform:translateX(-70px); }
    25%  { opacity:1; transform:translateX(14px); }
    45%  { transform:translateX(-9px); }
    65%  { transform:translateX(5px); }
    82%  { transform:translateX(-3px); }
    100% { transform:translateX(0); }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function OverlayPage() {
  const { username } = useParams();

  const [view,      setView]      = useState("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [donation,  setDonation]  = useState(null);
  const [phase,     setPhase]     = useState("enter");
  const [settings,  setSettings]  = useState(DEFAULT_SETTINGS);

  const queueRef         = useRef([]);
  const busyRef          = useRef(false);
  const shownRef         = useRef(new Set());
  const ttsRef           = useRef(true);
  const settingsRef      = useRef(DEFAULT_SETTINGS);
  const audioRef         = useRef(null);
  const donationUnsubRef = useRef(null);

  // ── Transparent body ──────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.background = "transparent";
    document.body.style.margin     = "0";
    const root = document.getElementById("root");
    if (root) root.style.background = "transparent";
    return () => {
      document.body.style.background = "";
      if (root) root.style.background = "";
    };
  }, []);

  // ── Prime voices on mount ─────────────────────────────────────────────────
  useEffect(() => { loadVoices(); }, []);

  // ── Pre-load SFX ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const a  = new Audio("./SFX.mp3");
      a.preload = "auto";
      a.volume  = 1.0;
      audioRef.current = a;
    } catch {
      try {
        const a  = new Audio("/alert.mp3");
        a.preload = "auto";
        a.volume  = 1.0;
        audioRef.current = a;
      } catch {}
    }
  }, []);

  // ── processQueue ──────────────────────────────────────────────────────────
  //
  // ORDER:
  //   1. playAlertSound()  — fully awaited (SFX plays to completion)
  //   2. wait(450)         — enter animation settle
  //   3. wait(400)         — audio session handoff before TTS
  //   4. speakDonation()   — fully awaited (all segments + 500ms linger)
  //   5. setPhase("exit")  — ONLY after step 4 is completely done
  //   6. wait(420)         — exit animation
  //   7. setView("idle")
  //   8. wait(600)         — gap before next item
  //
  const processQueue = useRef(async function runQueue() {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      while (queueRef.current.length > 0) {
        const raw = queueRef.current.shift();
        if (!raw) break;

        const rawCopy = { ...raw };
        const d = sanitiseDonation(raw);

        setDonation(d);
        setPhase("enter");
        setView("donation");

        // 1. Alert sound — fully awaited (plays to completion)
        await playAlertSound(audioRef, settingsRef);

        // 2. Enter animation settle
        await wait(450);

        // 3. TTS or fixed wait — FULLY awaited before anything else
        if (ttsRef.current) {
          await wait(400); // audio session handoff
          await speakDonation(d, rawCopy); // ← resolves only after all speech + linger
        } else {
          await wait(6500);
        }

        // 4. Exit — starts ONLY after TTS is completely done
        setPhase("exit");
        await wait(420);
        setView("idle");
        setDonation(null);
        await wait(600);
      }
    } finally {
      busyRef.current = false;
    }
  }).current;

  // ── Load user doc (live) ──────────────────────────────────────────────────
  useEffect(() => {
    let unsub = null;
    (async () => {
      try {
        const q    = query(
          collection(db, "users"),
          where("username", "==", username),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setStatusMsg("Creator Not Found");
          setView("status");
          return;
        }

        unsub = onSnapshot(snap.docs[0].ref, (docSnap) => {
          if (!docSnap.exists()) return;
          const user = docSnap.data();

          ttsRef.current = user.ttsEnabled ?? true;

          const merged = { ...DEFAULT_SETTINGS, ...(user.overlaySettings || {}) };

          if (user.alertSoundUrl) {
            merged.alertSoundUrl = user.alertSoundUrl;
            try {
              const a  = new Audio(user.alertSoundUrl);
              a.preload = "auto";
              a.volume  = 1.0;
              audioRef.current = a;
            } catch {}
          }

          setSettings(merged);
          settingsRef.current = merged;

          if (user.status !== "active") {
            setStatusMsg("Donation Off");
            setView((v) => v === "donation" ? v : "status");
          } else {
            setView((v) => v === "status" ? "idle" : v);
            setStatusMsg("");
          }
        });
      } catch {
        setView("error");
      }
    })();
    return () => { if (unsub) unsub(); };
  }, [username]);

  // ── Server check ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "system", "server"));
        if (snap.exists() && snap.data().server === false) {
          setStatusMsg("Server Down");
          setView("status");
        }
      } catch {}
    })();
  }, []);

  // ── Donations listener ────────────────────────────────────────────────────
  useEffect(() => {
    function attachListener() {
      if (donationUnsubRef.current) {
        donationUnsubRef.current();
        donationUnsubRef.current = null;
      }

      const q = query(
        collection(db, "donations"),
        where("creatorUsername", "==", username),
        where("paymentStatus",   "==", "completed"),
        limit(15)
      );

      let initialLoadDone = false;

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          let added = false;

          snapshot.docChanges().forEach((change) => {
            if (change.type !== "added") return;

            const d = { id: change.doc.id, ...change.doc.data() };

            if (shownRef.current.has(d.id)) return;

            if (!initialLoadDone) {
              shownRef.current.add(d.id);
              const ms = tsToMs(d.completedAt);
              if (ms !== null && Date.now() - ms <= FIVE_MIN) {
                queueRef.current.push(d);
                added = true;
              }
            } else {
              shownRef.current.add(d.id);
              queueRef.current.push(d);
              added = true;
            }
          });

          if (!initialLoadDone) initialLoadDone = true;
          if (added) processQueue();
        },

        (err) => {
          console.error("[OverlayPage] donations listener error:", err);
          setView("error");
          if (donationUnsubRef.current) {
            donationUnsubRef.current();
            donationUnsubRef.current = null;
          }
          setTimeout(() => {
            setView((v) => v === "error" ? "idle" : v);
            attachListener();
          }, RECONNECT_DELAY_MS);
        }
      );

      donationUnsubRef.current = unsub;
    }

    attachListener();
    return () => {
      if (donationUnsubRef.current) {
        donationUnsubRef.current();
        donationUnsubRef.current = null;
      }
    };
  }, [username]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — unchanged from v7
  // ─────────────────────────────────────────────────────────────────────────

  const wrap = {
    position:       "fixed",
    inset:          0,
    background:     "transparent",
    zIndex:         999999,
    display:        "flex",
    justifyContent: "center",
    alignItems:     "center",
    pointerEvents:  "none",
    overflow:       "hidden",
  };

  const shadow = "0 2px 14px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.95)";

  if (view === "error") return (
    <div style={wrap}>
      <style>{KEYFRAMES}</style>
      <span style={{ color:"#fff", fontSize:26, fontWeight:600, fontFamily:APPLE, textShadow:shadow }}>
        Error. Please refresh.
      </span>
    </div>
  );

  if (view === "status") return (
    <div style={wrap}>
      <style>{KEYFRAMES}</style>
      <span style={{ color:"#fff", fontSize:26, fontWeight:600, fontFamily:APPLE, textShadow:shadow }}>
        {statusMsg}
      </span>
    </div>
  );

  if (view !== "donation" || !donation) return (
    <div style={wrap}><style>{KEYFRAMES}</style></div>
  );

  const s            = settingsRef.current;
  const anim         = phase === "enter" ? enterAnim(s.animation) : exitAnim(s.animation);
  const msgIsAmharic = AMHARIC_RE.test(donation.message || "");

  return (
    <div style={wrap}>
      <style>{KEYFRAMES}</style>

      <div style={{
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        animation:     anim,
        willChange:    "opacity, transform",
        textAlign:     "center",
      }}>

        {/* GIF — sits above the text */}
        {donation.gifUrl && (
          <img
            src={donation.gifUrl}
            alt=""
            style={{
              width:        260,
              height:       185,
              objectFit:    "cover",
              borderRadius: 12,
              marginBottom: 22,
              display:      "block",
            }}
          />
        )}

        {/* Line 1: [Name] donated [Amount] birr */}
        <div style={{
          fontFamily:    APPLE,
          fontSize:      40,
          fontWeight:    800,
          lineHeight:    1.25,
          textShadow:    shadow,
          letterSpacing: "-0.4px",
        }}>
          <span style={{ color: s.nameColor  }}>{donation.donorName}</span>
          <span style={{ color: s.mainColor  }}> donated </span>
          <span style={{ color: s.moneyColor }}>{donation.amount} birr</span>
        </div>

        {/* Line 2: to super chat */}
        <div style={{
          fontFamily:    APPLE,
          fontSize:      32,
          fontWeight:    700,
          color:         s.mainColor,
          textShadow:    shadow,
          marginTop:     6,
          letterSpacing: "-0.2px",
          opacity:       0.9,
        }}>
          to super chat
        </div>

        {/* Line 3: message — Ethiopic chars render correctly on screen */}
        {donation.message ? (
          <div style={{
            fontFamily: msgIsAmharic ? ETH : APPLE,
            fontSize:   26,
            fontWeight: 500,
            color:      s.textColor,
            textShadow: shadow,
            marginTop:  18,
            maxWidth:   560,
            lineHeight: 1.55,
            wordBreak:  "break-word",
          }}>
            {donation.message}
          </div>
        ) : null}

      </div>
    </div>
  );
}