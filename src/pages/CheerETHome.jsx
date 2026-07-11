// CheerETHome.jsx — Main homepage component
// Auth-aware · Search · Creators slider · Bilingual · Dark/Light
import { useState, useEffect, useRef, useMemo } from 'react';
import { STR, CREATORS, TESTIMONIALS, GALLERY, PLATFORMS, PayDiagram, OverlayPreview } from './Home';
import { useForm, ValidationError } from '@formspree/react';
/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function CheerETHome() {
  const [lang, setLang] = useState('en');
  const [dark, setDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobOpen, setMobOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [launched, setLaunched] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const [balance, setBalance] = useState(12450);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [notif, setNotif] = useState(false);
  const [contact, setContact] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', msg: '' });
  const [formState, setFormState] = useState('idle');
  const [galIdx, setGalIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [creatorsLoading, setCreatorsLoading] = useState(true);
  const revRefs = useRef([]);
  const sliderRef = useRef(null);
  const s = STR[lang];
const [state, handleSubmit] = useForm("mykqljwv");
  // Apply theme class to body
  useEffect(() => {
    document.body.className = dark ? 'theme-dark' : 'theme-light';
  }, [dark]);

  // SEO
  useEffect(() => {
    document.title = "Cheer ET — Ethiopia's Creator Platform";
    const sm = (n, c) => {
      let m = document.querySelector(`meta[name="${n}"]`);
      if (!m) {
        m = document.createElement('meta');
        m.name = n;
        document.head.appendChild(m);
      }
      m.content = c;
    };
    const og = (p, c) => {
      let m = document.querySelector(`meta[property="${p}"]`);
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('property', p);
        document.head.appendChild(m);
      }
      m.content = c;
    };
    sm('description', "Cheer ET is Ethiopia's fan-support platform for TikTokers, YouTubers, podcasters, artists and streamers. Receive tips via Telebirr, CBEBirr and Chapa. Share one link, get paid instantly.");
    sm('keywords', 'Cheer ET, Ethiopian creator platform, Chapa donations, Telebirr creator, TikTok creator Ethiopia, YouTuber Ethiopia, fan tips Ethiopia');
    og('og:title', "Cheer ET — Ethiopia's Creator Platform");
    og('og:description', 'Receive fan tips in seconds. Powered by Chapa. Works with TikTok, Instagram, YouTube, OBS and more.');
    og('og:type', 'website');
    sm('twitter:card', 'summary_large_image');
    sm('twitter:title', 'Cheer ET');
  }, []);

  // Auth check — localStorage token (Firebase auth.currentUser would also work)
  useEffect(() => {
    const checkAuth = () => {
      const tok = localStorage.getItem('cheeret_token') || sessionStorage.getItem('cheeret_token');
      setIsLoggedIn(!!tok);
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Countdown to July 14 2026
  useEffect(() => {
    const target = new Date('2026-07-14T00:00:00').getTime();
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

  // Scroll detection
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 44);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Offline detection
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Notification prompt after 5s
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const t = setTimeout(() => setNotif(true), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  // Live balance ticker
  useEffect(() => {
    const i = setInterval(() => {
      setBalance((b) => b + Math.floor(Math.random() * 400 + 150));
    }, 4500);
    return () => clearInterval(i);
  }, []);

  // Simulate creators loading
  useEffect(() => {
    const t = setTimeout(() => setCreatorsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('on'); }),
      { threshold: 0.08 }
    );
    revRefs.current.forEach((r) => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);
  const addR = (el) => {
    if (el && !revRefs.current.includes(el)) revRefs.current.push(el);
  };

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return CREATORS.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return CREATORS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.nameAm.includes(searchQuery) || c.type.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const askNotif = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((p) => {
        if (p === 'granted') new Notification('Cheer ET', { body: lang === 'am' ? 'ማሳወቂያዎች ነቅተዋል!' : 'Notifications enabled!' });
        setNotif(false);
      });
    }
  };

  const submitContact = () => {
    if (!form.name || !form.email || !form.msg) return;
    setFormState('sending');
    setTimeout(() => {
      setFormState('sent');
      setTimeout(() => {
        setContact(false);
        setForm({ name: '', email: '', phone: '', msg: '' });
        setFormState('idle');
      }, 2000);
    }, 1500);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobOpen(false);
    }
  };

  const navigate = (path) => {
    window.location.href = path;
  };

  const prevGal = () => setGalIdx((i) => (i - 1 + GALLERY.length) % GALLERY.length);
  const nextGal = () => setGalIdx((i) => (i + 1) % GALLERY.length);

  const scrollSlider = (dir) => {
    if (sliderRef.current) {
      const amount = 300;
      sliderRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const accent = dark ? '#2979FF' : '#1A5FCC';

  return (
    <div className={dark ? 'theme-dark' : 'theme-light'}>
     {/* ── CONTACT PANEL ── */}
{contact && (
  <div
    className="contact-overlay"
    onClick={(e) => {
      if (e.target === e.currentTarget) setContact(false);
    }}
  >
    <div className="contact-box">
      <button
        onClick={() => setContact(false)}
        className="btn-g"
        style={{
          marginBottom: 24,
          padding: "8px 18px",
          fontSize: "0.86rem",
        }}
      >
        <i className="bi bi-arrow-left" /> {s.contactBack}
      </button>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {s.contactTitle}
      </h2>

      <p
        style={{
          color: "var(--muted)",
          fontSize: "0.9rem",
          marginBottom: 24,
          lineHeight: 1.7,
        }}
      >
        {s.contactSub}
      </p>

      {state.succeeded ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <i
            className="bi bi-check-circle-fill"
            style={{
              fontSize: "2.5rem",
              color: "#22C55E",
              display: "block",
              marginBottom: 12,
            }}
          />
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {s.sent}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input
            className="form-inp"
            id="name"
            type="text"
            name="name"
            placeholder={s.nameLabel}
          />

          <ValidationError
            prefix="Name"
            field="name"
            errors={state.errors}
          />

          <input
            className="form-inp"
            id="email"
            type="email"
            name="email"
            placeholder={s.emailLabel}
          />

          <ValidationError
            prefix="Email"
            field="email"
            errors={state.errors}
          />

          <input
            className="form-inp"
            id="phone"
            type="text"
            name="phone"
            placeholder={s.phoneLabel}
          />

          <ValidationError
            prefix="Phone"
            field="phone"
            errors={state.errors}
          />

          <textarea
            className="form-inp"
            id="message"
            name="message"
            placeholder={s.msgLabel}
          />

          <ValidationError
            prefix="Message"
            field="message"
            errors={state.errors}
          />

          <button
            className="btn-p"
            type="submit"
            disabled={state.submitting}
            style={{
              padding: "14px",
              fontSize: "1rem",
              borderRadius: 12,
              marginTop: 4,
              justifyContent: "center",
            }}
          >
            {state.submitting ? (
              <>
                <i
                  className="bi bi-arrow-repeat"
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                {s.sending}
              </>
            ) : (
              <>
                <i className="bi bi-send-fill" /> {s.sendBtn}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  </div>
)}
      {/* ── NAVBAR ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: scrolled ? '10px 24px' : '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px',
        background: scrolled ? 'var(--nav-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(28px) saturate(1.8)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : 'none',
        transition: 'all 0.35s cubic-bezier(.4,0,.2,1)',
      }}>
        <span className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Cheer<sup>ET</sup></span>

        {/* Search bar */}
        <div className="search-wrap hide-mob">
          <i className="bi bi-search search-icon" />
          <input
            className="search-input"
            placeholder={s.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          {searchFocused && (
            <div className="search-dropdown">
              <div className="search-section-label">{s.searchTopCreators}</div>
              {searchResults.length === 0 ? (
                <div className="search-empty">{s.searchNoResults}</div>
              ) : (
                searchResults.map((c, i) => (
                  <div key={i} className="search-result" onClick={() => navigate(`/${c.name}`)}>
                    <img src={c.img} alt={c.name} />
                    <div>
                      <div className="search-result-name">{lang === 'am' ? c.nameAm : c.name}</div>
                      <div className="search-result-type">{lang === 'am' ? c.typeAm : c.type}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <nav className="hide-mob" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a className="navlink" onClick={() => scrollTo('features')}>{s.navFeatures}</a>
          <a className="navlink" onClick={() => scrollTo('creators')}>{s.navCreators}</a>
          <a className="navlink" onClick={() => scrollTo('pricing')}>{s.navPricing}</a>
          <a className="navlink" onClick={() => setContact(true)}>{s.navContact}</a>
        </nav>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setDark((d) => !d)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.05rem', color: 'var(--muted)', padding: 6, borderRadius: 8, lineHeight: 1 }}>
            <i className={`bi ${dark ? 'bi-sun-fill' : 'bi-moon-fill'}`} />
          </button>
          <button onClick={() => setLang((l) => (l === 'en' ? 'am' : 'en'))} className="btn-g" style={{ padding: '7px 12px', fontSize: '0.82rem' }}>
            {lang === 'en' ? 'አማ' : 'EN'}
          </button>
          {isLoggedIn ? (
            <button onClick={() => navigate('/dashboard')} className="btn-p hide-mob" style={{ padding: '8px 18px', fontSize: '0.86rem' }}>
              <i className="bi bi-grid-fill" /> {s.dashboard}
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-g hide-mob" style={{ padding: '8px 18px', fontSize: '0.86rem' }}>{s.login}</button>
          )}
          <button onClick={() => navigate('/register')} className="btn-p" style={{ padding: '9px 20px', fontSize: '0.86rem' }}>{s.getStarted}</button>
          <button onClick={() => setMobOpen((o) => !o)} className="show-mob" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)', fontSize: '1.35rem', lineHeight: 1 }}>
            <i className={`bi ${mobOpen ? 'bi-x-lg' : 'bi-list'}`} />
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      <div className={`mob-menu${mobOpen ? ' open' : ''}`}>
        {[
          { lbl: s.navFeatures, ico: 'bi-stars', id: 'features' },
          { lbl: s.navCreators, ico: 'bi-people-fill', id: 'creators' },
          { lbl: s.navPricing, ico: 'bi-tag-fill', id: 'pricing' },
          { lbl: s.navContact, ico: 'bi-chat-dots-fill', action: () => setContact(true) },
        ].map((l) => (
          <a key={l.lbl} className="mob-link" onClick={() => { l.action ? l.action() : scrollTo(l.id); setMobOpen(false); }}>
            <i className={`bi ${l.ico}`} style={{ color: 'var(--accent)', width: 20 }} />{l.lbl}
          </a>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {isLoggedIn ? (
            <button onClick={() => navigate('/dashboard')} className="btn-p" style={{ flex: 1 }}>{s.dashboard}</button>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-g" style={{ flex: 1 }}>{s.login}</button>
          )}
          <button onClick={() => navigate('/register')} className="btn-p" style={{ flex: 1 }}>{s.getStarted}</button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', padding: '120px 0 80px', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-bg-glow" style={{
          top: '5%', left: '50%', transform: 'translateX(-50%)',
          width: 'clamp(400px,85vw,1000px)', height: 'clamp(300px,55vw,700px)',
          background: 'radial-gradient(ellipse at 50% 40%, var(--hero-glow) 0%, transparent 60%)',
          zIndex: 0,
        }} />
        <div className="hero-bg-glow" style={{
          top: '20%', left: '-8%', width: '45vw', height: '45vw', maxWidth: 500, maxHeight: 500,
          background: `radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)`,
          opacity: dark ? 1 : 0.5, zIndex: 0, animationDelay: '2s',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {showRelease && (
            <div className="release-banner rev" ref={addR}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="bi bi-rocket-takeoff-fill" style={{ color: 'var(--accent)', fontSize: '1.2rem' }} />
                <span style={{ fontWeight: 600 }}>{s.releasedMsg}</span>
              </div>
              <button onClick={() => setShowRelease(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', fontSize: '1rem', lineHeight: 1 }}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}

          <div className="hero-flex" style={{ display: 'flex', gap: 56, alignItems: 'center' }}>
            {/* LEFT */}
            <div style={{ flex: '1 1 460px', animation: 'slideUp 0.85s cubic-bezier(.4,0,.2,1) forwards' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 100, padding: '6px 14px', marginBottom: 20 }}>
                <i className="bi bi-stars" style={{ fontSize: '0.76rem', color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>{s.heroBadge}</span>
              </div>

              <h1 className="hero-title" style={{
                marginBottom: 24,
                background: `linear-gradient(160deg, var(--text) 0%, ${dark ? '#7EC8FF' : '#0044AA'} 60%, var(--accent) 100%)`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradX 8s ease infinite',
              }}>{s.heroTitle}</h1>

              <p style={{ fontSize: '1.07rem', color: 'var(--muted)', lineHeight: 1.78, maxWidth: 490, marginBottom: 18 }}>{s.heroSub}</p>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 100, padding: '5px 14px', marginBottom: 32 }}>
                <i className="bi bi-shield-check-fill" style={{ fontSize: '0.76rem', color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {lang === 'am' ? 'በቻፓ ተጠብቋል' : 'Powered by'} <strong style={{ color: 'var(--accent)' }}>Chapa</strong>
                </span>
              </div>

              <div className="cta-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
                <button onClick={() => navigate('/register')} className="btn-p" style={{ fontSize: '1rem', padding: '15px 34px' }}>
                  <i className="bi bi-arrow-right-circle-fill" /> {s.ctaStart}
                </button>
                <button onClick={() => scrollTo('how')} className="btn-g" style={{ fontSize: '1rem', padding: '15px 26px' }}>
                  <i className="bi bi-play-circle" /> {s.ctaWatch}
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--faint)' }}>{s.heroTrust}</p>
            </div>

            {/* RIGHT — live mockup card */}
            <div className="hide-mob" style={{ flex: '0 0 330px', position: 'relative', animation: 'float 7s ease-in-out infinite' }}>
              <div className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, var(--accent), var(--accent-2))`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-person-video" style={{ color: '#fff', fontSize: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>MesaretArt</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--faint)' }}>
                        <i className="bi bi-circle-fill" style={{ color: '#22C55E', fontSize: '0.46rem', marginRight: 4 }} />{s.liveNow} · 2,341
                      </div>
                    </div>
                  </div>
                  <span style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 7, padding: '3px 9px', fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700 }}>{s.ttsOn}</span>
                </div>
                <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 13, padding: '14px 16px', marginBottom: 11 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--faint)', marginBottom: 2 }}>{s.todayBalance}</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: -1, lineHeight: 1 }}>ETB {balance.toLocaleString()}</div>
                  <div style={{ fontSize: '0.68rem', color: '#22C55E', marginTop: 3 }}><i className="bi bi-arrow-up-right" /> +18% · {s.viaChapa}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 12px', marginBottom: 11 }}>
                  <i className="bi bi-volume-up-fill" style={{ fontSize: '0.78rem', color: 'var(--accent)', marginRight: 6 }} />
                  <span style={{ fontSize: '0.66rem', color: 'var(--faint)', marginRight: 6 }}>TTS:</span>
                  {[0, 65, 130, 195, 65, 130].map((d, i) => (
                    <div key={i} className="wbar" style={{ animation: `wave 1.1s ease-in-out ${d}ms infinite` }} />
                  ))}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--faint)', marginBottom: 7, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{s.liveFeed}</div>
                {[
                  { n: 'Tigist A.', a: 'ETB 500', m: lang === 'am' ? 'የአርትዎ ስራ ይወዳል!' : 'Love your art!', ico: 'bi-heart-fill' },
                  { n: 'Samuel B.', a: 'ETB 1,000', m: lang === 'am' ? 'ምርጥ TikTok!' : 'Best TikTok ever!', ico: 'bi-star-fill' },
                ].map((d, i) => (
                  <div key={i} style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 11, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                    <i className={`bi ${d.ico}`} style={{ color: 'var(--accent)', fontSize: '0.85rem', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{d.n}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.82rem' }}>{d.a}</span>
                      </div>
                      <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.m}</p>
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
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="lbl">{s.chapaLabel}</span>
            <h2 className="section-h" style={{ marginBottom: 14 }}>{s.chapaTitle}</h2>
            <p style={{ fontSize: '0.97rem', color: 'var(--muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.78 }}>{s.chapaSub}</p>
          </div>
          <PayDiagram dark={dark} />
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section id="how" ref={addR} className="rev">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="lbl">{s.howLabel}</span>
            <h2 className="section-h">{s.howTitle}</h2>
          </div>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { num: '01', ico: 'bi-credit-card-fill', t: s.s1, d: s.s1d, c: 'var(--accent)' },
              { num: '02', ico: 'bi-link-45deg', t: s.s2, d: s.s2d, c: dark ? '#40C0FF' : '#0D5EAF' },
              { num: '03', ico: 'bi-bank2', t: s.s3, d: s.s3d, c: '#22C55E' },
            ].map((st, i) => (
              <div key={i} className={`card rev d${i + 1}`} ref={addR} style={{ padding: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${st.c}18`, border: `1px solid ${st.c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi ${st.ico}`} style={{ color: st.c, fontSize: '1.05rem' }} />
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--faint)', letterSpacing: 1.2 }}>STEP {st.num}</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{st.t}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>{st.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TOP CREATORS SLIDER
      ════════════════════════════════════════ */}
      <section id="creators" ref={addR} className="rev">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span className="lbl">{s.creatorsLabel}</span>
            <h2 className="section-h" style={{ marginBottom: 12 }}>{s.creatorsTitle}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.93rem', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.75 }}>{s.creatorsNote}</p>
          </div>

          {/* Slider controls */}
          <div className="hide-mob" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
            <button className="slider-nav" onClick={() => scrollSlider('left')}><i className="bi bi-chevron-left" /></button>
            <button className="slider-nav" onClick={() => scrollSlider('right')}><i className="bi bi-chevron-right" /></button>
          </div>

          {/* Slider */}
          <div ref={sliderRef} className="creators-slider">
            {creatorsLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="creator-slide">
                    <div className="creator-wrap" style={{ padding: 0 }}>
                      <div style={{ height: 5, background: 'var(--card-bg)' }} />
                      <div style={{ padding: '26px 22px', textAlign: 'center' }}>
                        <div className="skeleton" style={{ width: 76, height: 76, borderRadius: '50%', margin: '0 auto 16px' }} />
                        <div className="skeleton" style={{ width: '60%', height: 16, margin: '0 auto 8px' }} />
                        <div className="skeleton" style={{ width: '40%', height: 12, margin: '0 auto 18px' }} />
                        <div className="skeleton" style={{ width: '50%', height: 20, margin: '0 auto 20px' }} />
                        <div className="skeleton" style={{ width: '100%', height: 38, borderRadius: 12 }} />
                      </div>
                    </div>
                  </div>
                ))
              : CREATORS.map((c, i) => (
                  <div key={i} className="creator-slide">
                    <div className={`creator-wrap rev d${(i % 3) + 1}`} ref={addR}>
                      <div style={{ height: 5, background: `linear-gradient(90deg, ${c.color}, var(--accent-2))` }} />
                      <div style={{ padding: '26px 22px', textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                          <img src={c.img} alt={c.name} style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${c.color}55`, display: 'block' }} />
                          <div style={{ position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, background: '#22C55E', borderRadius: '50%', border: '2px solid var(--bg)' }} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 3 }}>{lang === 'am' ? c.nameAm : c.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--faint)', marginBottom: 18 }}>{lang === 'am' ? c.typeAm : c.type}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--faint)', marginBottom: 4 }}>{s.totalRaised}</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: c.color, marginBottom: 20 }}>{c.raised}</div>
                        <button className="btn-p" style={{ width: '100%', padding: '11px', fontSize: '0.88rem', borderRadius: 12, background: c.color, boxShadow: `0 2px 14px ${c.color}44` }} onClick={() => navigate(`/${c.name}`)}>
                          <i className="bi bi-heart-fill" /> {s.support}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          GALLERY
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev">
        <div style={{ textAlign: 'center', marginBottom: 36, padding: '0 24px' }}>
          <span className="lbl">{s.galleryLabel}</span>
          <h2 className="section-h" style={{ marginBottom: 8 }}>{s.galleryTitle}</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{s.gallerySub}</p>
        </div>

        {/* DESKTOP */}
        <div className="gallery-desktop-wrap">
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '1.5%', borderRadius: 20, overflow: 'hidden' }}>
              <div className="gal-side-item" onClick={prevGal}>
                <iframe
                  src={`https://www.youtube.com/embed/${GALLERY[(galIdx - 1 + GALLERY.length) % GALLERY.length].id}?rel=0&modestbranding=1`}
                  title="prev" allow="accelerometer" allowFullScreen
                  style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block', pointerEvents: 'none' }}
                />
                <div style={{ padding: '10px 12px', background: 'var(--surface)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lang === 'am' ? GALLERY[(galIdx - 1 + GALLERY.length) % GALLERY.length].titleAm : GALLERY[(galIdx - 1 + GALLERY.length) % GALLERY.length].title}
                  </div>
                </div>
              </div>

              <div className="gal-main-item">
                <div style={{ position: 'relative' }}>
                  <iframe key={galIdx}
                    src={`https://www.youtube.com/embed/${GALLERY[galIdx].id}?rel=0&modestbranding=1`}
                    title={GALLERY[galIdx].title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, background: 'linear-gradient(transparent, rgba(0,0,0,.8))', pointerEvents: 'none' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>{lang === 'am' ? GALLERY[galIdx].titleAm : GALLERY[galIdx].title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,.6)', marginTop: 3 }}>{GALLERY[galIdx].creator} · {GALLERY[galIdx].views} · {GALLERY[galIdx].dur}</div>
                  </div>
                  <button onClick={() => navigate('/register')} style={{ position: 'absolute', bottom: 18, right: 18, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 980, padding: '9px 18px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                    <i className="bi bi-heart-fill" /> {s.donate}
                  </button>
                </div>
              </div>

              <div className="gal-side-item" onClick={nextGal}>
                <iframe
                  src={`https://www.youtube.com/embed/${GALLERY[(galIdx + 1) % GALLERY.length].id}?rel=0&modestbranding=1`}
                  title="next" allow="accelerometer" allowFullScreen
                  style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block', pointerEvents: 'none' }}
                />
                <div style={{ padding: '10px 12px', background: 'var(--surface)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lang === 'am' ? GALLERY[(galIdx + 1) % GALLERY.length].titleAm : GALLERY[(galIdx + 1) % GALLERY.length].title}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
              <button onClick={prevGal} className="btn-g" style={{ width: 40, height: 40, borderRadius: '50%', padding: 0, justifyContent: 'center' }}>
                <i className="bi bi-chevron-left" />
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                {GALLERY.map((_, i) => (
                  <button key={i} onClick={() => setGalIdx(i)} style={{ height: 4, width: i === galIdx ? 32 : 16, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === galIdx ? 'var(--accent)' : 'var(--accent-dim)', transition: 'all 0.3s', padding: 0 }} />
                ))}
              </div>
              <button onClick={nextGal} className="btn-g" style={{ width: 40, height: 40, borderRadius: '50%', padding: 0, justifyContent: 'center' }}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE */}
        <div className="gallery-mobile-wrap">
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', padding: '0 24px 12px' }}>
            {GALLERY.map((v, i) => (
              <div key={i} style={{ flex: '0 0 85vw', maxWidth: 340, scrollSnapAlign: 'center', borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe src={`https://www.youtube.com/embed/${v.id}?rel=0&modestbranding=1`} title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 8 }}>{lang === 'am' ? v.titleAm : v.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--faint)' }}>{v.creator} · {v.views}</span>
                    <button onClick={() => navigate('/register')} className="btn-p" style={{ padding: '7px 14px', fontSize: '0.78rem', borderRadius: 980 }}>
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
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="lbl">{s.platformsLabel}</span>
            <h2 className="section-h" style={{ marginBottom: 14 }}>{s.platformsTitle}</h2>
            <p style={{ fontSize: '0.97rem', color: 'var(--muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.78 }}>{s.platformsSub}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {PLATFORMS.map((p, i) => (
              <div key={i} className="platform-chip">
                <i className={`bi ${p.icon}`} style={{ color: 'var(--accent)', fontSize: '1.05rem' }} />
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
          <div style={{ display: 'flex', gap: 52, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 360px' }}>
              <span className="lbl">{s.overlayLabel}</span>
              <h2 className="section-h" style={{ marginBottom: 16 }}>{s.overlayTitle}</h2>
              <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.78, marginBottom: 24, maxWidth: 420 }}>{s.overlaySub}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {s.overlayFeats.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
                    <i className="bi bi-check-circle-fill" style={{ color: 'var(--accent)', fontSize: '0.9rem', flexShrink: 0 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 22, padding: '14px 16px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 13, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                <i className="bi bi-info-circle-fill" style={{ color: 'var(--accent)', marginRight: 8 }} />
                {s.overlayNote}
              </div>
            </div>
            <div style={{ flex: '1 1 280px' }}>
              <OverlayPreview lang={lang} accent={accent} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════ */}
      <section id="features" ref={addR} className="rev">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="lbl">{s.featLabel}</span>
            <h2 className="section-h">{s.featTitle}</h2>
          </div>
          <div className="feats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {s.featItems.map((f, i) => (
              <div key={i} className={`card rev d${(i % 3) + 1}`} ref={addR} style={{ padding: '22px 18px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <i className={`bi ${f.icon}`} style={{ color: 'var(--accent)', fontSize: '1.05rem' }} />
                </div>
                <h3 style={{ fontSize: '0.97rem', fontWeight: 700, marginBottom: 7 }}>{f.title}</h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.65 }}>{f.desc}</p>
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
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="lbl">{s.pricingLabel}</span>
            <h2 className="section-h" style={{ marginBottom: 12 }}>{s.pricingTitle}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.93rem' }}>{s.pricingSub}</p>
          </div>
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 680, margin: '0 auto' }}>
            <div className="pricing-card">
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{s.freeTitle}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>ETB 0</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--faint)', marginBottom: 26 }}>{s.freePer}</div>
              {s.freeFeats.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12, fontSize: '0.88rem' }}>
                  <i className="bi bi-check-circle-fill" style={{ color: '#22C55E', fontSize: '0.84rem', flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
              <button onClick={() => navigate('/register')} className="btn-g" style={{ width: '100%', marginTop: 22, padding: '12px', borderRadius: 12, justifyContent: 'center' }}>
                {s.currentPlan}
              </button>
            </div>
            <div className="pricing-card pricing-pro" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--accent)', color: '#fff', fontSize: '0.66rem', fontWeight: 700, letterSpacing: 1, padding: '3px 10px', borderRadius: 980 }}>BEST</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{s.proTitle}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: -1, marginBottom: 4, color: 'var(--accent)' }}>{s.proPrice}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--faint)', marginBottom: 26 }}>{s.proPer}</div>
              {s.proFeats.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12, fontSize: '0.88rem' }}>
                  <i className="bi bi-check-circle-fill" style={{ color: 'var(--accent)', fontSize: '0.84rem', flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
              <button onClick={() => navigate('/register?plan=pro')} className="btn-p" style={{ width: '100%', marginTop: 22, padding: '12px', borderRadius: 12, justifyContent: 'center' }}>
                {s.proBtn}
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--faint)', fontSize: '0.8rem', marginTop: 18 }}>{s.feeNote}</p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FAQ
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev">
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="lbl">{s.faqLabel}</span>
            <h2 className="section-h">{s.faqTitle}</h2>
          </div>
          {s.faqItems.map((item, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{item.q}</span>
                <i className={`bi ${openFaq === i ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ color: 'var(--accent)', fontSize: '0.88rem', flexShrink: 0 }} />
              </div>
              {openFaq === i && <div className="faq-a">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          COUNTDOWN
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev" style={{ textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <span className="lbl">{s.countLabel}</span>
          <h2 className="section-h" style={{ marginBottom: 44 }}>{s.countTitle}</h2>
          {launched ? (
            <div style={{ padding: '32px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 20, marginBottom: 36 }}>
              <i className="bi bi-rocket-takeoff-fill" style={{ fontSize: '2.5rem', color: 'var(--accent)', display: 'block', marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{s.releasedMsg}</div>
            </div>
          ) : (
            <div className="cd-row" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
              {[{ v: timeLeft.days, l: s.days }, { v: timeLeft.hours, l: s.hours }, { v: timeLeft.minutes, l: s.minutes }].map((item, i) => (
                <div key={i} className="cd-box" style={{ minWidth: 120, flex: '1 1 100px', maxWidth: 160 }}>
                  <div className="cd-num">{String(item.v).padStart(2, '0')}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--faint)', marginTop: 9, textTransform: 'uppercase', letterSpacing: 1.5 }}>{item.l}</div>
                </div>
              ))}
            </div>
          )}
          <div className="cta-row" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => navigate('/register')} className="btn-p">{s.joinEarly}</button>
            <button onClick={() => setContact(true)} className="btn-g">{s.contactUs}</button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev" style={{ overflow: 'hidden', paddingLeft: 0, paddingRight: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 36, padding: '0 24px' }}>
          <span className="lbl">{s.testiLabel}</span>
          <h2 className="section-h">{s.testiTitle}</h2>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(90deg, var(--scroll-fade), transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(-90deg, var(--scroll-fade), transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ overflow: 'hidden' }}>
            <div className="testi-track">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div key={i} style={{ width: 285, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-person-fill" style={{ color: 'var(--accent)', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--faint)' }}>{t.handle}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.68 }}>"{lang === 'am' ? t.am : t.en}"</p>
                  <div style={{ display: 'flex', gap: 2, marginTop: 10 }}>
                    {[1, 2, 3, 4, 5].map((n) => <i key={n} className="bi bi-star-fill" style={{ color: '#F0A000', fontSize: '0.7rem' }} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          MOBILE APP TEASER
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev">
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="app-teaser">
            <div className="app-teaser-glow" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="lbl">{s.appLabel}</span>
              <h2 className="section-h" style={{ marginBottom: 14 }}>{s.appTitle}</h2>
              <p style={{ fontSize: '0.97rem', color: 'var(--muted)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.78 }}>{s.appSub}</p>
              <div className="cta-row" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="#" className="app-btn-android" onClick={(e) => e.preventDefault()}>
                  <i className="bi bi-android2" style={{ fontSize: '1.6rem' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 500, opacity: 0.85 }}>{s.appAndroidSub}</div>
                    <div>{s.appAndroid}</div>
                  </div>
                </a>
                <div className="app-btn-ios">
                  <i className="bi bi-apple" style={{ fontSize: '1.6rem' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 500 }}>{lang === 'am' ? 'iOS · በቅርቡ' : 'iOS · Soon'}</div>
                    <div>{s.appIosComing}</div>
                  </div>
                  <span className="app-btn-ios-badge">{lang === 'am' ? 'በቅርቡ' : 'SOON'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════ */}
      <section ref={addR} className="rev" style={{ textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 620 }}>
          <div style={{ position: 'relative', background: 'linear-gradient(135deg, var(--accent-dim), var(--surface))', border: '1px solid var(--accent)', borderRadius: 28, padding: '52px 36px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', background: 'radial-gradient(circle, var(--hero-glow), transparent 65%)', pointerEvents: 'none', filter: 'blur(32px)' }} />
            <span className="lbl" style={{ position: 'relative' }}>{lang === 'am' ? 'ዛሬ ጀምሩ' : 'Get Started Today'}</span>
            <h2 className="section-h" style={{ marginBottom: 12, position: 'relative' }}>{s.ctaFinalTitle}</h2>
            <p style={{ fontSize: '0.97rem', color: 'var(--muted)', marginBottom: 32, lineHeight: 1.78, position: 'relative' }}>{s.ctaFinalSub}</p>
            <div className="cta-row" style={{ display: 'flex', gap: 12, justifyContent: 'center', position: 'relative' }}>
              <button onClick={() => navigate('/register')} className="btn-p" style={{ fontSize: '1rem', padding: '15px 38px' }}>{s.createPage}</button>
              <button onClick={() => setContact(true)} className="btn-g" style={{ fontSize: '1rem', padding: '15px 28px' }}>{s.contactUs}</button>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--faint)', marginTop: 18, position: 'relative' }}>{s.ctaTrust}</p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '56px 0 32px', background: 'var(--bg)' }}>
        <div className="container">
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 36, marginBottom: 44 }}>
            <div>
              <div style={{ marginBottom: 14 }}><span className="logo">Cheer<sup>ET</sup></span></div>
              <p style={{ fontSize: '0.83rem', color: 'var(--faint)', lineHeight: 1.78, maxWidth: 250, marginBottom: 20 }}>{s.footDesc}</p>
              <div style={{ display: 'flex', gap: 9 }}>
                {[
                  { ico: 'bi-twitter-x', lbl: 'Twitter' },
                  { ico: 'bi-youtube', lbl: 'YouTube' },
                  { ico: 'bi-facebook', lbl: 'Facebook' },
                  { ico: 'bi-instagram', lbl: 'Instagram' },
                  { ico: 'bi-tiktok', lbl: 'TikTok' },
                ].map((sc, i) => (
                  <button key={i} title={sc.lbl} aria-label={sc.lbl}
                    style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', color: 'var(--muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}>
                    <i className={`bi ${sc.ico}`} />
                  </button>
                ))}
              </div>
            </div>
            {[
              { title: s.footProduct, links: s.productLinks, actions: [() => scrollTo('features'), null, null, null, () => scrollTo('pricing')] },
              { title: s.footCompany, links: s.companyLinks, actions: [null, null, null, null, () => setContact(true)] },
              { title: s.footLegal, links: s.legalLinks, actions: [null, null, null] },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 }}>{col.title}</div>
                {col.links.map((l, j) => (
                  <div key={j} style={{ fontSize: '0.84rem', color: 'var(--faint)', marginBottom: 11, cursor: 'pointer', transition: 'color 0.2s' }}
                    onClick={col.actions[j] || undefined}
                    onMouseEnter={(e) => (e.target).style.color = 'var(--text)'}
                    onMouseLeave={(e) => (e.target).style.color = 'var(--faint)'}
                  >{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: '0.76rem', color: 'var(--faint)' }}>{s.footCopy}</p>
            <p style={{ fontSize: '0.76rem', color: 'var(--faint)' }}>{s.footBuilt}</p>
          </div>
        </div>
      </footer>

      {/* OFFLINE BANNER */}
      <div className={`offline-bar${offline ? ' show' : ''}`}>
        <i className="bi bi-wifi-off" style={{ fontSize: '1rem' }} />
        {s.offlineMsg}
      </div>

      {/* NOTIFICATION PROMPT */}
      {notif && (
        <div className="notif-box">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="bi bi-bell-fill" style={{ color: 'var(--accent)', fontSize: '0.95rem' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>Cheer ET</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>{s.notifAsk}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={askNotif} className="btn-p" style={{ flex: 1, padding: '9px', fontSize: '0.83rem', borderRadius: 10 }}>
              <i className="bi bi-bell-fill" /> {s.notifBtn}
            </button>
            <button onClick={() => setNotif(false)} className="btn-g" style={{ padding: '9px 14px', fontSize: '0.83rem', borderRadius: 10 }}>
              {s.notifDeny}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
