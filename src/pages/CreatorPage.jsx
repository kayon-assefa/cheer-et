import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  collection, query, where, getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import "../styles/creator.css";
import verifiedIcon from "../assets/verified.png";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const GIFS_BASIC = [
  "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/xT9IgG50Lg7russbCU/giphy.gif",
  "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  "https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif",
  "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
  "https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif",
  "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif",
  "https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif",
];
const GIFS_PLUS = [
  "https://media.giphy.com/media/3o6ZtlGkjeschymLNm/giphy.gif",
  "https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif",
  "https://media.giphy.com/media/xT9IgDECMw5cEMJjew/giphy.gif",
  "https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif",
  "https://media.giphy.com/media/26uf2YTgF5upXUTm0/giphy.gif",
  "https://media.giphy.com/media/3o7abwbzKeaAbkGeHe/giphy.gif",
  "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
  "https://media.giphy.com/media/3oEjI4sIm9RfpG3ONq/giphy.gif",
  "https://media.giphy.com/media/l0HlTy9x8FZo0XO1i/giphy.gif",
  "https://media.giphy.com/media/26tPplGWjN0xLybiU/giphy.gif",
];

// Small, representative profanity list used for client-side message
// filtering. Extend this list server-side too — client filtering is a
// courtesy nudge, not a security boundary.
const BAD_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "cunt",
  "nigger", "faggot", "whore", "slut", "retard",
];

// Common Amharic insults/profanity. \b word-boundary regex doesn't work
// reliably on non-Latin scripts in JS, so these are matched with a plain
// substring check instead (see containsBadWords).
const AMHARIC_BAD_WORDS = [
  "ውሻ", "ዝንጀሮ", "ደደብ", "እብድ", "ቆሻሻ", "ጅል", "አህያ", "ጨርቅ",
];

// Quick-pick donation amounts, in ETB.
const QUICK_AMOUNTS = [100, 250, 500, 1000];

const MESSAGE_LIMIT = 200;

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function safeUrl(raw = "") {
  const s = raw.trim();
  if (!s) return "#";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

// Normalizes Firestore Timestamps, JS Dates, or date-ish strings/numbers.
function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function containsBadWords(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const hasEnglishHit = BAD_WORDS.some((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));
  if (hasEnglishHit) return true;
  // Amharic script isn't tokenized by \b in JS regex, so fall back to
  // a direct substring check for these entries.
  return AMHARIC_BAD_WORDS.some((w) => text.includes(w));
}

// Formats a millisecond duration as "12h 45m left" / "2d 3h left".
function formatTimeLeft(ms) {
  if (ms <= 0) return "starting now";
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON LOADER
   ═══════════════════════════════════════════════════════════════ */

function SkeletonLoader() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-wrap">
        <div className="sk-top-card">
          <div className="sk sk-avatar" />
          <div className="sk sk-line sk-w130" />
          <div className="sk sk-line sk-w90" />
          <div className="sk sk-goal" />
        </div>
        <div className="sk sk-event" />
        <div className="sk-form-card">
          <div className="sk sk-input" />
          <div className="sk sk-input" />
          <div className="sk sk-quick-row">
            <div className="sk sk-quick-chip" />
            <div className="sk sk-quick-chip" />
            <div className="sk sk-quick-chip" />
            <div className="sk sk-quick-chip" />
          </div>
          <div className="sk sk-input" />
          <div className="sk sk-btn" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GIF PICKER  (kept exactly as-is, functionally)
   ═══════════════════════════════════════════════════════════════ */

function GifPicker({ isPlusUser, onSelect, selected }) {
  const [open, setOpen] = useState(false);
  const gifs = isPlusUser ? [...GIFS_BASIC, ...GIFS_PLUS] : GIFS_BASIC;

  return (
    <div>
      <button
        type="button"
        className={`gif-toggle${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{selected ? "GIF selected" : "Add a GIF reaction"}</span>
        <i className="bi bi-chevron-down gif-chev" />
      </button>

      {open && (
        <div className="gif-grid">
          {gifs.map((url, i) => (
            <div
              key={i}
              className={`gif-cell${selected === url ? " sel" : ""}`}
              onClick={() => onSelect(selected === url ? null : url)}
            >
              <img src={url} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {selected && !open && (
        <div className="gif-preview">
          <img src={selected} alt="Selected reaction" />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AD BANNER
   ═══════════════════════════════════════════════════════════════ */

function AdBanner({ ad }) {
  if (!ad) return null;
  const href = safeUrl(ad.adUrl);

  return (
    <div className="ad-wrap">
      <span className="ad-pill">Sponsored</span>
      <a className="glass ad-card hover-card" href={href} target="_blank" rel="noopener noreferrer">
        <img src={ad.imgUrl} alt="Sponsored content" className="ad-img" loading="lazy" />
      </a>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GOAL CARD — only rendered when there's an active goal. Parent
   passes null/undefined otherwise, and this component renders
   nothing at all (no empty state).
   ═══════════════════════════════════════════════════════════════ */

function GoalCard({ goal }) {
  if (!goal) return null;

  const target = Number(goal.target) || 0;
  // NOTE: assumes a "current" progress field alongside the documented
  // schema (createdAt, endDate, image, name, ownerId, target). Adjust
  // the field name here if your goal documents track progress under a
  // different key (e.g. "raised").
  const current = Number(goal.current ?? goal.raised ?? 0);
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="glass goal-card hover-card">
      {goal.image ? (
        <img src={goal.image} alt="" className="goal-thumb" />
      ) : (
        <div className="goal-icon-ring"><i className="bi bi-graph-up-arrow" /></div>
      )}
      <div className="goal-info">
        <div className="goal-top">
          <span className="goal-name">{goal.name}</span>
          <span className="goal-pct">{pct}%</span>
        </div>
        <div className="goal-track">
          <div className="goal-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIVE INDICATOR — compact oval pill beside the share button.
   Expands on hover/click to reveal event details + a "Watch Now"
   button that opens the creator's platform link. Only rendered
   while the event is actually live (not for upcoming events).
   ═══════════════════════════════════════════════════════════════ */

function LiveIndicator({ event, platformUrl }) {
  const [expanded, setExpanded] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!expanded) return undefined;
    const onOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setExpanded(false);
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [expanded]);

  if (!event) return null;

  const href = safeUrl(platformUrl);

  return (
    <div
      ref={wrapRef}
      className={`live-indicator${expanded ? " expanded" : ""}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onClick={() => setExpanded((v) => !v)}
      role="button"
      tabIndex={0}
      aria-label="Live now"
      onKeyDown={(e) => { if (e.key === "Enter") setExpanded((v) => !v); }}
    >
      <span className="live-dot-wrap">
        <span className="live-dot-ping" />
        <span className="live-dot" />
      </span>
      <span className="live-label">LIVE</span>

      <div className="live-detail-panel" onClick={(e) => e.stopPropagation()}>
        <span className="live-detail-name">{event.name}</span>
        {platformUrl && (
          <a
            className="live-watch-btn"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="bi bi-play-fill" /> Watch Now
          </a>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EVENT BANNER — upcoming countdown only. Live events are shown
   via the LiveIndicator beside the share button instead.
   ═══════════════════════════════════════════════════════════════ */

function EventBanner({ event }) {
  const [, forceTick] = useState(0);

  // Re-render every 60s so the countdown stays accurate without a
  // heavier timer or extra state churn.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (!event) return null;

  const start = toDate(event.startTime);
  if (!start) return null;
  // NOTE: duration is assumed to be in minutes.
  const end = new Date(start.getTime() + (Number(event.duration) || 0) * 60000);
  const now = new Date();

  if (now > end) return null; // ended — never shown
  if (now >= start) return null; // live — shown via LiveIndicator instead

  return (
    <div className="event-banner hover-card">
      <i className="bi bi-clock event-icon" />
      <span className="event-name">{event.name}</span>
      <span className="event-time">{formatTimeLeft(start - now)}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUGGESTED ACCOUNTS — up to 3, image-first modern cards
   ═══════════════════════════════════════════════════════════════ */

function SuggestedAccounts({ accounts }) {
  const SCard = ({ acc, isSlide }) => {
    const [imgError, setImgError] = useState(false);
    const showImage = acc.photoURL && !imgError;

    return (
      <div
        className={`s-card hover-card${isSlide ? " s-slide" : ""}`}
        onClick={() => { window.location.href = `/${acc.username}`; }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") window.location.href = `/${acc.username}`; }}
      >
        <div className="s-card-media">
          {showImage ? (
            <img
              src={acc.photoURL}
              alt={acc.username}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="s-card-fallback">
              <span>{(acc.username || "?")[0].toUpperCase()}</span>
            </div>
          )}
          <div className="s-card-gradient" />
          <span className="s-card-view">View profile</span>
        </div>
        <div className="s-card-info">
          <span className="s-name">@{acc.username}</span>
          {acc.followers != null && (
            <span className="s-follow"><i className="bi bi-people-fill" /> {Number(acc.followers).toLocaleString()}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="suggest-section">
      <div className="suggest-header">
        <span className="suggest-title">Suggested Creators</span>
      </div>

      {accounts.length === 0 ? (
        <div className="glass empty-state">
          <i className="bi bi-people empty-state-icon" />
          <span>No suggested creators yet</span>
        </div>
      ) : (
        <>
          <div className="suggest-grid">
            {accounts.map((acc) => <SCard key={acc.id} acc={acc} isSlide={false} />)}
          </div>
          <div className="suggest-slider">
            {accounts.map((acc) => <SCard key={acc.id} acc={acc} isSlide />)}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REDIRECT MODAL — shown briefly before handing off to Chapa
   ═══════════════════════════════════════════════════════════════ */

function RedirectModal({ visible }) {
  if (!visible) return null;
  return (
    <div className="redirect-overlay">
      <div className="glass redirect-modal">
        <span className="redirect-spinner" />
        <p className="redirect-title">Redirecting to Chapa...</p>
        <p className="redirect-sub">Hold on while we take you to a secure checkout.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function CreatorPage() {
  const { username } = useParams();

  const [creator, setCreator] = useState(null);
  const [ad, setAd] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [goal, setGoal] = useState(null);
  const [event, setEvent] = useState(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [selectedGif, setSelectedGif] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [errors, setErrors] = useState({});
  const [redirecting, setRedirecting] = useState(false);

  const messageRef = useRef(null);
  const donationCardRef = useRef(null);

  // Social-proof placeholder — swap for a real "cheers in the last hour"
  // count from your backend/analytics once available.
  const [cheerCount] = useState(() => 8 + Math.floor(Math.random() * 24));

  /* ── one combined fetch: creator + everything that depends on it ── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const creatorQ = query(collection(db, "users"), where("username", "==", username));
        const creatorSnap = await getDocs(creatorQ);

        if (creatorSnap.empty) {
          if (!cancelled) setNotFound(true);
          return;
        }

        const creatorData = { id: creatorSnap.docs[0].id, ...creatorSnap.docs[0].data() };
        if (cancelled) return;
        setCreator(creatorData);

        const isPlusUser = creatorData.premium === "plus" || creatorData.plus === true;
        const now = new Date();

        const [adsSnap, suggestSnap, goalSnap, eventsSnap] = await Promise.all([
          isPlusUser ? Promise.resolve(null) : getDocs(collection(db, "ads")),
          getDocs(collection(db, "suggestions")),
          getDocs(query(collection(db, "goal"), where("ownerId", "==", creatorData.id))),
          getDocs(query(collection(db, "events"), where("ownerId", "==", creatorData.id))),
        ]);

        if (cancelled) return;

        // Ad: pick a random active one.
        if (adsSnap) {
          const activeAds = adsSnap.docs.map((d) => d.data()).filter((a) => a.active === true);
          if (activeAds.length) setAd(activeAds[Math.floor(Math.random() * activeAds.length)]);
        }

        // Suggestions: active, ranked by click count + urgency (closeness
        // to endDate). Only the top 3 are ever shown.
        if (!isPlusUser && creatorData.premium !== "active") {
          const ranked = suggestSnap.docs
            .map((d) => ({ id: d.id, username: d.id, ...d.data() }))
            .filter((s) => s.active === true)
            .map((s) => {
              const end = toDate(s.endDate);
              const daysLeft = end ? Math.max((end - now) / 86400000, 0.25) : 999;
              const clicks = Number(s.clickCount) || 0;
              return { ...s, _score: clicks / daysLeft + clicks * 0.1 };
            })
            .sort((a, b) => b._score - a._score)
            .slice(0, 3);
          setSuggestions(ranked);
        }

        // Goal: closest to completion among this creator's active goals.
        const goals = goalSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((g) => {
            const end = toDate(g.endDate);
            return !end || end > now;
          });
        if (goals.length) {
          const withProgress = goals.map((g) => {
            const target = Number(g.target) || 0;
            const current = Number(g.current ?? g.raised ?? 0);
            return { ...g, _pct: target > 0 ? current / target : 0 };
          });
          withProgress.sort((a, b) => b._pct - a._pct);
          setGoal(withProgress[0]);
        }

        // Events: only upcoming or currently live.
        const liveOrUpcoming = eventsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .map((e) => {
            const start = toDate(e.startTime);
            if (!start) return null;
            const end = new Date(start.getTime() + (Number(e.duration) || 0) * 60000);
            return { ...e, _start: start, _end: end };
          })
          .filter((e) => e && now <= e._end)
          .sort((a, b) => a._start - b._start);
        if (liveOrUpcoming.length) setEvent(liveOrUpcoming[0]);
      } catch (err) {
        console.error("CreatorPage load error:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [username]);

  useEffect(() => {
    if (notFound) window.location.replace("/404.html");
  }, [notFound]);

  const isPremiumActive = creator?.premium === "active";
  const isPlus = creator?.premium === "plus" || creator?.plus === true;
  const isPremiumOrPlus = isPremiumActive || isPlus;
  const isBanned = creator?.banned === true;
  const isInactive = !isBanned && creator?.status !== "active";
  const isVerified = creator?.verified === true;
  const minDonation = Number(creator?.minDonation) || 100;
  const canDonate = creator && !isBanned && !isInactive;
  const messageHasBadWords = useMemo(() => containsBadWords(message), [message]);

  // Live status derived straight from the event, independent of the
  // (upcoming-only) EventBanner logic.
  const isEventLive = useMemo(() => {
    if (!event) return false;
    const start = toDate(event.startTime);
    if (!start) return false;
    const end = new Date(start.getTime() + (Number(event.duration) || 0) * 60000);
    const now = new Date();
    return now >= start && now <= end;
  }, [event]);

  const validate = useCallback(() => {
    const next = {};
    if (!name.trim()) next.name = "Enter your name";
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt)) next.amount = "Enter an amount";
    else if (amt < minDonation) next.amount = `Minimum is ${minDonation} ETB`;
    if (messageHasBadWords) next.message = "Please keep your message respectful";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, amount, minDonation, messageHasBadWords]);

  const handleDonate = useCallback(async () => {
    if (!canDonate || processing) return;
    if (!validate()) return;

    try {
      setProcessing(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          donorName: name.trim(),
          message: message.trim() || "",
          gifUrl: selectedGif || null,
          creatorUsername: creator.username,
          streamerId: creator.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to initialize payment");
      const data = await res.json();

      if (data.data?.checkout_url) {
        setRedirecting(true);
        // Brief, friendly pause so the "Redirecting..." modal is actually
        // seen before the browser navigates away.
        setTimeout(() => { window.location.href = data.data.checkout_url; }, 1200);
      } else {
        alert("Payment link not received. Please try again.");
        setProcessing(false);
      }
    } catch (err) {
      console.error("Donate error:", err);
      alert("Payment failed. Please try again.");
      setProcessing(false);
    }
  }, [canDonate, processing, validate, amount, name, message, selectedGif, creator]);

  const handleQuickAmount = useCallback((value) => {
    setAmount(String(value));
    setErrors((prev) => ({ ...prev, amount: undefined }));
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleDonate();
    }
  }, [handleDonate]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const followersText = creator?.followers != null
      ? ` · ${Number(creator.followers).toLocaleString()} followers`
      : "";
    const verifiedText = isVerified ? " ✓ Verified" : "";
    const shareText = `Support @${creator?.username}${verifiedText}${followersText} on Cheer ET!`;
    const shareData = { title: `Support @${creator?.username} on Cheer ET`, text: shareText, url };

    if (navigator.share) {
      try {
        if (creator?.photoURL && navigator.canShare) {
          try {
            const imgRes = await fetch(creator.photoURL);
            const blob = await imgRes.blob();
            const file = new File([blob], "profile.jpg", { type: blob.type || "image/jpeg" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ ...shareData, files: [file] });
              return;
            }
          } catch {
            // Image fetch/share failed (e.g. CORS) — fall through to a
            // text-only share instead of blocking the whole action.
          }
        }
        await navigator.share(shareData);
      } catch { /* user cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${url}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Share error:", err);
    }
  }, [creator, isVerified]);

  if (loading) return <SkeletonLoader />;
  if (!creator) return null;

  const donationForm = (
    <>
      <div className="form-group">
        <label className="form-label">Your Name</label>
        <input
          type="text"
          className={`form-input${errors.name ? " has-error" : ""}`}
          placeholder="Kebede"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Amount (ETB)</label>
        <input
          type="number"
          className={`form-input${errors.amount ? " has-error" : ""}`}
          placeholder={`Min ${minDonation} ETB`}
          min={minDonation}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {errors.amount && <span className="field-error">{errors.amount}</span>}

        <div className="quick-amounts">
          {QUICK_AMOUNTS.map((v) => (
            <button
              type="button"
              key={v}
              className={`quick-chip${Number(amount) === v ? " active" : ""}`}
              onClick={() => handleQuickAmount(v)}
            >
              {v.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {(isPremiumActive || isPlus) && (
        <GifPicker isPlusUser={isPlus} onSelect={setSelectedGif} selected={selectedGif} />
      )}

      <div className="form-group">
        <label className="form-label">Message</label>
        <textarea
          ref={messageRef}
          className={`form-textarea${errors.message ? " has-error" : ""}`}
          placeholder="Say something nice..."
          value={message}
          maxLength={MESSAGE_LIMIT}
          onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_LIMIT))}
        />
        <div className="textarea-footer">
          {messageHasBadWords ? (
            <span className="field-error">
              <i className="bi bi-exclamation-triangle" /> Please keep your message respectful
            </span>
          ) : <span />}
          <span className="char-count">{message.length}/{MESSAGE_LIMIT}</span>
        </div>
      </div>

      <button
        className="cheer-btn"
        onClick={handleDonate}
        disabled={processing || !name.trim() || !amount || messageHasBadWords}
      >
        {processing ? (
          <span className="btn-spinner" />
        ) : (
          <><i className="bi bi-heart-fill" /> Cheer</>
        )}
      </button>

      <p className="social-proof">
        <i className="bi bi-fire" /> {cheerCount} people cheered for @{creator.username} in the last hour
      </p>
    </>
  );

  return (
    <div className={`creator-page ${isPremiumActive ? "bg-premium" : "bg-standard"}`}>
      <div className="page-content">

        {/* Profile Card */}
        <div className="glass creator-top hover-card card-fade" style={{ "--d": "0s" }}>
          {isEventLive && (
            <LiveIndicator event={event} platformUrl={creator.platformUrl || creator.platform} />
          )}

          <button className="share-btn" onClick={handleShare} aria-label="Share profile">
            <i className={`bi ${shareCopied ? "bi-check-lg" : "bi-share-fill"}`} />
          </button>

          <div className="avatar-wrap">
            {creator.photoURL ? (
              <img src={creator.photoURL} alt={creator.username} className="profile-avatar" />
            ) : (
              <div className="avatar-fallback">{creator.username[0].toUpperCase()}</div>
            )}
          </div>
          <div className="username-row">
            <h1>{creator.username}</h1>
            {isVerified && (
              <img src={verifiedIcon} alt="Verified" className="verified-icon" title="Verified Creator" />
            )}
          </div>
          {creator.platform && <p className="creator-meta">{creator.platform}</p>}
          {creator.followers != null && (
            <p className="creator-meta">
              <i className="bi bi-people-fill" /> {Number(creator.followers).toLocaleString()} followers
            </p>
          )}

          <GoalCard goal={goal} />
        </div>

        {!isEventLive && event && (
          <div className="card-fade" style={{ "--d": "0.05s" }}>
            <EventBanner event={event} />
          </div>
        )}

        {/* Donation Card — always shown inline, on every screen size,
            for every user. No bottom sheet, no separate CTA button. */}
        <div
          ref={donationCardRef}
          className={`glass donation-card card-fade${isBanned ? " banned" : isInactive ? " inactive" : ""}`}
          style={{ "--d": "0.1s" }}
        >
          {isBanned && (
            <div className="state-msg">
              <div className="state-icon-ring red"><i className="bi bi-slash-circle" /></div>
              <p className="state-title red">@{creator.username} is banned</p>
              <p className="state-sub">This account has been suspended.</p>
            </div>
          )}

          {isInactive && (
            <div className="state-msg">
              <div className="state-icon-ring blue"><i className="bi bi-moon-stars" /></div>
              <p className="state-title blue">@{creator.username} is inactive</p>
              <p className="state-sub">This creator is currently unavailable.</p>
            </div>
          )}

          {canDonate && donationForm}
        </div>

        <AdBanner ad={ad} />
        {!isPremiumOrPlus && <SuggestedAccounts accounts={suggestions} />}
      </div>

      <RedirectModal visible={redirecting} />

      <footer className="site-footer">
        <span className="footer-logo">
          <span className="footer-line" /> Cheer ET <span className="footer-line" />
        </span>
      </footer>
    </div>
  );
}