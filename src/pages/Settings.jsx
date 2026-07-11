import { useEffect, useRef, useState, useCallback } from "react";
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
import verifiedIcon from "../assets/verified.png";

/* ─────────────────────────────────────
   SVG ICONS  (no emoji)
───────────────────────────────────── */
const Icon = {
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  ),
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  chevron: (
    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1l5 5-5 5" />
    </svg>
  ),
  download: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  share: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  palette: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
  check: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  camera: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  alert: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  telegram: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.94 4.5l-3.1 14.6c-.23 1.04-.86 1.3-1.74.8l-4.8-3.54-2.31 2.23c-.26.26-.47.47-.96.47l.34-4.88 8.9-8.04c.39-.34-.08-.53-.6-.19L6.6 13.36l-4.74-1.48c-1.03-.32-1.05-1.03.22-1.52L20.6 3.1c.86-.32 1.61.19 1.34 1.4z" />
    </svg>
  ),
  instagram: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  square: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  ),
  portrait: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="20" rx="3" />
    </svg>
  ),
  crown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18h20l-2-9-5 4-3-7-3 7-5-4z" /><line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  ),
  zap: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  monitor: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  clock: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  shield: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  warn: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

/* ─────────────────────────────────────
   Profile completion steps
───────────────────────────────────── */
function getSteps(data, user) {
  return [
    { label: "Add Profile Photo", done: !!data.photoURL, action: "Add Profile Photo" },
    { label: "Add Username", done: !!data.username, action: "Add Username" },
    { label: "Add Phone", done: !!data.phone, action: "Add Phone" },
    { label: "Add Telegram", done: !!data.telegram, action: "Add Telegram" },
    { label: "Add Bank Information", done: !!(data.lastBankInfo?.bankNumber), action: "Add Bank Information" },
    { label: "Verify Email", done: !!user?.emailVerified, action: "Verify Email" },
    { label: "Add Follower Count", done: !!data.followers, action: "Add Follower Count" },
  ];
}

/* ─────────────────────────────────────
   Premium helpers
───────────────────────────────────── */
function isPremiumActive(data) {
  if (!data?.premium) return false;
  if (!data.premiumEndingDate) return true;
  const end = data.premiumEndingDate?.toMillis
    ? data.premiumEndingDate.toMillis()
    : new Date(data.premiumEndingDate).getTime();
  return end > Date.now();
}

const DEFAULT_OVERLAY = {
  nameColor: "#5ac8fa",
  mainColor: "#ffffff",
  moneyColor: "#30d158",
  textColor: "#aaaaaa",
  animation: "slide",
};

function effectiveOverlay(data) {
  const stored = data?.overlaySettings || {};
  if (!isPremiumActive(data)) {
    return { ...DEFAULT_OVERLAY, theme: "default" };
  }
  return { ...DEFAULT_OVERLAY, ...stored, theme: stored.theme === "premium" ? "premium" : "default" };
}

/* Follower count needed before a creator qualifies for the verified badge flow */
const VERIFICATION_FOLLOWER_THRESHOLD = 30000;

/* Max upload size accepted for a profile photo, checked before it's ever read into memory */
const MAX_PHOTO_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

/* ─────────────────────────────────────
   Format follower count for display
───────────────────────────────────── */
function formatFollowers(num, suffix) {
  if (!num) return "";
  const n = Number(num);
  if (isNaN(n)) return String(num);
  if (suffix === "M") return `${n}M`;
  if (suffix === "K") return `${n}K`;
  return String(n);
}

/* ─────────────────────────────────────
   Default inline avatar
───────────────────────────────────── */
const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#1a1c2e"/><circle cx="60" cy="48" r="22" fill="#5ac8fa" opacity="0.7"/><path d="M22 100c0-18 17-30 38-30s38 12 38 30" fill="#5ac8fa" opacity="0.5"/></svg>'
  );

/* ─────────────────────────────────────
   Canvas share card renderer
───────────────────────────────────── */
const CARD_DIMS = {
  portrait: { w: 360, h: 540 },
  square: { w: 420, h: 420 },
};

async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function drawShareCard(canvas, { username, photoURL, qrDataUrl }, layout = "portrait") {
  const ctx = canvas.getContext("2d");
  const { w: W, h: H } = CARD_DIMS[layout];
  canvas.width = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const rrect = (x, y, ww, hh, r) => {
    ctx.beginPath();
    ctx.roundRect(x, y, ww, hh, r);
  };

  // Blue linear gradient background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a84ff");
  bg.addColorStop(1, "#5ac8fa");
  ctx.fillStyle = bg;
  rrect(0, 0, W, H, 32);
  ctx.fill();

  // Subtle white overlay for depth
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(255,255,255,0.10)");
  overlay.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1.5;
  rrect(1, 1, W - 2, H - 2, 31);
  ctx.stroke();

  const isSquare = layout === "square";
  const scale = isSquare ? 0.92 : 1;

  // "Cheer Me Up" text — tightened top offset so the header doesn't leave a big empty gap
  const baseY = 26;
  ctx.save();
  ctx.font = `bold ${Math.round(21 * scale)}px -apple-system, Helvetica Neue, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText("Cheer Me Up", W / 2, baseY + 18);
  ctx.restore();

  // Avatar
  const avatarR = isSquare ? 46 : 52;
  const avatarCX = W / 2;
  const avatarCY = baseY + 18 + avatarR + 18;
  const avatarImg = await loadImage(photoURL || DEFAULT_AVATAR);
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
  ctx.clip();
  if (avatarImg) {
    ctx.drawImage(avatarImg, avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fill();
  }
  ctx.restore();
  // Avatar ring
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarR + 4, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Username — well spaced below avatar
  const usernameY = avatarCY + avatarR + 30;
  ctx.save();
  ctx.font = `bold ${Math.round(18 * scale)}px -apple-system, Helvetica Neue, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`@${username || "username"}`, W / 2, usernameY);
  ctx.restore();

  // QR Code — well spaced below username
  if (qrDataUrl) {
    const qrImg = await loadImage(qrDataUrl);
    if (qrImg) {
      const qrSize = isSquare ? 120 : 132;
      const qrX = W / 2 - qrSize / 2;
      const qrY = usernameY + 24;
      ctx.save();
      ctx.fillStyle = "#ffffff";
      rrect(qrX - 13, qrY - 13, qrSize + 26, qrSize + 26, 16);
      ctx.fill();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.restore();
    }
  }

  // Footer
  ctx.save();
  ctx.font = `${Math.round(11.5 * scale)}px -apple-system, Helvetica Neue, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("cheer-et.web.app", W / 2, H - 18);
  ctx.restore();
}

function svgToPngDataUrl(svgEl, size = 200) {
  return new Promise((resolve) => {
    try {
      const xml = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/* ─────────────────────────────────────
   Crop image to circle using canvas
───────────────────────────────────── */
function cropToCircle(imgEl, cropX, cropY, cropSize, outputSize = 320) {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.clip();
  const scale = outputSize / cropSize;
  ctx.drawImage(
    imgEl,
    cropX, cropY, cropSize, cropSize,
    0, 0, outputSize, outputSize
  );
  return canvas.toDataURL("image/jpeg", 0.88);
}

/* ─────────────────────────────────────
   Animation options
───────────────────────────────────── */
const ANIM_OPTIONS = [
  { id: "slide", label: "Slide In" },
  { id: "bounce", label: "Bounce" },
  { id: "fade", label: "Fade" },
  { id: "pop", label: "Pop" },
  { id: "shake", label: "Shake" },
];

/* ═════════════════════════════════════
   CROP MODAL COMPONENT
═════════════════════════════════════ */
function CropModal({ src, onConfirm, onCancel }) {
  const imgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const stageRef = useRef(null);

  const handleMouseDown = (e) => {
    setDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const handleMouseMove = (e) => {
    if (!dragging || !dragStart.current) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => { setDragging(false); dragStart.current = null; };

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { x: t.clientX - offset.x, y: t.clientY - offset.y };
  };
  const handleTouchMove = (e) => {
    if (!dragging || !dragStart.current) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y });
  };

  const handleConfirm = () => {
    const stage = stageRef.current;
    if (!stage || !imgRef.current) return;
    const stageRect = stage.getBoundingClientRect();
    const stageSize = stageRect.width;
    const circleSize = stageSize * 0.8;
    const circleLeft = (stageSize - circleSize) / 2;
    const circleTop = (stageSize - circleSize) / 2;

    const imgNatW = imgRef.current.naturalWidth;
    const imgNatH = imgRef.current.naturalHeight;
    const imgDispW = imgRef.current.offsetWidth * zoom;
    const imgDispH = imgRef.current.offsetHeight * zoom;
    const imgLeft = (stageSize - imgDispW) / 2 + offset.x;
    const imgTop = (stageSize - imgDispH) / 2 + offset.y;

    const scaleX = imgNatW / imgDispW;
    const scaleY = imgNatH / imgDispH;

    const cropX = (circleLeft - imgLeft) * scaleX;
    const cropY = (circleTop - imgTop) * scaleY;
    const cropW = circleSize * scaleX;
    const cropH = circleSize * scaleY;

    const finalSize = Math.min(cropW, cropH);
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(160, 160, 160, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(imgRef.current, cropX, cropY, finalSize, finalSize, 0, 0, 320, 320);
    onConfirm(canvas.toDataURL("image/jpeg", 0.88));
  };

  return (
    <div className="s-crop-modal">
      <div className="s-crop-box">
        <h3>Crop Profile Photo</h3>
        <div
          ref={stageRef}
          className="s-crop-canvas-wrap"
          style={{ cursor: dragging ? "grabbing" : "grab", aspectRatio: "1/1", height: "auto" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt="Crop preview"
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "center",
              maxWidth: "100%",
              maxHeight: "260px",
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
          {/* Circle mask overlay */}
          <div className="s-crop-circle-overlay">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <mask id="circle-mask">
                  <rect width="100" height="100" fill="white" />
                  <ellipse cx="50" cy="50" rx="40" ry="40" fill="black" />
                </mask>
              </defs>
              <rect width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#circle-mask)" />
              <ellipse cx="50" cy="50" rx="40" ry="40" fill="none" stroke="rgba(90,200,250,0.8)" strokeWidth="0.5" />
            </svg>
          </div>
        </div>

        <div className="s-crop-slider-row">
          <span className="s-crop-slider-label">Zoom: {Math.round(zoom * 100)}%</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>

        <div className="s-crop-actions">
          <button className="s-btn-primary" onClick={handleConfirm}>Use This Photo</button>
          <button className="s-btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════ */
export default function Settings() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [reauthModal, setReauthModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [overlayModal, setOverlayModal] = useState(false);
  const [cropModal, setCropModal] = useState(null); // holds raw data URL

  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notif, setNotif] = useState(null);
  const [notifType, setNotifType] = useState("info");

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [language, setLanguage] = useState("en");
  const [photoInput, setPhotoInput] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [overlaySettings, setOverlaySettings] = useState(DEFAULT_OVERLAY);
  const [savingOverlay, setSavingOverlay] = useState(false);
  const [testAlert, setTestAlert] = useState(null);

  // Follower count fields
  const [followerNum, setFollowerNum] = useState("");
  const [followerSuffix, setFollowerSuffix] = useState(""); // "", "K", "M"

  const [cardLayout, setCardLayout] = useState("portrait");

  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const qrRef = useRef(null);

  const premiumActive = isPremiumActive(data);

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

        // Parse stored followers into num + suffix
        const stored = d.followers || "";
        let parsedNum = "";
        let parsedSuffix = "";
        if (stored) {
          const upper = String(stored).toUpperCase();
          if (upper.endsWith("M")) { parsedNum = upper.slice(0, -1); parsedSuffix = "M"; }
          else if (upper.endsWith("K")) { parsedNum = upper.slice(0, -1); parsedSuffix = "K"; }
          else { parsedNum = stored; parsedSuffix = ""; }
        }
        setFollowerNum(parsedNum);
        setFollowerSuffix(parsedSuffix);

        setForm({
          username: d.username || "",
          phone: d.phone || "",
          telegram: d.telegram || "",
          followers: d.followers || "",
          method: d.lastBankInfo?.method || "CBE",
          bankNumber: d.lastBankInfo?.bankNumber || "",
          bankUserName: d.lastBankInfo?.bankUserName || "",
        });
        setPhotoInput(d.photoURL || "");
        setPhotoPreview(d.photoURL || "");
        if (d.overlaySettings) setOverlaySettings(effectiveOverlay(d));
        setLoading(false);
      });
      return () => unsubDoc();
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !data) return;
    if (!premiumActive && data.overlaySettings?.theme === "premium") {
      updateDoc(doc(db, "users", user.uid), {
        overlaySettings: { ...DEFAULT_OVERLAY, theme: "default" },
        premium: false,
      }).catch(() => {});
    }
  }, [user, data, premiumActive]);

  useEffect(() => {
    if (!shareModal || !canvasRef.current) return;
    let active = true;
    (async () => {
      const svgEl = qrRef.current?.querySelector("svg");
      const qrUrl = svgEl ? await svgToPngDataUrl(svgEl, 200) : null;
      if (!active) return;
      await drawShareCard(
        canvasRef.current,
        { username: data.username, photoURL: data.photoURL, qrDataUrl: qrUrl },
        cardLayout
      );
    })();
    return () => { active = false; };
  }, [shareModal, data, cardLayout]);

  /* ── Handlers ── */
  const openEditModal = () => {
    setPhotoInput(data.photoURL || "");
    setPhotoPreview(data.photoURL || "");
    setEditModal(true);
  };

  const onPhotoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Please select an image file", "error");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_UPLOAD_BYTES) {
      notify("Image is too large — please choose a file under 8MB", "error");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropModal(reader.result);
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onCropConfirm = (croppedUrl) => {
    setPhotoInput(croppedUrl);
    setPhotoPreview(croppedUrl);
    setCropModal(null);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        username: (form.username || "").trim(),
        phone: (form.phone || "").trim(),
        telegram: (form.telegram || "").trim(),
        photoURL: photoInput,
      });
      notify("Profile updated", "success");
      setEditModal(false);
    } catch {
      notify("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveBank = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastBankInfo: {
          method: form.method,
          bankNumber: (form.bankNumber || "").trim(),
          bankUserName: (form.bankUserName || "").trim(),
        },
      });
      notify("Bank info saved", "success");
    } catch {
      notify("Failed to save", "error");
    }
  };

  const saveFollowers = async () => {
    const safeNum = Math.max(0, Number(followerNum) || 0);
    const formatted = formatFollowers(safeNum, followerSuffix);
    try {
      await updateDoc(doc(db, "users", user.uid), { followers: formatted });
      notify("Followers updated", "success");
    } catch {
      notify("Failed to save", "error");
    }
  };

  const saveOverlay = async () => {
    if (!premiumActive) { notify("Upgrade to Premium to customize", "error"); return; }
    setSavingOverlay(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        overlaySettings: { ...overlaySettings, theme: "premium" },
      });
      notify("Overlay settings saved", "success");
      setOverlayModal(false);
    } catch {
      notify("Failed to save", "error");
    } finally {
      setSavingOverlay(false);
    }
  };

  const reauth = async () => {
    try {
      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, newEmail);
      notify("Email updated", "success");
      setReauthModal(false);
      setEmailModal(false);
    } catch {
      notify("Wrong password", "error");
    }
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
      const a = document.createElement("a");
      a.href = url;
      a.download = `cheer-et-${user.uid.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify("Data downloaded", "success");
    } catch {
      notify("Failed to download", "error");
    }
  };

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `cheer-${data.username || "card"}-${cardLayout}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    notify("Card downloaded", "success");
  };

  const telegramShare = () => {
    const text = encodeURIComponent(`Support me on Cheer ET${data.username ? ` @${data.username}` : ""}`);
    const url = encodeURIComponent(profileLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank", "noopener,noreferrer");
  };

  const fireTestAlert = () => {
    const id = Date.now();
    setTestAlert({ id, name: "Abebe Girma", amount: 500, message: "Keep it up — great stream!" });
    setTimeout(() => setTestAlert((cur) => (cur && cur.id === id ? null : cur)), 4200);
  };

  /* ── Derived ── */
  const profileLink = `https://cheer-et.web.app/${data.username || ""}`;
  const overlayLink = `https://cheer-et.web.app/${data.username || ""}/overlays`;
  const steps = user ? getSteps(data, user) : [];
  const missingSteps = steps.filter((s) => !s.done);
  const donePct = steps.length ? Math.round(((steps.length - missingSteps.length) / steps.length) * 100) : 0;
  const isStreamer = data.role === "streamer" || data.isStreamer === true;

  // Follower derived
  const followerDisplay = formatFollowers(followerNum, followerSuffix);
  const followerRaw = Number(followerNum) || 0;
  const followerActual = followerSuffix === "M" ? followerRaw * 1_000_000
    : followerSuffix === "K" ? followerRaw * 1_000
    : followerRaw;

  // The verified badge shown on the profile card only reflects a real, confirmed
  // verified status — it is never inferred from follower count.
  const isVerified = data.verified === true;
  // Follower count only decides whether we invite the creator to apply for
  // verification (30k+); it never toggles the badge itself.
  const qualifiesForVerification = followerActual >= VERIFICATION_FOLLOWER_THRESHOLD;

  if (loading)
    return (
      <div className="s-loading">
        <div className="s-spinner" />
      </div>
    );

  return (
    <>
      <Navbar />

      {/* Hidden QR for canvas export */}
      <div ref={qrRef} aria-hidden="true" style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none" }}>
        <QRCode value={profileLink} size={120} fgColor="#0a84ff" bgColor="#ffffff" />
      </div>

     <div className="s-page s-settings-page">
        <div className="s-container">
          {/* ══ PROFILE CARD ══ */}
          <section className="s-section">
            <div className="s-card s-profile-card">
              <div className="s-avatar-wrap">
                <img
                  src={data.photoURL || DEFAULT_AVATAR}
                  alt="Avatar"
                  className="s-avatar"
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                />
              </div>

              <div className="s-profile-info">
                <div className="s-profile-name">
                  {form.username || "Your Name"}
                  {isVerified && (
                    <img
                      src={verifiedIcon}
                      alt="Verified"
                      className="s-verified-icon"
                      title="Verified Account"
                    />
                  )}
                </div>
                <div className="s-profile-email">{user?.email}</div>
                <div className="s-profile-meta">
                  {form.phone && <span>{form.phone}</span>}
                  {followerDisplay && (
                    <span style={{ userSelect: "none" }}>{followerDisplay} followers</span>
                  )}
                </div>
              </div>

              <button className="s-btn-primary s-edit-btn" onClick={openEditModal}>
                {Icon.edit} Edit
              </button>
            </div>

            {/* ── COMPLETION BAR (hidden at 100%) ── */}
            {donePct < 100 && (
              <div className="s-completion">
                <div className="s-completion-header">
                  <span className="s-completion-label">Profile completion</span>
                  <span className="s-completion-pct" style={{ color: "var(--s-blue)" }}>
                    {donePct}%
                  </span>
                </div>
                <div className="s-completion-track">
                  <div
                    className="s-completion-fill"
                    style={{
                      width: `${donePct}%`,
                      background: "linear-gradient(90deg,#0a84ff,#5ac8fa)",
                    }}
                  />
                </div>

                {missingSteps.length > 0 && (
                  <ul className="s-completion-missing">
                    {missingSteps.map((s) => (
                      <li key={s.action} className="s-missing-item">
                        <span className="s-missing-dot">{Icon.alert}</span>
                        {s.action}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="s-completion-chips">
                  {steps.map((s) => (
                    <div key={s.label} className={`s-chip ${s.done ? "s-chip-done" : ""}`}>
                      <span className="s-chip-dot">{s.done ? Icon.check : null}</span>
                      {s.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                {user?.emailVerified ? (
                  <span className="s-verified-badge">Verified</span>
                ) : (
                  <button
                    className="s-inline-btn"
                    onClick={() => sendEmailVerification(user).then(() => notify("Verification email sent", "success"))}
                  >
                    Verify
                  </button>
                )}
              </div>
              <div className="s-divider" />
              <button className="s-list-row s-list-row-btn" onClick={() => setEmailModal(true)}>
                <span className="s-list-icon">{Icon.mail}</span>
                <div className="s-list-body">
                  <div className="s-list-title">Change Email</div>
                </div>
                <span className="s-chevron">{Icon.chevron}</span>
              </button>
              <div className="s-divider" />
              <button
                className="s-list-row s-list-row-btn"
                onClick={() => sendPasswordResetEmail(auth, user.email).then(() => notify("Reset link sent", "success"))}
              >
                <span className="s-list-icon">{Icon.lock}</span>
                <div className="s-list-body">
                  <div className="s-list-title">Reset Password</div>
                </div>
                <span className="s-chevron">{Icon.chevron}</span>
              </button>
            </div>
          </section>

          {/* ══ MINIMUM DONATION ══ */}
          <section className="s-section">
            <p className="s-section-label">Minimum Donation</p>
            <div className="s-card">
              <div className="s-donation-display">
                <span className="s-donation-num">{data.minDonation || 67}</span>
                <span className="s-donation-cur">ETB</span>
              </div>
              <input
                type="range"
                min="67"
                max="10000"
                step="1"
                value={data.minDonation || 67}
                onChange={(e) => {
                  const v = Math.min(10000, Math.max(67, Number(e.target.value) || 67));
                  updateDoc(doc(db, "users", user.uid), { minDonation: v });
                }}
              />
              <div className="s-slider-labels">
                <span>67</span>
                <span>10,000 ETB</span>
              </div>
            </div>
          </section>

          {/* ══ BANK INFO ══ */}
          <section className="s-section">
            <p className="s-section-label">Bank Information</p>
            <div className="s-card">
              <div className="s-field">
                <label className="s-label">Payment Method</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="Commercial Bank of Ethiopia (CBE)">
  Commercial Bank of Ethiopia (CBE)
</option>

<option value="Telebirr">
  Telebirr
</option>
                </select>
              </div>
              <div className="s-field">
                <label className="s-label">Account Number</label>
                <input
                  placeholder="e.g. 1000123456789"
                  value={form.bankNumber}
                  maxLength={34}
                  autoComplete="off"
                  onChange={(e) => setForm({ ...form, bankNumber: e.target.value })}
                />
              </div>
              <div className="s-field">
                <label className="s-label">Account Name</label>
                <input
                  placeholder="Full name on account"
                  value={form.bankUserName}
                  maxLength={60}
                  autoComplete="off"
                  onChange={(e) => setForm({ ...form, bankUserName: e.target.value })}
                />
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

              <div className="s-ov-preview s-ov-preview-inline">
                <div className="s-ov-preview-bar">
                  <span className="s-ov-preview-label">Live Preview</span>
                  <button className="s-test-alert-btn" onClick={fireTestAlert}>
                    {Icon.zap} Test Alert
                  </button>
                </div>
                <div className="s-ov-stage">
                  <div key={testAlert?.id || "empty"} className={`s-ov-box ${testAlert ? `s-anim-${overlaySettings.animation}` : ""}`}>
                    {testAlert ? (
                      <>
                        <div className="s-ov-name" style={{ color: overlaySettings.nameColor }}>{testAlert.name}</div>
                        <div className="s-ov-main" style={{ color: overlaySettings.mainColor }}>
                          donated <span style={{ color: overlaySettings.moneyColor, fontWeight: 700 }}>{testAlert.amount} ETB</span>
                        </div>
                        <div className="s-ov-text" style={{ color: overlaySettings.textColor }}>{testAlert.message}</div>
                      </>
                    ) : (
                      <span className="s-ov-empty">Press Test Alert to preview</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="s-row-btns">
                <button
                  className="s-btn-primary"
                  onClick={() => { navigator.clipboard.writeText(overlayLink); notify("Copied!", "success"); }}
                >
                  {Icon.copy} Copy Link
                </button>
                <button className="s-btn-ghost" onClick={() => setOverlayModal(true)}>
                  {Icon.palette} Customize
                </button>
              </div>
            </div>
          </section>

          {/* ══ SHARE PROFILE ══ */}
          <section className="s-section">
            <p className="s-section-label">Share Profile</p>
            <button className="s-share-teaser" onClick={() => setShareModal(true)}>
              <div className="s-share-icon-wrap">{Icon.share}</div>
              <div className="s-share-text">
                <div className="s-share-title">Share Your Profile Card</div>
                <div className="s-share-sub">Generate a card to post with your audience</div>
              </div>
              <span className="s-chevron" style={{ color: "rgba(255,255,255,0.7)" }}>{Icon.chevron}</span>
            </button>
          </section>

          {/* ══ SOCIAL ══ */}
          <section className="s-section">
            <p className="s-section-label">Social</p>
            <div className="s-card">
              <div className="s-field">
                <label className="s-label">Follower Count</label>
                <div className="s-follower-row">
                  <input
                    type="number"
                    min="0"
                    value={followerNum}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || Number(v) >= 0) setFollowerNum(v);
                    }}
                    placeholder="e.g. 12"
                    style={{ userSelect: "none" }}
                  />
                  <div className="s-follower-suffix">
                    <button
                      className={`s-suffix-btn ${followerSuffix === "" ? "s-suffix-active" : ""}`}
                      onClick={() => setFollowerSuffix("")}
                    >
                      #
                    </button>
                    <button
                      className={`s-suffix-btn ${followerSuffix === "K" ? "s-suffix-active" : ""}`}
                      onClick={() => setFollowerSuffix("K")}
                    >
                      K
                    </button>
                    <button
                      className={`s-suffix-btn ${followerSuffix === "M" ? "s-suffix-active" : ""}`}
                      onClick={() => setFollowerSuffix("M")}
                    >
                      M
                    </button>
                  </div>
                </div>

                {followerNum && (
                  <div className="s-follower-warn">
                    <span style={{ flexShrink: 0, marginTop: 1 }}>{Icon.warn}</span>
                    <span>Adding a fake follower count can result in account strike or suspension.</span>
                  </div>
                )}

                {qualifiesForVerification && !isVerified && (
                  <button className="s-get-verified-banner" onClick={() => { window.location.href = "/premium"; }}>
                    <img src={verifiedIcon} alt="Verified" className="s-get-verified-img" />
                    <div>
                      <div className="s-get-verified-text">Get Verification Badge</div>
                      <span className="s-get-verified-sub">Your account qualifies — tap to unlock</span>
                    </div>
                    <span style={{ color: "var(--s-blue-soft)", flexShrink: 0 }}>{Icon.chevron}</span>
                  </button>
                )}
              </div>
              <button
                className="s-btn-primary"
                style={{ marginTop: 10 }}
                onClick={saveFollowers}
              >
                Update
              </button>
            </div>
          </section>

          {/* ══ CREATOR badge ══ */}
          {isStreamer && (
            <section className="s-section">
              <p className="s-section-label">Creator</p>
              <div className="s-card s-creator-badge">
                {Icon.crown}
                <div>
                  <div className="s-share-title" style={{ color: "var(--s-text)" }}>Streamer / Creator</div>
                  <div className="s-share-sub" style={{ color: "var(--s-text2)" }}>Share Profile and Stream Overlay features are unlocked.</div>
                </div>
              </div>
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

      {/* ── CROP IMAGE ── */}
      {cropModal && (
        <CropModal
          src={cropModal}
          onConfirm={onCropConfirm}
          onCancel={() => setCropModal(null)}
        />
      )}

      {/* ── EDIT PROFILE ── */}
      {editModal && (
        <div className="s-modal-bg" onClick={(e) => e.target === e.currentTarget && setEditModal(false)}>
          <div className="s-modal">
            <div className="s-modal-head">
              <h3>Edit Profile</h3>
              <button className="s-modal-close" onClick={() => setEditModal(false)}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>

            <div className="s-photo-wrap">
              <div className="s-photo-upload">
                <img
                  src={photoPreview || DEFAULT_AVATAR}
                  alt="Preview"
                  className="s-photo-preview"
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                />
                <button
                  type="button"
                  className="s-photo-camera"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? <span className="s-spinner-sm" /> : Icon.camera}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoSelected} className="s-file-hidden" />
              </div>
              <span className="s-photo-label">Tap camera to upload &amp; crop</span>
              {photoInput && (
                <button
                  type="button"
                  className="s-photo-remove"
                  onClick={() => { setPhotoInput(""); setPhotoPreview(""); }}
                >
                  Remove photo
                </button>
              )}
            </div>

            <div className="s-field">
              <label className="s-label">Username</label>
              <input
                value={form.username}
                maxLength={30}
                autoComplete="off"
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="s-field">
              <label className="s-label">Phone</label>
              <input
                value={form.phone}
                maxLength={20}
                autoComplete="tel"
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+251..."
              />
            </div>
            <div className="s-field">
              <label className="s-label">Telegram</label>
              <input
                value={form.telegram}
                maxLength={32}
                autoComplete="off"
                onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                placeholder="@handle"
              />
            </div>

            <div className="s-toggle-row">
              <div>
                <div className="s-toggle-title">Notifications</div>
                <div className="s-toggle-sub">Browser push alerts</div>
              </div>
              <label className="s-toggle">
                <input type="checkbox" checked={notifEnabled} onChange={(e) => askNotifPermission(e.target.checked)} />
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
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>
            <div className="s-field">
              <label className="s-label">New Email</label>
              <input
                type="email"
                placeholder="new@email.com"
                value={newEmail}
                autoComplete="email"
                onChange={(e) => setNewEmail(e.target.value)}
              />
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
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>
            <p className="s-modal-desc">Enter your current password to confirm this change.</p>
            <div className="s-field">
              <label className="s-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
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
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>

            <div className="s-layout-grid">
              <button
                className={`s-layout-btn ${cardLayout === "portrait" ? "s-layout-active" : ""}`}
                onClick={() => setCardLayout("portrait")}
              >
                {Icon.portrait}<span>Portrait</span>
              </button>
              <button
                className={`s-layout-btn ${cardLayout === "square" ? "s-layout-active" : ""}`}
                onClick={() => setCardLayout("square")}
              >
                {Icon.square}<span>Square</span>
              </button>
            </div>

            <div className="s-canvas-wrap">
              <canvas ref={canvasRef} width={360} height={540} className="s-canvas" />
            </div>

            <button
              className="s-copy-link-btn"
              onClick={() => { navigator.clipboard.writeText(profileLink); notify("Link copied!", "success"); }}
            >
              <span className="s-copy-link-url">{profileLink}</span>
              <span className="s-copy-link-action">{Icon.copy} Copy</span>
            </button>

            <div className="s-modal-actions">
              <button className="s-btn-primary" onClick={downloadCard}>
                {Icon.download} Download {cardLayout === "square" ? "Square" : "Portrait"} Image
              </button>
              <div className="s-share-extra-row">
                <button className="s-btn-ghost" onClick={telegramShare}>{Icon.telegram} Telegram</button>
                <button
                  className="s-btn-ghost"
                  onClick={() => { downloadCard(); notify("Saved — add it to your Instagram Story", "info"); }}
                >
                  {Icon.instagram} IG Story
                </button>
              </div>
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
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>

            <div className="s-ov-preview">
              <div className="s-ov-preview-bar">
                <span className="s-ov-preview-label">Live Preview · OBS-ready</span>
                <button className="s-test-alert-btn" onClick={fireTestAlert}>{Icon.zap} Test</button>
              </div>
              <div className="s-ov-stage">
                <div key={testAlert?.id || "empty"} className={`s-ov-box ${testAlert ? `s-anim-${overlaySettings.animation}` : ""}`}>
                  {testAlert ? (
                    <>
                      <div className="s-ov-name" style={{ color: overlaySettings.nameColor }}>{testAlert.name}</div>
                      <div className="s-ov-main" style={{ color: overlaySettings.mainColor }}>
                        donated <span style={{ color: overlaySettings.moneyColor, fontWeight: 700 }}>{testAlert.amount} ETB</span>
                      </div>
                      <div className="s-ov-text" style={{ color: overlaySettings.textColor }}>{testAlert.message}</div>
                    </>
                  ) : (
                    <span className="s-ov-empty">Press Test to preview</span>
                  )}
                </div>
              </div>
            </div>

            <div className="s-theme-section">
              <div className="s-theme-head">
                <span className="s-label">Theme</span>
                {!premiumActive && <span className="s-premium-tag">{Icon.lock} Premium</span>}
              </div>
              <div className="s-theme-grid">
                <button
                  className={`s-theme-btn ${overlaySettings.theme === "default" ? "s-theme-active" : ""}`}
                  onClick={() => setOverlaySettings((s) => ({ ...s, theme: "default" }))}
                >
                  <span className="s-theme-name">Default</span>
                  <span className="s-theme-sub">Available to everyone</span>
                </button>
                <button
                  className={`s-theme-btn s-theme-premium ${overlaySettings.theme === "premium" ? "s-theme-active" : ""}`}
                  onClick={() => premiumActive && setOverlaySettings((s) => ({ ...s, theme: "premium" }))}
                  disabled={!premiumActive}
                >
                  <span className="s-theme-name">Premium {Icon.crown}</span>
                  <span className="s-theme-sub">Customize everything</span>
                </button>
              </div>
            </div>

            <div className="s-customize-wrap">
              <div className={`s-customize-body ${premiumActive ? "" : "s-blur"}`}>
                <div className="s-color-list">
                  {[
                    { key: "nameColor", label: "Donor Name" },
                    { key: "mainColor", label: "Main Text" },
                    { key: "moneyColor", label: "Amount" },
                    { key: "textColor", label: "Message" },
                  ].map(({ key, label }) => (
                    <div className="s-color-row" key={key}>
                      <span className="s-color-label">{label}</span>
                      <div className="s-color-right">
                        <span className="s-color-hex">{overlaySettings[key]}</span>
                        <label className="s-swatch-wrap">
                          <input
                            type="color"
                            value={overlaySettings[key]}
                            onChange={(e) => setOverlaySettings({ ...overlaySettings, [key]: e.target.value })}
                            className="s-color-native"
                          />
                          <span className="s-swatch" style={{ background: overlaySettings[key] }} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="s-anim-section">
                  <p className="s-label" style={{ marginBottom: 10 }}>Alert Animation</p>
                  <div className="s-anim-grid">
                    {ANIM_OPTIONS.map((a) => (
                      <button
                        key={a.id}
                        className={`s-anim-btn ${overlaySettings.animation === a.id ? "s-anim-active" : ""}`}
                        onClick={() => setOverlaySettings({ ...overlaySettings, animation: a.id })}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {!premiumActive && (
                <div className="s-locked-overlay">
                  <div className="s-locked-icon">{Icon.crown}</div>
                  <p className="s-locked-text">Upgrade to Premium to customize your overlay.</p>
                  <button className="s-btn-gold" onClick={() => (window.location.href = "/premium")}>
                    {Icon.crown} Upgrade
                  </button>
                </div>
              )}
            </div>

            <div className="s-obs-info">
              {Icon.monitor}
              <span>Add the overlay URL as a Browser Source in OBS (width 800, height 200).</span>
            </div>

            <div className="s-modal-actions">
              <button className="s-btn-primary" onClick={saveOverlay} disabled={savingOverlay || !premiumActive}>
                {savingOverlay ? <span className="s-spinner-sm" /> : "Save Overlay"}
              </button>
              <button className="s-btn-ghost" onClick={() => setOverlayModal(false)}>Cancel</button>
            </div>
            {!premiumActive && <p className="s-lock-note">Saving disabled — Standard theme is active.</p>}
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {notif && (
        <div className={`s-toast s-toast-${notifType}`}>
          <span className="s-toast-icon">
            {notifType === "success" ? Icon.check : notifType === "error" ? (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </span>
          {notif}
        </div>
      )}
    </>
  );
}