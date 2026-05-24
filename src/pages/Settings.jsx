import { useEffect, useRef, useState } from "react";
import "../styles/settings.css";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateEmail,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { QRCode } from "react-qr-code";
import Navbar from "../components/Navbar";
import verifiedIcon from '../assets/verified.png'
/* ─────────────────────────────────────
   SVG ICONS  (no emoji)
───────────────────────────────────── */
const Icon = {
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
    </svg>
  ),
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  chevron: (
    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1l5 5-5 5"/>
    </svg>
  ),
  download: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  share: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  palette: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  check: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
};

/* ─────────────────────────────────────
   Profile completion steps
───────────────────────────────────── */
function getSteps(data, user) {
  return [
    { label: "Photo",     done: !!data.photoURL },
    { label: "Username",  done: !!data.username },
    { label: "Phone",     done: !!data.phone },
    { label: "Telegram",  done: !!data.telegram },
    { label: "Bank",      done: !!(data.lastBankInfo?.bankNumber) },
    { label: "Verified",  done: !!user?.emailVerified },
    { label: "Followers", done: !!data.followers },
  ];
}

/* ─────────────────────────────────────
   Canvas share card renderer
───────────────────────────────────── */
async function drawShareCard(canvas, { username, photoURL, qrDataUrl }) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0d0d1a");
  bg.addColorStop(1, "#06060f");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 28);
  ctx.fill();

  // Top glow
  const topGlow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 220);
  topGlow.addColorStop(0, "rgba(10,132,255,0.28)");
  topGlow.addColorStop(1, "transparent");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = "rgba(10,132,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(1, 1, W - 2, H - 2, 27);
  ctx.stroke();

  // Logo image
  const logoImg = new Image();
  logoImg.crossOrigin = "anonymous";
  await new Promise((r) => { logoImg.onload = r; logoImg.onerror = r; logoImg.src = "/logo.png"; });
  const logoSize = 48;
  const logoX = W / 2 - logoSize / 2;
  const logoY = 28;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(logoX, logoY, logoSize, logoSize, 12);
  ctx.clip();
  if (logoImg.naturalWidth) {
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
  } else {
    ctx.fillStyle = "#0a84ff";
    ctx.fill();
  }
  ctx.restore();

  // "Cheer Me Up" neon text
  ctx.save();
  ctx.font = "bold 21px -apple-system, Helvetica Neue, sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "#0a84ff";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#5ac8fa";
  ctx.fillText("Cheer Me Up", W / 2, logoY + logoSize + 26);
  ctx.shadowBlur = 5;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Cheer Me Up", W / 2, logoY + logoSize + 26);
  ctx.restore();

  // Avatar
  const avatarR = 44;
  const avatarCX = W / 2;
  const avatarCY = logoY + logoSize + 56;
  const avatarImg = new Image();
  avatarImg.crossOrigin = "anonymous";
  await new Promise((r) => { avatarImg.onload = r; avatarImg.onerror = r; avatarImg.src = photoURL || "/default-avatar.png"; });
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
  ctx.clip();
  if (avatarImg.naturalWidth) {
    ctx.drawImage(avatarImg, avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
  } else {
    ctx.fillStyle = "#1c1c2e";
    ctx.fill();
  }
  ctx.restore();
  // Avatar ring
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarR + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(10,132,255,0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Username
  ctx.save();
  ctx.font = "bold 18px -apple-system, Helvetica Neue, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5f5f7";
  ctx.fillText(`@${username || "username"}`, W / 2, avatarCY + avatarR + 24);
  ctx.restore();

  // QR Code
  if (qrDataUrl) {
    const qrImg = new Image();
    await new Promise((r) => { qrImg.onload = r; qrImg.onerror = r; qrImg.src = qrDataUrl; });
    const qrSize = 120;
    const qrX = W / 2 - qrSize / 2;
    const qrY = avatarCY + avatarR + 38;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 14);
    ctx.fill();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    ctx.restore();
  }

  // Footer
  ctx.save();
  ctx.font = "11.5px -apple-system, Helvetica Neue, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(245,245,247,0.35)";
  ctx.fillText("cheer-et.web.app", W / 2, H - 16);
  ctx.restore();
}

/* ─────────────────────────────────────
   Animation options
───────────────────────────────────── */
const ANIM_OPTIONS = [
  { id: "slide",  label: "Slide In" },
  { id: "bounce", label: "Bounce"   },
  { id: "fade",   label: "Fade"     },
  { id: "pop",    label: "Pop"      },
  { id: "shake",  label: "Shake"    },
];

/* ═════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════ */
export default function Settings() {
  const [user,    setUser]    = useState(null);
  const [data,    setData]    = useState({});
  const [form,    setForm]    = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [editModal,     setEditModal]     = useState(false);
  const [emailModal,    setEmailModal]    = useState(false);
  const [reauthModal,   setReauthModal]   = useState(false);
  const [logoutModal,   setLogoutModal]   = useState(false);
  const [shareModal,    setShareModal]    = useState(false);
  const [overlayModal,  setOverlayModal]  = useState(false);

  const [newEmail,  setNewEmail]  = useState("");
  const [password,  setPassword]  = useState("");
  const [notif,     setNotif]     = useState(null);
  const [notifType, setNotifType] = useState("info");

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [language,     setLanguage]     = useState("en");
  const [photoInput,   setPhotoInput]   = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  const [overlaySettings, setOverlaySettings] = useState({
    nameColor:  "#0a84ff",
    mainColor:  "#ffffff",
    moneyColor: "#30d158",
    textColor:  "#aaaaaa",
    animation:  "slide",
  });
  const [savingOverlay, setSavingOverlay] = useState(false);

  const canvasRef = useRef(null);
  const qrRef     = useRef(null);

  /* ── notify helper ── */
  const notify = (msg, type = "info") => {
    setNotif(msg);
    setNotifType(type);
    setTimeout(() => setNotif(null), 3000);
    if (notifEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification(msg);
    }
  };

  const askNotifPermission = async (val) => {
    setNotifEnabled(val);
    if (val && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  /* ── Firebase listener ── */
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) { window.location.href = "/login"; return; }
      setUser(u);
      const unsubDoc = onSnapshot(doc(db, "users", u.uid), (snap) => {
        const d = snap.data() || {};
        setData(d);
        setForm({
          username:     d.username    || "",
          phone:        d.phone       || "",
          telegram:     d.telegram    || "",
          followers:    d.followers   || "",
          method:       d.lastBankInfo?.method      || "CBE",
          bankNumber:   d.lastBankInfo?.bankNumber  || "",
          bankUserName: d.lastBankInfo?.bankUserName|| "",
        });
        setPhotoInput(d.photoURL   || "");
        setPhotoPreview(d.photoURL || "");
        if (d.overlaySettings) setOverlaySettings(d.overlaySettings);
        setLoading(false);
      });
      return () => unsubDoc();
    });
    return () => unsubAuth();
  }, []);

  /* ── Draw share card when modal opens ── */
  useEffect(() => {
    if (!shareModal || !canvasRef.current) return;
    const svgEl = qrRef.current?.querySelector("svg");
    let qrUrl   = null;
    if (svgEl) {
      const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: "image/svg+xml" });
      qrUrl = URL.createObjectURL(blob);
    }
    drawShareCard(canvasRef.current, {
      username: data.username,
      photoURL:  data.photoURL,
      qrDataUrl: qrUrl,
    }).then(() => { if (qrUrl) URL.revokeObjectURL(qrUrl); });
  }, [shareModal, data]);

  /* ── Handlers ── */
  const openEditModal = () => {
    setPhotoInput(data.photoURL   || "");
    setPhotoPreview(data.photoURL || "");
    setEditModal(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        username:  form.username,
        phone:     form.phone,
        telegram:  form.telegram,
        followers: form.followers,
        photoURL:  photoInput,
      });
      notify("Profile updated", "success");
      setEditModal(false);
    } catch { notify("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const saveBank = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastBankInfo: {
          method:      form.method,
          bankNumber:  form.bankNumber,
          bankUserName:form.bankUserName,
        },
      });
      notify("Bank info saved", "success");
    } catch { notify("Failed to save", "error"); }
  };

  const saveOverlay = async () => {
    setSavingOverlay(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { overlaySettings });
      notify("Overlay settings saved", "success");
      setOverlayModal(false);
    } catch { notify("Failed to save", "error"); }
    finally { setSavingOverlay(false); }
  };

  const reauth = async () => {
    try {
      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, newEmail);
      notify("Email updated", "success");
      setReauthModal(false);
      setEmailModal(false);
    } catch { notify("Wrong password", "error"); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  const handleDownload = async () => {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const blob = new Blob(
        [JSON.stringify({ uid: user.uid, email: user.email, emailVerified: user.emailVerified, ...snap.data() }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href = url;
      a.download = `cheer-et-${user.uid.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify("Data downloaded", "success");
    } catch { notify("Failed to download", "error"); }
  };

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `cheer-${data.username || "card"}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    notify("Card downloaded", "success");
  };

  /* ── Derived ── */
  const profileLink  = `https://cheer-et.web.app/${data.username || ""}`;
  const overlayLink  = `https://cheer-et.web.app/${data.username || ""}/overlays`;
  const steps        = user ? getSteps(data, user) : [];
  const donePct      = steps.length ? Math.round((steps.filter(s => s.done).length / steps.length) * 100) : 0;
  const isStreamer    = data.role === "streamer" || data.isStreamer === true;

  if (loading) return <div className="s-loading"><div className="s-spinner" /></div>;

  return (
    <>
      <Navbar />

      {/* Hidden QR for canvas export */}
      <div ref={qrRef} aria-hidden="true" style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none" }}>
        <QRCode value={profileLink} size={120} fgColor="#0a84ff" bgColor="#ffffff" />
      </div>

      <div className="s-page">
        <div className="s-container">

          {/* ══ PROFILE CARD ══ */}
          <section className="s-section">
            <div className="s-card s-profile-card">
              <div className="s-avatar-wrap">
                <img
                  src={data.photoURL || "/default-avatar.png"}
                  alt="Avatar"
                  className="s-avatar"
                  onError={(e) => { e.target.src = "/default-avatar.png"; }}
                />
              </div>

              <div className="s-profile-info">
                <div className="s-profile-name">
                  {form.username || "Your Name"}
                  {data.verified && (
                    <img
                      src={verifiedIcon}
                      alt="Verified"
                      className="s-verified-icon"
                    />
                  )}
                </div>
                <div className="s-profile-email">{user?.email}</div>
                <div className="s-profile-meta">
                  {form.phone    && <span>{form.phone}</span>}
                  {form.followers && <span>{form.followers} followers</span>}
                </div>
              </div>

              <button className="s-btn-primary s-edit-btn" onClick={openEditModal}>
                {Icon.edit} Edit
              </button>
            </div>

            {/* ── COMPLETION BAR ── */}
            <div className="s-completion">
              <div className="s-completion-header">
                <span className="s-completion-label">Profile completion</span>
                <span
                  className="s-completion-pct"
                  style={{ color: donePct === 100 ? "var(--s-green)" : "var(--s-blue)" }}
                >
                  {donePct}%
                </span>
              </div>
              <div className="s-completion-track">
                <div
                  className="s-completion-fill"
                  style={{
                    width: `${donePct}%`,
                    background: donePct === 100
                      ? "var(--s-green)"
                      : "linear-gradient(90deg,#0a84ff,#5ac8fa)",
                  }}
                />
              </div>
              <div className="s-completion-chips">
                {steps.map((s) => (
                  <div key={s.label} className={`s-chip ${s.done ? "s-chip-done" : ""}`}>
                    <span className="s-chip-dot">{s.done ? Icon.check : null}</span>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ ACCOUNT ══ */}
          <section className="s-section">
            <p className="s-section-label">Account</p>
            <div className="s-card s-list-card">
              <div className="s-list-row">
                <span className="s-list-icon">{Icon.mail}</span>
                <div className="s-list-body">
                  <div className="s-list-title">Email</div>
                  <div className="s-list-sub">{user?.email}</div>
                </div>
                {user?.emailVerified
                  ? <span className="s-verified-badge">Verified</span>
                  : (
                    <button className="s-inline-btn"
                      onClick={() => sendEmailVerification(user).then(() => notify("Verification email sent", "success"))}>
                      Verify
                    </button>
                  )}
              </div>
              <div className="s-divider" />
              <button className="s-list-row s-list-row-btn" onClick={() => setEmailModal(true)}>
                <span className="s-list-icon">{Icon.mail}</span>
                <div className="s-list-body"><div className="s-list-title">Change Email</div></div>
                <span className="s-chevron">{Icon.chevron}</span>
              </button>
              <div className="s-divider" />
              <button className="s-list-row s-list-row-btn"
                onClick={() => sendPasswordResetEmail(auth, user.email).then(() => notify("Reset link sent", "success"))}>
                <span className="s-list-icon">{Icon.lock}</span>
                <div className="s-list-body"><div className="s-list-title">Reset Password</div></div>
                <span className="s-chevron">{Icon.chevron}</span>
              </button>
            </div>
          </section>

          {/* ══ MINIMUM DONATION ══ */}
          <section className="s-section">
            <p className="s-section-label">Minimum Donation</p>
            <div className="s-card">
              <div className="s-donation-display">
                <span className="s-donation-num">{data.minDonation || 100}</span>
                <span className="s-donation-cur">ETB</span>
              </div>
              <input
                type="range" min="100" max="100000" step="100"
                value={data.minDonation || 100}
                onChange={(e) =>
                  updateDoc(doc(db, "users", user.uid), { minDonation: Number(e.target.value) })
                }
              />
              <div className="s-slider-labels"><span>100</span><span>100,000 ETB</span></div>
            </div>
          </section>

          {/* ══ BANK INFO ══ */}
          <section className="s-section">
            <p className="s-section-label">Bank Information</p>
            <div className="s-card">
              <div className="s-field">
                <label className="s-label">Payment Method</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  <option value="CBE">CBE</option>
                  <option value="Telebirr">Telebirr</option>
                </select>
              </div>
              <div className="s-field">
                <label className="s-label">Account Number</label>
                <input placeholder="e.g. 1000123456789" value={form.bankNumber}
                  onChange={(e) => setForm({ ...form, bankNumber: e.target.value })} />
              </div>
              <div className="s-field">
                <label className="s-label">Account Name</label>
                <input placeholder="Full name on account" value={form.bankUserName}
                  onChange={(e) => setForm({ ...form, bankUserName: e.target.value })} />
              </div>
              <button className="s-btn-primary" style={{ marginTop: 12 }} onClick={saveBank}>
                Save Bank Info
              </button>
            </div>
          </section>

          {/* ══ STREAM OVERLAY ══ */}
          <section className="s-section">
            <p className="s-section-label">Stream Overlay</p>
            <div className="s-card s-overlay-card">
              <div className="s-qr-box">
                <QRCode value={overlayLink} size={112} fgColor="#0a84ff" bgColor="transparent" />
              </div>
              <div className="s-overlay-url">{overlayLink}</div>
              <div className="s-row-btns">
                <button className="s-btn-primary"
                  onClick={() => { navigator.clipboard.writeText(overlayLink); notify("Copied!", "success"); }}>
                  {Icon.copy} Copy Link
                </button>
                <button className="s-btn-ghost" onClick={() => setOverlayModal(true)}>
                  {Icon.palette} Customize
                </button>
              </div>
            </div>
          </section>

          {/* ══ SOCIAL ══ */}
          <section className="s-section">
            <p className="s-section-label">Social</p>
            <div className="s-card">
              <div className="s-field">
                <label className="s-label">Follower Count</label>
                <input value={form.followers || ""} onChange={(e) => setForm({ ...form, followers: e.target.value })}
                  placeholder="e.g. 10K+" />
              </div>
              <button className="s-btn-primary" style={{ marginTop: 10 }}
                onClick={() => updateDoc(doc(db, "users", user.uid), { followers: form.followers })
                  .then(() => notify("Followers updated", "success"))}>
                Update
              </button>
            </div>
          </section>

          {/* ══ SHARE CARD — streamer/creator only ══ */}
          {isStreamer && (
            <section className="s-section">
              <p className="s-section-label">Creator</p>
              <button className="s-share-teaser" onClick={() => setShareModal(true)}>
                <div className="s-share-icon-wrap">{Icon.share}</div>
                <div className="s-share-text">
                  <div className="s-share-title">Share Your Profile Card</div>
                  <div className="s-share-sub">Generate a card to post with your audience</div>
                </div>
                <span className="s-chevron">{Icon.chevron}</span>
              </button>
            </section>
          )}

          {/* ══ BOTTOM ACTIONS ══ */}
          <section className="s-section s-bottom-actions">
            <button className="s-btn-download" onClick={handleDownload}>
              {Icon.download} Download Data
            </button>
            <button className="s-btn-logout" onClick={() => setLogoutModal(true)}>
              {Icon.logout} Log Out
            </button>
          </section>

        </div>
      </div>

      {/* ═══════════════════════════════════
          MODALS
      ═══════════════════════════════════ */}

      {/* ── EDIT PROFILE ── */}
      {editModal && (
        <div className="s-modal-bg" onClick={(e) => e.target === e.currentTarget && setEditModal(false)}>
          <div className="s-modal">
            <div className="s-modal-head">
              <h3>Edit Profile</h3>
              <button className="s-modal-close" onClick={() => setEditModal(false)}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
              </button>
            </div>

            {/* Photo preview */}
            <div className="s-photo-wrap">
              <img
                src={photoPreview || "/default-avatar.png"}
                alt="Preview"
                className="s-photo-preview"
                onError={(e) => { e.target.src = "/default-avatar.png"; }}
              />
              <span className="s-photo-label">Preview</span>
            </div>

            <div className="s-field">
              <label className="s-label">Photo URL</label>
              <input placeholder="https://example.com/photo.jpg" value={photoInput}
                onChange={(e) => { setPhotoInput(e.target.value); setPhotoPreview(e.target.value); }} />
            </div>
            <div className="s-field">
              <label className="s-label">Username</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="s-field">
              <label className="s-label">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251..." />
            </div>
            <div className="s-field">
              <label className="s-label">Telegram</label>
              <input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="@handle" />
            </div>

            {/* Notifications toggle */}
            <div className="s-toggle-row">
              <div>
                <div className="s-toggle-title">Notifications</div>
                <div className="s-toggle-sub">Browser push alerts</div>
              </div>
              <label className="s-toggle">
                <input type="checkbox" checked={notifEnabled}
                  onChange={(e) => askNotifPermission(e.target.checked)} />
                <span className="s-toggle-track"><span className="s-toggle-thumb" /></span>
              </label>
            </div>

            <div className="s-field">
              <label className="s-label">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="am">አማርኛ</option>
              </select>
            </div>

            <div className="s-modal-actions">
              <button className="s-btn-primary" onClick={saveProfile} disabled={saving}>
                {saving ? <span className="s-spinner-sm" /> : "Save Changes"}
              </button>
              <button className="s-btn-ghost" onClick={() => setEditModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGE EMAIL ── */}
      {emailModal && (
        <div className="s-modal-bg" onClick={(e) => e.target === e.currentTarget && setEmailModal(false)}>
          <div className="s-modal">
            <div className="s-modal-head">
              <h3>Change Email</h3>
              <button className="s-modal-close" onClick={() => setEmailModal(false)}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
              </button>
            </div>
            <div className="s-field">
              <label className="s-label">New Email</label>
              <input type="email" placeholder="new@email.com" value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="s-modal-actions">
              <button className="s-btn-primary" onClick={() => setReauthModal(true)}>Continue</button>
              <button className="s-btn-ghost" onClick={() => setEmailModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REAUTH ── */}
      {reauthModal && (
        <div className="s-modal-bg">
          <div className="s-modal">
            <div className="s-modal-head">
              <h3>Confirm Password</h3>
              <button className="s-modal-close" onClick={() => setReauthModal(false)}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
              </button>
            </div>
            <p className="s-modal-desc">Enter your current password to confirm this change.</p>
            <div className="s-field">
              <label className="s-label">Password</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="s-modal-actions">
              <button className="s-btn-primary" onClick={reauth}>Confirm</button>
              <button className="s-btn-ghost" onClick={() => setReauthModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGOUT ── */}
      {logoutModal && (
        <div className="s-modal-bg" onClick={(e) => e.target === e.currentTarget && setLogoutModal(false)}>
          <div className="s-modal s-modal-center">
            <div className="s-logout-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--s-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h3 className="s-logout-title">Log Out?</h3>
            <p className="s-modal-desc">You will be redirected to the login page.</p>
            <div className="s-modal-actions">
              <button className="s-btn-red" onClick={handleLogout}>Yes, Log Out</button>
              <button className="s-btn-ghost" onClick={() => setLogoutModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARE CARD ── */}
      {shareModal && (
        <div className="s-modal-bg" onClick={(e) => e.target === e.currentTarget && setShareModal(false)}>
          <div className="s-modal">
            <div className="s-modal-head">
              <h3>Share Profile Card</h3>
              <button className="s-modal-close" onClick={() => setShareModal(false)}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
              </button>
            </div>
            <div className="s-canvas-wrap">
              <canvas ref={canvasRef} width={320} height={460} className="s-canvas" />
            </div>
            <button className="s-copy-link-btn"
              onClick={() => { navigator.clipboard.writeText(profileLink); notify("Link copied!", "success"); }}>
              <span className="s-copy-link-url">{profileLink}</span>
              <span className="s-copy-link-action">{Icon.copy} Copy</span>
            </button>
            <div className="s-modal-actions">
              <button className="s-btn-primary" onClick={downloadCard}>
                {Icon.download} Download Image
              </button>
              <button className="s-btn-ghost" onClick={() => setShareModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── OVERLAY CUSTOMIZER ── */}
      {overlayModal && (
        <div className="s-modal-bg" onClick={(e) => e.target === e.currentTarget && setOverlayModal(false)}>
          <div className="s-modal">
            <div className="s-modal-head">
              <h3>Overlay Customizer</h3>
              <button className="s-modal-close" onClick={() => setOverlayModal(false)}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
              </button>
            </div>

            {/* Live preview */}
            <div className="s-ov-preview">
              <div className="s-ov-box">
                <div className="s-ov-name"  style={{ color: overlaySettings.nameColor }}>Abebe Girma</div>
                <div className="s-ov-main"  style={{ color: overlaySettings.mainColor }}>
                  donated{" "}
                  <span style={{ color: overlaySettings.moneyColor, fontWeight: 700 }}>500 ETB</span>
                  {" "}to superchat
                </div>
                <div className="s-ov-text"  style={{ color: overlaySettings.textColor }}>
                  Keep it up!
                </div>
              </div>
            </div>

            {/* Color pickers */}
            <div className="s-color-list">
              {[
                { key: "nameColor",  label: "Donor Name" },
                { key: "mainColor",  label: "Main Text" },
                { key: "moneyColor", label: "Amount" },
                { key: "textColor",  label: "Message" },
              ].map(({ key, label }) => (
                <div className="s-color-row" key={key}>
                  <span className="s-color-label">{label}</span>
                  <div className="s-color-right">
                    <span className="s-color-hex">{overlaySettings[key]}</span>
                    <label className="s-swatch-wrap">
                      <input type="color" value={overlaySettings[key]}
                        onChange={(e) => setOverlaySettings({ ...overlaySettings, [key]: e.target.value })}
                        className="s-color-native" />
                      <span className="s-swatch" style={{ background: overlaySettings[key] }} />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Animation picker */}
            <div className="s-anim-section">
              <p className="s-label" style={{ marginBottom: 10 }}>Alert Animation</p>
              <div className="s-anim-grid">
                {ANIM_OPTIONS.map((a) => (
                  <button key={a.id}
                    className={`s-anim-btn ${overlaySettings.animation === a.id ? "s-anim-active" : ""}`}
                    onClick={() => setOverlaySettings({ ...overlaySettings, animation: a.id })}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="s-modal-actions">
              <button className="s-btn-primary" onClick={saveOverlay} disabled={savingOverlay}>
                {savingOverlay ? <span className="s-spinner-sm" /> : "Save Overlay"}
              </button>
              <button className="s-btn-ghost" onClick={() => setOverlayModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {notif && (
        <div className={`s-toast s-toast-${notifType}`}>
          <span className="s-toast-icon">
            {notifType === "success" ? Icon.check : notifType === "error"
              ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </span>
          {notif}
        </div>
      )}
    </>
  );
}