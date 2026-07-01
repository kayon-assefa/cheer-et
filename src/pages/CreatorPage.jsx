import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection, query, where,
  getDocs, addDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import "../styles/creator.css";
import verifiedIcon from '../assets/verified.png'

/* ── GIF banks  (swap with your Giphy API call if preferred) ── */
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

/* ── Ensure URLs always have a proper scheme ── */
function safeUrl(raw = "") {
  const s = raw.trim();
  if (!s) return "#";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

/* ══════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════ */
function SkeletonLoader() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-wrap">
        <div className="sk-top-card" style={{ textAlign: "center" }}>
          <div className="sk sk-avatar" />
          <div className="sk sk-line sk-w130" />
          <div className="sk sk-line sk-w90" />
        </div>
        <div className="sk-form-card">
          <div className="sk sk-input" />
          <div className="sk sk-input" />
          <div className="sk sk-input" />
          <div className="sk sk-btn" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   GIF PICKER
══════════════════════════════════════════════ */
function GifPicker({ isPlusUser, onSelect, selected }) {
  const [open, setOpen] = useState(false);
  const gifs = isPlusUser ? [...GIFS_BASIC, ...GIFS_PLUS] : GIFS_BASIC;

  return (
    <div>
      <button
        type="button"
        className={`gif-toggle${open ? " open" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected ? "GIF selected" : "Add a GIF reaction"}</span>
        <span className="gif-chev">&#9660;</span>
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
          <img src={selected} alt="selected reaction" />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   AD BANNER
══════════════════════════════════════════════ */
function AdBanner({ isPlus }) {
  const [ad, setAd] = useState(null);

  useEffect(() => {
    if (isPlus) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "ads"));
        const active = snap.docs.filter(d => d.data().active === true);
        if (!active.length) return;
        const doc = active[Math.floor(Math.random() * active.length)];
        setAd(doc.data());
      } catch (e) {
        console.error("Ad:", e);
      }
    })();
  }, [isPlus]);

  if (isPlus || !ad) return null;

  const href = safeUrl(ad.adUrl);   // ← always a real external URL

  return (
    <div className="ad-wrap">
      <span className="ad-pill">Sponsored</span>
      <a
        className="glass ad-card"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={ad.imgUrl} alt="sponsored" className="ad-img" />
      </a>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SUGGESTED ACCOUNTS
══════════════════════════════════════════════ */

/* gradient palette per card index */
const CARD_GRADS = [
  "linear-gradient(135deg,#1e3a8a,#3b82f6)",
  "linear-gradient(135deg,#1e4060,#0ea5e9)",
  "linear-gradient(135deg,#1e1b4b,#6366f1)",
  "linear-gradient(135deg,#0f172a,#1d4ed8)",
  "linear-gradient(135deg,#042f2e,#0d9488)",
];

function SuggestedAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "suggestions"));
        const active = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(a => a.active === true);
        setAccounts(active.sort(() => Math.random() - 0.5).slice(0, 5));
      } catch (e) {
        console.error("Suggestions:", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready || !accounts.length) return null;

  const SCard = ({ acc, idx, isSlide }) => (
    <div
      className={`s-card${isSlide ? " s-slide" : ""}`}
      style={{ "--grad": CARD_GRADS[idx % CARD_GRADS.length] }}
    >
      {/* coloured top stripe */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: CARD_GRADS[idx % CARD_GRADS.length],
        borderRadius: "18px 18px 0 0"
      }} />

      <div className="s-avatar" style={{ background: CARD_GRADS[idx % CARD_GRADS.length] }}>
        {acc.photoURL
          ? <img src={acc.photoURL} alt={acc.username} />
          : <span>{(acc.username || "?")[0].toUpperCase()}</span>
        }
      </div>

      <span className="s-name">@{acc.username}</span>

      {acc.followers && (
        <span className="s-follow">
          {Number(acc.followers).toLocaleString()} followers
        </span>
      )}

      <button
        className="s-btn"
        onClick={() => { window.location.href = `/${acc.username}`; }}
      >
        Check him
      </button>
    </div>
  );

  return (
    <div className="suggest-section">
      <div className="suggest-header">
        <span className="suggest-title">Suggested Creators</span>
      </div>

      {/* desktop 5-col grid */}
      <div className="suggest-grid">
        {accounts.map((acc, i) => <SCard key={acc.id} acc={acc} idx={i} isSlide={false} />)}
      </div>

      {/* mobile snap-slider */}
      <div className="suggest-slider">
        {accounts.map((acc, i) => <SCard key={acc.id} acc={acc} idx={i} isSlide={true} />)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function CreatorPage() {
  const { username } = useParams();
  const navigate     = useNavigate();

  const [creator,     setCreator]     = useState(null);
  const [name,        setName]        = useState("");
  const [amount,      setAmount]      = useState("");
  const [message,     setMessage]     = useState("");
  const [selectedGif, setSelectedGif] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [processing,  setProcessing]  = useState(false);

  useEffect(() => { loadCreator(); }, []);

  const loadCreator = async () => {
    try {
      const q    = query(collection(db, "users"), where("username", "==", username));
      const snap = await getDocs(q);

      if (snap.empty) {
        // ← redirect to your 404 page
        window.location.replace("/404.html");
        return;
      }

      setCreator({ id: snap.docs[0].id, ...snap.docs[0].data() });
    } catch (e) {
      console.error(e);
      window.location.replace("/404.html");
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!creator) return;
    if (creator.status !== "active") { alert("User not active"); return; }
    if (creator.banned)               { alert("Creator banned");  return; }

    const minAmt = Number(creator.minDonation) || 10;
    if (Number(amount) < minAmt) {
      alert(`Minimum donation is ${minAmt} ETB`);
      return;
    }

    try {
      setProcessing(true);
      const tx_ref = `CHEER-${Date.now()}`;

      await addDoc(collection(db, "donations"), {
        streamerId:      creator.id,
        creatorUsername: creator.username,
        donorName:       name,
        amount:          Number(amount),
        message,
        gifUrl:          selectedGif || null,
        tx_ref,
        paymentStatus:   "pending",
        createdAt:       serverTimestamp(),
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/create-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
  amount: Number(amount),
  donorName: name,
  message,
  creatorUsername: creator.username,
  streamerId: creator.id,
  email: "cheeret@gmail.com"
})
        }
      );

      const data = await res.json();
      if (data.checkout_url) window.location.href = data.checkout_url;

    } catch (err) {
      console.error(err);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  /* derived flags */
  const isPremiumActive = creator?.premium === "active";
  const isPlus          = creator?.premium === "plus" || creator?.plus === true;
  const isBanned        = creator?.banned === true;
  const isInactive      = !isBanned && creator?.status !== "active";
  const isVerified      = creator?.verified === true;
  const minDonation     = Number(creator?.minDonation) || 10;

  /* ── Loading ── */
  if (loading) return <SkeletonLoader />;

  /* creator is null  → redirect already fired in loadCreator */
  if (!creator) return null;

  /* ── Page ── */
  return (
    <div className={`creator-page ${isPremiumActive ? "bg-premium" : "bg-standard"}`}>
      <div className="page-content">

        {/* ── Profile card ── */}
        <div className="glass creator-top">
          {/* avatar */}
          <div className="avatar-wrap">
            {creator.photoURL
              ? <img src={creator.photoURL} alt={creator.username} className="profile-avatar" />
              : <div className="avatar-fallback">{creator.username[0].toUpperCase()}</div>
            }
          </div>

          {/* name + verified */}
          <div className="username-row">
            <h1>{creator.username}</h1>
            {isVerified && (
              <img
                src={verifiedIcon}
                alt="Verified"
                className="verified-icon"
                title="Verified Creator"
              />
            )}
          </div>

          {creator.platform  && <p className="creator-meta">{creator.platform}</p>}
          {creator.followers && (
            <p className="creator-meta">
              {Number(creator.followers).toLocaleString()} followers
            </p>
          )}
        </div>

        {/* ── Donation card ── */}
        <div className={`glass donation-card${isBanned ? " banned" : isInactive ? " inactive" : ""}`}>

          {/* BANNED */}
          {isBanned && (
            <div className="state-msg">
              <span className="state-icon-ring red">
                {/* bi-x-circle */}
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" fill="#f87171" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </span>
              <p className="state-title red">@{creator.username} is banned</p>
              <p className="state-sub">This account has been suspended.</p>
            </div>
          )}

          {/* INACTIVE */}
          {isInactive && (
            <div className="state-msg">
              <span className="state-icon-ring blue">
                {/* bi-exclamation-circle */}
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" fill="#60a5fa" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
              </span>
              <p className="state-title blue">@{creator.username} is inactive</p>
              <p className="state-sub">This creator is currently unavailable.</p>
            </div>
          )}

          {/* ACTIVE FORM */}
          {!isBanned && !isInactive && (
            <>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Kebede"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (ETB)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder={`Min ${minDonation} ETB`}
                  min={minDonation}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>

              {/* GIF picker — premium & plus only */}
              {(isPremiumActive || isPlus) && (
                <GifPicker
                  isPlusUser={isPlus}
                  onSelect={setSelectedGif}
                  selected={selectedGif}
                />
              )}

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  placeholder="Say something nice..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              <button
                className="cheer-btn"
                onClick={handleDonate}
                disabled={processing || !name.trim() || !amount}
              >
                {processing ? "Processing..." : "Cheer"}
              </button>
            </>
          )}
        </div>

        {/* ── Ad banner ── */}
        <AdBanner isPlus={isPlus} />

        {/* ── Suggested accounts (hidden for premium / plus) ── */}
        {!isPremiumActive && !isPlus && <SuggestedAccounts />}

      </div>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <span className="footer-logo">
          <span className="footer-line" />
          Cheer ET
          <span className="footer-line" />
        </span>
      </footer>

    </div>
  );
}