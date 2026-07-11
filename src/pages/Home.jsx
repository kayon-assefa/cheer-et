// CheerET_Home.jsx — Data, translations, and sub-components
// Dark/Light · EN/AM bilingual · Auth-aware · Search · Creators slider
import { useState, useEffect, useRef } from 'react';
import '../styles/home.css';

/* ══════════════════════════════════════════════
   TRANSLATIONS
══════════════════════════════════════════════ */
const STR = {
  en: {
    navFeatures: 'Features', navCreators: 'Creators', navPricing: 'Pricing', navContact: 'Contact',
    login: 'Sign In', dashboard: 'Dashboard', getStarted: 'Get Started',
    searchPlaceholder: 'Search creators...',
    searchTopCreators: 'Top Creators',
    searchNoResults: 'No creators found',
    heroBadge: "Ethiopia's Creator Platform",
    heroTitle: 'Your audience.\nYour income.',
    heroSub:
      'Cheer ET helps Ethiopian TikTokers, YouTubers, podcasters, artists and streamers receive fan support in seconds — powered by Chapa.',
    ctaStart: 'Start for Free', ctaWatch: 'See how it works',
    heroTrust: 'No setup fee · 10% platform fee · Free to start',
    chapaLabel: 'Payment Partner', chapaTitle: 'Powered by Chapa',
    chapaSub:
      "Money flows instantly from your fans to your wallet through Ethiopia's most trusted payment network — Telebirr, CBEBirr, and all major banks.",
    howLabel: 'How It Works', howTitle: "Three steps. That's it.",
    s1: 'Fan sends a tip', s1d: 'Any amount via Telebirr, CBEBirr or any Ethiopian bank.',
    s2: 'They land on your page', s2d: 'Your fans open your CheerET link and tip you directly — from TikTok, Instagram, YouTube or anywhere you share it.',
    s3: 'Money hits your wallet', s3d: 'ETB lands immediately. 10% platform fee applies. Cash out anytime.',
    creatorsLabel: 'Top Creators', creatorsTitle: 'Built for every creator.',
    creatorsNote: 'From TikTokers to artists, YouTubers to podcasters — Cheer ET works for every Ethiopian creator.',
    support: 'Support', totalRaised: 'Total raised',
    galleryLabel: 'Creator Moments', galleryTitle: 'Watch creators doing what they do.',
    gallerySub: 'Real moments from Ethiopian creators on Cheer ET.',
    donate: 'Tip Now',
    platformsLabel: 'Share Anywhere', platformsTitle: 'Works with every platform.',
    platformsSub: 'Share your Cheer ET link on TikTok, Instagram, YouTube, Telegram, Twitter and anywhere your fans follow you. Tips come in from everywhere.',
    overlayLabel: 'Your Tip Page', overlayTitle: 'A beautiful page. One link.',
    overlaySub: 'Your CheerET page is ready to share the moment you sign up. Customize it with your photo, colors and message. Works for streamers too — with full overlay and alert support.',
    overlayFeats: ['Custom Tip Page', 'Donation Alerts (for streamers)', 'Goal Progress Bar', 'Live Chat Overlay', 'Countdown Widget', 'Donor Leaderboard', 'TTS Alert Widget', 'Amharic Support'],
    overlayNote: 'Every creator gets a shareable tip page. Streamers also get overlay URLs for OBS and Streamlabs — live alerts, sub goals and more.',
    featLabel: 'Features', featTitle: 'Built different.',
    featItems: [
      { icon: 'bi-lightning-charge-fill', title: 'Instant payments', desc: 'Fans tip you instantly — no delays, no waiting. ETB hits your wallet immediately.' },
      { icon: 'bi-volume-up-fill', title: 'Text-to-speech', desc: 'Fan messages read aloud live on your stream as they arrive.' },
      { icon: 'bi-graph-up-arrow', title: 'Analytics', desc: 'Beautiful dashboard tracking revenue, donors and growth.' },
      { icon: 'bi-phone-fill', title: 'Mobile ready', desc: 'Manage tips and your page from your phone anywhere.' },
      { icon: 'bi-shield-check-fill', title: 'Secure via Chapa', desc: "All payments flow through Chapa's verified infrastructure." },
      { icon: 'bi-translate', title: 'Amharic support', desc: 'Full Amharic language for you and your fans.' },
      { icon: 'bi-flag-fill', title: 'Goal page', desc: 'Set a tip goal and let your fans watch it fill up in real time.' },
      { icon: 'bi-people-fill', title: 'Fan leaderboard', desc: 'Show your top supporters publicly and reward your biggest fans.' },
    ],
    pricingLabel: 'Pricing', pricingTitle: 'Simple, transparent pricing.',
    pricingSub: 'One flat fee. No hidden costs. Start free.',
    freeTitle: 'Free', freePer: 'forever',
    freeFeats: ['Creator tip page', 'Donation alerts', 'Chapa payments', 'Basic analytics', '10% platform fee'],
    proTitle: 'Pro', proPer: '/ month', proPrice: 'ETB 199',
    proFeats: ['Everything in Free', 'Custom overlays', 'Goal page', 'Fan leaderboard', 'Priority support', 'Lower 7% fee', 'Advanced analytics', 'Remove Cheer ET branding'],
    proBtn: 'Go Pro', currentPlan: 'Start Free',
    feeNote: 'All donations carry a 10% (Pro: 7%) platform fee. Chapa processing fees may apply.',
    faqLabel: 'FAQ', faqTitle: 'Common questions.',
    faqItems: [
      { q: 'What is Cheer ET?', a: 'Cheer ET is Ethiopia\'s fan-support platform for creators of all kinds — TikTokers, YouTubers, podcasters, artists, musicians, and streamers. Your fans send you tips directly through your personal CheerET page.' },
      { q: 'How does payment work?', a: "We use Chapa — Ethiopia's leading payment gateway. Your fans pay via Telebirr, CBEBirr, Amhara Bank, Dashen Bank, Awash Bank and more. No international cards needed." },
      { q: 'What is the platform fee?', a: 'Cheer ET charges a 10% platform fee on all donations. Pro plan creators get a reduced 7% fee. Standard Chapa processing fees may also apply.' },
      { q: 'How do I start receiving tips?', a: 'Sign up, set up your page in minutes, and share your CheerET link anywhere — your TikTok bio, Instagram, YouTube description, Telegram, or wherever your fans are.' },
      { q: 'Which platforms does Cheer ET support?', a: 'You can share your CheerET link anywhere — TikTok, Instagram, YouTube, Telegram, Twitter and more. Streamers also get OBS, Streamlabs and browser-source overlay support.' },
      { q: "I'm not a streamer. Can I use Cheer ET?", a: 'Absolutely. Cheer ET is built for every type of creator. TikTokers, artists, podcasters, musicians — just share your tip link and your fans can support you instantly.' },
      { q: 'What is the Goal page?', a: 'A live public page with an animated progress bar showing your tip goal. Share the link in your bio or on your posts to motivate fans to contribute.' },
      { q: 'When does Cheer ET launch?', a: 'Cheer ET officially launches July 14, 2026. The platform is live — sign up now and start receiving tips today.' },
    ],
    countLabel: 'Live · July 14, 2026', countTitle: "Ethiopia's creator economy is live.",
    days: 'Days', hours: 'Hours', minutes: 'Min',
    joinEarly: 'Create Your Page', contactUs: 'Contact',
    releasedMsg: 'Cheer ET is live! Sign up now.',
    testiLabel: 'Community', testiTitle: 'Creators love it.',
    appLabel: 'Mobile App', appTitle: 'Cheer ET in your pocket.',
    appSub: 'Download the Android app and manage your tips, page and analytics on the go. iOS is on the way.',
    appAndroid: 'Download Cheer ET APK', appIosComing: 'Coming soon on the App Store',
    appAndroidSub: 'Android · v1.0 · 18 MB',
    ctaFinalTitle: 'Your fans are ready.', ctaFinalSub: 'Start earning from your audience today.',
    createPage: 'Create Your Page', ctaTrust: 'Free to start · 10% fee · Powered by Chapa',
    contactTitle: 'Get in Touch',
    contactSub: 'Have a question? Send us a message and we\'ll reply within 24 hours.',
    nameLabel: 'Full Name', emailLabel: 'Email Address', phoneLabel: 'Phone (optional)',
    msgLabel: 'Message', sendBtn: 'Send Message', sending: 'Sending...', sent: 'Message Sent',
    contactBack: 'Back',
    footDesc: "Ethiopia's fan-support platform for every type of creator.",
    footProduct: 'Product', footCompany: 'Company', footLegal: 'Legal',
    footCopy: '© 2026 Cheer ET. All rights reserved.',
    footBuilt: 'Built by Kayon Tech · Powered by Chapa',
    productLinks: ['Features', 'Creator Pages', 'Analytics', 'Overlays & Widgets', 'Pricing'],
    companyLinks: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
    legalLinks: ['Privacy', 'Terms', 'Cookies'],
    todayBalance: "Today's balance", viaChapa: 'via Chapa', liveNow: 'Live',
    newCheer: 'New Tip!', ttsOn: 'TTS ON', liveFeed: 'Live feed', topSupporter: 'Top Supporter',
    offlineMsg: 'No internet connection. Please check your network.',
    notifAsk: 'Get notified when your fans tip you.', notifBtn: 'Enable Notifications', notifDeny: 'Maybe later',
  },
  am: {
    navFeatures: 'ባህሪያት', navCreators: 'ፈጣሪዎች', navPricing: 'ዋጋ', navContact: 'ያግኙን',
    login: 'ግባ', dashboard: 'ዳሽቦርድ', getStarted: 'ጀምር',
    searchPlaceholder: 'ፈጣሪዎችን ይፈልጉ...',
    searchTopCreators: 'ምርጥ ፈጣሪዎች',
    searchNoResults: 'ፈጣሪ አልተገኘም',
    heroBadge: 'የኢትዮጵያ ፈጣሪዎች መድረክ',
    heroTitle: 'ታዳሚዎ.\nገቢዎ.',
    heroSub: 'Cheer ET ኢትዮጵያዊ ቲክቶከሮች፣ ዩቱበሮች፣ ፖድካስተሮች፣ አርቲስቶች እና ስትሪመሮች የደጋፊ ድጋፍ በሰከንዶች ውስጥ እንዲያገኙ ያደርጋል — በቻፓ ይሰራል።',
    ctaStart: 'ነጻ ጀምር', ctaWatch: 'እንዴት እንደሚሰራ ይመልከቱ',
    heroTrust: 'ምንም ማቋቋሚያ ክፍያ · 10% የመድረክ ክፍያ · ነጻ ጀምር',
    chapaLabel: 'የክፍያ አጋር', chapaTitle: 'በቻፓ ይሰራል',
    chapaSub: 'ገንዘቡ ከደጋፊዎችዎ ቦርሳ ወደ ቦርሳዎ ወዲያው ይፈስሳል — ቴሌብር፣ CBEBirr እና ሁሉም ዋና ባንኮች።',
    howLabel: 'እንዴት ይሰራል', howTitle: 'ሦስት ደረጃዎች ብቻ።',
    s1: 'ደጋፊ ቲፕ ይልካል', s1d: 'ማንኛውም መጠን፣ በቴሌብር፣ CBEBirr ወይም ሌላ ባንክ።',
    s2: 'ወደ ገጽዎ ይደርሳሉ', s2d: 'ደጋፊዎችዎ CheerET ሊንክዎን ይከፍቱና ቲፕ ይልካሉ — ከ TikTok፣ Instagram ወይም የትም ቢሆን።',
    s3: 'ገንዘቡ ወዲያው ይደርሳል', s3d: 'ETB ወዲያው ወደ ቦርሳዎ ይደርሳል። 10% ክፍያ ይፈጸማል። ማንኛውም ጊዜ ያውጡ።',
    creatorsLabel: 'ምርጥ ፈጣሪዎች', creatorsTitle: 'ለሁሉም ፈጣሪ ተሰርቷል።',
    creatorsNote: 'ከቲክቶከሮች እስከ አርቲስቶች፣ ከዩቱበሮች እስከ ፖድካስተሮች — Cheer ET ለሁሉም ኢትዮጵያዊ ፈጣሪ ይሰራል።',
    support: 'ደግፍ', totalRaised: 'ጠቅላላ',
    galleryLabel: 'የፈጣሪ ቅጽበቶች', galleryTitle: 'ፈጣሪዎች ሲሰሩ ይመልከቱ።',
    gallerySub: 'ከኢትዮጵያ ፈጣሪዎች የ Cheer ET ቅጽበቶች።',
    donate: 'አሁን ቲፕ ስጥ',
    platformsLabel: 'በሁሉም ቦታ አጋሩ', platformsTitle: 'ከሁሉም ዋና መድረኮች ጋር ይሰራል።',
    platformsSub: 'CheerET ሊንክዎን በ TikTok፣ Instagram፣ YouTube፣ Telegram እና ደጋፊዎችዎ ባሉበት ሁሉ ያጋሩ። ቲፖቹ ከሁሉም ቦታ ይመጣሉ።',
    overlayLabel: 'የቲፕ ገጽዎ', overlayTitle: 'ቆንጆ ገጽ። አንድ ሊንክ።',
    overlaySub: 'CheerET ገጽዎ ከተመዘገቡ ወዲያው ዝግጁ ነው። ፎቶዎን፣ ቀለምዎን እና መልዕክትዎን ያስተካክሉ። ስትሪመሮችም ሙሉ overlay ድጋፍ ያገኛሉ።',
    overlayFeats: ['ብጁ የቲፕ ገጽ', 'ልገሳ ማስጠንቀቂያ (ለስትሪመሮች)', 'ግብ ፕሮግሬስ ባር', 'ቀጥታ ቻት ኦቨርሌይ', 'ቆጠራ ዊጅት', 'ለጋሽ ሊደርቦርድ', 'TTS ማስጠንቀቂያ ዊጅት', 'አማርኛ ድጋፍ'],
    overlayNote: 'ሁሉም ፈጣሪዎች ሊጋሩ የሚችሉ የቲፕ ገጽ ያገኛሉ። ስትሪመሮችም ለ OBS እና Streamlabs overlay URL ያገኛሉ።',
    featLabel: 'ባህሪያት', featTitle: 'ለየት ያለ ተሰርቷል።',
    featItems: [
      { icon: 'bi-lightning-charge-fill', title: 'ቀጥተኛ ክፍያ', desc: 'ደጋፊዎቹ ወዲያው ይቲፑዎታል — ምንም መጠበቅ የለም።' },
      { icon: 'bi-volume-up-fill', title: 'ጽሑፍ-ወደ-ንግግር', desc: 'የደጋፊ መልዕክቶች ቀጥታ ሲደርሱ ይነበባሉ።' },
      { icon: 'bi-graph-up-arrow', title: 'ትንታኔ', desc: 'ገቢ፣ ለጋሾች እና እድገት ቆንጆ ዳሽቦርድ።' },
      { icon: 'bi-phone-fill', title: 'ሞባይል ዝግጁ', desc: 'ሁሉን ከስልክዎ ያስተዳድሩ።' },
      { icon: 'bi-shield-check-fill', title: 'በቻፓ ደህንነቱ ተጠብቋል', desc: 'ሁሉም ክፍያዎች በቻፓ ስርዓት ይፈስሳሉ።' },
      { icon: 'bi-translate', title: 'አማርኛ ድጋፍ', desc: 'ሙሉ አማርኛ ቋንቋ ለእርስዎ እና ለደጋፊዎችዎ።' },
      { icon: 'bi-flag-fill', title: 'ግብ ገጽ', desc: 'የቲፕ ግብ ያዘጋጁ ደጋፊዎምዎ ሲሞላ ይከታተሉ።' },
      { icon: 'bi-people-fill', title: 'የደጋፊ ሊደርቦርድ', desc: 'ምርጥ ደጋፊዎን ለሁሉ ያሳዩ።' },
    ],
    pricingLabel: 'ዋጋ', pricingTitle: 'ቀላል፣ ግልጽ ዋጋ።',
    pricingSub: 'አንድ የተስተካከለ ክፍያ። ምስጢራዊ ወጪዎች የሉም። ነጻ ይጀምሩ።',
    freeTitle: 'ነጻ', freePer: 'ለዘለዓለም',
    freeFeats: ['የቲፕ ገጽ', 'ልገሳ ማስጠንቀቂያዎች', 'ቻፓ ክፍያዎች', 'መሰረታዊ ትንታኔ', '10% ክፍያ'],
    proTitle: 'ፕሮ', proPer: '/ ወር', proPrice: 'ETB 199',
    proFeats: ['ሁሉ ነጻ ውስጥ ያለ', 'ብጁ ኦቨርሌይ', 'ግብ ገጽ', 'የደጋፊ ሊደርቦርድ', 'ቅድሚያ ድጋፍ', 'ዝቅተኛ 7% ክፍያ', 'የላቀ ትንታኔ', 'Cheer ET ምልክት ያስወግዱ'],
    proBtn: 'ፕሮ ጀምር', currentPlan: 'ነጻ ጀምር',
    feeNote: 'ሁሉም ልገሳዎች 10% (ፕሮ: 7%) ክፍያ ይሸከማሉ። ቻፓ ማካሄጃ ክፍያዎች ሊፈጸሙ ይችላሉ።',
    faqLabel: 'ጥያቄዎች', faqTitle: 'የተለመዱ ጥያቄዎች።',
    faqItems: [
      { q: 'Cheer ET ምንድን ነው?', a: 'Cheer ET ለሁሉም ኢትዮጵያዊ ፈጣሪዎች — ቲክቶከሮች፣ ዩቱበሮች፣ ፖድካስተሮች፣ አርቲስቶች፣ ሙዚቀኞች እና ስትሪመሮች — የደጋፊ ድጋፍ መድረክ ነው።' },
      { q: 'ክፍያ እንዴት ይሰራል?', a: 'ቻፓ — የኢትዮጵያ ቀዳሚ የክፍያ መድረክ እንጠቀማለን። ቴሌብር፣ CBEBirr፣ አምሐራ ባንክ፣ ዳሽን ባንክ፣ አዋሽ ባንክ ይደገፋሉ።' },
      { q: 'የመድረክ ክፍያ ምን ያህል ነው?', a: 'Cheer ET 10% ክፍያ ያስከፍላል። ፕሮ ፈጣሪዎች 7% ዝቅተኛ ክፍያ ያገኛሉ።' },
      { q: 'ቲፕ መቀበል እንዴት እጀምራለሁ?', a: 'ተመዝግቡ፣ ገጽዎን ያዘጋጁ፣ ሊንክዎን ወዲያው በ TikTok bio፣ Instagram፣ YouTube ወይም ደጋፊዎምዎ ባሉበት ሁሉ ያጋሩ።' },
      { q: 'Cheer ET ከምን መድረኮች ጋር ይሰራል?', a: 'CheerET ሊንክዎን በ TikTok፣ Instagram፣ YouTube፣ Telegram እና ሁሉም ቦታ ማጋራት ይችላሉ። ስትሪመሮችም OBS እና Streamlabs overlay ድጋፍ ያገኛሉ።' },
      { q: 'ስትሪሜ ካላደርኩ Cheer ET መጠቀም እችላለሁ?', a: 'አዎ። Cheer ET ለሁሉም ፈጣሪ ነው። ቲክቶከሮች፣ አርቲስቶች፣ ፖድካስተሮች፣ ሙዚቀኞች — ሊንክዎን ያጋሩ ደጋፊዎምዎ ወዲያው ይደግፉዎታል።' },
      { q: 'ግብ ገጽ ምንድን ነው?', a: 'ደጋፊዎምዎ ሊያዩት የሚችሉ ቀጥታ የቲፕ ግብ አኒሜሽን ፕሮግሬስ ባር ያለው ህዝባዊ ገጽ ነው። በ bio ወይም ፖስቶችዎ ያጋሩ።' },
      { q: 'Cheer ET መቼ ይጀምራል?', a: 'Cheer ET በኦፊሴላዊነት ሐምሌ 14 ቀን 2026 ተጀምሯል። አሁን ይመዝገቡ።' },
    ],
    countLabel: 'ቀጥል · ሐምሌ 14፣ 2026', countTitle: 'የኢትዮጵያ ፈጣሪ ኢኮኖሚ ተጀምሯል።',
    days: 'ቀናት', hours: 'ሰዓታት', minutes: 'ደቂቃ',
    joinEarly: 'ገጽዎን ይፍጠሩ', contactUs: 'ያግኙን',
    releasedMsg: 'Cheer ET ጀምሯል! አሁን ይመዝገቡ።',
    testiLabel: 'ማህበረሰብ', testiTitle: 'ፈጣሪዎች ይወዳሉ።',
    appLabel: 'ሞባይል አፕሊኬሽን', appTitle: 'Cheer ET በእጅዎ ውስጥ።',
    appSub: 'የአንድሮይድ አፕሊኬሽኑን ያውርዱ እና ቲፖችዎን፣ ገጽዎን እና ትንታኔዎን ያስተዳድሩ። iOS በመንገድ ላይ ነው።',
    appAndroid: 'Cheer ET APK ያውርዱ', appIosComing: 'በቅርቡ በ App Store',
    appAndroidSub: 'Android · v1.0 · 18 MB',
    ctaFinalTitle: 'ደጋፊዎችዎ ዝግጁ ናቸው።', ctaFinalSub: 'ዛሬ ከታዳሚዎችዎ ማግኘት ይጀምሩ።',
    createPage: 'ገጽዎን ይፍጠሩ', ctaTrust: 'ነጻ ጀምር · 10% ክፍያ · በቻፓ',
    contactTitle: 'ያግኙን',
    contactSub: 'ጥያቄ አለዎ? መልዕክት ይላኩ። በ24 ሰዓት ውስጥ እንመልሳለን።',
    nameLabel: 'ሙሉ ስም', emailLabel: 'ኢሜይል', phoneLabel: 'ስልክ (አማራጭ)',
    msgLabel: 'መልዕክት', sendBtn: 'ይላኩ', sending: 'እየተላከ...', sent: 'ተልኳል',
    contactBack: 'ተመለስ',
    footDesc: 'ለሁሉም ኢትዮጵያዊ ፈጣሪ የደጋፊ-ድጋፍ መድረክ።',
    footProduct: 'ምርት', footCompany: 'ኩባንያ', footLegal: 'ህጋዊ',
    footCopy: '© 2026 Cheer ET. መብቶቹ ሁሉ የተጠበቁ ናቸው።',
    footBuilt: 'በ Kayon Tech · በቻፓ',
    productLinks: ['ባህሪያት', 'የፈጣሪ ገጾች', 'ትንታኔ', 'ኦቨርሌይ እና ዊጅቶች', 'ዋጋ'],
    companyLinks: ['ስለ እኛ', 'ብሎግ', 'ቅጥር', 'ፕሬስ', 'ያግኙን'],
    legalLinks: ['ግላዊነት', 'ውሎች', 'ኩኪዎች'],
    todayBalance: 'የዛሬ ቀሪ ሂሳብ', viaChapa: 'በቻፓ', liveNow: 'ቀጥታ',
    newCheer: 'አዲስ ቲፕ!', ttsOn: 'TTS ክፍት', liveFeed: 'ቀጥታ', topSupporter: 'ምርጥ ደጋፊ',
    offlineMsg: 'ኢንተርኔት ግንኙነት የለም። ያረጋግጡ።',
    notifAsk: 'ደጋፊዎምዎ ሲቲፑዎ ይወቁ።', notifBtn: 'ማሳወቂያ አንቃ', notifDeny: 'ቆየት ብሎ',
  },
};

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */
const CREATORS = [
  { name: 'AbelGaming', nameAm: 'አቤልጌሚንግ', type: 'Streamer & Gamer', typeAm: 'ስትሪሜ እና ጨዋች', raised: 'ETB 12,450', color: '#2979FF', img: 'https://i.pravatar.cc/150?img=11' },
  { name: 'HabtamuTube', nameAm: 'ሀብታሙ ቲዩብ', type: 'YouTuber & Podcaster', typeAm: 'ዩቱበር እና ፖድካስተር', raised: 'ETB 31,000', color: '#0EA5E9', img: 'https://i.pravatar.cc/150?img=32' },
  { name: 'MesaretArt', nameAm: 'መሰረት አርት', type: 'TikToker & Artist', typeAm: 'ቲክቶከር እና አርቲስት', raised: 'ETB 9,150', color: '#6366F1', img: 'https://i.pravatar.cc/150?img=47' },
  { name: 'SelamDraws', nameAm: 'ሰላም ዣር', type: 'Digital Artist', typeAm: 'ዲጂታል አርቲስት', raised: 'ETB 7,820', color: '#EC4899', img: 'https://i.pravatar.cc/150?img=23' },
  { name: 'DawitMusic', nameAm: 'ዳዊት ሙዚቃ', type: 'Musician', typeAm: 'ሙዚቀኛ', raised: 'ETB 18,300', color: '#F59E0B', img: 'https://i.pravatar.cc/150?img=15' },
  { name: 'HiwotPodcast', nameAm: 'ሕይወት ፖድካስት', type: 'Podcaster', typeAm: 'ፖድካስተር', raised: 'ETB 5,640', color: '#10B981', img: 'https://i.pravatar.cc/150?img=44' },
  { name: 'YonasTV', nameAm: 'ዮናስ ቲቪ', type: 'YouTuber', typeAm: 'ዩቱበር', raised: 'ETB 24,100', color: '#8B5CF6', img: 'https://i.pravatar.cc/150?img=33' },
  { name: 'MekdesArt', nameAm: 'መቅደስ አርት', type: 'TikToker & Artist', typeAm: 'ቲክቶከር እና አርቲስት', raised: 'ETB 11,200', color: '#EF4444', img: 'https://i.pravatar.cc/150?img=49' },
  { name: 'BirukGaming', nameAm: 'ብሩክ ጌሚንግ', type: 'Streamer', typeAm: 'ስትሪመር', raised: 'ETB 8,750', color: '#06B6D4', img: 'https://i.pravatar.cc/150?img=12' },
  { name: 'TigistMusic', nameAm: 'ትግስት ሙዚቃ', type: 'Singer', typeAm: 'ዘፋኝ', raised: 'ETB 15,900', color: '#84CC16', img: 'https://i.pravatar.cc/150?img=5' },
];

const TESTIMONIALS = [
  { en: 'Finally a tipping platform built for Ethiopian creators. My TikTok fans use it every day.', am: 'በመጨረሻ ለኢትዮጵያዊ ፈጣሪዎች የተሰራ የቲፕ መድረክ። የ TikTok ደጋፊዎቼ ሁሌ ይጠቀሙታል።', name: 'Yonas T.', handle: '@yonastv' },
  { en: 'Chapa integration is seamless. ETB hits my account instantly.', am: 'ቻፓ ሲምለስ ነው። ETB ወዲያው ሂሳቤ ላይ ይወድቃሉ።', name: 'Abel M.', handle: '@abelgame' },
  { en: 'Finally a platform for African creators. Complete game changer.', am: 'በመጨረሻ ለአፍሪካ ፈጣሪዎች። ሁሉ ነገር ተለወጠ።', name: 'Selam K.', handle: '@selamdraws' },
  { en: "I just share my link in my bio and tips come in automatically. It's that simple.", am: 'ሊንኬን ቢዮ ላይ ለጠፍኩ ቲፑ ወዲያው ይመጣል። እርግጥ ቀላል ነው።', name: 'Hiwot G.', handle: '@hiwotmusic' },
  { en: 'Telebirr support is a real game changer for Ethiopian creators.', am: 'ቴሌብር ለኢትዮጵያ ፈጣሪዎች ጨዋታ ቀያሪ ነው።', name: 'Dawit B.', handle: '@dawittv' },
  { en: "Best analytics dashboard I've seen on any creator platform.", am: 'ካየሁት ምርጥ ዳሽቦርድ።', name: 'Mekdes A.', handle: '@mekdesart' },
];

const GALLERY = [
  { id: 'dQw4w9WgXcQ', title: 'AbelGaming hits 10k', titleAm: 'አቤል 10 ሺ ደረሰ', creator: '@abelgaming', views: '14K views', dur: '0:18' },
  { id: 'jNQXAC9IVRw', title: 'First donation moment', titleAm: 'የመጀመሪያ ቲፕ', creator: '@hiwotmusic', views: '8K views', dur: '0:15' },
  { id: '9bZkp7q19f0', title: 'Biggest supporter night', titleAm: 'ትልቁ የደጋፊ ምሽት', creator: '@yonastv', views: '22K views', dur: '0:20' },
];

const PLATFORMS = [
  { icon: 'bi-tiktok', name: 'TikTok' },
  { icon: 'bi-instagram', name: 'Instagram' },
  { icon: 'bi-play-btn-fill', name: 'YouTube' },
  { icon: 'bi-telegram', name: 'Telegram' },
  { icon: 'bi-twitter-x', name: 'Twitter / X' },
  { icon: 'bi-camera-video-fill', name: 'OBS Studio' },
  { icon: 'bi-broadcast', name: 'Streamlabs' },
  { icon: 'bi-collection-play-fill', name: 'Kick' },
];

const PAY_NODES = [
  { label: 'Telebirr', x: 50, y: 5 },
  { label: 'CBEBirr', x: 87, y: 25 },
  { label: 'Awash', x: 95, y: 58 },
  { label: 'Dashen', x: 72, y: 88 },
  { label: 'Zemen', x: 38, y: 95 },
  { label: 'PayPal', x: 8, y: 72 },
  { label: 'Amhara', x: 5, y: 38 },
  { label: 'Nib Int.', x: 20, y: 14 },
];

/* ══════════════════════════════════════════════
   PAYMENT DIAGRAM SUB-COMPONENT
══════════════════════════════════════════════ */
function PayDiagram({ dark }) {
  const cvRef = useRef(null);
  const anRef = useRef(0);
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
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const sz = Math.min(cv.parentElement?.clientWidth || 480, 480);
      cv.width = sz;
      cv.height = sz;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const W = cv.width;
      const H = cv.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const nodes = PAY_NODES.map((n) => ({ x: (n.x / 100) * W, y: (n.y / 100) * H, label: n.label }));

      nodes.forEach((nd) => {
        const g = ctx.createLinearGradient(nd.x, nd.y, cx, cy);
        g.addColorStop(0, dark ? 'rgba(41,121,255,0.1)' : 'rgba(26,95,204,0.08)');
        g.addColorStop(1, dark ? 'rgba(41,121,255,0.4)' : 'rgba(26,95,204,0.35)');
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

      pts.current.forEach((p) => {
        p.prog += p.spd;
        if (p.prog > 1) p.prog = 0;
        const nd = nodes[p.ni];
        const tp = p.dir === 1 ? p.prog : 1 - p.prog;
        const px = nd.x + (cx - nd.x) * tp;
        const py = nd.y + (cy - nd.y) * tp;
        const dg = ctx.createRadialGradient(px, py, 0, px, py, 5);
        dg.addColorStop(0, dark ? 'rgba(100,180,255,0.9)' : 'rgba(41,121,255,0.9)');
        dg.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.fillStyle = dg;
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      nodes.forEach((nd) => {
        ctx.beginPath();
        ctx.fillStyle = dark ? 'rgba(41,121,255,0.07)' : 'rgba(26,95,204,0.05)';
        ctx.arc(nd.x, nd.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = dark ? 'rgba(15,18,28,0.96)' : 'rgba(248,250,255,0.96)';
        ctx.strokeStyle = dark ? 'rgba(41,121,255,0.35)' : 'rgba(26,95,204,0.25)';
        ctx.lineWidth = 1.5;
        ctx.arc(nd.x, nd.y, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = dark ? 'rgba(237,242,255,0.85)' : 'rgba(11,22,48,0.85)';
        ctx.font = 'bold 8.5px Plus Jakarta Sans,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
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
      cg.addColorStop(0, dark ? '#2979FF' : '#1A5FCC');
      cg.addColorStop(1, dark ? '#1A4FCC' : '#0D47A1');
      ctx.beginPath();
      ctx.fillStyle = cg;
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Plus Jakarta Sans,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Chapa', cx, cy);

      anRef.current = requestAnimationFrame(draw);
    };

    anRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(anRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [dark]);

  return <canvas ref={cvRef} style={{ width: '100%', maxWidth: 480, display: 'block', margin: '0 auto' }} />;
}

/* ══════════════════════════════════════════════
   OVERLAY PREVIEW SUB-COMPONENT
══════════════════════════════════════════════ */
function OverlayPreview({ lang, accent }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 3500);
    return () => clearInterval(i);
  }, []);
  const pool = [
    { name: 'Tigist A.', amt: 'ETB 500', msg: lang === 'am' ? 'ቀጥሉ! ' : 'Keep going! ' },
    { name: 'Biruk M.', amt: 'ETB 2,000', msg: lang === 'am' ? 'ጎት! ' : 'GOAT! ' },
    { name: 'Samuel B.', amt: 'ETB 750', msg: lang === 'am' ? 'ምርጥ!' : 'Best content!' },
  ];
  const d = pool[tick % pool.length];
  return (
    <div className="overlay-box">
      <div style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,.4)', marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase' }}>
        LIVE TIP PAGE PREVIEW
      </div>
      <div key={tick} className="overlay-alert">
        <i className="bi bi-lightning-charge-fill" style={{ color: '#fff', fontSize: '1rem', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{d.name} — {d.amt}</div>
          <div style={{ fontSize: '0.76rem', opacity: 0.85 }}>{d.msg}</div>
        </div>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,.1)', borderRadius: 8, overflow: 'hidden', marginBottom: 7 }}>
        <div style={{ height: '100%', width: '68%', background: `linear-gradient(90deg,${accent},#40D0FF)`, borderRadius: 8 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,.4)' }}>
        <span>{lang === 'am' ? 'ግብ 68%' : 'Goal 68%'}</span>
        <span>ETB 3,400 / 5,000</span>
      </div>
    </div>
  );
}

export { STR, CREATORS, TESTIMONIALS, GALLERY, PLATFORMS, PAY_NODES, PayDiagram, OverlayPreview };
