/**
 * PremiumPage.jsx — Creator Premium Page
 *
 * INTEGRATION:
 *   1. Import and render <PremiumPage /> in your router at /premium
 *   2. Pass `user` prop: null (not logged in) | { id, email, firstName, lastName }
 *   3. Set REACT_APP_API_URL env var to your backend URL
 *
 * Example:
 *   import PremiumPage from './PremiumPage';
 *   <Route path="/premium" element={<PremiumPage user={currentUser} onLoginRedirect={() => navigate('/login')} />} />
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PLANS = {
  premium: {
    id:       'premium',
    name:     'Premium',
    price:    150,
    badge:    '⭐ Premium',
    color:    '#f59e0b',
    glow:     'rgba(245,158,11,0.35)',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    tag:      null,
    features: [
      { icon: '✓', text: 'Verified Badge on your profile',      highlight: true  },
      { icon: '✓', text: 'Fast Payout (Basic tier)',            highlight: false },
      { icon: '✓', text: 'Custom Stream Overlays',              highlight: false },
      { icon: '✓', text: 'Premium Creator Profile',             highlight: false },
      { icon: '✓', text: 'No Suggested Accounts in your feed', highlight: false },
    ],
    cta:      'Upgrade to Premium',
    subtext:  'Billed monthly · Cancel anytime',
  },
  plus: {
    id:       'plus',
    name:     'Plus',
    price:    200,
    badge:    '💎 Plus',
    color:    '#818cf8',
    glow:     'rgba(129,140,248,0.35)',
    gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
    tag:      'MOST POPULAR',
    features: [
      { icon: '✓', text: 'Everything in Premium',              highlight: true  },
      { icon: '✓', text: 'Completely Ad-Free experience',      highlight: false },
      { icon: '✓', text: 'Featured / Suggested Account',       highlight: false },
      { icon: '✓', text: 'Exclusive Animated Profile GIF',     highlight: false },
      { icon: '✓', text: 'Priority Creator Support',           highlight: false },
    ],
    cta:      'Upgrade to Plus',
    subtext:  'Best value · Billed monthly',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

const daysLeft = (end) => {
  if (!end) return 0;
  return Math.max(0, Math.ceil((new Date(end) - new Date()) / 86400000));
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pp-root {
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    background: #050c1a;
    color: #e2e8f0;
    overflow-x: hidden;
    position: relative;
  }

  /* ── Background ── */
  .pp-bg {
    position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
  }
  .pp-orb {
    position: absolute; border-radius: 50%;
    filter: blur(80px); opacity: 0.18; animation: ppDrift 18s ease-in-out infinite alternate;
  }
  .pp-orb-1 { width: 700px; height: 700px; background: radial-gradient(circle, #1d4ed8, transparent 70%); top: -200px; left: -150px; animation-delay: 0s; }
  .pp-orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #6366f1, transparent 70%); top: 40%;  right: -100px; animation-delay: -6s; }
  .pp-orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, #0ea5e9, transparent 70%); bottom: 10%; left: 20%; animation-delay: -12s; }
  @keyframes ppDrift {
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(30px, -40px) scale(1.08); }
    100% { transform: translate(-20px, 20px) scale(0.95); }
  }

  /* ── Glass ── */
  .glass {
    background: rgba(255,255,255,0.055);
    backdrop-filter: blur(48px) saturate(160%);
    -webkit-backdrop-filter: blur(48px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 24px;
    box-shadow:
      0 4px 6px rgba(0,0,0,0.25),
      0 20px 60px rgba(0,0,0,0.30),
      inset 0 1px 0 rgba(255,255,255,0.13),
      inset 0 -1px 0 rgba(0,0,0,0.12);
  }
  .glass-sm {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(24px) saturate(150%);
    -webkit-backdrop-filter: blur(24px) saturate(150%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    box-shadow: 0 2px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
  }

  /* ── Navbar ── */
  .pp-nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(5,12,26,0.75);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 0 32px; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .pp-logo {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px;
    background: linear-gradient(90deg, #60a5fa, #818cf8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    letter-spacing: -0.5px;
  }
  .pp-nav-badge {
    padding: 6px 14px; border-radius: 99px; font-size: 13px; font-weight: 500;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(12px);
    color: #94a3b8;
  }

  /* ── Main content ── */
  .pp-content {
    position: relative; z-index: 1;
    max-width: 1080px; margin: 0 auto;
    padding: 80px 24px 60px;
  }

  /* ── Hero ── */
  .pp-hero { text-align: center; margin-bottom: 72px; }
  .pp-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 18px; border-radius: 99px;
    background: rgba(96,165,250,0.10);
    border: 1px solid rgba(96,165,250,0.25);
    color: #60a5fa; font-size: 13px; font-weight: 500;
    margin-bottom: 28px; letter-spacing: 0.02em;
  }
  .pp-hero h1 {
    font-family: 'Syne', sans-serif; font-size: clamp(36px, 6vw, 64px);
    font-weight: 800; line-height: 1.08; letter-spacing: -1.5px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .pp-hero p {
    font-size: 18px; color: #64748b; max-width: 520px; margin: 0 auto 36px;
    line-height: 1.65; font-weight: 300;
  }
  .pp-social-proof {
    display: flex; align-items: center; justify-content: center; gap: 24px;
    flex-wrap: wrap;
  }
  .pp-stat { display: flex; flex-direction: column; align-items: center; }
  .pp-stat-num {
    font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700;
    color: #f8fafc;
  }
  .pp-stat-label { font-size: 12px; color: #475569; font-weight: 400; }
  .pp-stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.08); }

  /* ── Status Card ── */
  .pp-status-card {
    margin: 0 auto 72px;
    max-width: 560px;
    padding: 36px;
    position: relative;
    overflow: hidden;
  }
  .pp-status-glow {
    position: absolute; inset: -1px;
    border-radius: 25px;
    background: linear-gradient(135deg, var(--plan-color, #f59e0b) 0%, transparent 60%);
    opacity: 0.15; pointer-events: none;
  }
  .pp-status-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; }
  .pp-status-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 18px; border-radius: 99px; font-size: 14px; font-weight: 600;
    border: 1px solid; letter-spacing: 0.02em;
  }
  .pp-status-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: ppPulse 2s infinite; }
  @keyframes ppPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
  .pp-verified-badge {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 600;
    background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25);
    color: #4ade80;
  }
  .pp-status-title {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
    margin-bottom: 6px; color: #f8fafc;
  }
  .pp-status-sub { color: #64748b; font-size: 14px; font-weight: 400; }
  .pp-status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .pp-status-field {
    padding: 16px 20px; border-radius: 14px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
  }
  .pp-field-label { font-size: 11px; color: #475569; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .pp-field-value { font-size: 15px; color: #e2e8f0; font-weight: 500; }
  .pp-days-bar { margin-top: 24px; }
  .pp-days-label { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 8px; }
  .pp-days-track { height: 5px; border-radius: 99px; background: rgba(255,255,255,0.07); overflow: hidden; }
  .pp-days-fill { height: 100%; border-radius: 99px; transition: width 1s ease; }

  /* ── Plans ── */
  .pp-plans-title { text-align: center; margin-bottom: 48px; }
  .pp-plans-title h2 {
    font-family: 'Syne', sans-serif; font-size: clamp(24px, 4vw, 40px); font-weight: 800;
    letter-spacing: -1px; color: #f8fafc; margin-bottom: 12px;
  }
  .pp-plans-title p { color: #64748b; font-size: 16px; font-weight: 300; }
  .pp-plans-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 80px;
  }
  @media (max-width: 700px) {
    .pp-plans-grid { grid-template-columns: 1fr; }
  }

  .pp-plan-card {
    padding: 36px 32px; position: relative; overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .pp-plan-card:hover { transform: translateY(-4px); }
  .pp-plan-card.featured {
    border-color: rgba(129,140,248,0.3) !important;
    box-shadow:
      0 4px 6px rgba(0,0,0,0.25),
      0 20px 60px rgba(0,0,0,0.30),
      0 0 0 1px rgba(129,140,248,0.2),
      inset 0 1px 0 rgba(255,255,255,0.13),
      inset 0 -1px 0 rgba(0,0,0,0.12) !important;
  }
  .pp-plan-glow {
    position: absolute; top: 0; left: 0; right: 0; height: 160px;
    background: var(--plan-glow);
    opacity: 0.12; pointer-events: none;
    transition: opacity 0.3s;
  }
  .pp-plan-card:hover .pp-plan-glow { opacity: 0.2; }
  .pp-most-popular {
    position: absolute; top: 18px; right: 18px;
    padding: 5px 12px; border-radius: 99px; font-size: 11px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: #fff; box-shadow: 0 2px 12px rgba(99,102,241,0.5);
  }
  .pp-plan-badge-icon {
    width: 52px; height: 52px; border-radius: 16px; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    background: var(--plan-gradient);
    box-shadow: 0 4px 20px var(--plan-glow);
  }
  .pp-plan-name {
    font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
    color: #f8fafc; margin-bottom: 6px;
  }
  .pp-plan-desc { font-size: 14px; color: #64748b; margin-bottom: 24px; font-weight: 300; }
  .pp-plan-price {
    display: flex; align-items: baseline; gap: 4px; margin-bottom: 28px;
  }
  .pp-plan-amount {
    font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800;
    line-height: 1; color: #f8fafc;
  }
  .pp-plan-currency { font-size: 18px; color: #94a3b8; font-weight: 500; align-self: flex-start; padding-top: 8px; }
  .pp-plan-period { font-size: 14px; color: #475569; }
  .pp-features { list-style: none; margin-bottom: 32px; display: flex; flex-direction: column; gap: 12px; }
  .pp-feature {
    display: flex; align-items: center; gap: 12px;
    font-size: 14px; color: #94a3b8; font-weight: 400;
  }
  .pp-feature.highlight { color: #e2e8f0; font-weight: 500; }
  .pp-feature-check {
    width: 22px; height: 22px; border-radius: 99px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    background: var(--plan-gradient);
  }
  .pp-btn {
    width: 100%; padding: 16px 24px; border-radius: 14px; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 600;
    transition: all 0.25s ease; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pp-btn-primary {
    background: var(--plan-gradient);
    color: #fff;
    box-shadow: 0 4px 20px var(--plan-glow);
  }
  .pp-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 32px var(--plan-glow); }
  .pp-btn-primary:active { transform: translateY(0); }
  .pp-btn-disabled {
    background: rgba(255,255,255,0.05); color: #475569;
    border: 1px solid rgba(255,255,255,0.07); cursor: not-allowed;
  }
  .pp-btn-subtext { text-align: center; font-size: 12px; color: #475569; margin-top: 10px; }

  /* ── Upgrade warning ── */
  .pp-upgrade-notice {
    margin-top: 12px; padding: 14px 18px; border-radius: 12px;
    background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
    color: #fbbf24; font-size: 13px; line-height: 1.5;
  }

  /* ── Support ── */
  .pp-support { margin-bottom: 80px; }
  .pp-section-title {
    font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800;
    color: #f8fafc; margin-bottom: 8px; letter-spacing: -0.5px;
    text-align: center;
  }
  .pp-section-sub { color: #64748b; text-align: center; margin-bottom: 40px; font-size: 15px; font-weight: 300; }
  .pp-faq { display: flex; flex-direction: column; gap: 12px; max-width: 720px; margin: 0 auto 40px; }
  .pp-faq-item { border-radius: 16px; overflow: hidden; }
  .pp-faq-q {
    width: 100%; text-align: left; padding: 20px 24px;
    background: rgba(255,255,255,0.04); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: space-between;
    color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
    transition: background 0.2s;
  }
  .pp-faq-q:hover { background: rgba(255,255,255,0.07); }
  .pp-faq-icon { font-size: 18px; transition: transform 0.3s; color: #475569; }
  .pp-faq-icon.open { transform: rotate(45deg); }
  .pp-faq-a {
    padding: 0 24px; max-height: 0; overflow: hidden;
    transition: max-height 0.35s ease, padding 0.35s ease;
    font-size: 14px; color: #64748b; line-height: 1.7;
    background: rgba(255,255,255,0.02);
  }
  .pp-faq-a.open { max-height: 200px; padding: 16px 24px; }

  .pp-contact-card {
    max-width: 500px; margin: 0 auto; padding: 32px; text-align: center;
    border-radius: 20px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
  }
  .pp-contact-icon { font-size: 40px; margin-bottom: 16px; }
  .pp-contact-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 8px; }
  .pp-contact-text { color: #64748b; font-size: 14px; margin-bottom: 20px; font-weight: 300; }
  .pp-contact-email {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 12px;
    background: rgba(96,165,250,0.10); border: 1px solid rgba(96,165,250,0.2);
    color: #60a5fa; font-size: 14px; font-weight: 500;
    text-decoration: none; transition: all 0.2s;
  }
  .pp-contact-email:hover { background: rgba(96,165,250,0.18); transform: translateY(-1px); }

  /* ── Toast ── */
  .pp-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    padding: 14px 24px; border-radius: 14px; z-index: 9999;
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    font-size: 14px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    animation: ppSlideUp 0.4s ease;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    white-space: nowrap;
  }
  .pp-toast.success { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; }
  .pp-toast.error   { background: rgba(239,68,68,0.15);  border: 1px solid rgba(239,68,68,0.3);  color: #f87171; }
  .pp-toast.info    { background: rgba(96,165,250,0.15); border: 1px solid rgba(96,165,250,0.3); color: #60a5fa; }
  @keyframes ppSlideUp { from { opacity:0; transform: translateX(-50%) translateY(16px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }

  /* ── Footer ── */
  .pp-footer {
    position: relative; z-index: 1;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 48px 32px 32px;
    font-family: 'DM Sans', sans-serif;
  }
  .pp-footer-inner { max-width: 1080px; margin: 0 auto; }
  .pp-footer-top { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
  @media (max-width: 768px) { .pp-footer-top { grid-template-columns: 1fr 1fr; gap: 24px; } }
  @media (max-width: 480px) { .pp-footer-top { grid-template-columns: 1fr; } }
  .pp-footer-brand p { color: #475569; font-size: 14px; margin-top: 12px; line-height: 1.6; max-width: 240px; font-weight: 300; }
  .pp-footer-col h4 { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #94a3b8; margin-bottom: 16px; letter-spacing: 0.04em; text-transform: uppercase; }
  .pp-footer-col a { display: block; color: #475569; text-decoration: none; font-size: 14px; margin-bottom: 10px; transition: color 0.2s; font-weight: 400; }
  .pp-footer-col a:hover { color: #94a3b8; }
  .pp-footer-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap; gap: 12px; }
  .pp-footer-copy { font-size: 13px; color: #334155; }
  .pp-footer-badges { display: flex; gap: 12px; }
  .pp-footer-badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: #475569; }

  /* ── Loading spinner ── */
  .pp-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: ppSpin 0.6s linear infinite; }
  @keyframes ppSpin { to { transform: rotate(360deg); } }
`;

// ─── Sub-components ────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  return (
    <div className={`pp-toast ${type}`} role="alert">
      <span>{icons[type]}</span>
      <span>{msg}</span>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pp-faq-item glass-sm">
      <button className="pp-faq-q" onClick={() => setOpen(!open)} aria-expanded={open}>
        {q}
        <span className={`pp-faq-icon ${open ? 'open' : ''}`}>+</span>
      </button>
      <div className={`pp-faq-a ${open ? 'open' : ''}`}>{a}</div>
    </div>
  );
}

function StatusCard({ premium }) {
  const plan   = PLANS[premium.type];
  const days   = daysLeft(premium.endDate);
  const totalD = 30;
  const pct    = Math.max(0, Math.min(100, (days / totalD) * 100));

  return (
    <div
      className="pp-status-card glass"
      style={{ '--plan-color': plan.color, '--plan-gradient': plan.gradient, '--plan-glow': plan.glow }}
    >
      <div className="pp-status-glow" />
      <div className="pp-status-top">
        <span
          className="pp-status-badge"
          style={{ color: plan.color, borderColor: `${plan.color}44`, background: `${plan.color}11` }}
        >
          <span className="pp-status-badge-dot" />
          {plan.name} Active
        </span>
        {premium.verified && (
          <span className="pp-verified-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Verified
          </span>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="pp-status-title">You're a {plan.name} Creator</div>
        <div className="pp-status-sub">Your account is fully unlocked with all {plan.name} benefits.</div>
      </div>

      <div className="pp-status-grid">
        <div className="pp-status-field">
          <div className="pp-field-label">Plan</div>
          <div className="pp-field-value" style={{ color: plan.color }}>{plan.badge}</div>
        </div>
        <div className="pp-status-field">
          <div className="pp-field-label">Verified</div>
          <div className="pp-field-value" style={{ color: premium.verified ? '#4ade80' : '#f87171' }}>
            {premium.verified ? '✓ Yes' : '✗ No'}
          </div>
        </div>
        <div className="pp-status-field">
          <div className="pp-field-label">Started</div>
          <div className="pp-field-value">{fmt(premium.startDate)}</div>
        </div>
        <div className="pp-status-field">
          <div className="pp-field-label">Expires</div>
          <div className="pp-field-value">{fmt(premium.endDate)}</div>
        </div>
      </div>

      <div className="pp-days-bar">
        <div className="pp-days-label">
          <span>Time remaining</span>
          <span style={{ color: days < 7 ? '#f87171' : '#94a3b8' }}>{days} day{days !== 1 ? 's' : ''} left</span>
        </div>
        <div className="pp-days-track">
          <div
            className="pp-days-fill"
            style={{ width: `${pct}%`, background: plan.gradient, boxShadow: `0 0 8px ${plan.glow}` }}
          />
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, currentPremium, onBuy, loading }) {
  const p           = PLANS[plan];
  const isActive    = currentPremium?.type === plan;
  const hasActive   = !!currentPremium;
  const isUpgrade   = hasActive && !isActive;

  return (
    <div
      className={`pp-plan-card glass ${plan === 'plus' ? 'featured' : ''}`}
      style={{ '--plan-color': p.color, '--plan-gradient': p.gradient, '--plan-glow': p.glow }}
    >
      <div className="pp-plan-glow" />
      {p.tag && <span className="pp-most-popular">{p.tag}</span>}

      <div className="pp-plan-badge-icon" style={{ background: p.gradient, boxShadow: `0 4px 20px ${p.glow}` }}>
        {plan === 'premium' ? '⭐' : '💎'}
      </div>

      <div className="pp-plan-name">{p.name}</div>
      <div className="pp-plan-desc">
        {plan === 'premium' ? 'Everything you need to grow your creator brand.' : 'The ultimate creator experience, fully unlocked.'}
      </div>

      <div className="pp-plan-price">
        <span className="pp-plan-currency">ETB</span>
        <span className="pp-plan-amount">{p.price}</span>
        <span className="pp-plan-period">/mo</span>
      </div>

      <ul className="pp-features">
        {p.features.map((f, i) => (
          <li key={i} className={`pp-feature ${f.highlight ? 'highlight' : ''}`}>
            <span className="pp-feature-check" style={{ background: p.gradient }}>✓</span>
            {f.text}
          </li>
        ))}
      </ul>

      {isActive ? (
        <button className="pp-btn pp-btn-disabled" disabled>
          ✓ Current Plan
        </button>
      ) : isUpgrade ? (
        <>
          <button className="pp-btn pp-btn-disabled" disabled>Upgrade to {p.name}</button>
          <div className="pp-upgrade-notice">
            ⏳ Wait until your current {currentPremium.type} plan expires on{' '}
            <strong>{fmt(currentPremium.endDate)}</strong> to upgrade.
          </div>
        </>
      ) : (
        <button
          className="pp-btn pp-btn-primary"
          style={{ '--plan-gradient': p.gradient, '--plan-glow': p.glow }}
          onClick={() => onBuy(plan)}
          disabled={loading === plan}
        >
          {loading === plan ? (
            <><div className="pp-spinner" /> Processing…</>
          ) : (
            <>{p.cta} →</>
          )}
        </button>
      )}

      <div className="pp-btn-subtext">{p.subtext}</div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
/**
 * @param {{ user: {id:string, email:string, firstName:string, lastName:string}|null, onLoginRedirect: ()=>void }} props
 */
export default function PremiumPage({ user = null, onLoginRedirect }) {
  const [premium,  setPremium]  = useState(null);
  const [fetched,  setFetched]  = useState(false);
  const [loading,  setLoading]  = useState(null);   // plan id | null
  const [toast,    setToast]    = useState(null);
  const [openFaq,  setOpenFaq]  = useState(null);   // unused – replaced by FaqItem internal state

  const showToast = useCallback((msg, type = 'info') => setToast({ msg, type }), []);

  // ── Fetch premium status ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setFetched(true); return; }

    (async () => {
      try {
        const res  = await fetch(`${API_URL}/api/user/premium`, { headers: { 'x-user-id': user.id } });
        const data = await res.json();
        setPremium(data.premium || null);
      } catch { /* network error – treat as no premium */ }
      finally { setFetched(true); }
    })();
  }, [user]);

  // ── Handle payment redirect from Chapa ─────────────────────────────────────
  useEffect(() => {
    if (!user || !fetched) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment');
    const txRef  = params.get('tx_ref');
    const plan   = params.get('plan');

    if (status === 'success' && txRef) {
      // Verify and activate
      (async () => {
        try {
          const res  = await fetch(`${API_URL}/api/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
            body: JSON.stringify({ txRef }),
          });
          const data = await res.json();
          if (data.success && data.premium) {
            setPremium(data.premium);
            showToast(`🎉 ${PLANS[plan]?.name || 'Premium'} activated! Welcome aboard.`, 'success');
          } else {
            showToast('Payment received! Your plan will activate shortly.', 'info');
          }
        } catch { showToast('Could not verify payment. Contact support if your plan is not active.', 'error'); }
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      })();
    } else if (status === 'failed') {
      showToast('Payment was not completed. Please try again.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user, fetched, showToast]);

  // ── Buy handler ─────────────────────────────────────────────────────────────
  const handleBuy = useCallback(async (plan) => {
    if (!user) {
      if (onLoginRedirect) onLoginRedirect();
      else window.location.href = '/login';
      return;
    }

    if (premium) {
      showToast('Wait until your current plan expires before upgrading.', 'info');
      return;
    }

    setLoading(plan);
    try {
      const res  = await fetch(`${API_URL}/api/payment/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          plan,
          email:     user.email,
          firstName: user.firstName,
          lastName:  user.lastName,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'active_subscription') {
          showToast('You already have an active plan. Wait for it to expire.', 'info');
        } else {
          showToast(data.error || 'Something went wrong. Please try again.', 'error');
        }
        return;
      }

      // Redirect to Chapa checkout
      window.location.href = data.checkoutUrl;
    } catch {
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setLoading(null);
    }
  }, [user, premium, showToast, onLoginRedirect]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="pp-root">
        {/* ── Background orbs ── */}
        <div className="pp-bg">
          <div className="pp-orb pp-orb-1" />
          <div className="pp-orb pp-orb-2" />
          <div className="pp-orb pp-orb-3" />
        </div>

        {/* ── Nav ── */}
        <nav className="pp-nav">
          <div className="pp-logo">Creator Studio</div>
          <div className="pp-nav-badge">
            {user ? (premium ? `${PLANS[premium.type]?.name || 'Premium'} Member` : 'Free Account') : 'Not signed in'}
          </div>
        </nav>

        {/* ── Main ── */}
        <main className="pp-content">

          {/* ── Hero ── */}
          <section className="pp-hero">
            <div className="pp-hero-eyebrow">
              <span>✦</span> Unlock Your Creative Potential
            </div>
            <h1>Level Up Your{'\n'}Creator Journey</h1>
            <p>
              Join thousands of creators who supercharged their growth with verified badges,
              faster payouts, and a profile that stands out.
            </p>
            <div className="pp-social-proof">
              {[['12,400+', 'Active Creators'], ['99.8%', 'Payout Success'], ['4.9★', 'Creator Rating']].map(([n, l], i, arr) => (
                <React.Fragment key={n}>
                  <div className="pp-stat">
                    <span className="pp-stat-num">{n}</span>
                    <span className="pp-stat-label">{l}</span>
                  </div>
                  {i < arr.length - 1 && <div className="pp-stat-divider" />}
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* ── Premium Status Card (logged in + premium) ── */}
          {fetched && user && premium && (
            <StatusCard premium={premium} />
          )}

          {/* ── Plans ── */}
          <section>
            <div className="pp-plans-title">
              <h2>Choose Your Plan</h2>
              <p>
                {premium
                  ? 'Your current plan is highlighted. Upgrade available after your plan expires.'
                  : 'One-click checkout. Cancel anytime. No hidden fees.'}
              </p>
            </div>

            <div className="pp-plans-grid">
              {Object.keys(PLANS).map((plan) => (
                <PlanCard
                  key={plan}
                  plan={plan}
                  currentPremium={premium}
                  onBuy={handleBuy}
                  loading={loading}
                />
              ))}
            </div>
          </section>

          {/* ── Support / FAQ ── */}
          <section className="pp-support">
            <h2 className="pp-section-title">Frequently Asked Questions</h2>
            <p className="pp-section-sub">Have more questions? We're here to help.</p>

            <div className="pp-faq">
              {[
                { q: 'How does billing work?', a: 'You are billed once a month via Chapa. Your plan is automatically deactivated at the end of the billing period — there are no automatic renewals, so you stay in control.' },
                { q: 'When does my plan activate?', a: 'Your plan activates instantly after a successful payment. You'll see your status update on this page immediately.' },
                { q: 'Can I upgrade from Premium to Plus?', a: 'You can upgrade to Plus after your current Premium period expires. Simply return to this page and choose Plus when your plan ends.' },
                { q: 'What payment methods does Chapa support?', a: 'Chapa supports all major Ethiopian banks, mobile money services (CBE Birr, Telebirr), and debit/credit cards.' },
                { q: 'What is the Verified Badge?', a: 'The Verified Badge appears on your public profile to signal to your audience that you're an authenticated, trusted creator on the platform.' },
                { q: 'What happens when my plan expires?', a: 'Your account reverts to the free tier automatically. Your content stays untouched — only the premium features are removed until you renew.' },
              ].map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
            </div>

            {/* Contact */}
            <div className="pp-contact-card">
              <div className="pp-contact-icon">💬</div>
              <div className="pp-contact-title">Still have questions?</div>
              <div className="pp-contact-text">
                Our creator support team typically responds within 2 hours during business hours.
              </div>
              <a href="mailto:support@creatorstudio.app" className="pp-contact-email">
                ✉ support@creatorstudio.app
              </a>
            </div>
          </section>

        </main>

        {/* ── Footer ── */}
        <footer className="pp-footer">
          <div className="pp-footer-inner">
            <div className="pp-footer-top">
              <div className="pp-footer-brand">
                <div className="pp-logo" style={{ display: 'inline-block' }}>Creator Studio</div>
                <p>Empowering creators to build, grow, and monetize their audience — one stream at a time.</p>
              </div>
              <div className="pp-footer-col">
                <h4>Product</h4>
                <a href="/premium">Premium Plans</a>
                <a href="/overlays">Overlays</a>
                <a href="/analytics">Analytics</a>
                <a href="/payouts">Payouts</a>
              </div>
              <div className="pp-footer-col">
                <h4>Support</h4>
                <a href="/help">Help Center</a>
                <a href="/status">System Status</a>
                <a href="mailto:support@creatorstudio.app">Contact Us</a>
                <a href="/report">Report Issue</a>
              </div>
              <div className="pp-footer-col">
                <h4>Legal</h4>
                <a href="/terms">Terms of Service</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/refund">Refund Policy</a>
                <a href="/cookies">Cookie Policy</a>
              </div>
            </div>
            <div className="pp-footer-bottom">
              <span className="pp-footer-copy">© {new Date().getFullYear()} Creator Studio. All rights reserved.</span>
              <div className="pp-footer-badges">
                <span className="pp-footer-badge">🔒 Secure Payments</span>
                <span className="pp-footer-badge">⚡ Powered by Chapa</span>
              </div>
            </div>
          </div>
        </footer>

        {/* ── Toast ── */}
        {toast && (
          <Toast
            msg={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </>
  );
}