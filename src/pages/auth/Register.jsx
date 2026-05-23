import { useState, useEffect, useRef } from "react"
import { auth, db } from "../../firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { useNavigate, Link } from "react-router-dom"
import "../../styles/auth.css"

/* ── Translations ─────────────────────────────────────── */
const T = {
  en: {
    balloon: "Cheer ET",
    tagline: "Cheer up Ethiopia",
    langBtn: ["EN", "አማ"],
    step1Title: "Create Account",
    step1Sub: "Let's get you set up",
    step2Title: "Creator Info",
    step2Sub: "Tell us about your channel",
    username: "Username",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    phone: "Phone (optional)",
    telegram: "Telegram Username (optional)",
    followers: "Followers Count",
    platform: "Your Platform",
    continue: "Continue",
    back: "Back",
    create: "Create Account",
    creating: "Creating…",
    haveAccount: "Already have an account?",
    login: "Log in",
    err: {
      usernameTooShort: "Username must be at least 3 characters.",
      usernameTaken: "That username is already taken — try another one.",
      usernameChecking: "Still checking username availability, hang on.",
      badEmail: "That doesn't look like a valid email address.",
      weakPassword: "Password needs to be at least 6 characters.",
      passwordMismatch: "Passwords don't match — double-check and try again.",
      noPlatform: "Please pick your main streaming platform.",
      emailInUse: "That email is already registered. Want to log in instead?",
      weakPass: "Your password is too simple — add numbers or symbols.",
      invalidEmail: "That email address doesn't look right.",
      noNet: "No internet connection. Check your network and try again.",
      tooMany: "Too many attempts. Take a break and try again in a few minutes.",
      generic: "Something went wrong on our end. Please try again.",
    },
    strength: ["", "Weak", "Fair", "Good", "Strong"],
  },
  am: {
    balloon: "Cheer ET",
    tagline: "Cheer up Ethiopia",
    langBtn: ["EN", "አማ"],
    step1Title: "መለያ ይፍጠሩ",
    step1Sub: "እንጀምር!",
    step2Title: "የፈጣሪ መረጃ",
    step2Sub: "ስለ ቻናልዎ ያስተዋውቁን",
    username: "የተጠቃሚ ስም",
    email: "ኢሜይል",
    password: "የይለፍ ቃል",
    confirmPassword: "የይለፍ ቃል ያረጋግጡ",
    phone: "ስልክ (አማራጭ)",
    telegram: "የቴሌግራም ስም (አማራጭ)",
    followers: "የተከታዮች ቁጥር",
    platform: "የእርስዎ መድረክ",
    continue: "ቀጣይ",
    back: "ተመለስ",
    create: "መለያ ይፍጠሩ",
    creating: "እየተፈጠረ ነው…",
    haveAccount: "መለያ አለዎት?",
    login: "ይግቡ",
    err: {
      usernameTooShort: "የተጠቃሚ ስም ቢያንስ 3 ፊደላት መሆን አለበት።",
      usernameTaken: "ይህ የተጠቃሚ ስም ተወስዷል — ሌላ ይሞክሩ።",
      usernameChecking: "የተጠቃሚ ስምዎን እያረጋገጥን ነው፣ ቆይ።",
      badEmail: "ትክክለኛ ኢሜይል አይደለም።",
      weakPassword: "የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት።",
      passwordMismatch: "የይለፍ ቃሎቹ አይዛመዱም — ደግሞ ያረጋግጡ።",
      noPlatform: "የስርጭት ዋናውን መድረክ ይምረጡ።",
      emailInUse: "ኢሜይሉ ቀደም ሲል ተመዝግቧል። ይግቡ?",
      weakPass: "የይለፍ ቃሉ ደካማ ነው — ቁጥሮች ወይም ምልክቶችን ይጨምሩ።",
      invalidEmail: "ኢሜይሉ ትክክል አይደለም።",
      noNet: "የኢንተርኔት ግንኙነት የለም። ኔትዎርክዎን ያረጋግጡ።",
      tooMany: "ብዙ ሙከራዎች። ቆይ ደግሞ ይሞክሩ።",
      generic: "ስህተት ተፈጥሯል። ደግሞ ይሞክሩ።",
    },
    strength: ["", "ደካማ", "መካከለኛ", "ጥሩ", "ጠንካራ"],
  },
}

const PLATFORMS = [
  { value: "TikTok",   icon: "bi-tiktok" },
  { value: "Twitch",   icon: "bi-twitch" },
  { value: "Kick",     icon: "bi-controller" },
  { value: "YouTube",  icon: "bi-youtube" },
  { value: "Facebook", icon: "bi-facebook" },
]

const FLOATING_ICONS = [
  { icon: "bi-star-fill",         x: "7%",  y: "10%", size: 20, delay: 0.0 },
  { icon: "bi-heart-fill",        x: "80%", y: "15%", size: 16, delay: 0.5 },
  { icon: "bi-lightning-fill",    x: "5%",  y: "70%", size: 18, delay: 1.0 },
  { icon: "bi-gem",               x: "85%", y: "60%", size: 15, delay: 0.3 },
  { icon: "bi-trophy-fill",       x: "12%", y: "85%", size: 17, delay: 0.8 },
  { icon: "bi-music-note-beamed", x: "78%", y: "80%", size: 16, delay: 1.4 },
  { icon: "bi-camera-video-fill", x: "88%", y: "35%", size: 19, delay: 0.2 },
  { icon: "bi-broadcast",         x: "3%",  y: "40%", size: 16, delay: 1.1 },
  { icon: "bi-gift-fill",         x: "72%", y: "8%",  size: 14, delay: 0.7 },
  { icon: "bi-currency-dollar",   x: "20%", y: "6%",  size: 15, delay: 1.6 },
]

function PasswordStrength({ password, strength: s }) {
  const get = (p) => {
    if (!p) return 0
    let sc = 0
    if (p.length >= 8)           sc++
    if (/[A-Z]/.test(p))        sc++
    if (/[0-9]/.test(p))        sc++
    if (/[^A-Za-z0-9]/.test(p)) sc++
    return sc
  }
  const strength = get(password)
  const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"]
  if (!password) return null
  return (
    <div className="password-strength">
      <div className="strength-bars">
        {[1,2,3,4].map(i => (
          <div key={i} className="strength-bar"
            style={{ background: i <= strength ? colors[strength] : "rgba(255,255,255,0.1)" }} />
        ))}
      </div>
      <span className="strength-label" style={{ color: colors[strength] }}>
        {s[strength]}
      </span>
    </div>
  )
}

function FloatingLabel({ label, isAmharic, children }) {
  return (
    <div className="float-field">
      {children}
      <label className={`float-label${isAmharic ? " amharic" : ""}`}>{label}</label>
    </div>
  )
}

function CheerBalloon({ up, text, isAmharic }) {
  return (
    <div className={`balloon-scene ${up ? "balloon-up" : ""}`}>
      <div
        className={`cheer-balloon-text${isAmharic ? " amharic" : ""}`}
        data-text={text}
      >
        {text}
      </div>
      <div className="balloon-knot" />
      <svg className="balloon-string-svg" width="36" height="120" viewBox="0 0 36 120">
        <path
          d="M18,0 Q28,24 12,48 Q2,72 22,96 Q28,108 18,120"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [lang, setLang]                     = useState("en")
  const [step, setStep]                     = useState(1)
  const [error, setError]                   = useState("")
  const [loading, setLoading]               = useState(false)
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [balloonUp, setBalloonUp]           = useState(false)
  const usernameTimer                       = useRef(null)
  const t                                   = T[lang]
  const isAmharic                           = lang === "am"

  const [form, setForm] = useState({
    username: "", email: "", phone: "", telegram: "",
    followers: "", platform: "", password: "", confirmPassword: "",
  })

  useEffect(() => { setTimeout(() => setBalloonUp(true), 250) }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    setError("")
    if (name === "username") {
      setUsernameStatus(null)
      clearTimeout(usernameTimer.current)
      if (value.length >= 3) {
        setUsernameStatus("checking")
        usernameTimer.current = setTimeout(() => checkUsername(value), 700)
      }
    }
  }

  async function checkUsername(username) {
    try {
      const q = query(collection(db, "users"), where("username", "==", username))
      const snap = await getDocs(q)
      setUsernameStatus(snap.empty ? "available" : "taken")
    } catch { setUsernameStatus(null) }
  }

  function validateStep1() {
    if (!form.username || form.username.length < 3) return t.err.usernameTooShort
    if (usernameStatus === "taken")     return t.err.usernameTaken
    if (usernameStatus === "checking")  return t.err.usernameChecking
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return t.err.badEmail
    if (form.password.length < 6)      return t.err.weakPassword
    if (form.password !== form.confirmPassword) return t.err.passwordMismatch
    return null
  }

  function validateStep2() {
    if (!form.platform) return t.err.noPlatform
    return null
  }

  function friendlyError(code) {
    const map = {
      "auth/email-already-in-use":   t.err.emailInUse,
      "auth/weak-password":          t.err.weakPass,
      "auth/invalid-email":          t.err.invalidEmail,
      "auth/network-request-failed": t.err.noNet,
      "auth/too-many-requests":      t.err.tooMany,
    }
    return map[code] || t.err.generic
  }

  function goNext(e) {
    e.preventDefault()
    const err = validateStep1()
    if (err) { setError(err); return }
    setError(""); setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validateStep2()
    if (err) { setError(err); return }
    setLoading(true); setError("")
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await setDoc(doc(db, "users", cred.user.uid), {
        username: form.username, email: form.email,
        phone: form.phone || "", telegram: form.telegram || "",
        followers: Number(form.followers) || 0,
        platform: form.platform,
        emailVerified: false, status: "active",
        createdAt: serverTimestamp(),
      })
      navigate("/dashboard")
    } catch (err) {
      setError(friendlyError(err.code))
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-container">

      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="moving-bg" />

        {/* Language toggle — top right of left panel */}
        <div className="lang-toggle">
          <button className={`lang-btn ${lang === "en" ? "active" : ""}`}
            onClick={() => setLang("en")}>EN</button>
          <button className={`lang-btn ${lang === "am" ? "active" : ""}`}
            onClick={() => setLang("am")}>አማ</button>
        </div>

        {FLOATING_ICONS.map((fi, i) => (
          <i key={i} className={`bi ${fi.icon} floating-icon`}
            style={{ left: fi.x, top: fi.y, fontSize: fi.size, animationDelay: `${fi.delay}s` }} />
        ))}

        <CheerBalloon up={balloonUp} text={t.balloon} isAmharic={isAmharic} />

        <p className={`auth-tagline${isAmharic ? " amharic" : ""}`}>{t.tagline}</p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="auth-card">

          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? "active" : ""}`}>
              {step > 1 ? <i className="bi bi-check" /> : "1"}
            </div>
            <div className={`step-line ${step > 1 ? "done" : ""}`} />
            <div className={`step-dot ${step >= 2 ? "active" : ""}`}>2</div>
          </div>

          <h2 className={`card-title${isAmharic ? " amharic" : ""}`}>
            {step === 1 ? t.step1Title : t.step2Title}
          </h2>
          <p className={`card-sub${isAmharic ? " amharic" : ""}`}>
            {step === 1 ? t.step1Sub : t.step2Sub}
          </p>

          {error && (
            <div className={`auth-error${isAmharic ? " amharic" : ""}`}>
              <i className="bi bi-exclamation-circle" style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={goNext} noValidate>
              <FloatingLabel label={t.username} isAmharic={isAmharic}>
                <input className="auth-input" name="username" value={form.username}
                  onChange={handleChange} required autoComplete="off" />
                <span className="username-badge">
                  {usernameStatus === "checking"  && <i className="bi bi-arrow-repeat spin" />}
                  {usernameStatus === "taken"      && <i className="bi bi-x-circle-fill"     style={{ color: "#ef4444" }} />}
                  {usernameStatus === "available"  && <i className="bi bi-check-circle-fill" style={{ color: "#22c55e" }} />}
                </span>
              </FloatingLabel>

              <FloatingLabel label={t.email} isAmharic={isAmharic}>
                <input className="auth-input" name="email" type="email"
                  value={form.email} onChange={handleChange} required />
              </FloatingLabel>

              <FloatingLabel label={t.password} isAmharic={isAmharic}>
                <input className="auth-input" name="password" type="password"
                  value={form.password} onChange={handleChange} required />
              </FloatingLabel>
              <PasswordStrength password={form.password} strength={t.strength} />

              <FloatingLabel label={t.confirmPassword} isAmharic={isAmharic}>
                <input className="auth-input" name="confirmPassword" type="password"
                  value={form.confirmPassword} onChange={handleChange} required />
              </FloatingLabel>

              <button type="submit" className={`auth-btn${isAmharic ? " amharic" : ""}`}>
                {t.continue} <i className="bi bi-arrow-right" />
              </button>
              <div className={`auth-link${isAmharic ? " amharic" : ""}`}>
                {t.haveAccount} <Link to="/login">{t.login}</Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate>
              <FloatingLabel label={t.phone} isAmharic={isAmharic}>
                <input className="auth-input" name="phone" type="tel"
                  value={form.phone} onChange={handleChange} />
              </FloatingLabel>

              <FloatingLabel label={t.telegram} isAmharic={isAmharic}>
                <input className="auth-input" name="telegram"
                  value={form.telegram} onChange={handleChange} />
              </FloatingLabel>

              <FloatingLabel label={t.followers} isAmharic={isAmharic}>
                <input className="auth-input" name="followers" type="number"
                  value={form.followers} onChange={handleChange} min="0" />
              </FloatingLabel>

              <p className={`platform-label${isAmharic ? " amharic" : ""}`}>{t.platform}</p>
              <div className="platform-grid">
                {PLATFORMS.map(p => (
                  <button key={p.value} type="button"
                    className={`platform-card ${form.platform === p.value ? "selected" : ""}`}
                    onClick={() => setForm(f => ({ ...f, platform: p.value }))}>
                    <i className={`bi ${p.icon}`} />
                    <span>{p.value}</span>
                  </button>
                ))}
              </div>

              <div className="step2-actions">
                <button type="button"
                  className={`auth-btn-ghost${isAmharic ? " amharic" : ""}`}
                  onClick={() => { setStep(1); setError("") }}>
                  <i className="bi bi-arrow-left" /> {t.back}
                </button>
                <button type="submit"
                  className={`auth-btn${isAmharic ? " amharic" : ""}`}
                  disabled={loading}>
                  {loading
                    ? <><i className="bi bi-arrow-repeat spin" /> {t.creating}</>
                    : <>{t.create} <i className="bi bi-check2" /></>}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}