// CheerET_Home.jsx — Full Production Component
// Dark default | Light/Dark toggle | EN/AM bilingual | Auth redirect | SEO | All sections
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ══════════════════════════════════════════════
   TRANSLATIONS
══════════════════════════════════════════════ */
const STR = {
  en: {
    navFeatures:"Features",navCreators:"Creators",navPricing:"Pricing",navContact:"Contact",
    login:"Sign In",getStarted:"Get Started",
    // ✅ CHANGED: removed "Streamer" — now just Creator Platform
    heroBadge:"",
    heroTitle:"Your audience.\nYour income.",
    // ✅ CHANGED: TikTokers & YouTubers listed first, streamers not highlighted
    heroSub:"Cheer ET helps Ethiopian TikTokers, YouTubers, podcasters, artists and streamers receive fan support in seconds — powered by Chapa.",
    ctaStart:"Start for Free",ctaWatch:"See how it works",
    heroTrust:"",
    chapaLabel:"Payment Partner",chapaTitle:"Powered by Chapa",
    chapaSub:"Money flows instantly from your fans to your wallet through Ethiopia's most trusted payment network — Telebirr, CBEBirr, and all major banks.",
    howLabel:"How It Works",howTitle:"Three steps. That's it.",
    s1:"Fan sends a tip",s1d:"Any amount via Telebirr, CBEBirr or any Ethiopian bank.",
    // ✅ CHANGED: removed OBS/overlay/streaming language — now generic for all creators
    s2:"They land on your page",s2d:"Your fans open your CheerET link and tip you directly — from TikTok, Instagram, YouTube or anywhere you share it.",
    s3:"Money hits your wallet",s3d:"ETB lands immediately. 10% platform fee applies. Cash out anytime.",
    creatorsLabel:"Top Creators",creatorsTitle:"Built for every creator.",
    // ✅ CHANGED: removed "special focus on live streaming"
    creatorsNote:"From TikTokers to artists, YouTubers to podcasters — Cheer ET works for every Ethiopian creator.",
    support:"Support",totalRaised:"Total raised",
    // ✅ CHANGED: "go live" replaced with neutral "creating"
    galleryLabel:"Creator Moments",galleryTitle:"Watch creators doing what they do.",
    gallerySub:"Real moments from Ethiopian creators on Cheer ET.",
    donate:"Tip Now",
    // ✅ CHANGED: platforms section reframed around sharing links, not streaming software
    platformsLabel:"Share Anywhere",platformsTitle:"Works with every platform.",
    platformsSub:"Share your Cheer ET link on TikTok, Instagram, YouTube, Telegram, Twitter and anywhere your fans follow you. Tips come in from everywhere.",
    // ✅ CHANGED: overlays section reframed as "tip page" customization for all creators
    overlayLabel:"Your Tip Page",overlayTitle:"A beautiful page. One link.",
    overlaySub:"Your CheerET page is ready to share the moment you sign up. Customize it with your photo, colors and message. Works for streamers too — with full overlay and alert support.",
    overlayFeats:["Custom Tip Page","Donation Alerts (for streamers)","Goal Progress Bar","Live Chat Overlay","Countdown Widget","Donor Leaderboard","TTS Alert Widget","Amharic Support"],
    // ✅ CHANGED: note now leads with creators, mentions streamers as bonus
    overlayNote:"Every creator gets a shareable tip page. Streamers also get overlay URLs for OBS and Streamlabs — live alerts, sub goals and more.",
    featLabel:"Features",featTitle:"Built different.",
    featItems:[
      {icon:"bi-lightning-charge-fill",title:"Instant payments",desc:"Fans tip you instantly — no delays, no waiting. ETB hits your wallet immediately."},
      {icon:"bi-volume-up-fill",title:"Text-to-speech",desc:"Fan messages read aloud live on your stream as they arrive."},
      {icon:"bi-graph-up-arrow",title:"Analytics",desc:"Beautiful dashboard tracking revenue, donors and growth."},
      {icon:"bi-phone-fill",title:"Mobile ready",desc:"Manage tips and your page from your phone anywhere."},
      {icon:"bi-shield-check-fill",title:"Secure via Chapa",desc:"All payments flow through Chapa's verified infrastructure."},
      {icon:"bi-translate",title:"Amharic support",desc:"Full Amharic language for you and your fans."},
      {icon:"bi-flag-fill",title:"Goal page",desc:"Set a tip goal and let your fans watch it fill up in real time."},
      // ✅ CHANGED: "Live sub page" → creator-neutral "Fan leaderboard"
      {icon:"bi-people-fill",title:"Fan leaderboard",desc:"Show your top supporters publicly and reward your biggest fans."},
    ],
    pricingLabel:"Pricing",pricingTitle:"Simple, transparent pricing.",
    pricingSub:"One flat fee. No hidden costs. Start free.",
    freeTitle:"Free",freePer:"forever",
    freeFeats:["Creator tip page","Donation alerts","Chapa payments","Basic analytics","10% platform fee"],
    proTitle:"Pro",proPer:"/ month",proPrice:"ETB 199",
    proFeats:["Everything in Free","Custom overlays","Goal page","Fan leaderboard","Priority support","Lower 7% fee","Advanced analytics","Remove Cheer ET branding"],
    proBtn:"Go Pro",currentPlan:"Start Free",
    feeNote:"All donations carry a 10% (Pro: 7%) platform fee. Chapa processing fees may apply.",
    faqLabel:"FAQ",faqTitle:"Common questions.",
    faqItems:[
      // ✅ CHANGED: answer reframed — creators first, streamers second
      {q:"What is Cheer ET?",a:"Cheer ET is Ethiopia's fan-support platform for creators of all kinds — TikTokers, YouTubers, podcasters, artists, musicians, and streamers. Your fans send you tips directly through your personal CheerET page."},
      {q:"How does payment work?",a:"We use Chapa — Ethiopia's leading payment gateway. Your fans pay via Telebirr, CBEBirr, Amhara Bank, Dashen Bank, Awash Bank and more. No international cards needed."},
      {q:"What is the platform fee?",a:"Cheer ET charges a 10% platform fee on all donations. Pro plan creators get a reduced 7% fee. Standard Chapa processing fees may also apply."},
      {q:"How do I start receiving tips?",a:"Sign up, set up your page in minutes, and share your CheerET link anywhere — your TikTok bio, Instagram, YouTube description, Telegram, or wherever your fans are."},
      {q:"Which platforms does Cheer ET support?",a:"You can share your CheerET link anywhere — TikTok, Instagram, YouTube, Telegram, Twitter and more. Streamers also get OBS, Streamlabs and browser-source overlay support."},
      // ✅ CHANGED: removed "platform focuses on streaming" — now all creators are equal
      {q:"I'm not a streamer. Can I use Cheer ET?",a:"Absolutely. Cheer ET is built for every type of creator. TikTokers, artists, podcasters, musicians — just share your tip link and your fans can support you instantly."},
      {q:"What is the Goal page?",a:"A live public page with an animated progress bar showing your tip goal. Share the link in your bio or on your posts to motivate fans to contribute."},
      {q:"When does Cheer ET launch?",a:"Cheer ET officially launches June 30, 2026. Join early access now to be among the first creators on the platform."},
    ],
    countLabel:"Launch · June 30, 2026",countTitle:"Ethiopia's creator economy launches soon.",
    days:"Days",hours:"Hours",minutes:"Min",
    joinEarly:"Join Early Access",contactUs:"Contact",
    releasedMsg:"🎉 Cheer ET is live! Sign up now.",
    testiLabel:"Community",testiTitle:"Creators love it.",
    ctaFinalTitle:"Your fans are ready.",ctaFinalSub:"Start earning from your audience today.",
    createPage:"Create Your Page",ctaTrust:"Free to start · 10% fee · Powered by Chapa · 🇪🇹",
    contactTitle:"Get in Touch",
    contactSub:"Have a question? Send us a message and we'll reply within 24 hours.",
    nameLabel:"Full Name",emailLabel:"Email Address",phoneLabel:"Phone (optional)",
    msgLabel:"Message",sendBtn:"Send Message",sending:"Sending...",sent:"Message Sent ✓",
    contactBack:"Back",
    // ✅ CHANGED: removed "gamers" from footer description
    footDesc:"Ethiopia's fan-support platform for every type of creator.",
    footProduct:"Product",footCompany:"Company",footLegal:"Legal",
    footCopy:"© 2026 Cheer ET. All rights reserved.",
    footBuilt:"Built by Kayon Tech 🇪🇹 · Powered by Chapa",
    productLinks:["Features","Creator Pages","Analytics","Overlays & Widgets","Pricing"],
    companyLinks:["About","Blog","Careers","Press","Contact"],
    legalLinks:["Privacy","Terms","Cookies"],
    todayBalance:"Today's balance",viaChapa:"via Chapa",liveNow:"Live",
    newCheer:"New Tip!",ttsOn:"TTS ON",liveFeed:"Live feed",topSupporter:"Top Supporter",
    offlineMsg:"No internet connection. Please check your network.",
    notifAsk:"Get notified when your fans tip you.",notifBtn:"Enable Notifications",notifDeny:"Maybe later",
  },
  am: {
    navFeatures:"ባህሪያት",navCreators:"ፈጣሪዎች",navPricing:"ዋጋ",navContact:"ያግኙን",
    login:"ግባ",getStarted:"ጀምር",
    // ✅ CHANGED: removed "ስትሪሜ" from badge
    heroBadge:"የኢትዮጵያ ፈጣሪዎች መድረክ",
    heroTitle:"ታዳሚዎ.\nገቢዎ.",
    // ✅ CHANGED: TikTokers listed first in Amharic too
    heroSub:"Cheer ET ኢትዮጵያዊ ቲክቶከሮች፣ ዩቱበሮች፣ ፖድካስተሮች፣ አርቲስቶች እና ስትሪመሮች የደጋፊ ድጋፍ በሰከንዶች ውስጥ እንዲያገኙ ያደርጋል — በቻፓ ይሰራል።",
    ctaStart:"ነጻ ጀምር",ctaWatch:"እንዴት እንደሚሰራ ይመልከቱ",
    heroTrust:"ምንም ማቋቋሚያ ክፍያ · 10% የመድረክ ክፍያ · ነጻ ጀምር",
    chapaLabel:"የክፍያ አጋር",chapaTitle:"በቻፓ ይሰራል",
    chapaSub:"ገንዘቡ ከደጋፊዎችዎ ቦርሳ ወደ ቦርሳዎ ወዲያው ይፈስሳል — ቴሌብር፣ CBEBirr እና ሁሉም ዋና ባንኮች።",
    howLabel:"እንዴት ይሰራል",howTitle:"ሦስት ደረጃዎች ብቻ።",
    s1:"ደጋፊ ቲፕ ይልካል",s1d:"ማንኛውም መጠን፣ በቴሌብር፣ CBEBirr ወይም ሌላ ባንክ።",
    // ✅ CHANGED: removed OBS/overlay language in Amharic
    s2:"ወደ ገጽዎ ይደርሳሉ",s2d:"ደጋፊዎችዎ CheerET ሊንክዎን ይከፍቱና ቲፕ ይልካሉ — ከ TikTok፣ Instagram ወይም የትም ቢሆን።",
    s3:"ገንዘቡ ወዲያው ይደርሳል",s3d:"ETB ወዲያው ወደ ቦርሳዎ ይደርሳል። 10% ክፍያ ይፈጸማል። ማንኛውም ጊዜ ያውጡ።",
    creatorsLabel:"ምርጥ ፈጣሪዎች",creatorsTitle:"ለሁሉም ፈጣሪ ተሰርቷል።",
    // ✅ CHANGED: removed streaming focus in Amharic
    creatorsNote:"ከቲክቶከሮች እስከ አርቲስቶች፣ ከዩቱበሮች እስከ ፖድካስተሮች — Cheer ET ለሁሉም ኢትዮጵያዊ ፈጣሪ ይሰራል።",
    support:"ደግፍ",totalRaised:"ጠቅላላ",
    // ✅ CHANGED: removed "go live" in Amharic
    galleryLabel:"የፈጣሪ ቅጽበቶች",galleryTitle:"ፈጣሪዎች ሲሰሩ ይመልከቱ።",
    gallerySub:"ከኢትዮጵያ ፈጣሪዎች የ Cheer ET ቅጽበቶች።",
    donate:"አሁን ቲፕ ስጥ",
    // ✅ CHANGED: Amharic platforms section — link sharing, not streaming software
    platformsLabel:"በሁሉም ቦታ አጋሩ",platformsTitle:"ከሁሉም ዋና መድረኮች ጋር ይሰራል።",
    platformsSub:"CheerET ሊንክዎን በ TikTok፣ Instagram፣ YouTube፣ Telegram እና ደጋፊዎችዎ ባሉበት ሁሉ ያጋሩ። ቲፖቹ ከሁሉም ቦታ ይመጣሉ።",
    // ✅ CHANGED: Amharic overlay section reframed as tip page
    overlayLabel:"የቲፕ ገጽዎ",overlayTitle:"ቆንጆ ገጽ። አንድ ሊንክ።",
    overlaySub:"CheerET ገጽዎ ከተመዘገቡ ወዲያው ዝግጁ ነው። ፎቶዎን፣ ቀለምዎን እና መልዕክትዎን ያስተካክሉ። ስትሪመሮችም ሙሉ overlay ድጋፍ ያገኛሉ።",
    overlayFeats:["ብጁ የቲፕ ገጽ","ልገሳ ማስጠንቀቂያ (ለስትሪመሮች)","ግብ ፕሮግሬስ ባር","ቀጥታ ቻት ኦቨርሌይ","ቆጠራ ዊጅት","ለጋሽ ሊደርቦርድ","TTS ማስጠንቀቂያ ዊጅት","አማርኛ ድጋፍ"],
    // ✅ CHANGED: note leads with all creators, streamers as bonus
    overlayNote:"ሁሉም ፈጣሪዎች ሊጋሩ የሚችሉ የቲፕ ገጽ ያገኛሉ። ስትሪመሮችም ለ OBS እና Streamlabs overlay URL ያገኛሉ።",
    featLabel:"ባህሪያት",featTitle:"ለየት ያለ ተሰርቷል።",
    featItems:[
      {icon:"bi-lightning-charge-fill",title:"ቀጥተኛ ክፍያ",desc:"ደጋፊዎቹ ወዲያው ይቲፑዎታል — ምንም መጠበቅ የለም።"},
      {icon:"bi-volume-up-fill",title:"ጽሑፍ-ወደ-ንግግር",desc:"የደጋፊ መልዕክቶች ቀጥታ ሲደርሱ ይነበባሉ።"},
      {icon:"bi-graph-up-arrow",title:"ትንታኔ",desc:"ገቢ፣ ለጋሾች እና እድገት ቆንጆ ዳሽቦርድ።"},
      {icon:"bi-phone-fill",title:"ሞባይል ዝግጁ",desc:"ሁሉን ከስልክዎ ያስተዳድሩ።"},
      {icon:"bi-shield-check-fill",title:"በቻፓ ደህንነቱ ተጠብቋል",desc:"ሁሉም ክፍያዎች በቻፓ ስርዓት ይፈስሳሉ።"},
      {icon:"bi-translate",title:"አማርኛ ድጋፍ",desc:"ሙሉ አማርኛ ቋንቋ ለእርስዎ እና ለደጋፊዎችዎ።"},
      {icon:"bi-flag-fill",title:"ግብ ገጽ",desc:"የቲፕ ግብ ያዘጋጁ ደጋፊዎምዎ ሲሞላ ይከታተሉ።"},
      // ✅ CHANGED: Amharic fan leaderboard
      {icon:"bi-people-fill",title:"የደጋፊ ሊደርቦርድ",desc:"ምርጥ ደጋፊዎን ለሁሉ ያሳዩ።"},
    ],
    pricingLabel:"ዋጋ",pricingTitle:"ቀላል፣ ግልጽ ዋጋ።",
    pricingSub:"አንድ የተስተካከለ ክፍያ። ምስጢራዊ ወጪዎች የሉም። ነጻ ይጀምሩ።",
    freeTitle:"ነጻ",freePer:"ለዘለዓለም",
    freeFeats:["የቲፕ ገጽ","ልገሳ ማስጠንቀቂያዎች","ቻፓ ክፍያዎች","መሰረታዊ ትንታኔ","10% ክፍያ"],
    proTitle:"ፕሮ",proPer:"/ ወር",proPrice:"ETB 199",
    proFeats:["ሁሉ ነጻ ውስጥ ያለ","ብጁ ኦቨርሌይ","ግብ ገጽ","የደጋፊ ሊደርቦርድ","ቅድሚያ ድጋፍ","ዝቅተኛ 7% ክፍያ","የላቀ ትንታኔ","Cheer ET ምልክት ያስወግዱ"],
    proBtn:"ፕሮ ጀምር",currentPlan:"ነጻ ጀምር",
    feeNote:"ሁሉም ልገሳዎች 10% (ፕሮ: 7%) ክፍያ ይሸከማሉ። ቻፓ ማካሄጃ ክፍያዎች ሊፈጸሙ ይችላሉ።",
    faqLabel:"ጥያቄዎች",faqTitle:"የተለመዱ ጥያቄዎች።",
    faqItems:[
      // ✅ CHANGED: Amharic FAQ — creators first
      {q:"Cheer ET ምንድን ነው?",a:"Cheer ET ለሁሉም ኢትዮጵያዊ ፈጣሪዎች — ቲክቶከሮች፣ ዩቱበሮች፣ ፖድካስተሮች፣ አርቲስቶች፣ ሙዚቀኞች እና ስትሪመሮች — የደጋፊ ድጋፍ መድረክ ነው።"},
      {q:"ክፍያ እንዴት ይሰራል?",a:"ቻፓ — የኢትዮጵያ ቀዳሚ የክፍያ መድረክ እንጠቀማለን። ቴሌብር፣ CBEBirr፣ አምሐራ ባንክ፣ ዳሽን ባንክ፣ አዋሽ ባንክ ይደገፋሉ።"},
      {q:"የመድረክ ክፍያ ምን ያህል ነው?",a:"Cheer ET 10% ክፍያ ያስከፍላል። ፕሮ ፈጣሪዎች 7% ዝቅተኛ ክፍያ ያገኛሉ።"},
      // ✅ CHANGED: Amharic FAQ — generic for all creators
      {q:"ቲፕ መቀበል እንዴት እጀምራለሁ?",a:"ተመዝግቡ፣ ገጽዎን ያዘጋጁ፣ ሊንክዎን ወዲያው በ TikTok bio፣ Instagram፣ YouTube ወይም ደጋፊዎምዎ ባሉበት ሁሉ ያጋሩ።"},
      {q:"Cheer ET ከምን መድረኮች ጋር ይሰራል?",a:"CheerET ሊንክዎን በ TikTok፣ Instagram፣ YouTube፣ Telegram እና ሁሉም ቦታ ማጋራት ይችላሉ። ስትሪመሮችም OBS እና Streamlabs overlay ድጋፍ ያገኛሉ።"},
      // ✅ CHANGED: Amharic FAQ — non-streamers welcome
      {q:"ስትሪሜ ካላደርኩ Cheer ET መጠቀም እችላለሁ?",a:"አዎ። Cheer ET ለሁሉም ፈጣሪ ነው። ቲክቶከሮች፣ አርቲስቶች፣ ፖድካስተሮች፣ ሙዚቀኞች — ሊንክዎን ያጋሩ ደጋፊዎምዎ ወዲያው ይደግፉዎታል።"},
      {q:"ግብ ገጽ ምንድን ነው?",a:"ደጋፊዎምዎ ሊያዩት የሚችሉ ቀጥታ የቲፕ ግብ አኒሜሽን ፕሮግሬስ ባር ያለው ህዝባዊ ገጽ ነው። በ bio ወይም ፖስቶችዎ ያጋሩ።"},
      {q:"Cheer ET መቼ ይጀምራል?",a:"Cheer ET በኦፊሴላዊነት ሰኔ 30 ቀን 2026 ይጀምራል። ቀደም ብሎ ይቀላቀሉ።"},
    ],
    countLabel:"ጅምር · ሰኔ 30፣ 2026",countTitle:"የኢትዮጵያ ፈጣሪ ኢኮኖሚ ብዙም ሳይቆይ ይጀምራል።",
    days:"ቀናት",hours:"ሰዓታት",minutes:"ደቂቃ",
    joinEarly:"ቀደም ብሎ ተቀላቀሉ",contactUs:"ያግኙን",
    releasedMsg:"🎉 Cheer ET ጀምሯል! አሁን ይመዝገቡ።",
    testiLabel:"ማህበረሰብ",testiTitle:"ፈጣሪዎች ይወዳሉ።",
    ctaFinalTitle:"ደጋፊዎችዎ ዝግጁ ናቸው።",ctaFinalSub:"ዛሬ ከታዳሚዎችዎ ማግኘት ይጀምሩ።",
    createPage:"ገጽዎን ይፍጠሩ",ctaTrust:"ነጻ ጀምር · 10% ክፍያ · በቻፓ · 🇪🇹",
    contactTitle:"ያግኙን",
    contactSub:"ጥያቄ አለዎ? መልዕክት ይላኩ። በ24 ሰዓት ውስጥ እንመልሳለን።",
    nameLabel:"ሙሉ ስም",emailLabel:"ኢሜይል",phoneLabel:"ስልክ (አማራጭ)",
    msgLabel:"መልዕክት",sendBtn:"ይላኩ",sending:"እየተላከ...",sent:"ተልኳል ✓",
    contactBack:"ተመለስ",
    // ✅ CHANGED: removed "ጨዋቾች" (gamers) from Amharic footer
    footDesc:"ለሁሉም ኢትዮጵያዊ ፈጣሪ የደጋፊ-ድጋፍ መድረክ።",
    footProduct:"ምርት",footCompany:"ኩባንያ",footLegal:"ህጋዊ",
    footCopy:"© 2026 Cheer ET. መብቶቹ ሁሉ የተጠበቁ ናቸው።",
    footBuilt:"በ Kayon Tech 🇪🇹 · በቻፓ",
    productLinks:["ባህሪያት","የፈጣሪ ገጾች","ትንታኔ","ኦቨርሌይ እና ዊጅቶች","ዋጋ"],
    companyLinks:["ስለ እኛ","ብሎግ","ቅጥር","ፕሬስ","ያግኙን"],
    legalLinks:["ግላዊነት","ውሎች","ኩኪዎች"],
    todayBalance:"የዛሬ ቀሪ ሂሳብ",viaChapa:"በቻፓ",liveNow:"ቀጥታ",
    newCheer:"አዲስ ቲፕ!",ttsOn:"TTS ክፍት",liveFeed:"ቀጥታ",topSupporter:"ምርጥ ደጋፊ",
    offlineMsg:"ኢንተርኔት ግንኙነት የለም። ያረጋግጡ።",
    notifAsk:"ደጋፊዎምዎ ሲቲፑዎ ይወቁ።",notifBtn:"ማሳወቂያ አንቃ",notifDeny:"ቆየት ብሎ",
  }
};

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */
const CREATORS = [
  // ✅ CHANGED: creator types updated — Streamer is just one of them, not the main
  {name:"AbelGaming",nameAm:"አቤልጌሚንግ",type:"Streamer & Gamer",typeAm:"ስትሪሜ እና ጨዋች",raised:"ETB 12,450",color:"#2979FF",img:"https://i.pravatar.cc/150?img=11"},
  {name:"HabtamuTube",nameAm:"ሀብታሙ ቲዩብ",type:"YouTuber & Podcaster",typeAm:"ዩቱበር እና ፖድካስተር",raised:"ETB 31,000",color:"#0EA5E9",img:"https://i.pravatar.cc/150?img=32"},
  // ✅ CHANGED: third creator is TikToker & Artist — most visible non-streamer
  {name:"MesaretArt",nameAm:"መሰረት አርት",type:"TikToker & Artist",typeAm:"ቲክቶከር እና አርቲስት",raised:"ETB 9,150",color:"#6366F1",img:"https://i.pravatar.cc/150?img=47"},
];

const TESTIMONIALS = [
  // ✅ CHANGED: first testimonial rewritten to be creator-generic, not streamer-specific
  {en:"Finally a tipping platform built for Ethiopian creators. My TikTok fans use it every day.",am:"በመጨረሻ ለኢትዮጵያዊ ፈጣሪዎች የተሰራ የቲፕ መድረክ። የ TikTok ደጋፊዎቼ ሁሌ ይጠቀሙታል።",name:"Yonas T.",handle:"@yonastv"},
  {en:"Chapa integration is seamless. ETB hits my account instantly.",am:"ቻፓ ሲምለስ ነው። ETB ወዲያው ሂሳቤ ላይ ይወድቃሉ።",name:"Abel M.",handle:"@abelgame"},
  {en:"Finally a platform for African creators. Complete game changer.",am:"በመጨረሻ ለአፍሪካ ፈጣሪዎች። ሁሉ ነገር ተለወጠ።",name:"Selam K.",handle:"@selamdraws"},
  // ✅ CHANGED: testimonial reframed to not be streaming-specific
  {en:"I just share my link in my bio and tips come in automatically. It's that simple.",am:"ሊንኬን ቢዮ ላይ ለጠፍኩ ቲፑ ወዲያው ይመጣል። እርግጥ ቀላል ነው።",name:"Hiwot G.",handle:"@hiwotmusic"},
  {en:"Telebirr support is a real game changer for Ethiopian creators.",am:"ቴሌብር ለኢትዮጵያ ፈጣሪዎች ጨዋታ ቀያሪ ነው።",name:"Dawit B.",handle:"@dawittv"},
  {en:"Best analytics dashboard I've seen on any creator platform.",am:"ካየሁት ምርጥ ዳሽቦርድ።",name:"Mekdes A.",handle:"@mekdesart"},
];

const GALLERY = [
  {id:"dQw4w9WgXcQ",title:"AbelGaming hits 10k",titleAm:"አቤል 10 ሺ ደረሰ",creator:"@abelgaming",views:"14K views",dur:"0:18"},
  {id:"jNQXAC9IVRw",title:"First donation moment",titleAm:"የመጀመሪያ ቲፕ",creator:"@hiwotmusic",views:"8K views",dur:"0:15"},
  {id:"9bZkp7q19f0",title:"Biggest supporter night",titleAm:"ትልቁ የደጋፊ ምሽት",creator:"@yonastv",views:"22K views",dur:"0:20"},
];

// ✅ CHANGED: Platforms now show TikTok and Instagram first (creator-first order)
const PLATFORMS = [
  {icon:"bi-tiktok",name:"TikTok"},
  {icon:"bi-instagram",name:"Instagram"},
  {icon:"bi-play-fill",name:"YouTube"},
  {icon:"bi-telegram",name:"Telegram"},
  {icon:"bi-twitter-x",name:"Twitter / X"},
  {icon:"bi-camera-video-fill",name:"OBS Studio"},
  {icon:"bi-broadcast",name:"Streamlabs"},
  {icon:"bi-collection-play-fill",name:"Kick"},
];

const PAY_NODES = [
  {label:"Telebirr",x:50,y:5},
  {label:"CBEBirr",x:87,y:25},
  {label:"Awash",x:95,y:58},
  {label:"Dashen",x:72,y:88},
  {label:"Zemen",x:38,y:95},
  {label:"PayPal",x:8,y:72},
  {label:"Amhara",x:5,y:38},
  {label:"Nib Int.",x:20,y:14},
];

/* ══════════════════════════════════════════════
   THEMES
══════════════════════════════════════════════ */
const DARK = {
  bg:"#07090F",bg2:"#0B0F1A",
  surface:"rgba(255,255,255,0.05)",surfaceHover:"rgba(255,255,255,0.08)",
  border:"rgba(255,255,255,0.09)",borderHover:"rgba(41,121,255,0.5)",
  text:"#EDF2FF",muted:"rgba(237,242,255,0.58)",faint:"rgba(237,242,255,0.32)",
  accent:"#2979FF",accentDim:"rgba(41,121,255,0.15)",
  navBg:"rgba(7,9,15,0.88)",scrollFade:"#07090F",
  inputBg:"rgba(255,255,255,0.06)",cardBg:"rgba(255,255,255,0.04)",
  heroGlow:"rgba(41,121,255,0.2)",
};
const LIGHT = {
  bg:"#F8FAFF",bg2:"#EEF4FF",
  surface:"rgba(255,255,255,0.92)",surfaceHover:"rgba(255,255,255,1)",
  border:"rgba(0,0,0,0.07)",borderHover:"rgba(41,121,255,0.35)",
  text:"#0B1630",muted:"rgba(11,22,48,0.6)",faint:"rgba(11,22,48,0.38)",
  accent:"#1A5FCC",accentDim:"rgba(26,95,204,0.09)",
  navBg:"rgba(248,250,255,0.9)",scrollFade:"#F8FAFF",
  inputBg:"rgba(0,70,200,0.05)",cardBg:"rgba(0,70,200,0.03)",
  heroGlow:"rgba(41,121,255,0.09)",
};

/* ══════════════════════════════════════════════
   CSS FACTORY
══════════════════════════════════════════════ */
const makeCSS = (dark) => {
  const t = dark ? DARK : LIGHT;
  return `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;font-size:16px}
body{background:${t.bg};color:${t.text};font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased;line-height:1.5;transition:background .3s,color .3s}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:${t.bg}}
::-webkit-scrollbar-thumb{background:${t.accent}55;border-radius:4px;transition:background .2s}
::-webkit-scrollbar-thumb:hover{background:${t.accent}99}

.logo{font-family:-apple-system,'Plus Jakarta Sans','Helvetica Neue',sans-serif;font-weight:800;font-size:1.3rem;letter-spacing:-0.04em;background:linear-gradient(135deg,${dark?"#8BB8FF":"#0D47A1"} 0%,${t.accent} 55%,${dark?"#60D8FF":"#1565C0"} 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;cursor:pointer}
.logo sup{font-size:.52em;font-weight:700;letter-spacing:.12em;vertical-align:super}

.hero-title{font-family:-apple-system,'Plus Jakarta Sans','Helvetica Neue',sans-serif;font-size:clamp(3.2rem,7.5vw,6.5rem);font-weight:800;line-height:1.04;letter-spacing:-0.04em;white-space:pre-line}
.section-h{font-size:clamp(1.7rem,4vw,2.6rem);font-weight:700;letter-spacing:-0.025em;line-height:1.2}
.lbl{font-size:.7rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${t.accent};display:block;margin-bottom:10px}

.btn-p{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:${t.accent};color:#fff;border:none;border-radius:980px;padding:12px 26px;font-size:.93rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .22s cubic-bezier(.4,0,.2,1);box-shadow:0 2px 14px ${t.accent}44;text-decoration:none;white-space:nowrap}
.btn-p:hover{filter:brightness(1.12);box-shadow:0 4px 24px ${t.accent}66;transform:translateY(-1px)}
.btn-p:active{transform:translateY(0)}
.btn-g{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:${t.inputBg};color:${t.text};border:1px solid ${t.border};border-radius:980px;padding:12px 24px;font-size:.93rem;font-weight:500;cursor:pointer;font-family:inherit;transition:all .22s cubic-bezier(.4,0,.2,1);backdrop-filter:blur(10px);white-space:nowrap;text-decoration:none}
.btn-g:hover{background:${t.accentDim};border-color:${t.borderHover};transform:translateY(-1px)}

.card{background:${t.surface};border:1px solid ${t.border};border-radius:18px;overflow:hidden;backdrop-filter:blur(20px);transition:border-color .25s,background .25s,transform .25s,box-shadow .25s}
.card:hover{border-color:${t.borderHover};background:${t.surfaceHover}}

.navlink{color:${t.muted};text-decoration:none;font-size:.9rem;font-weight:500;transition:color .18s;cursor:pointer;white-space:nowrap}
.navlink:hover{color:${t.text}}

.rev{opacity:0;transform:translateY(22px);transition:opacity .65s cubic-bezier(.4,0,.2,1),transform .65s cubic-bezier(.4,0,.2,1)}
.rev.on{opacity:1;transform:translateY(0)}
.rev.d1{transition-delay:.08s}.rev.d2{transition-delay:.16s}.rev.d3{transition-delay:.24s}

@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes float2{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(10px) rotate(1.5deg)}}
@keyframes slideUp{from{opacity:0;transform:translateY(36px)}to{opacity:1;transform:translateY(0)}}
@keyframes don-pop{0%{opacity:0;transform:translateY(14px) scale(.92)}10%{opacity:1;transform:translateY(0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translateY(-6px)}}
@keyframes scrollL{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes wave{0%,100%{height:4px}50%{height:18px}}
@keyframes orbPulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
@keyframes gradX{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes alertSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.hero-bg-glow{position:absolute;pointer-events:none;border-radius:50%;filter:blur(72px);animation:orbPulse 9s ease-in-out infinite}

.wbar{width:3px;border-radius:3px;background:${t.accent};align-self:center}

.overlay-box{background:${dark?"rgba(8,10,20,0.88)":"rgba(10,15,40,0.82)"};border:1.5px solid ${t.accent}44;border-radius:14px;padding:14px 16px;font-size:.82rem;color:#fff;overflow:hidden}
.overlay-alert{display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,${t.accent}cc,${dark?"#40D0FF":"#1A88FF"}88);border-radius:10px;padding:10px 14px;margin-bottom:9px;animation:alertSlide .4s ease forwards}

.platform-chip{display:inline-flex;align-items:center;gap:8px;background:${t.cardBg};border:1px solid ${t.border};border-radius:12px;padding:10px 18px;font-size:.88rem;font-weight:500;transition:all .22s;color:${t.text};white-space:nowrap}
.platform-chip:hover{border-color:${t.borderHover};background:${t.accentDim};transform:translateY(-2px)}

.creator-wrap{background:${t.surface};border:1px solid ${t.border};border-radius:22px;overflow:hidden;transition:all .3s cubic-bezier(.34,1.56,.64,1)}
.creator-wrap:hover{border-color:${t.borderHover};transform:translateY(-6px);box-shadow:0 16px 48px ${t.accent}1A}

.faq-item{border-bottom:1px solid ${t.border};overflow:hidden}
.faq-q{display:flex;justify-content:space-between;align-items:center;padding:18px 0;cursor:pointer;gap:12px;font-weight:600;font-size:.97rem;user-select:none}
.faq-a{font-size:.9rem;color:${t.muted};line-height:1.72;padding-bottom:18px;padding-right:32px}

.pricing-card{background:${t.surface};border:1px solid ${t.border};border-radius:22px;padding:32px 26px;transition:all .28s ease}
.pricing-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px ${t.accent}18}
.pricing-pro{border-color:${t.accent}55;background:${dark?"rgba(41,121,255,0.08)":"rgba(26,95,204,0.06)"}}

.cd-box{background:${t.surface};border:1px solid ${t.border};border-radius:18px;padding:26px 32px;text-align:center;transition:all .28s ease}
.cd-box:hover{border-color:${t.borderHover};transform:translateY(-3px)}
.cd-num{font-size:clamp(2.4rem,5vw,3.8rem);font-weight:800;color:${t.accent};letter-spacing:-0.03em;line-height:1}

.testi-track{display:flex;gap:16px;animation:scrollL 36s linear infinite;width:max-content}
.testi-track:hover{animation-play-state:paused}

.mob-menu{position:fixed;top:56px;left:0;right:0;bottom:0;background:${dark?"rgba(7,9,15,.97)":"rgba(248,250,255,.97)"};backdrop-filter:blur(32px);z-index:990;padding:20px;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.mob-menu.open{transform:translateX(0)}
.mob-link{padding:16px 12px;font-size:1.05rem;font-weight:500;color:${t.text};border-bottom:1px solid ${t.border};cursor:pointer;display:flex;align-items:center;gap:12px;transition:color .18s}
.mob-link:hover{color:${t.accent}}

.offline-bar{position:fixed;bottom:0;left:0;right:0;z-index:3000;background:${dark?"#1a0e00":"#FFF3E0"};color:${dark?"#FFCC88":"#7A3800"};border-top:2px solid #FF8C0044;padding:12px 24px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:.88rem;font-weight:500;transform:translateY(100%);transition:transform .3s ease}
.offline-bar.show{transform:translateY(0)}

.notif-box{position:fixed;bottom:24px;right:24px;z-index:2500;background:${t.surface};border:1px solid ${t.border};border-radius:18px;padding:18px;max-width:300px;width:calc(100vw - 48px);backdrop-filter:blur(24px);box-shadow:0 8px 40px rgba(0,0,0,.22);animation:fadeIn .35s ease}

.contact-overlay{position:fixed;inset:0;z-index:2000;background:${dark?"rgba(7,9,15,.97)":"rgba(248,250,255,.97)"};backdrop-filter:blur(32px);display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .25s ease}
.contact-box{background:${t.surface};border:1px solid ${t.border};border-radius:24px;padding:40px;max-width:520px;width:100%}
.form-inp{width:100%;background:${t.inputBg};border:1px solid ${t.border};border-radius:12px;padding:13px 16px;font-size:.93rem;font-family:inherit;color:${t.text};outline:none;transition:border-color .2s}
.form-inp:focus{border-color:${t.accent}}
.form-inp::placeholder{color:${t.faint}}
textarea.form-inp{resize:vertical;min-height:110px}

.gal-side-item{flex:0 0 22%;border-radius:12px;overflow:hidden;opacity:.5;transition:opacity .3s;cursor:pointer}
.gal-side-item:hover{opacity:.75}
.gal-main-item{flex:0 0 52%;border-radius:16px;overflow:hidden;position:relative}

.release-banner{background:${t.accentDim};border:1px solid ${t.accent}44;border-radius:14px;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:24px}

.container{max-width:1100px;margin:0 auto;padding:0 24px}
section{padding:80px 0}

@media(max-width:900px){
  section{padding:56px 0}
  .hide-mob{display:none!important}
  .show-mob{display:block!important}
  .hero-flex{flex-direction:column!important;gap:28px!important}
  .steps-grid{grid-template-columns:1fr!important}
  .footer-grid{grid-template-columns:1fr 1fr!important}
  .pricing-grid{grid-template-columns:1fr!important;max-width:380px!important;margin-left:auto!important;margin-right:auto!important}
  .feats-grid{grid-template-columns:repeat(2,1fr)!important}
  .gallery-desktop-wrap{display:none!important}
  .gallery-mobile-wrap{display:block!important}
}
@media(min-width:901px){
  .show-mob{display:none!important}
  .gallery-desktop-wrap{display:block!important}
  .gallery-mobile-wrap{display:none!important}
}
@media(max-width:600px){
  .footer-grid{grid-template-columns:1fr!important}
  .creators-grid{grid-template-columns:1fr!important;max-width:280px!important;margin-left:auto!important;margin-right:auto!important}
  .feats-grid{grid-template-columns:repeat(2,1fr)!important}
  .cd-row{gap:10px!important}
  .cta-row{flex-direction:column!important}
  .cta-row>*{width:100%!important;text-align:center!important;justify-content:center!important}
  .contact-box{padding:24px!important}
  .hero-title{font-size:clamp(2.6rem,10vw,3.8rem)!important}
}
`;
};

/* ══════════════════════════════════════════════
   PAYMENT DIAGRAM
══════════════════════════════════════════════ */
function PayDiagram({ dark }) {
  const cvRef = useRef(null);
  const anRef = useRef(null);
  const pts = useRef(
    PAY_NODES.map((_, i) => ({
      ni: i,
      prog: Math.random(),
      dir: Math.random() > 0.5 ? 1 : -1,
      spd: 0.0022 + Math.random() * 0.002,
    }))
  );

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const resize = () => {
      const sz = Math.min(cv.parentElement.clientWidth, 480);
      cv.width = sz;
      cv.height = sz;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const nodes = PAY_NODES.map(n => ({ x: (n.x / 100) * W, y: (n.y / 100) * H, label: n.label }));

      nodes.forEach(nd => {
        const g = ctx.createLinearGradient(nd.x, nd.y, cx, cy);
        g.addColorStop(0, dark ? "rgba(41,121,255,0.1)" : "rgba(26,95,204,0.08)");
        g.addColorStop(1, dark ? "rgba(41,121,255,0.4)" : "rgba(26,95,204,0.35)");
        ctx.beginPath();
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 9]);
        ctx.lineDashOffset = -(Date.now() / 38) % 14;
        ctx.moveTo(nd.x, nd.y);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      pts.current.forEach(p => {
        p.prog += p.spd;
        if (p.prog > 1) p.prog = 0;
        const nd = nodes[p.ni];
        const tp = p.dir === 1 ? p.prog : 1 - p.prog;
        const px = nd.x + (cx - nd.x) * tp;
        const py = nd.y + (cy - nd.y) * tp;
        const dg = ctx.createRadialGradient(px, py, 0, px, py, 5);
        dg.addColorStop(0, dark ? "rgba(100,180,255,0.9)" : "rgba(41,121,255,0.9)");
        dg.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.fillStyle = dg;
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      nodes.forEach(nd => {
        ctx.beginPath();
        ctx.fillStyle = dark ? "rgba(41,121,255,0.07)" : "rgba(26,95,204,0.05)";
        ctx.arc(nd.x, nd.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = dark ? "rgba(15,18,28,0.96)" : "rgba(248,250,255,0.96)";
        ctx.strokeStyle = dark ? "rgba(41,121,255,0.35)" : "rgba(26,95,204,0.25)";
        ctx.lineWidth = 1.5;
        ctx.arc(nd.x, nd.y, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = dark ? "rgba(237,242,255,0.85)" : "rgba(11,22,48,0.85)";
        ctx.font = "bold 8.5px Plus Jakarta Sans,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(nd.label, nd.x, nd.y);
      });

      const pulse = (Date.now() % 2200) / 2200;
      ctx.beginPath();
      ctx.strokeStyle = dark
        ? `rgba(41,121,255,${0.5 * (1 - pulse)})`
        : `rgba(26,95,204,${0.35 * (1 - pulse)})`;
      ctx.lineWidth = 2;
      ctx.arc(cx, cy, 44 + pulse * 28, 0, Math.PI * 2);
      ctx.stroke();

      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
      cg.addColorStop(0, dark ? "#2979FF" : "#1A5FCC");
      cg.addColorStop(1, dark ? "#1A4FCC" : "#0D47A1");
      ctx.beginPath();
      ctx.fillStyle = cg;
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Plus Jakarta Sans,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Chapa", cx, cy);

      anRef.current = requestAnimationFrame(draw);
    };

    anRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(anRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [dark]);

  return <canvas ref={cvRef} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} />;
}

/* ══════════════════════════════════════════════
   OVERLAY PREVIEW
══════════════════════════════════════════════ */
function OverlayPreview({ lang, accent }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 3500);
    return () => clearInterval(i);
  }, []);
  const pool = [
    { name: "Tigist A.", amt: "ETB 500", msg: lang === "am" ? "ቀጥሉ! " : "Keep going! " },
    { name: "Biruk M.", amt: "ETB 2,000", msg: lang === "am" ? "ጎት! " : "GOAT! " },
    { name: "Samuel B.", amt: "ETB 750", msg: lang === "am" ? "ምርጥ!" : "Best content!" },
  ];
  const d = pool[tick % pool.length];
  return (
    <div className="overlay-box">
      <div style={{ fontSize: ".64rem", color: "rgba(255,255,255,.4)", marginBottom: 8, letterSpacing: 1.2, textTransform: "uppercase" }}>
        LIVE TIP PAGE PREVIEW
      </div>
      <div key={tick} className="overlay-alert">
        <i className="bi bi-lightning-charge-fill" style={{ color: "#fff", fontSize: "1rem", flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: ".88rem" }}>{d.name} — {d.amt}</div>
          <div style={{ fontSize: ".76rem", opacity: .85 }}>{d.msg}</div>
        </div>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,.1)", borderRadius: 8, overflow: "hidden", marginBottom: 7 }}>
        <div style={{ height: "100%", width: "68%", background: `linear-gradient(90deg,${accent},#40D0FF)`, borderRadius: 8 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", color: "rgba(255,255,255,.4)" }}>
        <span>{lang === "am" ? "ግብ 68%" : "Goal 68%"}</span>
        <span>ETB 3,400 / 5,000</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function CheerETHome() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobOpen, setMobOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [launched, setLaunched] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [liveDon, setLiveDon] = useState(null);
  const [balance, setBalance] = useState(12450);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [notif, setNotif] = useState(false);
  const [contact, setContact] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", msg: "" });
  const [formState, setFormState] = useState("idle");
  const [galIdx, setGalIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const revRefs = useRef([]);
  const s = STR[lang];
  const th = dark ? DARK : LIGHT;

  // SEO
  useEffect(() => {
    document.title = "Cheer ET — Ethiopia's Creator Platform";
    const sm = (n, c) => { let m = document.querySelector(`meta[name="${n}"]`); if (!m) { m = document.createElement("meta"); m.name = n; document.head.appendChild(m); } m.content = c; };
    const og = (p, c) => { let m = document.querySelector(`meta[property="${p}"]`); if (!m) { m = document.createElement("meta"); m.setAttribute("property", p); document.head.appendChild(m); } m.content = c; };
    // ✅ CHANGED: SEO description — TikTokers first, streamers not highlighted
    sm("description", "Cheer ET is Ethiopia's fan-support platform for TikTokers, YouTubers, podcasters, artists and streamers. Receive tips via Telebirr, CBEBirr and Chapa. Share one link, get paid instantly.");
    sm("keywords", "Cheer ET, Ethiopian creator platform, Chapa donations, Telebirr creator, TikTok creator Ethiopia, YouTuber Ethiopia, fan tips Ethiopia");
    og("og:title", "Cheer ET — Ethiopia's Creator Platform");
    og("og:description", "Receive fan tips in seconds. Powered by Chapa. Works with TikTok, Instagram, YouTube, OBS and more.");
    og("og:type", "website");
    sm("twitter:card", "summary_large_image");
    sm("twitter:title", "Cheer ET");
  }, []);

  // Auth redirect
  useEffect(() => {
    const tok = localStorage.getItem("cheeret_token") || sessionStorage.getItem("cheeret_token");
    if (tok) navigate("/dashboard", { replace: true });
  }, []);

  // Countdown to June 30 2026
  useEffect(() => {
    const target = new Date("2026-07-20T00:00:00").getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLaunched(true);
        const launchTime = target;
        const twoWeeks = 14 * 24 * 60 * 60 * 1000;
        if (Date.now() - launchTime < twoWeeks) setShowRelease(true);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  // Scroll
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 44);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Offline
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Notification prompt after 5s
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      const t = setTimeout(() => setNotif(true), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  // Live donations
  useEffect(() => {
    const pool = [
      { name: "Tigist A.", amount: "ETB 500", msg: lang === "am" ? "ቀጥሉ! 🔥" : "Keep it up! 🔥" },
      { name: "Samuel B.", amount: "ETB 1,000", msg: lang === "am" ? "ምርጥ!" : "Love your content!" },
      { name: "Biruk M.", amount: "ETB 2,000", msg: lang === "am" ? "ጎት!" : "You're the best!" },
    ];
    let idx = 0;
    const show = () => {
      setLiveDon(pool[idx % pool.length]);
      setBalance(b => b + Math.floor(Math.random() * 400 + 150));
      idx++;
    };
    show();
    const i = setInterval(show, 4500);
    return () => clearInterval(i);
  }, [lang]);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("on"); }),
      { threshold: 0.08 }
    );
    revRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);
  const addR = el => { if (el && !revRefs.current.includes(el)) revRefs.current.push(el); };

  const askNotif = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(p => {
        if (p === "granted") new Notification("Cheer ET", { body: lang === "am" ? "ማሳወቂያዎች ነቅተዋል!" : "Notifications enabled!" });
        setNotif(false);
      });
    }
  };

  const submitContact = () => {
    if (!form.name || !form.email || !form.msg) return;
    setFormState("sending");
    setTimeout(() => {
      setFormState("sent");
      setTimeout(() => { setContact(false); setForm({ name: "", email: "", phone: "", msg: "" }); setFormState("idle"); }, 2000);
    }, 1500);
  };

  const scrollTo = id => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setMobOpen(false); }
  };

  const prevGal = () => setGalIdx(i => (i - 1 + GALLERY.length) % GALLERY.length);
  const nextGal = () => setGalIdx(i => (i + 1) % GALLERY.length);

  return (
    <>
      <style>{makeCSS(dark)}</style>

      {/* ── CONTACT PANEL ── */}
      {contact && (
        <div className="contact-overlay" onClick={e => { if (e.target === e.currentTarget) setContact(false); }}>
          <div className="contact-box">
            <button onClick={() => setContact(false)} className="btn-g" style={{ marginBottom: 24, padding: "8px 18px", fontSize: ".86rem" }}>
              <i className="bi bi-arrow-left" /> {s.contactBack}
            </button>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>{s.contactTitle}</h2>
            <p style={{ color: th.muted, fontSize: ".9rem", marginBottom: 24, lineHeight: 1.7 }}>{s.contactSub}</p>
            {formState === "sent" ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <i className="bi bi-check-circle-fill" style={{ fontSize: "2.5rem", color: "#22C55E", display: "block", marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{s.sent}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input className="form-inp" placeholder={s.nameLabel} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <input className="form-inp" type="email" placeholder={s.emailLabel} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                <input className="form-inp" placeholder={s.phoneLabel} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                <textarea className="form-inp" placeholder={s.msgLabel} value={form.msg} onChange={e => setForm(f => ({ ...f, msg: e.target.value }))} />
                <button className="btn-p" onClick={submitContact} disabled={formState === "sending"} style={{ padding: "14px", fontSize: "1rem", borderRadius: 12, marginTop: 4, justifyContent: "center" }}>
                  {formState === "sending"
                    ? <><i className="bi bi-arrow-repeat" style={{ animation: "spin 1s linear infinite" }} /> {s.sending}</>
                    : <><i className="bi bi-send-fill" /> {s.sendBtn}</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: scrolled ? "10px 24px" : "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? th.navBg : "transparent",
        backdropFilter: scrolled ? "blur(28px) saturate(1.8)" : "none",
        borderBottom: scrolled ? `1px solid ${th.border}` : "none",
        transition: "all .35s cubic-bezier(.4,0,.2,1)",
      }}>
        <span className="logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Cheer<sup>ET</sup></span>

        <nav className="hide-mob" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a className="navlink" onClick={() => scrollTo("features")}>{s.navFeatures}</a>
          <a className="navlink" onClick={() => scrollTo("creators")}>{s.navCreators}</a>
          <a className="navlink" onClick={() => scrollTo("pricing")}>{s.navPricing}</a>
          <a className="navlink" onClick={() => setContact(true)}>{s.navContact}</a>
        </nav>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setDark(d => !d)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.05rem", color: th.muted, padding: "6px", borderRadius: 8, lineHeight: 1 }}>
            <i className={`bi ${dark ? "bi-sun-fill" : "bi-moon-fill"}`} />
          </button>
          <button onClick={() => setLang(l => l === "en" ? "am" : "en")} className="btn-g" style={{ padding: "7px 12px", fontSize: ".82rem" }}>
            {lang === "en" ? "አማ" : "EN"}
          </button>
          <button onClick={() => navigate("/login")} className="btn-g hide-mob" style={{ padding: "8px 18px", fontSize: ".86rem" }}>{s.login}</button>
          <button onClick={() => navigate("/register")} className="btn-p" style={{ padding: "9px 20px", fontSize: ".86rem" }}>{s.getStarted}</button>
          <button onClick={() => setMobOpen(o => !o)} className="show-mob" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: th.text, fontSize: "1.35rem", lineHeight: 1 }}>
            <i className={`bi ${mobOpen ? "bi-x-lg" : "bi-list"}`} />
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      <div className={`mob-menu${mobOpen ? " open" : ""}`}>
        {[
          { lbl: s.navFeatures, ico: "bi-stars", id: "features" },
          { lbl: s.navCreators, ico: "bi-people-fill", id: "creators" },
          { lbl: s.navPricing, ico: "bi-tag-fill", id: "pricing" },
          { lbl: s.navContact, ico: "bi-chat-dots-fill", action: () => setContact(true) },
        ].map(l => (
          <a key={l.lbl} className="mob-link" onClick={() => { l.action ? l.action() : scrollTo(l.id); setMobOpen(false); }}>
            <i className={`bi ${l.ico}`} style={{ color: th.accent, width: 20 }} />{l.lbl}
          </a>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => navigate("/login")} className="btn-g" style={{ flex: 1 }}>{s.login}</button>
          <button onClick={() => navigate("/register")} className="btn-p" style={{ flex: 1 }}>{s.getStarted}</button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section style={{ minHeight: "100svh", display: "flex", alignItems: "center", padding: "120px 0 80px", position: "relative", overflow: "hidden" }}>
        <div className="hero-bg-glow" style={{
          top: "5%", left: "50%", transform: "translateX(-50%)",
          width: "clamp(400px,85vw,1000px)", height: "clamp(300px,55vw,700px)",
          background: `radial-gradient(ellipse at 50% 40%,${th.heroGlow} 0%,transparent 60%)`,
          zIndex: 0,
        }} />
        <div className="hero-bg-glow" style={{
          top: "20%", left: "-8%", width: "45vw", height: "45vw", maxWidth: 500, maxHeight: 500,
          background: `radial-gradient(circle,${th.accentDim} 0%,transparent 70%)`,
          opacity: dark ? 1 : 0.5, zIndex: 0, animationDelay: "2s",
        }} />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          {showRelease && (
            <div className="release-banner rev" ref={addR}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className="bi bi-rocket-takeoff-fill" style={{ color: th.accent, fontSize: "1.2rem" }} />
                <span style={{ fontWeight: 600 }}>{s.releasedMsg}</span>
              </div>
              <button onClick={() => setShowRelease(false)} style={{ background: "none", border: "none", cursor: "pointer", color: th.faint, fontSize: "1rem", lineHeight: 1 }}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}

          <div className="hero-flex" style={{ display: "flex", gap: 56, alignItems: "center" }}>
            {/* LEFT */}
            <div style={{ flex: "1 1 460px", animation: "slideUp .85s cubic-bezier(.4,0,.2,1) forwards" }}>
             

              <h1 className="hero-title" style={{
                marginBottom: 24,
                background: `linear-gradient(160deg,${th.text} 0%,${dark ? "#7EC8FF" : "#0044AA"} 60%,${th.accent} 100%)`,
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "gradX 8s ease infinite",
              }}>{s.heroTitle}</h1>

              <p style={{ fontSize: "1.07rem", color: th.muted, lineHeight: 1.78, maxWidth: 490, marginBottom: 18 }}>{s.heroSub}</p>

              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: th.accentDim, border: `1px solid ${th.accent}22`, borderRadius: 100, padding: "5px 14px", marginBottom: 32 }}>
                <i className="bi bi-shield-check-fill" style={{ fontSize: ".76rem", color: th.accent }} />
                <span style={{ fontSize: ".8rem", color: th.muted }}>
                  {lang === "am" ? "በቻፓ ተጠብቋል" : "Powered by"} <strong style={{ color: th.accent }}>Chapa</strong>
                </span>
              </div>

              <div className="cta-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
                <button onClick={() => navigate("/register")} className="btn-p" style={{ fontSize: "1rem", padding: "15px 34px" }}>
                  <i className="bi bi-arrow-right-circle-fill" /> {s.ctaStart}
                </button>
                <button onClick={() => scrollTo("how")} className="btn-g" style={{ fontSize: "1rem", padding: "15px 26px" }}>
                  <i className="bi bi-play-circle" /> {s.ctaWatch}
                </button>
              </div>
          
            </div>

            {/* RIGHT — live mockup card */}
            <div className="hide-mob" style={{ flex: "0 0 330px", position: "relative", animation: "float 7s ease-in-out infinite" }}>
              <div className="card" style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${th.accent},${dark ? "#40D0FF" : "#1A4FCC"})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* ✅ CHANGED: icon from bi-controller (gaming) to bi-person-video (creator) */}
                      <i className="bi bi-person-video" style={{ color: "#fff", fontSize: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".88rem" }}>MesaretArt</div>
                      <div style={{ fontSize: ".68rem", color: th.faint }}>
                        <i className="bi bi-circle-fill" style={{ color: "#22C55E", fontSize: ".46rem", marginRight: 4 }} />{s.liveNow} · 2,341
                      </div>
                    </div>
                  </div>
                  <span style={{ background: th.accentDim, border: `1px solid ${th.accent}33`, borderRadius: 7, padding: "3px 9px", fontSize: ".68rem", color: th.accent, fontWeight: 700 }}>{s.ttsOn}</span>
                </div>
                <div style={{ background: th.accentDim, border: `1px solid ${th.accent}22`, borderRadius: 13, padding: "14px 16px", marginBottom: 11 }}>
                  <div style={{ fontSize: ".68rem", color: th.faint, marginBottom: 2 }}>{s.todayBalance}</div>
                  <div style={{ fontSize: "1.85rem", fontWeight: 800, color: th.accent, letterSpacing: -1, lineHeight: 1 }}>ETB {balance.toLocaleString()}</div>
                  <div style={{ fontSize: ".68rem", color: "#22C55E", marginTop: 3 }}><i className="bi bi-arrow-up-right" /> +18% · {s.viaChapa}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, background: th.inputBg, border: `1px solid ${th.border}`, borderRadius: 9, padding: "8px 12px", marginBottom: 11 }}>
                  <i className="bi bi-volume-up-fill" style={{ fontSize: ".78rem", color: th.accent, marginRight: 6 }} />
                  <span style={{ fontSize: ".66rem", color: th.faint, marginRight: 6 }}>TTS:</span>
                  {[0, 65, 130, 195, 65, 130].map((d, i) => (
                    <div key={i} className="wbar" style={{ animation: `wave 1.1s ease-in-out ${d}ms infinite` }} />
                  ))}
                </div>
                <div style={{ fontSize: ".62rem", color: th.faint, marginBottom: 7, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase" }}>{s.liveFeed}</div>
                {[
                  { n: "Tigist A.", a: "ETB 500", m: "Love your art! 🔥", ico: "bi-heart-fill" },
                  { n: "Samuel B.", a: "ETB 1,000", m: "Best TikTok ever!", ico: "bi-star-fill" },
                ].map((d, i) => (
                  <div key={i} style={{ background: th.accentDim, border: `1px solid ${th.accent}18`, borderRadius: 11, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                    <i className={`bi ${d.ico}`} style={{ color: th.accent, fontSize: ".85rem", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, fontSize: ".82rem" }}>{d.n}</span>
                        <span style={{ color: th.accent, fontWeight: 700, fontSize: ".82rem" }}>{d.a}</span>
                      </div>
                      <p style={{ fontSize: ".7rem", opacity: .5, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.m}</p>
                    </div>
                  </div>
                ))}

              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CHAPA PAYMENT FLOW
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="lbl">{s.chapaLabel}</span>
            <h2 className="section-h" style={{ marginBottom: 14 }}>{s.chapaTitle}</h2>
            <p style={{ fontSize: ".97rem", color: th.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.78 }}>{s.chapaSub}</p>
          </div>
          <PayDiagram dark={dark} />
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section id="how" ref={addR} className="rev">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="lbl">{s.howLabel}</span>
            <h2 className="section-h">{s.howTitle}</h2>
          </div>
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { num: "01", ico: "bi-credit-card-fill", t: s.s1, d: s.s1d, c: th.accent },
              // ✅ CHANGED: step 2 icon from bi-broadcast-pin (streaming) to bi-link-45deg (link sharing)
              { num: "02", ico: "bi-link-45deg", t: s.s2, d: s.s2d, c: dark ? "#40C0FF" : "#0D5EAF" },
              { num: "03", ico: "bi-bank2", t: s.s3, d: s.s3d, c: "#22C55E" },
            ].map((st, i) => (
              <div key={i} className={`card rev d${i + 1}`} ref={addR} style={{ padding: 26 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${st.c}18`, border: `1px solid ${st.c}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={`bi ${st.ico}`} style={{ color: st.c, fontSize: "1.05rem" }} />
                  </div>
                  <span style={{ fontSize: ".68rem", fontWeight: 800, color: th.faint, letterSpacing: 1.2 }}>STEP {st.num}</span>
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8 }}>{st.t}</h3>
                <p style={{ fontSize: ".85rem", color: th.muted, lineHeight: 1.65 }}>{st.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TOP CREATORS
      ════════════════════════════════════════ */}
      <section id="creators" ref={addR} className="rev" hidden={!launched}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span className="lbl">{s.creatorsLabel}</span>
            <h2 className="section-h" style={{ marginBottom: 12 }}>{s.creatorsTitle}</h2>
            <p style={{ color: th.muted, fontSize: ".93rem", maxWidth: 500, margin: "0 auto 44px", lineHeight: 1.75 }}>{s.creatorsNote}</p>
          </div>
          <div className="creators-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 840, margin: "0 auto" }}>
            {CREATORS.map((c, i) => (
              <div key={i} className={`creator-wrap rev d${i + 1}`} ref={addR}>
                <div style={{ height: 5, background: `linear-gradient(90deg,${c.color},${dark ? "#40D0FF" : "#1A4FCC"})` }} />
                <div style={{ padding: "26px 22px", textAlign: "center" }}>
                  <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
                    <img src={c.img} alt={c.name} style={{ width: 76, height: 76, borderRadius: "50%", objectFit: "cover", border: `3px solid ${c.color}55`, display: "block" }} />
                    <div style={{ position: "absolute", bottom: 2, right: 2, width: 16, height: 16, background: "#22C55E", borderRadius: "50%", border: `2px solid ${th.bg}` }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 3 }}>{lang === "am" ? c.nameAm : c.name}</div>
                  <div style={{ fontSize: ".78rem", color: th.faint, marginBottom: 18 }}>{lang === "am" ? c.typeAm : c.type}</div>
                  <div style={{ fontSize: ".72rem", color: th.faint, marginBottom: 4 }}>{s.totalRaised}</div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: c.color, marginBottom: 20 }}>{c.raised}</div>
                  <button className="btn-p" style={{ width: "100%", padding: "11px", fontSize: ".88rem", borderRadius: 12, background: c.color, boxShadow: `0 2px 14px ${c.color}44` }}>
                    <i className="bi bi-heart-fill" /> {s.support}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          GALLERY
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev" hidden={!launched}>
        <div style={{ textAlign: "center", marginBottom: 36, padding: "0 24px" }}>
          <span className="lbl">{s.galleryLabel}</span>
          <h2 className="section-h" style={{ marginBottom: 8 }}>{s.galleryTitle}</h2>
          <p style={{ color: th.muted, fontSize: ".9rem" }}>{s.gallerySub}</p>
        </div>

        {/* DESKTOP */}
        <div className="gallery-desktop-wrap" >
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "flex", alignItems: "stretch", gap: "1.5%", borderRadius: 20, overflow: "hidden" }}>
              <div className="gal-side-item" onClick={prevGal}>
                <iframe
                  src={`https://www.youtube.com/embed/${GALLERY[(galIdx - 1 + GALLERY.length) % GALLERY.length].id}?rel=0&modestbranding=1`}
                  title="prev" allow="accelerometer" allowFullScreen
                  style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block", pointerEvents: "none" }}
                />
                <div style={{ padding: "10px 12px", background: th.surface }}>
                  <div style={{ fontSize: ".8rem", fontWeight: 600, color: th.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {lang === "am" ? GALLERY[(galIdx - 1 + GALLERY.length) % GALLERY.length].titleAm : GALLERY[(galIdx - 1 + GALLERY.length) % GALLERY.length].title}
                  </div>
                </div>
              </div>

              <div className="gal-main-item">
                <div style={{ position: "relative" }}>
                  <iframe key={galIdx}
                    src={`https://www.youtube.com/embed/${GALLERY[galIdx].id}?rel=0&modestbranding=1`}
                    title={GALLERY[galIdx].title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block" }}
                  />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px", background: "linear-gradient(transparent,rgba(0,0,0,.8))", pointerEvents: "none" }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: "1.05rem" }}>{lang === "am" ? GALLERY[galIdx].titleAm : GALLERY[galIdx].title}</div>
                    <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,.6)", marginTop: 3 }}>{GALLERY[galIdx].creator} · {GALLERY[galIdx].views} · {GALLERY[galIdx].dur}</div>
                  </div>
                  <button onClick={() => navigate("/register")} style={{ position: "absolute", bottom: 18, right: 18, background: th.accent, color: "#fff", border: "none", borderRadius: 980, padding: "9px 18px", fontSize: ".84rem", fontWeight: 600, cursor: "pointer" }}>
                    <i className="bi bi-heart-fill" /> {s.donate}
                  </button>
                </div>
              </div>

              <div className="gal-side-item" onClick={nextGal}>
                <iframe
                  src={`https://www.youtube.com/embed/${GALLERY[(galIdx + 1) % GALLERY.length].id}?rel=0&modestbranding=1`}
                  title="next" allow="accelerometer" allowFullScreen
                  style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block", pointerEvents: "none" }}
                />
                <div style={{ padding: "10px 12px", background: th.surface }}>
                  <div style={{ fontSize: ".8rem", fontWeight: 600, color: th.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {lang === "am" ? GALLERY[(galIdx + 1) % GALLERY.length].titleAm : GALLERY[(galIdx + 1) % GALLERY.length].title}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 20 }}>
              <button onClick={prevGal} className="btn-g" style={{ width: 40, height: 40, borderRadius: "50%", padding: 0, justifyContent: "center" }}>
                <i className="bi bi-chevron-left" />
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                {GALLERY.map((_, i) => (
                  <button key={i} onClick={() => setGalIdx(i)} style={{ height: 4, width: i === galIdx ? 32 : 16, borderRadius: 4, border: "none", cursor: "pointer", background: i === galIdx ? th.accent : `${th.accent}33`, transition: "all .3s", padding: 0 }} />
                ))}
              </div>
              <button onClick={nextGal} className="btn-g" style={{ width: 40, height: 40, borderRadius: "50%", padding: 0, justifyContent: "center" }}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <div className="card" style={{ padding: "14px 28px", display: "inline-flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
                {[
                  { label: lang === "am" ? "ፈጣሪ" : "Creator", val: GALLERY[galIdx].creator },
                  { label: lang === "am" ? "እይታዎች" : "Views", val: GALLERY[galIdx].views },
                  { label: lang === "am" ? "ርዝማኔ" : "Duration", val: GALLERY[galIdx].dur },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    {i > 0 && <div style={{ width: 1, height: 28, background: th.border }} />}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: ".65rem", color: th.faint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontWeight: 600, fontSize: ".88rem" }}>{item.val}</div>
                    </div>
                  </div>
                ))}
                <div style={{ width: 1, height: 28, background: th.border }} />
                <button onClick={() => navigate("/register")} className="btn-p" style={{ padding: "9px 22px", fontSize: ".88rem" }}>
                  <i className="bi bi-heart-fill" /> {s.donate}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE */}
        <div className="gallery-mobile-wrap">
          <div style={{ display: "flex", gap: 14, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", padding: "0 24px 12px" }}>
            {GALLERY.map((v, i) => (
              <div key={i} style={{ flex: "0 0 85vw", maxWidth: 340, scrollSnapAlign: "center", borderRadius: 16, overflow: "hidden", background: th.surface, border: `1px solid ${th.border}` }}>
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                  <iframe src={`https://www.youtube.com/embed/${v.id}?rel=0&modestbranding=1`} title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} />
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: 8 }}>{lang === "am" ? v.titleAm : v.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: ".76rem", color: th.faint }}>{v.creator} · {v.views}</span>
                    <button onClick={() => navigate("/register")} className="btn-p" style={{ padding: "7px 14px", fontSize: ".78rem", borderRadius: 980 }}>
                      <i className="bi bi-heart-fill" /> {s.donate}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          PLATFORMS
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="lbl">{s.platformsLabel}</span>
            <h2 className="section-h" style={{ marginBottom: 14 }}>{s.platformsTitle}</h2>
            <p style={{ fontSize: ".97rem", color: th.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.78 }}>{s.platformsSub}</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {PLATFORMS.map((p, i) => (
              <div key={i} className="platform-chip">
                <i className={`bi ${p.icon}`} style={{ color: th.accent, fontSize: "1.05rem" }} />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TIP PAGE / OVERLAYS & WIDGETS
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev">
        <div className="container">
          <div style={{ display: "flex", gap: 52, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 360px" }}>
              <span className="lbl">{s.overlayLabel}</span>
              <h2 className="section-h" style={{ marginBottom: 16 }}>{s.overlayTitle}</h2>
              <p style={{ fontSize: ".97rem", color: th.muted, lineHeight: 1.78, marginBottom: 24, maxWidth: 420 }}>{s.overlaySub}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {s.overlayFeats.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".9rem" }}>
                    <i className="bi bi-check-circle-fill" style={{ color: th.accent, fontSize: ".9rem", flexShrink: 0 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 22, padding: "14px 16px", background: th.accentDim, border: `1px solid ${th.accent}28`, borderRadius: 13, fontSize: ".85rem", color: th.muted, lineHeight: 1.65 }}>
                <i className="bi bi-info-circle-fill" style={{ color: th.accent, marginRight: 8 }} />
                {s.overlayNote}
              </div>
            </div>
            <div style={{ flex: "1 1 280px" }}>
              <OverlayPreview lang={lang} accent={th.accent} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════ */}
      <section id="features" ref={addR} className="rev">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="lbl">{s.featLabel}</span>
            <h2 className="section-h">{s.featTitle}</h2>
          </div>
          <div className="feats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {s.featItems.map((f, i) => (
              <div key={i} className={`card rev d${(i % 3) + 1}`} ref={addR} style={{ padding: "22px 18px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: th.accentDim, border: `1px solid ${th.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <i className={`bi ${f.icon}`} style={{ color: th.accent, fontSize: "1.05rem" }} />
                </div>
                <h3 style={{ fontSize: ".97rem", fontWeight: 700, marginBottom: 7 }}>{f.title}</h3>
                <p style={{ fontSize: ".83rem", color: th.muted, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          PRICING
      ════════════════════════════════════════ */}
      <section id="pricing" ref={addR} className="rev">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="lbl">{s.pricingLabel}</span>
            <h2 className="section-h" style={{ marginBottom: 12 }}>{s.pricingTitle}</h2>
            <p style={{ color: th.muted, fontSize: ".93rem" }}>{s.pricingSub}</p>
          </div>
          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 680, margin: "0 auto" }}>
            <div className="pricing-card">
              <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>{s.freeTitle}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>ETB 0</div>
              <div style={{ fontSize: ".8rem", color: th.faint, marginBottom: 26 }}>{s.freePer}</div>
              {s.freeFeats.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, fontSize: ".88rem" }}>
                  <i className="bi bi-check-circle-fill" style={{ color: "#22C55E", fontSize: ".84rem", flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
              <button onClick={() => navigate("/register")} className="btn-g" style={{ width: "100%", marginTop: 22, padding: "12px", borderRadius: 12, justifyContent: "center" }}>
                {s.currentPlan}
              </button>
            </div>
            <div className="pricing-card pricing-pro" style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: 16, right: 16, background: th.accent, color: "#fff", fontSize: ".66rem", fontWeight: 700, letterSpacing: 1, padding: "3px 10px", borderRadius: 980 }}>BEST</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>{s.proTitle}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: -1, marginBottom: 4, color: th.accent }}>{s.proPrice}</div>
              <div style={{ fontSize: ".8rem", color: th.faint, marginBottom: 26 }}>{s.proPer}</div>
              {s.proFeats.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, fontSize: ".88rem" }}>
                  <i className="bi bi-check-circle-fill" style={{ color: th.accent, fontSize: ".84rem", flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
              <button onClick={() => navigate("/register?plan=pro")} className="btn-p" style={{ width: "100%", marginTop: 22, padding: "12px", borderRadius: 12, justifyContent: "center" }}>
                {s.proBtn}
              </button>
            </div>
          </div>
          <p style={{ textAlign: "center", color: th.faint, fontSize: ".8rem", marginTop: 18 }}>{s.feeNote}</p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FAQ
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev">
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="lbl">{s.faqLabel}</span>
            <h2 className="section-h">{s.faqTitle}</h2>
          </div>
          {s.faqItems.map((item, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{item.q}</span>
                <i className={`bi ${openFaq === i ? "bi-chevron-up" : "bi-chevron-down"}`} style={{ color: th.accent, fontSize: ".88rem", flexShrink: 0 }} />
              </div>
              {openFaq === i && <div className="faq-a">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          COUNTDOWN
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <span className="lbl">{s.countLabel}</span>
          <h2 className="section-h" style={{ marginBottom: 44 }}>{s.countTitle}</h2>
          {launched ? (
            <div style={{ padding: "32px", background: th.accentDim, border: `1px solid ${th.accent}44`, borderRadius: 20, marginBottom: 36 }}>
              <i className="bi bi-rocket-takeoff-fill" style={{ fontSize: "2.5rem", color: th.accent, display: "block", marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>{s.releasedMsg}</div>
            </div>
          ) : (
            <div className="cd-row" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}>
              {[{ v: timeLeft.days, l: s.days }, { v: timeLeft.hours, l: s.hours }, { v: timeLeft.minutes, l: s.minutes }].map((item, i) => (
                <div key={i} className="cd-box" style={{ minWidth: 120, flex: "1 1 100px", maxWidth: 160 }}>
                  <div className="cd-num">{String(item.v).padStart(2, "0")}</div>
                  <div style={{ fontSize: ".74rem", color: th.faint, marginTop: 9, textTransform: "uppercase", letterSpacing: 1.5 }}>{item.l}</div>
                </div>
              ))}
            </div>
          )}
          <div className="cta-row" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => navigate("/register")} className="btn-p">{s.joinEarly}</button>
            <button onClick={() => setContact(true)} className="btn-g">{s.contactUs}</button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev" style={{ overflow: "hidden", paddingLeft: 0, paddingRight: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 36, padding: "0 24px" }}>
          <span className="lbl">{s.testiLabel}</span>
          <h2 className="section-h">{s.testiTitle}</h2>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(90deg,${th.scrollFade},transparent)`, zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(-90deg,${th.scrollFade},transparent)`, zIndex: 2, pointerEvents: "none" }} />
          <div style={{ overflow: "hidden" }}>
            <div className="testi-track">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div key={i} style={{ width: 285, flexShrink: 0, background: th.surface, border: `1px solid ${th.border}`, borderRadius: 18, padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: th.accentDim, border: `1px solid ${th.accent}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="bi bi-person-fill" style={{ color: th.accent, fontSize: ".9rem" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".86rem" }}>{t.name}</div>
                      <div style={{ fontSize: ".7rem", color: th.faint }}>{t.handle}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: ".84rem", color: th.muted, lineHeight: 1.68 }}>"{lang === "am" ? t.am : t.en}"</p>
                  <div style={{ display: "flex", gap: 2, marginTop: 10 }}>
                    {[1, 2, 3, 4, 5].map(n => <i key={n} className="bi bi-star-fill" style={{ color: "#F0A000", fontSize: ".7rem" }} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 620 }}>
          <div style={{ position: "relative", background: `linear-gradient(135deg,${th.accentDim},${th.surface})`, border: `1px solid ${th.accent}28`, borderRadius: 28, padding: "52px 36px", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "80%", height: "80%", background: `radial-gradient(circle,${th.heroGlow},transparent 65%)`, pointerEvents: "none", filter: "blur(32px)" }} />
            <span className="lbl" style={{ position: "relative" }}>{lang === "am" ? "ዛሬ ጀምሩ" : "Get Started Today"}</span>
            <h2 className="section-h" style={{ marginBottom: 12, position: "relative" }}>{s.ctaFinalTitle}</h2>
            <p style={{ fontSize: ".97rem", color: th.muted, marginBottom: 32, lineHeight: 1.78, position: "relative" }}>{s.ctaFinalSub}</p>
            <div className="cta-row" style={{ display: "flex", gap: 12, justifyContent: "center", position: "relative" }}>
              <button onClick={() => navigate("/register")} className="btn-p" style={{ fontSize: "1rem", padding: "15px 38px" }}>{s.createPage}</button>
              <button onClick={() => setContact(true)} className="btn-g" style={{ fontSize: "1rem", padding: "15px 28px" }}>{s.contactUs}</button>
            </div>
            <p style={{ fontSize: ".74rem", color: th.faint, marginTop: 18, position: "relative" }}>{s.ctaTrust}</p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${th.border}`, padding: "56px 0 32px", background: th.bg }}>
        <div className="container">
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 36, marginBottom: 44 }}>
            <div>
              <div style={{ marginBottom: 14 }}><span className="logo">Cheer<sup>ET</sup></span></div>
              <p style={{ fontSize: ".83rem", color: th.faint, lineHeight: 1.78, maxWidth: 250, marginBottom: 20 }}>{s.footDesc}</p>
              <div style={{ display: "flex", gap: 9 }}>
                {[
                  { ico: "bi-twitter-x", lbl: "Twitter" },
                  { ico: "bi-youtube", lbl: "YouTube" },
                  { ico: "bi-facebook", lbl: "Facebook" },
                  { ico: "bi-instagram", lbl: "Instagram" },
                  { ico: "bi-tiktok", lbl: "TikTok" },
                ].map((sc, i) => (
                  <button key={i} title={sc.lbl} aria-label={sc.lbl}
                    style={{ width: 32, height: 32, borderRadius: 8, background: th.cardBg, border: `1px solid ${th.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".85rem", cursor: "pointer", transition: "all .2s", color: th.muted }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = th.accent + "66"; e.currentTarget.style.color = th.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = th.border; e.currentTarget.style.color = th.muted; }}>
                    <i className={`bi ${sc.ico}`} />
                  </button>
                ))}
              </div>
            </div>
            {[
              {
                title: s.footProduct, links: s.productLinks,
                actions: [() => scrollTo("features"), null, null, null, () => scrollTo("pricing")],
              },
              {
                title: s.footCompany, links: s.companyLinks,
                actions: [null, null, null, null, () => setContact(true)],
              },
              { title: s.footLegal, links: s.legalLinks, actions: [null, null, null] },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: th.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>{col.title}</div>
                {col.links.map((l, j) => (
                  <div key={j} style={{ fontSize: ".84rem", color: th.faint, marginBottom: 11, cursor: "pointer", transition: "color .2s" }}
                    onClick={col.actions[j] || undefined}
                    onMouseEnter={e => e.target.style.color = th.text}
                    onMouseLeave={e => e.target.style.color = th.faint}
                  >{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${th.border}`, paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: ".76rem", color: th.faint }}>{s.footCopy}</p>
            <p style={{ fontSize: ".76rem", color: th.faint }}>{s.footBuilt}</p>
          </div>
        </div>
      </footer>

      {/* OFFLINE BANNER */}
      <div className={`offline-bar${offline ? " show" : ""}`}>
        <i className="bi bi-wifi-off" style={{ fontSize: "1rem" }} />
        {s.offlineMsg}
      </div>

      {/* NOTIFICATION PROMPT */}
      {notif && (
        <div className="notif-box">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: th.accentDim, border: `1px solid ${th.accent}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="bi bi-bell-fill" style={{ color: th.accent, fontSize: ".95rem" }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: ".88rem", marginBottom: 4 }}>Cheer ET</div>
              <p style={{ fontSize: ".82rem", color: th.muted, lineHeight: 1.6 }}>{s.notifAsk}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={askNotif} className="btn-p" style={{ flex: 1, padding: "9px", fontSize: ".83rem", borderRadius: 10 }}>
              <i className="bi bi-bell-fill" /> {s.notifBtn}
            </button>
            <button onClick={() => setNotif(false)} className="btn-g" style={{ padding: "9px 14px", fontSize: ".83rem", borderRadius: 10 }}>
              {s.notifDeny}
            </button>
          </div>
        </div>
      )}
    </>
  );
}