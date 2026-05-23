import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ─── THEME TOKENS ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');

  :root {
    --bg: #ffffff;
    --bg2: #f5f5f7;
    --bg3: #e8e8ed;
    --surface: rgba(255,255,255,0.8);
    --surface2: rgba(245,245,247,0.9);
    --text: #1d1d1f;
    --text2: #6e6e73;
    --text3: #86868b;
    --accent: #0071e3;
    --accent2: #0077ed;
    --accent-light: #e8f0fe;
    --border: rgba(0,0,0,0.08);
    --border2: rgba(0,0,0,0.12);
    --shadow: 0 2px 20px rgba(0,0,0,0.08);
    --shadow2: 0 8px 40px rgba(0,0,0,0.12);
    --radius: 18px;
    --radius-sm: 12px;
    --radius-xs: 8px;
    --scrollbar: rgba(0,0,0,0.2);
    --font: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  }
  [data-theme="dark"] {
    --bg: #111111;
    --bg2: #1c1c1e;
    --bg3: #2c2c2e;
    --surface: rgba(28,28,30,0.8);
    --surface2: rgba(44,44,46,0.9);
    --text: #f5f5f7;
    --text2: #aeaeb2;
    --text3: #6e6e73;
    --accent: #2997ff;
    --accent2: #66b2ff;
    --accent-light: rgba(41,151,255,0.15);
    --border: rgba(255,255,255,0.08);
    --border2: rgba(255,255,255,0.12);
    --shadow: 0 2px 20px rgba(0,0,0,0.4);
    --shadow2: 0 8px 40px rgba(0,0,0,0.5);
    --scrollbar: rgba(255,255,255,0.2);
  }

  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior: smooth; font-size: 16px; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    transition: background 0.3s ease, color 0.3s ease;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 3px; }

  /* TYPOGRAPHY */
  .display { font-size: clamp(2.6rem,5.5vw,4.8rem); font-weight: 700; line-height: 1.05; letter-spacing: -0.025em; color: var(--text); }
  .title-lg { font-size: clamp(1.8rem,3.5vw,3rem); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
  .title { font-size: clamp(1.4rem,2.5vw,2rem); font-weight: 600; line-height: 1.2; letter-spacing: -0.015em; }
  .body-lg { font-size: 1.125rem; line-height: 1.7; color: var(--text2); }
  .body { font-size: 1rem; line-height: 1.65; color: var(--text2); }
  .caption { font-size: 0.82rem; color: var(--text3); letter-spacing: 0.02em; }
  .eyebrow { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
  .accent-text { color: var(--accent); }

  /* NAV */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    height: 52px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 22px;
    background: var(--surface);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 0.5px solid var(--border);
    transition: all 0.3s ease;
  }
  .nav-logo { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text); text-decoration: none; }
  .nav-logo span { color: var(--accent); }
  .nav-links { display: flex; gap: 28px; align-items: center; }
  .nav-links a { font-size: 0.86rem; color: var(--text2); text-decoration: none; cursor: pointer; transition: color 0.2s; }
  .nav-links a:hover { color: var(--text); }
  .nav-actions { display: flex; gap: 10px; align-items: center; }

  /* BUTTONS */
  .btn-primary {
    background: var(--accent); color: #fff;
    border: none; border-radius: 980px;
    padding: 10px 22px; font-size: 0.9rem; font-weight: 500;
    cursor: pointer; font-family: var(--font);
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    white-space: nowrap;
  }
  .btn-primary:hover { background: var(--accent2); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,113,227,0.3); }
  .btn-primary:active { transform: translateY(0); }
  .btn-ghost {
    background: transparent; color: var(--text2);
    border: 1px solid var(--border2); border-radius: 980px;
    padding: 9px 18px; font-size: 0.86rem; font-weight: 500;
    cursor: pointer; font-family: var(--font);
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .btn-ghost:hover { background: var(--bg2); color: var(--text); }
  .btn-icon {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--bg2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text2); font-size: 1rem;
    transition: all 0.2s ease;
  }
  .btn-icon:hover { background: var(--bg3); color: var(--text); }

  /* CARDS */
  .card {
    background: var(--bg2); border-radius: var(--radius);
    border: 1px solid var(--border); padding: 28px;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .card:hover { transform: translateY(-4px); box-shadow: var(--shadow2); border-color: var(--border2); }
  .card-flat { background: var(--bg2); border-radius: var(--radius); border: 1px solid var(--border); padding: 24px; }

  /* SECTIONS */
  section { padding: 90px 22px; }
  .section-inner { max-width: 980px; margin: 0 auto; }
  .section-header { text-align: center; margin-bottom: 56px; }
  .section-header .eyebrow { margin-bottom: 14px; display: block; }

  /* REVEAL */
  .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .reveal.in { opacity: 1; transform: none; }
  .reveal-d1 { transition-delay: 0.05s; }
  .reveal-d2 { transition-delay: 0.12s; }
  .reveal-d3 { transition-delay: 0.2s; }

  /* HERO */
  .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 140px 22px 80px; }
  .hero-inner { max-width: 760px; margin: 0 auto; }
  .hero .display { margin-bottom: 20px; }
  .hero .body-lg { max-width: 560px; margin: 0 auto 36px; }

  /* BADGE */
  .badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--accent-light); color: var(--accent);
    border-radius: 980px; padding: 5px 14px;
    font-size: 0.8rem; font-weight: 600;
    margin-bottom: 24px;
  }
  .badge .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }

  /* PAYMENT FLOW */
  .payment-flow { max-width: 900px; margin: 0 auto; }
  .flow-canvas { position: relative; width: 100%; height: 420px; }
  @media(max-width:600px){ .flow-canvas{ height: 520px; } }

  /* CREATORS — desktop grid, mobile instagram-style horizontal scroll */
  .creators-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 20px;
  }
  @media(max-width:700px){
    .creators-grid {
      display: flex; overflow-x: auto; gap: 14px;
      scroll-snap-type: x mandatory; padding-bottom: 12px;
      -webkit-overflow-scrolling: touch; scrollbar-width: none;
    }
    .creators-grid::-webkit-scrollbar { display: none; }
    .creator-card { min-width: 260px; scroll-snap-align: start; flex-shrink: 0; }
  }

  /* GALLERY slider */
  .gallery-track { display: flex; gap: 14px; overflow: hidden; }
  .gallery-slide {
    flex: 0 0 340px; border-radius: var(--radius); overflow: hidden;
    background: #000; position: relative; cursor: pointer;
    transition: transform 0.3s ease;
  }
  .gallery-slide:hover { transform: scale(1.02); }
  .gallery-slide iframe { width: 100%; height: 220px; border: none; pointer-events: none; }
  .gallery-slide .slide-label {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.75));
    padding: 14px; color: #fff; font-size: 0.82rem; font-weight: 600;
  }
  @media(max-width:600px){ .gallery-slide { flex: 0 0 85vw; } }

  /* FEATURES GRID */
  .features-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 14px; }
  .feature-item { background: var(--bg2); border-radius: var(--radius-sm); border: 1px solid var(--border); padding: 24px; transition: all 0.25s ease; }
  .feature-item:hover { border-color: var(--border2); background: var(--bg3); }
  .feature-icon { font-size: 1.5rem; color: var(--accent); margin-bottom: 12px; display: block; }

  /* COUNTDOWN */
  .countdown-grid { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
  .cdown-box { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 36px; text-align: center; min-width: 130px; }
  .cdown-num { font-size: clamp(2.8rem,6vw,4.5rem); font-weight: 700; letter-spacing: -0.04em; color: var(--text); line-height: 1; }
  .cdown-label { font-size: 0.78rem; color: var(--text3); margin-top: 8px; letter-spacing: 0.06em; text-transform: uppercase; }

  /* TESTIMONIALS */
  .test-track { display: flex; gap: 14px; animation: scroll-left 30s linear infinite; width: max-content; }
  .test-track:hover { animation-play-state: paused; }
  @keyframes scroll-left { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  .test-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px 24px; min-width: 290px; max-width: 300px; }

  /* DIAGRAM SVG */
  .diagram-wrap { overflow-x: auto; }

  /* STATS */
  .stats-row { display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 1px; background: var(--border); border-radius: var(--radius); overflow: hidden; }
  .stat-cell { background: var(--bg2); padding: 32px 24px; text-align: center; }
  .stat-num { font-size: 2.2rem; font-weight: 700; letter-spacing: -0.03em; color: var(--text); }
  .stat-label { font-size: 0.84rem; color: var(--text3); margin-top: 4px; }

  /* HOW IT WORKS */
  .steps-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 16px; }
  .step-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; position: relative; }
  .step-num { font-size: 3rem; font-weight: 700; color: var(--border2); letter-spacing: -0.04em; line-height: 1; margin-bottom: 16px; }

  /* FOOTER */
  footer { padding: 60px 22px 40px; border-top: 1px solid var(--border); }
  .footer-inner { max-width: 980px; margin: 0 auto; }
  .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
  @media(max-width:700px){ .footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; } }
  .footer-col-title { font-size: 0.78rem; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
  .footer-link { font-size: 0.88rem; color: var(--text2); display: block; margin-bottom: 10px; text-decoration: none; cursor: pointer; transition: color 0.15s; }
  .footer-link:hover { color: var(--text); }

  /* OFFLINE BANNER */
  .offline-bar {
    position: fixed; top: 52px; left: 0; right: 0; z-index: 999;
    background: #222222; color: #fff;
    padding: 10px 22px; text-align: center;
    font-size: 0.88rem; font-weight: 500;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transform: translateY(-100%); transition: transform 0.3s ease;
  }
  .offline-bar.show { transform: translateY(0); }

  /* NOTIFICATION PROMPT */
  .notif-prompt {
    position: fixed; bottom: 24px; right: 24px; z-index: 900;
    background: var(--surface2); border: 1px solid var(--border2);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-radius: var(--radius); padding: 20px 22px;
    max-width: 320px; box-shadow: var(--shadow2);
    transform: translateY(20px); opacity: 0;
    transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .notif-prompt.show { transform: translateY(0); opacity: 1; }

  /* LANG PILL */
  .lang-am { font-family: 'Noto Sans Ethiopic', var(--font); }

  @media(max-width:900px){
    .nav-links { display: none; }
    .hero { padding: 120px 22px 60px; }
    section { padding: 70px 18px; }
  }
  @media(max-width:600px){
    .cdown-box { min-width: 80px; padding: 20px 16px; }
    .display { letter-spacing: -0.02em; }
  }
`;

/* ─── DATA ─── */
const CREATORS = [
  { name:"Abel Gaming", handle:"@abelgame", type:"Gaming", raised:"ETB 12,450", supporters:284, init:"AG", color:"#0071e3" },
  { name:"Hiwot Music", handle:"@hiwotmusic", type:"Music", raised:"ETB 8,200", supporters:156, init:"HM", color:"#30a46c" },
  { name:"Selam Draws", handle:"@selamdraws", type:"Art", raised:"ETB 9,150", supporters:201, init:"SD", color:"#e54d2e" },
];

const FEATURES = [
  { icon:"bi-lightning-charge-fill", title:"Real-Time Alerts", desc:"Instant overlay alerts the moment a fan supports you — zero delay.", amh:"የቅጽበት ማሳወቂያ" },
  { icon:"bi-mic-fill", title:"Text-to-Speech", desc:"Fan messages read aloud on your stream, just like big streamers do.", amh:"ድምጽ ቅጂ" },
  { icon:"bi-camera-video-fill", title:"Stream Overlays", desc:"Cinematic overlays for OBS, Streamlabs, and all broadcast tools.", amh:"ስትሪም ኦቨርሌይ" },
  { icon:"bi-bank2", title:"Chapa Payments", desc:"Telebirr, CBEBirr, and all major Ethiopian banks — native support.", amh:"ቻፓ ክፍያ" },
  { icon:"bi-wallet2", title:"Instant Payouts", desc:"ETB hits your account immediately. No waiting, no minimums.", amh:"ፈጣን ክፍያ" },
  { icon:"bi-bar-chart-fill", title:"Analytics", desc:"Beautiful real-time data on revenue, fans, and your growth.", amh:"ትንታኔ" },
  { icon:"bi-person-badge-fill", title:"Creator Page", desc:"Your own link, shareable and built to convert fans to supporters.", amh:"ፈጣሪ ገጽ" },
  { icon:"bi-phone-fill", title:"Mobile First", desc:"Manage donations and stream alerts from any device, anywhere.", amh:"ሞባይል ቅድሚያ" },
];

const TESTIMONIALS = [
  { name:"Yonas T.", handle:"@yonastv", text:"This feels exactly like Streamlabs but built for Ethiopia. My viewers donate every stream now.", init:"YT" },
  { name:"Selam K.", handle:"@selamdraws", text:"Finally a platform that understands African creators. Cheer ET changed everything for me.", init:"SK" },
  { name:"Abel M.", handle:"@abelgame", text:"Got my first real donation in 10 minutes of going live. The Chapa integration is seamless!", init:"AM" },
  { name:"Hiwot G.", handle:"@hiwotmusic", text:"The TTS alerts are amazing. My stream went from 0 to 500 viewers in one week.", init:"HG" },
  { name:"Dawit B.", handle:"@dawittv", text:"Ethiopian Birr payments via Chapa. Finally. No more workarounds.", init:"DB" },
  { name:"Mekdes A.", handle:"@mekdesart", text:"The analytics dashboard is beautiful. I know exactly who my top fans are.", init:"MA" },
];

const GALLERY = [
  { id:"dQw4w9WgXcQ", title:"Abel Gaming — Epic Win Moment" },
  { id:"ZZ5LpwO-An4", title:"Hiwot Music — Live Concert Stream" },
  { id:"9bZkp7q19f0", title:"Selam Draws — Art Stream Highlight" },
  { id:"kJQP7kiw5Fk", title:"Ethiopian Gaming Legends Collab" },
];

const BANKS = [
  { name:"Telebirr", x:50, y:50 },
  { name:"CBE Birr", x:85, y:20 },
  { name:"Awash", x:115, y:60 },
  { name:"Dashen", x:90, y:85 },
  { name:"Zemen", x:55, y:95 },
  { name:"Paypal", x:20, y:80 },
  { name:"Abyssinia", x:10, y:45 },
  { name:"Nib", x:25, y:15 },
];

/* ─── TEXT ─── */
const COPY = {
  en: {
    badge: "Ethiopia's #1 Creator Platform",
    heroTitle: "Turn Support Into a Career.",
    heroSub: "Built for Ethiopian streamers, gamers, artists and storytellers. Powered by Chapa.",
    cta1: "Start Creating",
    cta2: "Watch Demo",
    toggle: "አማ",
    featTitle: "Everything you need to get paid.",
    featSub: "Tools built for the Ethiopian creator.",
    creatorsTitle: "Top Creators",
    creatorsSub: "Ethiopian creators earning real income.",
    galleryTitle: "Biggest Moments",
    gallerySub: "Watch live stream highlights.",
    howTitle: "Three steps. That's all.",
    howSub: "Simple, fast, built for Ethiopia.",
    steps: [
      { num:"01", title:"Fan Sends a Cheer", desc:"Viewer picks any amount and pays via Telebirr or any Chapa-supported bank in seconds." },
      { num:"02", title:"Alert Fires Instantly", desc:"A cinematic overlay appears on your stream with text-to-speech reading the fan message." },
      { num:"03", title:"Money in Your Account", desc:"Your ETB balance updates live. Cash out instantly to your bank via Chapa — no waiting." },
    ],
    payTitle: "Powered by Chapa",
    paySub: "Every payment flows through Ethiopia's most trusted gateway.",
    countTitle: "Ethiopia's creator economy launches soon.",
    countSub: "Launch Date · June 30, 2026",
    testTitle: "Creators love Cheer ET.",
    ctaFinal: "Your audience already supports you.",
    ctaFinalSub: "Now get paid for it.",
    ctaFinalBtn: "Create Your Page",
    statsTitle: "Growing fast.",
    stats: [
      { num:"4,200+", label:"Creators" },
      { num:"ETB 2.1M", label:"Paid Out" },
      { num:"98%", label:"Uptime" },
      { num:"4.9★", label:"Creator Rating" },
    ],
    notifTitle: "Stay updated",
    notifBody: "Get notified when Cheer ET launches and when fans support you.",
    notifAllow: "Allow Notifications",
    notifDeny: "Not Now",
    offlineBanner: "No internet connection. Check your network.",
    login: "Sign In",
    register: "Get Started",
    support: "Support",
    raised: "raised",
  },
  am: {
    badge: "የኢትዮጵያ ቁ.1 ፈጣሪ መድረክ",
    heroTitle: "ድጋፍን ወደ ሙያ ቀይር።",
    heroSub: "ለኢትዮጵያ ስትሪመሮች፣ ጌምሮች፣ አርቲስቶች እና ተርጓሚዎች። በቻፓ ይሰራል።",
    cta1: "ፈጠራ ጀምር",
    cta2: "ቪዲዮ ይመልከቱ",
    toggle: "EN",
    featTitle: "ለሚከፈልህ ሁሉም ነገር።",
    featSub: "ለኢትዮጵያ ፈጣሪ የተሰሩ መሳሪያዎች።",
    creatorsTitle: "ምርጥ ፈጣሪዎች",
    creatorsSub: "እውነተኛ ገቢ የሚያገኙ ኢትዮጵያውያን ፈጣሪዎች።",
    galleryTitle: "ትልቁ ቅጽበቶች",
    gallerySub: "የቀጥታ ስትሪም ደቂቃዎችን ይመልከቱ።",
    howTitle: "ሶስት ደረጃዎች ብቻ።",
    howSub: "ቀላል፣ ፈጣን፣ ለኢትዮጵያ የተሰራ።",
    steps: [
      { num:"01", title:"አድናቂ ቺር ይልካል", desc:"ተመልካቹ ማናቸውም መጠን ይመርጣል እና በቴሌብር ወይም በቻፓ ደጋፊ ባንክ ይከፍላል።" },
      { num:"02", title:"ማሳወቂያ ወዲያው ይነሳሳል", desc:"በስትሪምህ ላይ የሲኒማ ኦቨርሌይ ይታያል እና የአድናቂ መልዕክቱ ይነበባል።" },
      { num:"03", title:"ገንዘብ ወደ ሂሳብህ ይገባል", desc:"ETB ቀሪ ሂሳብህ ቅጽበታዊ ይዘምናል። ቀጥተኛ ወደ ባንክህ ያስተላልፍ — ምንም ጥበቃ የለም።" },
    ],
    payTitle: "በቻፓ ይሰራል",
    paySub: "እያንዳንዱ ክፍያ በኢትዮጵያ በጣም ታማኝ ጌትዌይ ያልፋል።",
    countTitle: "የኢትዮጵያ ፈጣሪ ኢኮኖሚ በቅርቡ ይጀምራል።",
    countSub: "የጅምር ቀን · ሰኔ 30, 2026",
    testTitle: "ፈጣሪዎች ቺር ኢቲን ይወዱታል።",
    ctaFinal: "ታዳሚዎችህ አስቀድሞ ይደግፉሃል።",
    ctaFinalSub: "አሁን ለዚህ ክፍያ ተቀበል።",
    ctaFinalBtn: "ገጽህን ፍጠር",
    statsTitle: "በፍጥነት እያደገ ነው።",
    stats: [
      { num:"4,200+", label:"ፈጣሪዎች" },
      { num:"ETB 2.1M", label:"ተከፍሏል" },
      { num:"98%", label:"አፕታይም" },
      { num:"4.9★", label:"የፈጣሪ ደረጃ" },
    ],
    notifTitle: "ዘምን",
    notifBody: "ቺር ኢቲ ሲጀምር እና አድናቂዎች ሲደግፉህ ማሳወቂያ ይምጣ።",
    notifAllow: "ማሳወቂያ ፍቀድ",
    notifDeny: "አሁን አይደለም",
    offlineBanner: "የኢንተርኔት ግንኙነት የለም። ኔትወርክህን ያረጋግጥ።",
    login: "ይግቡ",
    register: "ይጀምሩ",
    support: "ደግፍ",
    raised: "ተሰብስቧል",
  },
};

/* ─── PAYMENT FLOW SVG ─── */
function PaymentDiagram({ isDark }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(i);
  }, []);

  const cx = 450, cy = 200, r = 150;
  const chapaCx = cx, chapaCy = cy;
  const chapR = 48;

  const banks = [
    { name:"Telebirr", angle:-90 },
    { name:"CBE Birr", angle:-30 },
    { name:"Awash", angle:30 },
    { name:"Dashen", angle:90 },
    { name:"Zemen", angle:150 },
    { name:"Paypal", angle:210 },
    { name:"Nib", angle:270 },
    { name:"Abyssinia", angle:-150 },
  ];

  const toRad = deg => deg * Math.PI / 180;
  const bankPos = banks.map(b => ({
    ...b,
    x: cx + r * Math.cos(toRad(b.angle)),
    y: cy + r * Math.sin(toRad(b.angle)),
  }));

  const ANIM_SPEED = 0.04;
  const stroke = isDark ? "#2997ff" : "#0071e3";
  const textFill = isDark ? "#f5f5f7" : "#1d1d1f";
  const textFill2 = isDark ? "#aeaeb2" : "#6e6e73";
  const nodeBg = isDark ? "#1c1c1e" : "#f5f5f7";
  const nodeBorder = isDark ? "#3a3a3c" : "#d1d1d6";
  const chapaBg = isDark ? "#0a2540" : "#e8f0fe";
  const chapaStroke = stroke;

  return (
    <svg viewBox="0 0 900 400" style={{ width:"100%", maxWidth:900, display:"block", margin:"0 auto" }}>
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,1 L7,4 L0,7 Z" fill={stroke} opacity="0.7" />
        </marker>
      </defs>

      {bankPos.map((b, i) => {
        const progress = ((tick * ANIM_SPEED + i * 0.37) % 1 + 1) % 1;
        const goingIn = progress < 0.5;
        const t = goingIn ? progress * 2 : (progress - 0.5) * 2;
        const fromX = goingIn ? b.x : chapaCx;
        const fromY = goingIn ? b.y : chapaCy;
        const toX = goingIn ? chapaCx : b.x;
        const toY = goingIn ? chapaCy : b.y;
        const dotX = fromX + (toX - fromX) * t;
        const dotY = fromY + (toY - fromY) * t;

        const nearChapa = Math.hypot(dotX - chapaCx, dotY - chapaCy) < chapR + 10;

        return (
          <g key={i}>
            <line
              x1={b.x} y1={b.y} x2={chapaCx} y2={chapaCy}
              stroke={stroke} strokeWidth="1" opacity="0.18"
              strokeDasharray="5 6"
            />
            {!nearChapa && (
              <circle cx={dotX} cy={dotY} r="5" fill={stroke} opacity={0.85} />
            )}
          </g>
        );
      })}

      {bankPos.map((b, i) => (
        <g key={i}>
          <rect x={b.x-38} y={b.y-20} width={76} height={40} rx="10"
            fill={nodeBg} stroke={nodeBorder} strokeWidth="1" />
          <text x={b.x} y={b.y+5} textAnchor="middle"
            fontSize="11" fontWeight="600" fill={textFill}
            fontFamily="-apple-system, 'SF Pro Display', sans-serif">
            {b.name}
          </text>
        </g>
      ))}

      <circle cx={chapaCx} cy={chapaCy} r={chapR + 12} fill={chapaBg} opacity="0.5" />
      <circle cx={chapaCx} cy={chapaCy} r={chapR} fill={chapaBg} stroke={chapaStroke} strokeWidth="2" />
      <text x={chapaCx} y={chapaCy - 8} textAnchor="middle"
        fontSize="13" fontWeight="700" fill={stroke}
        fontFamily="-apple-system, 'SF Pro Display', sans-serif">Chapa</text>
      <text x={chapaCx} y={chapaCy + 8} textAnchor="middle"
        fontSize="10" fill={textFill2}
        fontFamily="-apple-system, 'SF Pro Display', sans-serif">Gateway</text>
      <text x={chapaCx} y={chapaCy + 22} textAnchor="middle"
        fontSize="10" fill={textFill2}
        fontFamily="-apple-system, 'SF Pro Display', sans-serif">100% Secure</text>
    </svg>
  );
}

/* ─── GALLERY SLIDER ─── */
function GallerySlider({ t }) {
  const trackRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(null);

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(GALLERY.length - 1, c + 1));

  useEffect(() => {
    if (trackRef.current) {
      const slideW = trackRef.current.children[0]?.offsetWidth + 14;
      trackRef.current.scrollTo({ left: current * slideW, behavior: "smooth" });
    }
  }, [current]);

  return (
    <div>
      <div ref={trackRef} className="gallery-track" style={{ scrollBehavior:"smooth", overflowX:"hidden" }}>
        {GALLERY.map((v, i) => (
          <div key={i} className="gallery-slide" onClick={() => setPlaying(playing === i ? null : i)}>
            {playing === i ? (
              <iframe
                src={`https://www.youtube.com/embed/${v.id}?autoplay=1&end=20&mute=0&rel=0&showinfo=0`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{ width:"100%", height:220, border:"none", pointerEvents:"all" }}
              />
            ) : (
              <>
                <img
                  src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                  alt={v.title}
                  style={{ width:"100%", height:220, objectFit:"cover", display:"block" }}
                />
                <div style={{
                  position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
                  width:52, height:52, background:"rgba(0,0,0,0.7)", borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <i className="bi bi-play-fill" style={{ fontSize:"1.4rem", color:"#fff", marginLeft:3 }} />
                </div>
                <div className="slide-label">{v.title}</div>
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:20 }}>
        <button className="btn-icon" onClick={prev} disabled={current===0} style={{ opacity: current===0?0.3:1 }}>
          <i className="bi bi-chevron-left" />
        </button>
        {GALLERY.map((_,i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{
            width:8, height:8, borderRadius:"50%", cursor:"pointer", marginTop:14,
            background: i===current ? "var(--accent)" : "var(--border2)",
            transition:"background 0.2s",
          }} />
        ))}
        <button className="btn-icon" onClick={next} disabled={current===GALLERY.length-1} style={{ opacity: current===GALLERY.length-1?0.3:1 }}>
          <i className="bi bi-chevron-right" />
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function CheerETHome() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isAmharic, setIsAmharic] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days:0, hours:0, minutes:0 });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const revealRefs = useRef([]);

  const t = isAmharic ? COPY.am : COPY.en;

  /* Check auth */
  useEffect(() => {
    try {
      const token = localStorage.getItem("cheerET_token") || sessionStorage.getItem("cheerET_token");
      if (token) navigate("/dashboard");
    } catch(_) {}
  }, []);

  /* Theme */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  /* Online/offline */
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  /* Countdown */
  useEffect(() => {
    const target = new Date("2026-06-30T00:00:00").getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff > 0) setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  /* Notification prompt after 5s */
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      const t = setTimeout(() => setShowNotifPrompt(true), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  /* Reveal on scroll */
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.08 }
    );
    revealRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);

  const addReveal = el => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  const requestNotif = async () => {
    setShowNotifPrompt(false);
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("Cheer ET", { body: "You'll be notified when fans support you!", icon: "/favicon.ico" });
      }
    }
  };

  return (
    <>
      <style>{css}</style>

      {/* OFFLINE BANNER */}
      <div className={`offline-bar ${isOffline ? "show" : ""}`}>
        <i className="bi bi-wifi-off" />
        {t.offlineBanner}
      </div>

      {/* NOTIFICATION PROMPT */}
      <div className={`notif-prompt ${showNotifPrompt ? "show" : ""}`}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:14 }}>
          <div style={{ width:38, height:38, borderRadius:"50%", background:"var(--accent-light)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <i className="bi bi-bell-fill" style={{ color:"var(--accent)", fontSize:"1.1rem" }} />
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:"0.92rem", color:"var(--text)", marginBottom:4 }}>{t.notifTitle}</div>
            <div style={{ fontSize:"0.82rem", color:"var(--text2)", lineHeight:1.5 }}>{t.notifBody}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn-primary" style={{ flex:1, padding:"8px 14px", fontSize:"0.84rem" }} onClick={requestNotif}>{t.notifAllow}</button>
          <button className="btn-ghost" style={{ padding:"8px 14px", fontSize:"0.84rem" }} onClick={() => setShowNotifPrompt(false)}>{t.notifDeny}</button>
        </div>
      </div>

      {/* ─── NAV ─── */}
      <nav className="nav">
        <a className="nav-logo" onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>
          Cheer<span>ET</span>
        </a>
        <div className="nav-links">
          <a onClick={() => document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>Features</a>
          <a onClick={() => document.getElementById("creators")?.scrollIntoView({behavior:"smooth"})}>Creators</a>
          <a onClick={() => document.getElementById("gallery")?.scrollIntoView({behavior:"smooth"})}>Highlights</a>
          <a onClick={() => navigate("/contact")}>Contact</a>
        </div>
        <div className="nav-actions">
          <button className="btn-icon" onClick={() => setIsDark(d => !d)} title="Toggle theme">
            <i className={`bi ${isDark ? "bi-sun-fill" : "bi-moon-fill"}`} />
          </button>
          <button className="btn-ghost" style={{ padding:"7px 14px", fontSize:"0.82rem" }} onClick={() => setIsAmharic(a => !a)}>
            {t.toggle}
          </button>
          <button className="btn-ghost" style={{ padding:"7px 16px", fontSize:"0.84rem" }} onClick={() => navigate("/login")}>{t.login}</button>
          <button className="btn-primary" style={{ padding:"8px 18px", fontSize:"0.84rem" }} onClick={() => navigate("/register")}>{t.register}</button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="badge">
            <span className="dot" />
            <span>{t.badge}</span>
          </div>
          <h1 className="display" style={{ marginBottom:20 }}>{t.heroTitle}</h1>
          <p className="body-lg" style={{ maxWidth:560, margin:"0 auto 36px" }}>{t.heroSub}</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:24 }}>
            <button className="btn-primary" style={{ padding:"14px 32px", fontSize:"1rem" }} onClick={() => navigate("/register")}>{t.cta1}</button>
            <button className="btn-ghost" style={{ padding:"14px 28px", fontSize:"1rem" }}>
              <i className="bi bi-play-circle-fill" style={{ marginRight:6 }} />{t.cta2}
            </button>
          </div>
          <p className="caption">Free to start · ETB payouts · No setup fees</p>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ padding:"0 22px 80px" }}>
        <div className="section-inner reveal" ref={addReveal}>
          <div className="stats-row">
            {t.stats.map((s,i) => (
              <div key={i} className="stat-cell">
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ background:"var(--bg2)", padding:"90px 22px" }}>
        <div className="section-inner">
          <div className="section-header reveal" ref={addReveal}>
            <span className="eyebrow">Features</span>
            <h2 className="title-lg">{t.featTitle}</h2>
            <p className="body" style={{ marginTop:12, maxWidth:480, margin:"12px auto 0" }}>{t.featSub}</p>
          </div>
          <div className="features-grid reveal" ref={addReveal}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-item">
                <i className={`bi ${f.icon} feature-icon`} />
                <h3 style={{ fontSize:"0.97rem", fontWeight:600, marginBottom:8, color:"var(--text)" }}>{f.title}</h3>
                <p style={{ fontSize:"0.85rem", color:"var(--text2)", lineHeight:1.6 }}>{f.desc}</p>
                {isAmharic && <p style={{ fontSize:"0.78rem", color:"var(--accent)", marginTop:8 }}>{f.amh}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section>
        <div className="section-inner">
          <div className="section-header reveal" ref={addReveal}>
            <span className="eyebrow">How it works</span>
            <h2 className="title-lg">{t.howTitle}</h2>
            <p className="body" style={{ maxWidth:400, margin:"12px auto 0" }}>{t.howSub}</p>
          </div>
          <div className="steps-grid reveal" ref={addReveal}>
            {t.steps.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{s.num}</div>
                <h3 style={{ fontSize:"1rem", fontWeight:600, marginBottom:10, color:"var(--text)" }}>{s.title}</h3>
                <p style={{ fontSize:"0.86rem", color:"var(--text2)", lineHeight:1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CREATORS ─── */}
      <section id="creators" style={{ background:"var(--bg2)", padding:"90px 22px" }}>
        <div className="section-inner">
          <div className="section-header reveal" ref={addReveal}>
            <span className="eyebrow">Creators</span>
            <h2 className="title-lg">{t.creatorsTitle}</h2>
            <p className="body" style={{ maxWidth:400, margin:"12px auto 0" }}>{t.creatorsSub}</p>
          </div>
          <div className="creators-grid reveal" ref={addReveal}>
            {CREATORS.map((c, i) => (
              <div key={i} className="creator-card card" style={{ textAlign:"center" }}>
                <div style={{
                  width:72, height:72, borderRadius:"50%",
                  background: c.color + "18",
                  border:`2px solid ${c.color}40`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:700, fontSize:"1.2rem", color:c.color,
                  margin:"0 auto 16px",
                }}>
                  {c.init}
                </div>
                <div style={{ fontWeight:600, fontSize:"1rem", color:"var(--text)", marginBottom:4 }}>{c.name}</div>
                <div style={{ fontSize:"0.82rem", color:"var(--text3)", marginBottom:14 }}>{c.handle} · {c.type}</div>
                <div style={{ fontWeight:700, fontSize:"1.15rem", color:"var(--accent)", marginBottom:4 }}>{c.raised}</div>
                <div style={{ fontSize:"0.78rem", color:"var(--text3)", marginBottom:18 }}>{t.raised} · {c.supporters} supporters</div>
                <button className="btn-primary" style={{ width:"100%", padding:"10px 0" }}>
                  <i className="bi bi-heart-fill" style={{ marginRight:6, fontSize:"0.85rem" }} />{t.support}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GALLERY / MOMENTS ─── */}
      <section id="gallery">
        <div className="section-inner">
          <div className="section-header reveal" ref={addReveal}>
            <span className="eyebrow">Highlights</span>
            <h2 className="title-lg">{t.galleryTitle}</h2>
            <p className="body" style={{ maxWidth:400, margin:"12px auto 0" }}>{t.gallerySub}</p>
          </div>
          <div className="reveal" ref={addReveal}>
            <GallerySlider t={t} />
          </div>
        </div>
      </section>

      {/* ─── PAYMENT DIAGRAM ─── */}
      <section style={{ background:"var(--bg2)", padding:"90px 22px" }}>
        <div className="section-inner">
          <div className="section-header reveal" ref={addReveal}>
            <span className="eyebrow">Payments</span>
            <h2 className="title-lg">{t.payTitle}</h2>
            <p className="body" style={{ maxWidth:460, margin:"12px auto 0" }}>{t.paySub}</p>
          </div>
          <div className="reveal diagram-wrap" ref={addReveal}>
            <PaymentDiagram isDark={isDark} />
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap", marginTop:28 }} className="reveal" ref={addReveal}>
            {["Telebirr","CBE Birr","Awash Bank","Dashen Bank","Zemen Bank","Abyssinia","Nib Bank","Paypal"].map((p,i) => (
              <div key={i} style={{
                background:"var(--bg)", border:"1px solid var(--border2)",
                borderRadius:980, padding:"6px 16px",
                fontSize:"0.8rem", fontWeight:500, color:"var(--text2)",
                display:"flex", alignItems:"center", gap:6,
              }}>
                <i className="bi bi-check-circle-fill" style={{ color:"var(--accent)", fontSize:"0.8rem" }} />
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COUNTDOWN ─── */}
      <section style={{ textAlign:"center" }}>
        <div className="section-inner">
          <div className="reveal" ref={addReveal}>
            <span className="eyebrow" style={{ display:"block", marginBottom:14 }}>{t.countSub}</span>
            <h2 className="title-lg" style={{ marginBottom:48 }}>{t.countTitle}</h2>
            <div className="countdown-grid">
              {[
                { val:timeLeft.days, label:isAmharic?"ቀናት":"Days" },
                { val:timeLeft.hours, label:isAmharic?"ሰዓቶች":"Hours" },
                { val:timeLeft.minutes, label:isAmharic?"ደቂቃዎች":"Minutes" },
              ].map((item,i) => (
                <div key={i} className="cdown-box">
                  <div className="cdown-num">{String(item.val).padStart(2,"0")}</div>
                  <div className="cdown-label">{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:40, display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button className="btn-primary" style={{ padding:"14px 32px", fontSize:"1rem" }} onClick={() => navigate("/register")}>
                {isAmharic ? "ቀደምት ተጠቃሚ ሁን" : "Join Early Access"}
              </button>
              <button className="btn-ghost" style={{ padding:"14px 28px", fontSize:"1rem" }} onClick={() => navigate("/contact")}>
                {isAmharic ? "ያናግሩን" : "Contact Us"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ background:"var(--bg2)", padding:"90px 0", overflow:"hidden" }}>
        <div style={{ textAlign:"center", padding:"0 22px", marginBottom:44 }}>
          <span className="eyebrow" style={{ display:"block", marginBottom:14 }}>Community</span>
          <h2 className="title-lg">{t.testTitle}</h2>
        </div>
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:80, background:"linear-gradient(90deg,var(--bg2),transparent)", zIndex:2, pointerEvents:"none" }} />
          <div style={{ position:"absolute", right:0, top:0, bottom:0, width:80, background:"linear-gradient(-90deg,var(--bg2),transparent)", zIndex:2, pointerEvents:"none" }} />
          <div style={{ overflow:"hidden" }}>
            <div className="test-track">
              {[...TESTIMONIALS,...TESTIMONIALS].map((tm, i) => (
                <div key={i} className="test-card">
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                    <div style={{
                      width:36, height:36, borderRadius:"50%",
                      background:"var(--accent-light)", color:"var(--accent)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontWeight:600, fontSize:"0.85rem",
                    }}>{tm.init}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:"0.9rem", color:"var(--text)" }}>{tm.name}</div>
                      <div style={{ fontSize:"0.76rem", color:"var(--text3)" }}>{tm.handle}</div>
                    </div>
                  </div>
                  <p style={{ fontSize:"0.87rem", color:"var(--text2)", lineHeight:1.65 }}>"{tm.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ textAlign:"center" }}>
        <div className="section-inner">
          <div className="reveal" ref={addReveal} style={{ maxWidth:600, margin:"0 auto" }}>
            <h2 className="title-lg" style={{ marginBottom:16 }}>{t.ctaFinal}</h2>
            <p className="body-lg" style={{ marginBottom:40 }}>{t.ctaFinalSub}</p>
            <button className="btn-primary" style={{ padding:"16px 44px", fontSize:"1.05rem" }} onClick={() => navigate("/register")}>
              {t.ctaFinalBtn}
            </button>
            <p className="caption" style={{ marginTop:20 }}>
              {isAmharic ? "ነፃ ጀምር · ቻፓ ያስደርሳል · 🇪🇹 ለኢትዮጵያ ፈጣሪዎች" : "Free to start · Powered by Chapa · 🇪🇹 Ethiopian creators"}
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer>
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="nav-logo" style={{ display:"block", marginBottom:14, fontSize:"1.15rem" }}>
                Cheer<span style={{ color:"var(--accent)" }}>ET</span>
              </div>
              <p style={{ fontSize:"0.84rem", color:"var(--text3)", lineHeight:1.75, maxWidth:260, marginBottom:20 }}>
                {isAmharic ? "ለኢትዮጵያ ፈጣሪዎች — ስትሪምላብስ ባህሪያት በቻፓ ክፍያ።" : "Ethiopia's creator monetization platform — like Streamlabs, built for Ethiopian streamers and powered by Chapa."}
              </p>
              <div style={{ display:"flex", gap:10 }}>
                {[
                  { icon:"bi-twitter-x", label:"X" },
                  { icon:"bi-youtube", label:"YouTube" },
                  { icon:"bi-instagram", label:"Instagram" },
                  { icon:"bi-telegram", label:"Telegram" },
                ].map((s,i) => (
                  <button key={i} className="btn-icon" title={s.label}>
                    <i className={`bi ${s.icon}`} />
                  </button>
                ))}
              </div>
            </div>
            {[
              { title:isAmharic?"ምርት":"Product", links:[
                { label:isAmharic?"ባህሪያት":"Features", action:()=>document.getElementById("features")?.scrollIntoView({behavior:"smooth"}) },
                { label:isAmharic?"ፈጣሪ ገጾች":"Creator Pages", action:()=>navigate("/register") },
                { label:isAmharic?"ትንታኔ":"Analytics", action:()=>navigate("/dashboard") },
                { label:isAmharic?"ዋጋ":"Pricing", action:()=>{} },
              ]},
              { title:isAmharic?"ኩባንያ":"Company", links:[
                { label:isAmharic?"ስለ እኛ":"About", action:()=>{} },
                { label:isAmharic?"ብሎግ":"Blog", action:()=>{} },
                { label:isAmharic?"ሥራ":"Careers", action:()=>{} },
                { label:"Contact", action:()=>navigate("/contact") },
              ]},
              { title:isAmharic?"ህጋዊ":"Legal", links:[
                { label:isAmharic?"ግላዊነት":"Privacy", action:()=>{} },
                { label:isAmharic?"ውሎች":"Terms", action:()=>{} },
                { label:"Cookies", action:()=>{} },
              ]},
            ].map((col,i) => (
              <div key={i}>
                <div className="footer-col-title">{col.title}</div>
                {col.links.map((l,j) => (
                  <a key={j} className="footer-link" onClick={l.action}>{l.label}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <p className="caption">© 2026 Cheer ET. All rights reserved.</p>
            <p className="caption">
              Built for 🇪🇹 by <span style={{ color:"var(--accent)" }}>Kayon Tech</span> · Powered by <span style={{ color:"var(--accent)" }}>Chapa</span>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}