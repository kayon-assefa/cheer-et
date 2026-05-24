import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  animation: "fade",
  mainColor: "#ffffff",
  moneyColor: "#30d158",
  nameColor: "#0a84ff",
  textColor: "#aaaaaa",
};

const AMHARIC_RE = /[\u1200-\u137F]/;
const APPLE = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif';
const ETH   = '"Noto Sans Ethiopic", -apple-system, BlinkMacSystemFont, sans-serif';
const wait  = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// TTS
// ─────────────────────────────────────────────────────────────────────────────

function loadVoices() {
  return new Promise((resolve) => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) { resolve(v); return; }
    const handler = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 2000);
  });
}

async function pickFemaleVoice() {
  const voices = await loadVoices();
  const order = [
    "Google UK English Female",
    "Microsoft Zira Desktop",
    "Microsoft Zira",
    "Samantha",
    "Karen",
    "Moira",
    "Tessa",
    "Victoria",
    "Google US English",
  ];
  for (const name of order) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }
  return (
    voices.find((v) => /female|woman|zira|samantha|karen|moira/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0] ||
    null
  );
}

function sayOne(text, lang, rate, pitch, voice) {
  return new Promise((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang  = lang;
      u.rate  = rate;
      u.pitch = pitch;
      if (voice) u.voice = voice;
      const t = setTimeout(resolve, 15000);
      u.onend  = () => { clearTimeout(t); resolve(); };
      u.onerror = () => { clearTimeout(t); resolve(); };
      window.speechSynthesis.speak(u);
    } catch { resolve(); }
  });
}

async function speakDonation(donation) {
  const { donorName, amount, message } = donation;
  const msgIsAmharic  = AMHARIC_RE.test(message  || "");
  const nameIsAmharic = AMHARIC_RE.test(donorName || "");

  window.speechSynthesis.cancel();
  await wait(120);

  const femaleVoice = await pickFemaleVoice();

  if (nameIsAmharic || msgIsAmharic) {
    await sayOne(
      `${donorName} ሱፐር ቻት ላይ ${amount} ብር ለገሱ!`,
      "am-ET", 1.05, 1.3, null
    );
    if (message) {
      await wait(300);
      await sayOne(
        message,
        msgIsAmharic ? "am-ET" : "en-US",
        1.0, 1.25,
        msgIsAmharic ? null : femaleVoice
      );
    }
  } else {
    await sayOne(`${donorName}!`, "en-US", 1.08, 1.4, femaleVoice);
    await wait(100);
    await sayOne(`donated ${amount} birr to super chat!`, "en-US", 1.05, 1.3, femaleVoice);
    if (message) {
      await wait(300);
      await sayOne(message, "en-US", 0.97, 1.2, femaleVoice);
    }
  }

  await wait(600);
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATIONS
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

  // All mutable state lives in refs so closures are never stale
  const queueRef      = useRef([]);
  const processingRef = useRef(false);
  const shownRef      = useRef(new Set());
  const ttsRef        = useRef(true);
  const settingsRef   = useRef(DEFAULT_SETTINGS);
  const audioRef      = useRef(null);

  // ── Transparent body ──────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.background = "transparent";
    document.body.style.margin = "0";
    const root = document.getElementById("root");
    if (root) root.style.background = "transparent";
    return () => {
      document.body.style.background = "";
      if (root) root.style.background = "";
    };
  }, []);

  // ── Prime voices on mount ─────────────────────────────────────────────────
  useEffect(() => { loadVoices(); }, []);

  // ── Alert sound ───────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const a = new Audio("/alert.mp3");
      a.preload = "auto";
      audioRef.current = a;
    } catch {}
  }, []);

  // ── processQueue — defined as a ref so it's ALWAYS stable, never stale ───
  //
  // This is the key fix. Instead of useCallback (which can be stale in
  // closures), we store the function in a ref. The function reads all its
  // dependencies from other refs (queueRef, ttsRef, etc.) which are always
  // current. React state setters (setDonation, setPhase, setView) are also
  // always stable.
  //
  const processQueue = useRef(async function runQueue() {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const d = queueRef.current.shift();

      setDonation(d);
      setPhase("enter");
      setView("donation");

      // Alert sound
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          await audioRef.current.play().catch(() => {});
        }
      } catch {}

      await wait(650);

      if (ttsRef.current) {
        await speakDonation(d);
      } else {
        await wait(4350); // 5s total with enter anim
      }

      setPhase("exit");
      await wait(420);
      setView("idle");
      setDonation(null);
      await wait(500);
    }

    processingRef.current = false;
  }).current; // .current gives us the function directly

  // ── Load user (live listener so settings update without refresh) ──────────
  useEffect(() => {
    let unsub = null;
    (async () => {
      try {
        const q = query(
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

        // Live listener on user doc — picks up ttsEnabled + status changes instantly
        unsub = onSnapshot(snap.docs[0].ref, (docSnap) => {
          if (!docSnap.exists()) return;
          const user = docSnap.data();

          ttsRef.current = user.ttsEnabled ?? true;

          const merged = { ...DEFAULT_SETTINGS, ...(user.overlaySettings || {}) };
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
  //
  // processQueue is a plain ref function — no stale closure possible.
  // Works for both the initial snapshot batch AND new incoming donations.
  //
  useEffect(() => {
    const FIVE_MIN = 5 * 60 * 1000;

    const q = query(
      collection(db, "donations"),
      where("creatorUsername", "==", username)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        let added = false;

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;

          const d = { id: change.doc.id, ...change.doc.data() };

          if (d.paymentStatus !== "completed") return;
          if (shownRef.current.has(d.id)) return;

          // Timestamp to ms
          const ms = d.completedAt?.toMillis
            ? d.completedAt.toMillis()
            : d.completedAt?.seconds
              ? d.completedAt.seconds * 1000
              : null;

          // Skip if older than 5 minutes
          if (ms !== null && Date.now() - ms > FIVE_MIN) return;

          shownRef.current.add(d.id);
          queueRef.current.push(d);
          added = true;
        });

        // Call once after processing all changes in this batch
        if (added) processQueue();
      },
      () => setView("error")
    );

    return () => unsub();
  }, [username]); // processQueue is a ref, not a dependency

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const wrap = {
    position: "fixed",
    inset: 0,
    background: "transparent",
    zIndex: 999999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
    overflow: "hidden",
  };

  const shadow = "0 2px 14px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.95)";

  if (view === "error") return (
    <div style={wrap}>
      <span style={{ color:"#fff", fontSize:26, fontWeight:600, fontFamily:APPLE, textShadow:shadow }}>
        Error. Please refresh.
      </span>
    </div>
  );

  if (view === "status") return (
    <div style={wrap}>
      <span style={{ color:"#fff", fontSize:26, fontWeight:600, fontFamily:APPLE, textShadow:shadow }}>
        {statusMsg}
      </span>
    </div>
  );

  if (view !== "donation" || !donation) return <div style={wrap} />;

  const s    = settingsRef.current;
  const anim = phase === "enter" ? enterAnim(s.animation) : exitAnim(s.animation);
  const msgIsAmharic = AMHARIC_RE.test(donation.message || "");

  return (
    <div style={wrap}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: anim,
          willChange: "opacity, transform",
          textAlign: "center",
        }}
      >
        {/* GIF */}
        {donation.gifUrl && (
          <img
            src={donation.gifUrl}
            alt=""
            style={{
              width: 260,
              height: 185,
              objectFit: "cover",
              borderRadius: 12,
              marginBottom: 22,
              display: "block",
            }}
          />
        )}

        {/* Line 1: [Name] donated [Amount] birr */}
        <div style={{
          fontFamily: APPLE,
          fontSize: 40,
          fontWeight: 800,
          lineHeight: 1.25,
          textShadow: shadow,
          letterSpacing: "-0.4px",
        }}>
          <span style={{ color: s.nameColor }}>{donation.donorName}</span>
          <span style={{ color: s.mainColor }}> donated </span>
          <span style={{ color: s.moneyColor }}>{donation.amount} birr</span>
        </div>

        {/* Line 2: to super chat */}
        <div style={{
          fontFamily: APPLE,
          fontSize: 32,
          fontWeight: 700,
          color: s.mainColor,
          textShadow: shadow,
          marginTop: 6,
          letterSpacing: "-0.2px",
          opacity: 0.9,
        }}>
          to super chat
        </div>

        {/* Line 3: message */}
        {donation.message ? (
          <div style={{
            fontFamily: msgIsAmharic ? ETH : APPLE,
            fontSize: 26,
            fontWeight: 500,
            color: s.textColor,
            textShadow: shadow,
            marginTop: 18,
            maxWidth: 560,
            lineHeight: 1.55,
            wordBreak: "break-word",
          }}>
            {donation.message}
          </div>
        ) : null}
      </div>

      <style>{KEYFRAMES}</style>
    </div>
  );
}