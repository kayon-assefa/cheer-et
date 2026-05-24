import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   TRANSLATIONS  (EN + AM)
───────────────────────────────────────────── */
const T = {
  en: {
    // nav
    navFeatures:"Features", navCreators:"Creators", navPricing:"Pricing", navContact:"Contact",
    login:"Sign In", getStarted:"Get Started",
    // hero
    heroBadge:"Ethiopia's Creator Platform",
    heroTitle:"Your audience.\nYour income.",
    heroSub:"Cheer ET lets Ethiopian streamers, gamers & creators receive fan support — powered by Chapa.",
    ctaStart:"Start for Free", ctaDemo:"See how it works",
    heroTrust:"No setup fee · Instant ETB payouts · Free to start",
    // chapa flow
    chapaTitle:"Powered by Chapa",
    chapaSub:"Money moves seamlessly between your fans and your wallet through Ethiopia's trusted payment network.",
    // how
    howLabel:"How It Works", howTitle:"Three steps. That's it.",
    s1title:"Fan sends a Cheer", s1desc:"Any amount, via Telebirr, CBEBirr or any Ethiopian bank.",
    s2title:"Alert appears on stream", s2desc:"Animated overlay + TTS voice fires instantly on your stream.",
    s3title:"Money hits your account", s3desc:"ETB lands in your wallet immediately. Cash out anytime.",
    // creators
    creatorsLabel:"Community", creatorsTitle:"Top Creators",
    support:"Support",
    totalRaised:"Total raised",
    // moments (gallery)
    galleryLabel:"Biggest Moments", galleryTitle:"Watch creators go live.",
    // features
    featLabel:"Features", featTitle:"Built different.",
    featItems:[
      { icon:"bi-lightning-charge-fill", title:"Real-time alerts", desc:"Instant donation alerts on your stream." },
      { icon:"bi-volume-up-fill", title:"Text-to-speech", desc:"Fan messages read aloud as they arrive." },
      { icon:"bi-graph-up-arrow", title:"Analytics", desc:"Beautiful dashboard to track growth." },
      { icon:"bi-phone-fill", title:"Mobile ready", desc:"Manage everything from your phone." },
      { icon:"bi-shield-check-fill", title:"Secure payments", desc:"Backed by Chapa's secure infrastructure." },
      { icon:"bi-translate", title:"Amharic support", desc:"Full Amharic language experience." },
    ],
    // countdown
    countLabel:"Launch Date · June 30, 2026",
    countTitle:"Ethiopia's creator economy starts soon.",
    days:"Days", hours:"Hours", minutes:"Min",
    joinEarly:"Join Early Access", contactUs:"Contact",
    // testimonials
    testiLabel:"Reviews", testiTitle:"Creators love it.",
    // cta
    ctaTitle:"Your fans are ready.",
    ctaSub:"Start earning from your audience today.",
    createPage:"Create Your Page",
    ctaTrust:"Free · No credit card · 🇪🇹",
    // footer
    footDesc:"Ethiopia's fan-support platform for creators, streamers, and gamers.",
    footProduct:"Product", footCompany:"Company", footLegal:"Legal",
    footCopy:"© 2026 Cheer ET. All rights reserved.",
    footBuilt:"Built by Kayon Tech · Powered by Chapa",
    productLinks:["Features","Creator Pages","Analytics","Stream Alerts","Pricing"],
    companyLinks:["About","Blog","Careers","Press","Contact"],
    legalLinks:["Privacy","Terms","Cookies"],
    // misc
    todayBalance:"Today's balance", viaChapa:"via Chapa", liveNow:"Live",
    newCheer:"New Cheer!", ttsOn:"TTS ON", liveFeed:"Live",
    topSupporter:"Top Supporter", cashOut:"Cash out", history:"History",
    totalEarned:"Total earned", thisWeek:"This week", supporters:"Supporters", avgDon:"Avg donation",
    weeklyRev:"Weekly Revenue", sendViaChapa:"Send via Chapa", sendAmount:"Amount",
    cheerAlert:"CHEER ALERT", ttsReading:"TTS:",
    // offline / notification
    offlineMsg:"No internet connection. Please check your network.",
    notifAsk:"Enable notifications to know when your fans cheer you.",
    notifBtn:"Enable Notifications",
    notifDeny:"Maybe later",
  },
  am: {
    navFeatures:"ባህሪያት", navCreators:"ፈጣሪዎች", navPricing:"ዋጋ", navContact:"ያግኙን",
    login:"ግባ", getStarted:"ጀምር",
    heroBadge:"የኢትዮጵያ ፈጣሪ መድረክ",
    heroTitle:"ታዳሚዎ.\nገቢዎ.",
    heroSub:"Cheer ET ኢትዮጵያዊ ስትሪመሮች፣ ጨዋቾች እና ፈጣሪዎች የደጋፊ ድጋፍ እንዲያገኙ ያደርጋል — በቻፓ ይሰራል።",
    ctaStart:"ነጻ ጀምር", ctaDemo:"እንዴት እንደሚሰራ ይመልከቱ",
    heroTrust:"ምንም ማቋቋሚያ ክፍያ የለም · ፈጣን ETB ክፍያ · ነጻ",
    chapaTitle:"በቻፓ ይሰራል",
    chapaSub:"ገንዘቡ በቻፓ ተዓማኒ ሂደት ከደጋፊዎችዎ ወደ ቦርሳዎ ያልፋል።",
    howLabel:"እንዴት ይሰራል", howTitle:"ሦስት ደረጃዎች ብቻ።",
    s1title:"ደጋፊ ቺር ይልካል", s1desc:"ማንኛውም መጠን፣ በቴሌብር፣ CBEBirr ወይም ሌላ ባንክ።",
    s2title:"ማስጠንቀቂያ ወዲያው ይነሳል", s2desc:"አኒሜሽን ኦቨርሌይ + TTS ድምጽ ወዲያው ይቀጥላሉ።",
    s3title:"ገንዘቡ ወዲያው ይደርሳል", s3desc:"ETB ወዲያው ወደ ቦርሳዎ ይደርሳል። ማንኛውም ጊዜ ያውጡ።",
    creatorsLabel:"ማህበረሰብ", creatorsTitle:"ምርጥ ፈጣሪዎች",
    support:"ደግፍ",
    totalRaised:"ጠቅላላ የተሰበሰበ",
    galleryLabel:"ትልቁ ቅጽበቶች", galleryTitle:"ፈጣሪዎች ቀጥታ ሲሄዱ ይመልከቱ።",
    featLabel:"ባህሪያት", featTitle:"ለየት ያለ ተሰርቷል።",
    featItems:[
      { icon:"bi-lightning-charge-fill", title:"ቀጥታ ማስጠንቀቂያ", desc:"ወዲያው ልገሳ ማስጠንቀቂያ።" },
      { icon:"bi-volume-up-fill", title:"ጽሑፍ-ወደ-ንግግር", desc:"የደጋፊ መልዕክቶች ሲደርሱ ይነበባሉ።" },
      { icon:"bi-graph-up-arrow", title:"ትንታኔ", desc:"እድገትን ለመከታተል ቆንጆ ዳሽቦርድ።" },
      { icon:"bi-phone-fill", title:"ሞባይል ዝግጁ", desc:"ሁሉን ከስልክዎ ያስተዳድሩ።" },
      { icon:"bi-shield-check-fill", title:"ደህንነቱ የተጠበቀ", desc:"በቻፓ ደህንነቱ የተጠበቀ።" },
      { icon:"bi-translate", title:"አማርኛ ድጋፍ", desc:"ሙሉ አማርኛ ቋንቋ ተሞክሮ።" },
    ],
    countLabel:"የጅምር ቀን · ሰኔ 30፣ 2026",
    countTitle:"የኢትዮጵያ ፈጣሪ ኢኮኖሚ ብዙም ሳይቆይ ይጀምራል።",
    days:"ቀናት", hours:"ሰዓታት", minutes:"ደቂቃ",
    joinEarly:"ቀደም ብሎ ተቀላቀሉ", contactUs:"ያግኙን",
    testiLabel:"ግምገማዎች", testiTitle:"ፈጣሪዎች ይወዳሉ።",
    ctaTitle:"ደጋፊዎችዎ ዝግጁ ናቸው።",
    ctaSub:"ዛሬ ከታዳሚዎችዎ ማግኘት ይጀምሩ።",
    createPage:"ገጽዎን ይፍጠሩ",
    ctaTrust:"ነጻ · ክሬዲት ካርድ አያስፈልግም · 🇪🇹",
    footDesc:"ለፈጣሪዎች፣ ስትሪመሮች እና ጨዋቾች የኢትዮጵያ ደጋፊ-ድጋፍ መድረክ።",
    footProduct:"ምርት", footCompany:"ኩባንያ", footLegal:"ህጋዊ",
    footCopy:"© 2026 Cheer ET. መብቶቹ ሁሉ የተጠበቁ ናቸው።",
    footBuilt:"በ Kayon Tech · በቻፓ",
    productLinks:["ባህሪያት","የፈጣሪ ገጾች","ትንታኔ","ስትሪም ማስጠንቀቂያ","ዋጋ"],
    companyLinks:["ስለ እኛ","ብሎግ","ቅጥር","ፕሬስ","ያግኙን"],
    legalLinks:["ግላዊነት","ውሎች","ኩኪዎች"],
    todayBalance:"የዛሬ ቀሪ ሂሳብ", viaChapa:"በቻፓ", liveNow:"ቀጥታ",
    newCheer:"አዲስ ቺር!", ttsOn:"TTS ክፍት", liveFeed:"ቀጥታ",
    topSupporter:"ምርጥ ደጋፊ", cashOut:"አውጣ", history:"ታሪክ",
    totalEarned:"ጠቅላላ ያገኙ", thisWeek:"ይህ ሳምንት", supporters:"ደጋፊዎች", avgDon:"አማካይ ልገሳ",
    weeklyRev:"ሳምንታዊ ገቢ", sendViaChapa:"በቻፓ ይላኩ", sendAmount:"መጠን",
    cheerAlert:"ቺር ማስጠንቀቂያ", ttsReading:"TTS:",
    offlineMsg:"ኢንተርኔት ግንኙነት የለም። አውታረ መረብዎን ያረጋግጡ።",
    notifAsk:"ደጋፊዎችዎ ቺር ሲልኩ ለማወቅ ማሳወቂያዎችን ያንቁ።",
    notifBtn:"ማሳወቂያዎችን አንቃ",
    notifDeny:"ቆየት ብሎ",
  }
};

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const CREATORS = [
  { name:"AbelGaming", nameAm:"አቤልጌሚንግ", type:"Gamer", typeAm:"ጨዋች", raised:"ETB 12,450", icon:"bi-controller", color:"#0066FF" },
  { name:"HabtamuTube", nameAm:"ሀብታሙ ቲዩብ", type:"YouTuber", typeAm:"ዩቱበር", raised:"ETB 31,000", icon:"bi-play-circle-fill", color:"#0088CC" },
  { name:"MesaretArt", nameAm:"መሰረት አርት", type:"Artist", typeAm:"አርቲስት", raised:"ETB 9,150", icon:"bi-palette-fill", color:"#0055AA" },
];

const TESTIMONIALS = [
  { en:"This is exactly like Streamlabs but for Ethiopia. My viewers donate every stream now.", am:"ልክ እንደ Streamlabs ነው ለኢትዮጵያ። ተመልካቾቼ በእያንዳንዱ ስትሪም ይለግሳሉ።", name:"Yonas T.", handle:"@yonastv" },
  { en:"The Chapa integration is seamless. ETB in my account instantly.", am:"የቻፓ ውህደት ሲምለስ ነው። ETB ወዲያው ሂሳቤ ላይ።", name:"Abel M.", handle:"@abelgame" },
  { en:"Finally a platform built for African creators. Changed everything.", am:"በመጨረሻ ለአፍሪካ ፈጣሪዎች የተሰራ። ሁሉ ነገር ተለወጠ።", name:"Selam K.", handle:"@selamdraws" },
  { en:"TTS alerts went viral. My stream grew from 0 to 800 in a week.", am:"TTS ማስጠንቀቂያዎቹ ቫይረሎ ሆኑ። ስትሪሜ 0 ወደ 800 አደገ።", name:"Hiwot G.", handle:"@hiwotmusic" },
  { en:"Telebirr support is a game changer. No more workarounds.", am:"ቴሌብር ድጋፍ ጨዋታ ቀያሪ ነው። ምንም ዙሪያ መለሻ የለም።", name:"Dawit B.", handle:"@dawittv" },
  { en:"Best analytics I've seen on any creator platform.", am:"ባየሁት ምርጥ ፈጣሪ ትንታኔ።", name:"Mekdes A.", handle:"@mekdesart" },
];

const PAYMENT_NODES = [
  { label:"Telebirr", x:50, y:4 },
  { label:"CBEBirr", x:88, y:28 },
  { label:"Awash", x:92, y:62 },
  { label:"Dashen", x:70, y:90 },
  { label:"Zemen", x:30, y:90 },
  { label:"PayPal", x:8, y:62 },
  { label:"Amhara", x:12, y:28 },
];

const YT_VIDEOS = [
  "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0&modestbranding=1",
  "https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=0&rel=0&modestbranding=1",
  "https://www.youtube.com/embed/9bZkp7q19f0?autoplay=0&rel=0&modestbranding=1",
];

/* ─────────────────────────────────────────────
   THEME  (dark / light)
───────────────────────────────────────────── */
const DARK = {
  bg:"#08090C", surface:"rgba(255,255,255,0.04)", surfaceHover:"rgba(255,255,255,0.07)",
  border:"rgba(255,255,255,0.08)", borderHover:"rgba(0,140,255,0.4)",
  text:"#F0F4FF", muted:"rgba(240,244,255,0.55)", faint:"rgba(240,244,255,0.3)",
  accent:"#0A84FF", accentSoft:"rgba(10,132,255,0.12)",
  navBg:"rgba(8,9,12,0.85)", scrollFade:"#08090C",
  inputBg:"rgba(255,255,255,0.06)",
  cardBg:"rgba(255,255,255,0.04)",
};
const LIGHT = {
  bg:"#FAFCFF", surface:"rgba(255,255,255,0.9)", surfaceHover:"rgba(255,255,255,1)",
  border:"rgba(0,0,0,0.07)", borderHover:"rgba(0,100,220,0.35)",
  text:"#0D1733", muted:"rgba(13,23,51,0.6)", faint:"rgba(13,23,51,0.38)",
  accent:"#0066CC", accentSoft:"rgba(0,102,204,0.08)",
  navBg:"rgba(250,252,255,0.9)", scrollFade:"#FAFCFF",
  inputBg:"rgba(0,80,200,0.05)",
  cardBg:"rgba(0,80,200,0.03)",
};

/* ─────────────────────────────────────────────
   GLOBAL CSS  (injected into <style>)
───────────────────────────────────────────── */
const makeCSS = (dark) => {
  const th = dark ? DARK : LIGHT;
  return `
@import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css');

*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; font-size:16px; }
body {
  background:${th.bg};
  color:${th.text};
  font-family:'Plus Jakarta Sans',-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  line-height:1.5;
}
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background:${th.bg}; }
::-webkit-scrollbar-thumb { background:${th.accent}44; border-radius:4px; }
::-webkit-scrollbar-thumb:hover { background:${th.accent}88; }

/* LOGO */
.ce-logo {
  font-family:-apple-system,'SF Pro Display','Plus Jakarta Sans',sans-serif;
  font-weight:700; font-size:1.35rem; letter-spacing:-0.04em;
  background:linear-gradient(135deg,${dark?"#60B0FF":"#004DC0"} 0%,${th.accent} 60%,${dark?"#40D0FF":"#0066FF"} 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text;
}
.ce-logo sup { font-size:.52em; font-weight:600; letter-spacing:.1em; vertical-align:super; }

/* BUTTONS */
.btn-primary {
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  background:${th.accent}; color:#fff; border:none; border-radius:980px;
  padding:12px 26px; font-size:.93rem; font-weight:600;
  cursor:pointer; font-family:inherit;
  transition:all .22s cubic-bezier(.4,0,.2,1);
  box-shadow:0 2px 12px ${th.accent}44;
  white-space:nowrap; text-decoration:none;
}
.btn-primary:hover { background:${dark?"#1E9AFF":"#0055BB"}; box-shadow:0 4px 24px ${th.accent}66; transform:translateY(-1px); }
.btn-primary:active { transform:translateY(0); }

.btn-ghost {
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  background:${th.inputBg}; color:${th.text}; border:1px solid ${th.border};
  border-radius:980px; padding:12px 24px; font-size:.93rem; font-weight:500;
  cursor:pointer; font-family:inherit;
  transition:all .22s cubic-bezier(.4,0,.2,1);
  backdrop-filter:blur(12px); white-space:nowrap;
}
.btn-ghost:hover { background:${th.accentSoft}; border-color:${th.borderHover}; }

/* CARDS */
.card {
  background:${th.surface};
  border:1px solid ${th.border};
  border-radius:18px; overflow:hidden;
  backdrop-filter:blur(24px);
  transition:all .28s cubic-bezier(.4,0,.2,1);
}
.card:hover { border-color:${th.borderHover}; background:${th.surfaceHover}; }

/* NAV */
.nav-link {
  color:${th.muted}; text-decoration:none; font-size:.9rem; font-weight:500;
  transition:color .18s; cursor:pointer; letter-spacing:.01em; white-space:nowrap;
}
.nav-link:hover { color:${th.text}; }

/* SECTION LABELS */
.label-tag {
  font-size:.72rem; font-weight:700; letter-spacing:.15em; text-transform:uppercase;
  color:${th.accent}; margin-bottom:10px; display:block;
}

/* SCROLL REVEAL */
.reveal { opacity:0; transform:translateY(24px); transition:opacity .65s cubic-bezier(.4,0,.2,1),transform .65s cubic-bezier(.4,0,.2,1); }
.reveal.on { opacity:1; transform:translateY(0); }
.reveal-d1 { transition-delay:.1s; }
.reveal-d2 { transition-delay:.2s; }
.reveal-d3 { transition-delay:.3s; }

/* ANIMATIONS */
@keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-12px);} }
@keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(10px) rotate(1.5deg);} }
@keyframes pulse-ring { 0%{transform:scale(1);opacity:.6;} 100%{transform:scale(2.2);opacity:0;} }
@keyframes slide-up { from{opacity:0;transform:translateY(36px);} to{opacity:1;transform:translateY(0);} }
@keyframes scroll-l { from{transform:translateX(0);} to{transform:translateX(-50%);} }
@keyframes wave { 0%,100%{height:4px;} 50%{height:20px;} }
@keyframes don-pop { 0%{opacity:0;transform:translateY(14px) scale(.92);} 10%{opacity:1;transform:translateY(0) scale(1);} 80%{opacity:1;} 100%{opacity:0;transform:translateY(-6px);} }
@keyframes dash-flow { to{stroke-dashoffset:0;} }
@keyframes dot-travel { 0%{offset-distance:0%;opacity:0;} 10%{opacity:1;} 90%{opacity:1;} 100%{offset-distance:100%;opacity:0;} }
@keyframes spin-slow { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
@keyframes fade-in { from{opacity:0;} to{opacity:1;} }
@keyframes orb-drift { 0%,100%{transform:translate(0,0);} 33%{transform:translate(20px,-14px);} 66%{transform:translate(-14px,10px);} }
@keyframes gradient-x { 0%,100%{background-position:0% 50%;} 50%{background-position:100% 50%;} }

.hero-title {
  font-family:-apple-system,'SF Pro Display','Plus Jakarta Sans',sans-serif;
  font-size:clamp(2.6rem,6vw,5rem); font-weight:700; line-height:1.08;
  letter-spacing:-0.03em;
  background:linear-gradient(160deg,${th.text} 0%,${dark?"#7EC8FF":"#0044AA"} 60%,${th.accent} 100%);
  background-size:200% 200%;
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text;
  animation:gradient-x 8s ease infinite;
  white-space:pre-line;
}

.wave-bar {
  width:3px; border-radius:3px; align-self:center;
  background:linear-gradient(180deg,${th.accent},${dark?"#40AAFF":"#004DB5"});
}

/* MOBILE MENU */
.mobile-menu {
  position:fixed; top:56px; left:0; right:0; bottom:0;
  background:${dark?"rgba(8,9,12,0.97)":"rgba(250,252,255,0.97)"};
  backdrop-filter:blur(32px);
  z-index:990; padding:24px;
  display:flex; flex-direction:column; gap:4px;
  transform:translateX(100%); transition:transform .3s cubic-bezier(.4,0,.2,1);
}
.mobile-menu.open { transform:translateX(0); }
.mobile-nav-link {
  padding:16px 12px; font-size:1.1rem; font-weight:500; color:${th.text};
  border-bottom:1px solid ${th.border}; cursor:pointer;
  display:flex; align-items:center; gap:12px;
  text-decoration:none; transition:color .18s;
}
.mobile-nav-link:last-of-type { border-bottom:none; }
.mobile-nav-link:hover { color:${th.accent}; }

/* CREATOR CARD (mobile: Instagram-style slide) */
.creators-scroll {
  display:flex; gap:16px; overflow-x:auto; padding:8px 24px 16px;
  scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
}
.creators-scroll::-webkit-scrollbar { display:none; }
.creator-slide {
  flex:0 0 260px; scroll-snap-align:center;
  background:${th.surface}; border:1px solid ${th.border};
  border-radius:22px; overflow:hidden;
  transition:all .28s ease;
}
.creator-slide:hover { border-color:${th.borderHover}; transform:translateY(-4px); box-shadow:0 12px 40px ${th.accent}22; }

/* GALLERY (Netflix trailer style) */
.gallery-track { display:flex; gap:16px; overflow-x:auto; padding:8px 24px 16px; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
.gallery-track::-webkit-scrollbar { display:none; }
.gallery-item { flex:0 0 300px; scroll-snap-align:start; border-radius:16px; overflow:hidden; position:relative; }
@media(min-width:600px) { .gallery-item { flex:0 0 360px; } }
@media(min-width:900px) { .gallery-item { flex:0 0 440px; } }

/* COUNTDOWN */
.countdown-num {
  font-family:-apple-system,'SF Pro Display','Plus Jakarta Sans',sans-serif;
  font-size:clamp(2.4rem,5.5vw,4rem); font-weight:700; color:${th.accent};
  line-height:1; letter-spacing:-0.03em;
}

/* TESTIMONIAL SCROLL */
.testi-track { display:flex; gap:16px; animation:scroll-l 34s linear infinite; width:max-content; }
.testi-track:hover { animation-play-state:paused; }
.testi-card {
  width:290px; flex-shrink:0;
  background:${th.surface}; border:1px solid ${th.border};
  border-radius:18px; padding:22px;
}

/* FEAT GRID */
.feat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
@media(max-width:780px) { .feat-grid { grid-template-columns:repeat(2,1fr); } }
@media(max-width:480px) { .feat-grid { grid-template-columns:1fr 1fr; } }

/* OFFLINE BANNER */
.offline-banner {
  position:fixed; bottom:0; left:0; right:0; z-index:2000;
  background:${dark?"#1a0a00":"#FFF3E0"}; color:${dark?"#FFCC88":"#7A3800"};
  border-top:1px solid ${dark?"#FF8C0044":"#FF8C0044"};
  padding:12px 24px; display:flex; align-items:center; justify-content:center; gap:10px;
  font-size:.88rem; font-weight:500;
  transform:translateY(100%); transition:transform .3s ease;
}
.offline-banner.show { transform:translateY(0); }

/* NOTIF PROMPT */
.notif-prompt {
  position:fixed; bottom:24px; right:24px; z-index:1500;
  background:${th.surface}; border:1px solid ${th.border};
  border-radius:18px; padding:20px; max-width:320px; width:calc(100vw - 48px);
  backdrop-filter:blur(24px); box-shadow:0 8px 40px rgba(0,0,0,.18);
  animation:fade-in .35s ease;
}

/* RESPONSIVE helpers */
.hide-mobile { }
.hide-desktop { display:none !important; }
@media(max-width:900px) {
  .hide-mobile { display:none !important; }
  .hide-desktop { display:block !important; }
  .hero-split { flex-direction:column !important; gap:32px !important; }
  .steps-grid { grid-template-columns:1fr !important; }
  .feat-grid { grid-template-columns:1fr 1fr !important; }
  .footer-grid { grid-template-columns:1fr 1fr !important; }
}
@media(max-width:600px) {
  .footer-grid { grid-template-columns:1fr !important; }
  .stats-grid { grid-template-columns:1fr 1fr !important; }
  .cta-row { flex-direction:column !important; }
  .cta-row button, .cta-row a { width:100% !important; text-align:center !important; }
}

/* Payment Flow Diagram */
.pay-diagram { position:relative; width:100%; aspect-ratio:1; max-width:480px; margin:0 auto; }
.pay-dot {
  position:absolute; border-radius:50%; background:${th.accent};
  animation:pulse-ring 2s ease-out infinite;
}

/* Section spacing */
section { padding:80px 0; }
@media(max-width:600px) { section { padding:56px 0; } }
.container { max-width:1100px; margin:0 auto; padding:0 24px; }
.container-wide { max-width:1280px; margin:0 auto; padding:0 24px; }
`;
};

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function WaveBar({ delay = 0, accent }) {
  return (
    <div className="wave-bar" style={{
      animation: `wave 1.1s ease-in-out ${delay}ms infinite`,
    }} />
  );
}

function LiveDonRow({ name, amount, msg, emoji, visible, accent }) {
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transition: "opacity .5s ease",
      background: "rgba(10,132,255,0.07)",
      border: "1px solid rgba(10,132,255,0.15)",
      borderRadius: 13, padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
    }}>
      <i className={`bi ${emoji}`} style={{ fontSize: 18, color: accent }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, fontSize: ".84rem" }}>{name}</span>
          <span style={{ color: accent, fontWeight: 700, fontSize: ".84rem" }}>{amount}</span>
        </div>
        <p style={{ fontSize: ".72rem", opacity: .55, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</p>
      </div>
    </div>
  );
}

/* Payment Flow Diagram */
function PaymentDiagram({ dark, accent }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef(
    PAYMENT_NODES.map((n, i) => ({
      nodeIndex: i,
      progress: Math.random(),
      dir: Math.random() > 0.5 ? 1 : -1,
      speed: 0.003 + Math.random() * 0.003,
    }))
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2;
      const r = Math.min(W, H) * 0.38;

      const nodes = PAYMENT_NODES.map(n => ({
        x: (n.x / 100) * W,
        y: (n.y / 100) * H,
        label: n.label,
      }));

      // Draw lines from nodes to center
      nodes.forEach(node => {
        const grad = ctx.createLinearGradient(node.x, node.y, cx, cy);
        grad.addColorStop(0, dark ? "rgba(10,132,255,0.15)" : "rgba(0,102,204,0.12)");
        grad.addColorStop(1, dark ? "rgba(10,132,255,0.4)" : "rgba(0,102,204,0.35)");
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 8]);
        ctx.lineDashOffset = -(Date.now() / 40) % 13;
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Animated dots on lines
      const t = Date.now();
      particlesRef.current.forEach((p, pi) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const node = nodes[p.nodeIndex];
        const tp = p.dir === 1 ? p.progress : 1 - p.progress;
        const px = node.x + (cx - node.x) * tp;
        const py = node.y + (cy - node.y) * tp;

        const dotGrad = ctx.createRadialGradient(px, py, 0, px, py, 5);
        dotGrad.addColorStop(0, dark ? "#60BFFF" : "#0066FF");
        dotGrad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.fillStyle = dotGrad;
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw node circles
      nodes.forEach(node => {
        // outer pulse
        ctx.beginPath();
        ctx.fillStyle = dark ? "rgba(10,132,255,0.08)" : "rgba(0,102,204,0.06)";
        ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
        ctx.fill();

        // circle
        ctx.beginPath();
        ctx.fillStyle = dark ? "rgba(20,28,48,0.95)" : "rgba(250,252,255,0.95)";
        ctx.strokeStyle = dark ? "rgba(10,132,255,0.35)" : "rgba(0,102,204,0.25)";
        ctx.lineWidth = 1.5;
        ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // label
        ctx.fillStyle = dark ? "rgba(240,244,255,0.85)" : "rgba(13,23,51,0.85)";
        ctx.font = "bold 9px Plus Jakarta Sans, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, node.x, node.y);
      });

      // Center Chapa circle
      const cr = 40;
      const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      cGrad.addColorStop(0, dark ? "#0A84FF" : "#0066CC");
      cGrad.addColorStop(1, dark ? "#0055CC" : "#004499");
      ctx.beginPath();
      ctx.fillStyle = cGrad;
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();

      // Chapa pulse ring
      const pulse = ((t % 2000) / 2000);
      ctx.beginPath();
      ctx.strokeStyle = dark
        ? `rgba(10,132,255,${0.6 * (1 - pulse)})`
        : `rgba(0,100,200,${0.4 * (1 - pulse)})`;
      ctx.lineWidth = 2;
      ctx.arc(cx, cy, cr + pulse * 30, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Plus Jakarta Sans, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Chapa", cx, cy);

      animRef.current = requestAnimationFrame(draw);
    };

    const resize = () => {
      const size = canvas.parentElement.clientWidth;
      canvas.width = Math.min(size, 480);
      canvas.height = canvas.width;
    };
    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [dark]);

  return (
    <canvas ref={canvasRef} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} />
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function CheerETHome() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [liveDon, setLiveDon] = useState(null);
  const [balance, setBalance] = useState(12450);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showNotif, setShowNotif] = useState(false);
  const revealRefs = useRef([]);
  const s = T[lang];
  const th = dark ? DARK : LIGHT;

  // Auth redirect
  useEffect(() => {
    const tok = localStorage.getItem("cheeret_token") || sessionStorage.getItem("cheeret_token");
    if (tok) navigate("/dashboard", { replace: true });
  }, []);

  // Countdown June 30 2026
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
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, []);

  // Scroll
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 44);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Offline detection
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Notification permission prompt (after 4s)
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      const t = setTimeout(() => setShowNotif(true), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  // Live donations
  useEffect(() => {
    const pool = [
      { name: "Tigist A.", amount: "ETB 500", msg: lang === "am" ? "ቀጥሉ! 🔥" : "Keep going! 🔥", emoji: "bi-heart-fill" },
      { name: "Samuel B.", amount: "ETB 1,000", msg: lang === "am" ? "ምርጥ ስትሪም!" : "Best stream ever!", emoji: "bi-controller" },
      { name: "Biruk M.", amount: "ETB 2,000", msg: lang === "am" ? "ጎት!" : "You're the GOAT!", emoji: "bi-trophy-fill" },
    ];
    let idx = 0;
    const show = () => {
      setLiveDon(pool[idx % pool.length]);
      setBalance(b => b + Math.floor(Math.random() * 450 + 100));
      idx++;
    };
    show(); const i = setInterval(show, 4500); return () => clearInterval(i);
  }, [lang]);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("on"); }),
      { threshold: 0.1 }
    );
    revealRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);
  const addR = el => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  const askNotification = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(p => {
        if (p === "granted") new Notification("Cheer ET", { body: lang === "am" ? "ማሳወቂያዎች ነቅተዋል!" : "Notifications enabled!", icon: "/favicon.ico" });
        setShowNotif(false);
      });
    }
  };

  const feats = s.featItems;
  const testimonials = TESTIMONIALS;

  const navBg = scrolled
    ? `${th.navBg}` : "transparent";

  return (
    <>
      <style>{makeCSS(dark)}</style>

      {/* ──── NAVBAR ──── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: scrolled ? "10px 24px" : "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: navBg,
        backdropFilter: scrolled ? "blur(28px) saturate(1.8)" : "none",
        borderBottom: scrolled ? `1px solid ${th.border}` : "none",
        transition: "all .35s cubic-bezier(.4,0,.2,1)",
      }}>
        <span className="ce-logo">Cheer<sup>ET</sup></span>

        {/* Desktop nav */}
        <nav className="hide-mobile" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a className="nav-link">{s.navFeatures}</a>
          <a className="nav-link">{s.navCreators}</a>
          <a className="nav-link">{s.navPricing}</a>
          <a className="nav-link" onClick={() => navigate("/contact")}>{s.navContact}</a>
        </nav>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Theme */}
          <button onClick={() => setDark(d => !d)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: th.muted, padding: "4px 6px", borderRadius: 8, transition: "color .2s" }} title="Toggle theme">
            <i className={`bi ${dark ? "bi-sun-fill" : "bi-moon-fill"}`} />
          </button>
          {/* Lang */}
          <button onClick={() => setLang(l => l === "en" ? "am" : "en")} className="btn-ghost" style={{ padding: "7px 13px", fontSize: ".82rem" }}>
            {lang === "en" ? "አማ" : "EN"}
          </button>
          <button onClick={() => navigate("/login")} className="btn-ghost hide-mobile" style={{ padding: "8px 18px", fontSize: ".86rem" }}>{s.login}</button>
          <button onClick={() => navigate("/register")} className="btn-primary" style={{ padding: "9px 20px", fontSize: ".86rem" }}>{s.getStarted}</button>
          {/* Hamburger */}
          <button onClick={() => setMobileOpen(o => !o)} className="hide-desktop" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: th.text }}>
            <i className={`bi ${mobileOpen ? "bi-x-lg" : "bi-list"}`} style={{ fontSize: "1.4rem" }} />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`mobile-menu${mobileOpen ? " open" : ""}`}>
        {[
          { label: s.navFeatures, icon: "bi-stars" },
          { label: s.navCreators, icon: "bi-people-fill" },
          { label: s.navPricing, icon: "bi-tag-fill" },
          { label: s.navContact, icon: "bi-chat-dots-fill", action: () => navigate("/contact") },
        ].map(l => (
          <a key={l.label} className="mobile-nav-link" onClick={() => { l.action?.(); setMobileOpen(false); }}>
            <i className={`bi ${l.icon}`} style={{ color: th.accent, width: 20 }} />{l.label}
          </a>
        ))}
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/login")} className="btn-ghost" style={{ flex: 1 }}>{s.login}</button>
          <button onClick={() => navigate("/register")} className="btn-primary" style={{ flex: 1 }}>{s.getStarted}</button>
        </div>
      </div>

      {/* ──── HERO ──── */}
      <section style={{ minHeight: "100svh", display: "flex", alignItems: "center", padding: "120px 0 80px", position: "relative", overflow: "hidden" }}>
        {/* Subtle background orb */}
        <div style={{ position: "absolute", top: "20%", right: "-5%", width: "45vw", height: "45vw", maxWidth: 520, maxHeight: 520, borderRadius: "50%", background: dark ? "radial-gradient(circle,rgba(10,132,255,0.12) 0%,transparent 70%)" : "radial-gradient(circle,rgba(0,102,204,0.07) 0%,transparent 70%)", animation: "orb-drift 16s ease-in-out infinite", pointerEvents: "none" }} />

        <div className="container">
          <div className="hero-split" style={{ display: "flex", gap: 48, alignItems: "center" }}>
            {/* Left */}
            <div style={{ flex: "1 1 460px", animation: "slide-up .8s cubic-bezier(.4,0,.2,1) forwards" }}>
              {/* Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: th.accentSoft, border: `1px solid ${th.accent}28`, borderRadius: 100, padding: "5px 14px", marginBottom: 22 }}>
                <i className="bi bi-broadcast" style={{ fontSize: ".78rem", color: th.accent }} />
                <span style={{ fontSize: ".78rem", color: th.accent, fontWeight: 600 }}>{s.heroBadge}</span>
              </div>

              <h1 className="hero-title" style={{ marginBottom: 20 }}>{s.heroTitle}</h1>

              <p style={{ fontSize: "1.05rem", color: th.muted, lineHeight: 1.75, maxWidth: 460, marginBottom: 16 }}>{s.heroSub}</p>

              {/* Chapa trust */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: th.accentSoft, border: `1px solid ${th.accent}22`, borderRadius: 100, padding: "5px 14px", marginBottom: 32 }}>
                <i className="bi bi-shield-check-fill" style={{ fontSize: ".78rem", color: th.accent }} />
                <span style={{ fontSize: ".8rem", color: th.muted }}>
                  {lang === "am" ? "በቻፓ ተጠብቋል" : "Secured by"} <strong style={{ color: th.accent }}>Chapa</strong> · Telebirr · CBEBirr
                </span>
              </div>

              <div className="cta-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
                <button onClick={() => navigate("/register")} className="btn-primary" style={{ fontSize: "1rem", padding: "14px 32px" }}>
                  <i className="bi bi-arrow-right-circle-fill" /> {s.ctaStart}
                </button>
                <button className="btn-ghost" style={{ fontSize: "1rem", padding: "14px 24px" }}>
                  <i className="bi bi-play-circle" /> {s.ctaDemo}
                </button>
              </div>
              <p style={{ fontSize: ".76rem", color: th.faint }}>{s.heroTrust}</p>
            </div>

            {/* Right — mockup */}
            <div className="hide-mobile" style={{ flex: "0 0 340px", position: "relative", animation: "float 7s ease-in-out infinite" }}>
              <div className="card" style={{ padding: 22 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${th.accent},${dark?"#40D0FF":"#0044BB"})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="bi bi-controller" style={{ color: "#fff", fontSize: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".88rem" }}>AbelGaming</div>
                      <div style={{ fontSize: ".68rem", color: th.faint }}>
                        <i className="bi bi-circle-fill" style={{ color: "#22C55E", fontSize: ".5rem", marginRight: 4 }} />{s.liveNow} · 2,341
                      </div>
                    </div>
                  </div>
                  <span style={{ background: th.accentSoft, border: `1px solid ${th.accent}33`, borderRadius: 7, padding: "3px 9px", fontSize: ".68rem", color: th.accent, fontWeight: 700 }}>{s.ttsOn}</span>
                </div>

                {/* Balance */}
                <div style={{ background: th.accentSoft, border: `1px solid ${th.accent}22`, borderRadius: 13, padding: "14px 16px", marginBottom: 11 }}>
                  <div style={{ fontSize: ".68rem", color: th.faint, marginBottom: 2 }}>{s.todayBalance}</div>
                  <div style={{ fontSize: "1.9rem", fontWeight: 700, color: th.accent, letterSpacing: -1, lineHeight: 1 }}>
                    ETB {balance.toLocaleString()}
                  </div>
                  <div style={{ fontSize: ".68rem", color: "#22C55E", marginTop: 3 }}>
                    <i className="bi bi-arrow-up-right" /> +18% · {s.viaChapa}
                  </div>
                </div>

                {/* TTS wave */}
                <div style={{ display: "flex", alignItems: "center", gap: 3, background: th.inputBg, border: `1px solid ${th.border}`, borderRadius: 9, padding: "8px 12px", marginBottom: 11 }}>
                  <i className="bi bi-volume-up-fill" style={{ fontSize: ".8rem", color: th.accent, marginRight: 6 }} />
                  <span style={{ fontSize: ".68rem", color: th.faint, marginRight: 7 }}>{s.ttsReading}</span>
                  {[0, 65, 130, 195, 65, 130].map((d, i) => <WaveBar key={i} delay={d} accent={th.accent} />)}
                </div>

                {/* Feed */}
                <div style={{ fontSize: ".65rem", color: th.faint, marginBottom: 7, fontWeight: 700, letterSpacing: .7, textTransform: "uppercase" }}>{s.liveFeed}</div>
                <LiveDonRow name="Tigist A." amount="ETB 500" msg="Keep going! 🔥" emoji="bi-heart-fill" visible={true} accent={th.accent} />
                <LiveDonRow name="Samuel B." amount="ETB 1,000" msg="Best stream!" emoji="bi-controller" visible={true} accent={th.accent} />

                {/* Pop */}
                {liveDon && (
                  <div key={balance} style={{ position: "absolute", bottom: -12, left: -12, background: `linear-gradient(135deg,${th.accent},${dark?"#40AAFF":"#004DB5"})`, borderRadius: 13, padding: "11px 16px", animation: "don-pop 4.5s ease forwards", boxShadow: `0 8px 28px ${th.accent}44`, minWidth: 205 }}>
                    <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.75)", marginBottom: 2 }}>
                      <i className="bi bi-lightning-charge-fill" /> {s.newCheer}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: ".9rem", color: "#fff" }}>{liveDon.name} · {liveDon.amount}</div>
                    <div style={{ fontSize: ".73rem", color: "rgba(255,255,255,.82)" }}>{liveDon.msg}</div>
                  </div>
                )}
              </div>
              {/* Chip */}
              <div style={{ position: "absolute", top: -16, right: -16, background: th.surface, border: `1px solid ${th.border}`, borderRadius: 13, padding: "10px 16px", backdropFilter: "blur(16px)", animation: "float2 5.5s ease-in-out infinite", boxShadow: `0 4px 20px ${th.accent}18` }}>
                <div style={{ fontSize: ".64rem", color: th.faint }}>{s.topSupporter}</div>
                <div style={{ fontWeight: 700, fontSize: ".86rem" }}>Biruk M. <i className="bi bi-trophy-fill" style={{ color: "#F0A000", fontSize: ".75rem" }} /></div>
                <div style={{ fontSize: ".78rem", color: th.accent }}>ETB 8,200 total</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── CHAPA PAYMENT FLOW ──── */}
      <section ref={addR} className="reveal">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="label-tag">{s.paymentPartner || (lang === "am" ? "የክፍያ አጋር" : "Payment Partner")}</span>
            <h2 style={{ fontSize: "clamp(1.7rem,4vw,2.6rem)", fontWeight: 700, letterSpacing: -.03 * 16, marginBottom: 14 }}>{s.chapaTitle}</h2>
            <p style={{ fontSize: ".97rem", color: th.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.75 }}>{s.chapaSub}</p>
          </div>
          <PaymentDiagram dark={dark} accent={th.accent} />
        </div>
      </section>

      {/* ──── HOW IT WORKS ──── */}
      <section ref={addR} className="reveal">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="label-tag">{s.howLabel}</span>
            <h2 style={{ fontSize: "clamp(1.7rem,4vw,2.6rem)", fontWeight: 700, letterSpacing: -.02 * 16 }}>{s.howTitle}</h2>
          </div>
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { num: "01", icon: "bi-credit-card-fill", title: s.s1title, desc: s.s1desc, color: th.accent },
              { num: "02", icon: "bi-broadcast-pin", title: s.s2title, desc: s.s2desc, color: dark ? "#40C0FF" : "#0055BB" },
              { num: "03", icon: "bi-bank2", title: s.s3title, desc: s.s3desc, color: "#22C55E" },
            ].map((st, i) => (
              <div key={i} className={`card reveal reveal-d${i + 1}`} ref={addR} style={{ padding: 26 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${st.color}16`, border: `1px solid ${st.color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={`bi ${st.icon}`} style={{ color: st.color, fontSize: "1.1rem" }} />
                  </div>
                  <span style={{ fontSize: ".7rem", fontWeight: 800, color: th.faint, letterSpacing: 1.2 }}>STEP {st.num}</span>
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8 }}>{st.title}</h3>
                <p style={{ fontSize: ".85rem", color: th.muted, lineHeight: 1.65 }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── TOP CREATORS (Instagram-style mobile slide) ──── */}
      <section ref={addR} className="reveal">
        <div style={{ textAlign: "center", marginBottom: 36, padding: "0 24px" }}>
          <span className="label-tag">{s.creatorsLabel}</span>
          <h2 style={{ fontSize: "clamp(1.7rem,4vw,2.6rem)", fontWeight: 700, letterSpacing: -.02 * 16 }}>{s.creatorsTitle}</h2>
        </div>
        <div className="creators-scroll">
          {CREATORS.map((c, i) => (
            <div key={i} className="creator-slide">
              {/* Top color bar */}
              <div style={{ height: 4, background: `linear-gradient(90deg,${c.color},${dark ? "#40D0FF" : "#0044BB"})` }} />
              <div style={{ padding: "22px 20px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <div style={{ width: 68, height: 68, borderRadius: "50%", background: `${c.color}18`, border: `2px solid ${c.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={`bi ${c.icon}`} style={{ fontSize: "1.6rem", color: c.color }} />
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>{lang === "am" ? c.nameAm : c.name}</div>
                  <div style={{ fontSize: ".78rem", color: th.faint, marginBottom: 16 }}>
                    <i className={`bi ${c.icon}`} style={{ marginRight: 5 }} />{lang === "am" ? c.typeAm : c.type}
                  </div>
                  <div style={{ fontSize: ".72rem", color: th.faint, marginBottom: 4 }}>{s.totalRaised}</div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: c.color, marginBottom: 18 }}>{c.raised}</div>
                  <button className="btn-primary" style={{ width: "100%", padding: "10px", fontSize: ".88rem", borderRadius: 12 }}>
                    <i className="bi bi-heart-fill" /> {s.support}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──── GALLERY — Biggest Moments (Netflix-style) ──── */}
      <section ref={addR} className="reveal">
        <div style={{ textAlign: "center", marginBottom: 36, padding: "0 24px" }}>
          <span className="label-tag">{s.galleryLabel}</span>
          <h2 style={{ fontSize: "clamp(1.7rem,4vw,2.6rem)", fontWeight: 700, letterSpacing: -.02 * 16 }}>{s.galleryTitle}</h2>
        </div>
        <div className="gallery-track">
          {YT_VIDEOS.map((src, i) => (
            <div key={i} className="gallery-item">
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  src={src}
                  title={`Moment ${i + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: 16 }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──── FEATURES ──── */}
      <section ref={addR} className="reveal">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="label-tag">{s.featLabel}</span>
            <h2 style={{ fontSize: "clamp(1.7rem,4vw,2.6rem)", fontWeight: 700, letterSpacing: -.02 * 16 }}>{s.featTitle}</h2>
          </div>
          <div className="feat-grid">
            {feats.map((f, i) => (
              <div key={i} className={`card reveal reveal-d${(i % 3) + 1}`} ref={addR} style={{ padding: "22px 20px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: th.accentSoft, border: `1px solid ${th.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <i className={`bi ${f.icon}`} style={{ color: th.accent, fontSize: "1.1rem" }} />
                </div>
                <h3 style={{ fontSize: ".98rem", fontWeight: 700, marginBottom: 7 }}>{f.title}</h3>
                <p style={{ fontSize: ".83rem", color: th.muted, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── COUNTDOWN ──── */}
      <section ref={addR} className="reveal" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <span className="label-tag">{s.countLabel}</span>
          <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 700, letterSpacing: -.02 * 16, marginBottom: 44 }}>{s.countTitle}</h2>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}>
            {[{ val: timeLeft.days, label: s.days }, { val: timeLeft.hours, label: s.hours }, { val: timeLeft.minutes, label: s.minutes }].map((item, i) => (
              <div key={i} className="card" style={{ padding: "24px 32px", minWidth: 120, flex: "1 1 100px", maxWidth: 160 }}>
                <div className="countdown-num">{String(item.val).padStart(2, "0")}</div>
                <div style={{ fontSize: ".75rem", color: th.faint, marginTop: 7, textTransform: "uppercase", letterSpacing: 1.5 }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div className="cta-row" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => navigate("/register")} className="btn-primary">{s.joinEarly}</button>
            <button onClick={() => navigate("/contact")} className="btn-ghost">{s.contactUs}</button>
          </div>
        </div>
      </section>

      {/* ──── TESTIMONIALS ──── */}
      <section ref={addR} className="reveal" style={{ overflow: "hidden", paddingLeft: 0, paddingRight: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 36, padding: "0 24px" }}>
          <span className="label-tag">{s.testiLabel}</span>
          <h2 style={{ fontSize: "clamp(1.7rem,4vw,2.6rem)", fontWeight: 700, letterSpacing: -.02 * 16 }}>{s.testiTitle}</h2>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(90deg,${th.scrollFade},transparent)`, zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(-90deg,${th.scrollFade},transparent)`, zIndex: 2, pointerEvents: "none" }} />
          <div style={{ overflow: "hidden" }}>
            <div className="testi-track">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="testi-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: th.accentSoft, border: `1px solid ${th.accent}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="bi bi-person-fill" style={{ color: th.accent, fontSize: ".95rem" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".86rem" }}>{t.name}</div>
                      <div style={{ fontSize: ".72rem", color: th.faint }}>{t.handle}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: ".85rem", color: th.muted, lineHeight: 1.68 }}>"{lang === "am" ? t.am : t.en}"</p>
                  <div style={{ display: "flex", gap: 2, marginTop: 10 }}>
                    {[1, 2, 3, 4, 5].map(s => <i key={s} className="bi bi-star-fill" style={{ color: "#F0A000", fontSize: ".72rem" }} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section ref={addR} className="reveal" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 620 }}>
          <div style={{ position: "relative", background: `linear-gradient(135deg,${th.accent}18,${th.accentSoft})`, border: `1px solid ${th.accent}28`, borderRadius: 28, padding: "52px 36px", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "80%", height: "80%", background: `radial-gradient(circle,${th.accent}10,transparent 65%)`, pointerEvents: "none" }} />
            <span className="label-tag" style={{ display: "block", position: "relative" }}>{lang === "am" ? "ዛሬ ጀምሩ" : "Get Started"}</span>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 700, letterSpacing: -.02 * 16, marginBottom: 12, position: "relative" }}>
              {s.ctaTitle}
            </h2>
            <p style={{ fontSize: ".97rem", color: th.muted, marginBottom: 32, lineHeight: 1.75, position: "relative" }}>{s.ctaSub}</p>
            <div className="cta-row" style={{ display: "flex", gap: 12, justifyContent: "center", position: "relative" }}>
              <button onClick={() => navigate("/register")} className="btn-primary" style={{ fontSize: "1rem", padding: "14px 36px" }}>{s.createPage}</button>
              <button onClick={() => navigate("/contact")} className="btn-ghost" style={{ fontSize: "1rem", padding: "14px 28px" }}>{s.contactUs}</button>
            </div>
            <p style={{ fontSize: ".74rem", color: th.faint, marginTop: 18, position: "relative" }}>{s.ctaTrust}</p>
          </div>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer style={{ borderTop: `1px solid ${th.border}`, padding: "56px 0 32px", background: th.bg }}>
        <div className="container">
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 36, marginBottom: 44 }}>
            <div>
              <div style={{ marginBottom: 14 }}>
                <span className="ce-logo" style={{ fontSize: "1.3rem" }}>Cheer<sup>ET</sup></span>
              </div>
              <p style={{ fontSize: ".84rem", color: th.faint, lineHeight: 1.78, maxWidth: 250, marginBottom: 20 }}>{s.footDesc}</p>
              <div style={{ display: "flex", gap: 9 }}>
                {[
                  { icon: "bi-twitter-x", label: "Twitter" },
                  { icon: "bi-youtube", label: "YouTube" },
                  { icon: "bi-facebook", label: "Facebook" },
                  { icon: "bi-instagram", label: "Instagram" },
                  { icon: "bi-tiktok", label: "TikTok" },
                ].map((s, i) => (
                  <button key={i} style={{ width: 32, height: 32, borderRadius: 8, background: th.cardBg, border: `1px solid ${th.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".85rem", cursor: "pointer", transition: "all .2s", color: th.muted }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = th.accent + "66"; e.currentTarget.style.color = th.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = th.border; e.currentTarget.style.color = th.muted; }}
                    title={s.label} aria-label={s.label}
                  >
                    <i className={`bi ${s.icon}`} />
                  </button>
                ))}
              </div>
            </div>
            {[
              { title: s.footProduct, links: s.productLinks },
              { title: s.footCompany, links: s.companyLinks },
              { title: s.footLegal, links: s.legalLinks },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: th.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>{col.title}</div>
                {col.links.map((l, j) => (
                  <div key={j} style={{ fontSize: ".84rem", color: th.faint, marginBottom: 11, cursor: "pointer", transition: "color .2s" }}
                    onClick={() => (l === "Contact" || l === "ያግኙን") && navigate("/contact")}
                    onMouseEnter={e => e.target.style.color = th.text}
                    onMouseLeave={e => e.target.style.color = th.faint}
                  >{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${th.border}`, paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: ".76rem", color: th.faint }}>{s.footCopy}</p>
            <p style={{ fontSize: ".76rem", color: th.faint }}>
              {s.footBuilt} · <span style={{ color: th.accent }}>Chapa</span>
            </p>
          </div>
        </div>
      </footer>

      {/* ──── OFFLINE BANNER ──── */}
      <div className={`offline-banner${offline ? " show" : ""}`}>
        <i className="bi bi-wifi-off" style={{ fontSize: "1rem" }} />
        {s.offlineMsg}
      </div>

      {/* ──── NOTIFICATION PROMPT ──── */}
      {showNotif && (
        <div className="notif-prompt">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: th.accentSoft, border: `1px solid ${th.accent}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="bi bi-bell-fill" style={{ color: th.accent, fontSize: "1rem" }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: ".9rem", marginBottom: 4 }}>Cheer ET</div>
              <p style={{ fontSize: ".83rem", color: th.muted, lineHeight: 1.6 }}>{s.notifAsk}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={askNotification} className="btn-primary" style={{ flex: 1, padding: "10px", fontSize: ".85rem", borderRadius: 10 }}>
              <i className="bi bi-bell-fill" /> {s.notifBtn}
            </button>
            <button onClick={() => setShowNotif(false)} className="btn-ghost" style={{ padding: "10px 14px", fontSize: ".85rem", borderRadius: 10 }}>
              {s.notifDeny}
            </button>
          </div>
        </div>
      )}
    </>
  );
}